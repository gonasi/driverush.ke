/**
 * Audio for the road-sign trainers, client-only, two flavours:
 *
 *   • one-shot **SFX** (whoosh / reveal / correct / wrong / complete), files in
 *     `public/assets/sounds/`;
 *   • the per-sign **voice** clips authored into a board (`audioSrc`, under
 *     `public/assets/road-signs/sounds/`).
 *
 * Everything plays through one Web Audio context, not an `<audio>` element per
 * clip. Mobile browsers (iOS Safari above all) only let an element play from a
 * timer if that same element was played inside a tap first, and the trainers
 * reveal on a timer with clips created a few signs ahead, so per-element audio
 * went silent and only "Replay sound" worked. A context is unlocked once, by any
 * tap, and then plays anything from anywhere. Clips are fetched and decoded
 * ahead of time ({@link warmVoice}); one that's late just plays late.
 *
 * All exports no-op on the server.
 */

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let unlockInstalled = false;

function getCtx(): Ctx | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** Resume the context on every user gesture (iOS also re-suspends it after a
 *  call or a trip to the lock screen). Capture phase, so it runs before any
 *  handler that starts a run and schedules sound on a timer. */
function installUnlock() {
  if (unlockInstalled || typeof window === "undefined") return;
  unlockInstalled = true;
  // Without this, iOS routes Web Audio through the ringer and the silent switch
  // mutes it. Safari 16.4+; ignored elsewhere.
  try {
    const session = (navigator as unknown as { audioSession?: { type: string } })
      .audioSession;
    if (session) session.type = "playback";
  } catch {
    /* ignore */
  }
  const unlock = () => {
    const c = getCtx();
    if (!c || c.state === "running") return;
    void c.resume().catch(() => {});
    // Older iOS only unlocks once a sound actually starts inside the gesture.
    try {
      const src = c.createBufferSource();
      src.buffer = c.createBuffer(1, 1, 22050);
      src.connect(c.destination);
      src.start(0);
    } catch {
      /* ignore */
    }
  };
  for (const type of ["pointerdown", "touchend", "keydown", "click"]) {
    window.addEventListener(type, unlock, { capture: true, passive: true });
  }
}

installUnlock();

// ---- decoding cache -----------------------------------------------------------
const buffers = new Map<string, Promise<AudioBuffer | null>>();

function loadBuffer(src: string): Promise<AudioBuffer | null> {
  const c = getCtx();
  if (!c) return Promise.resolve(null);
  let p = buffers.get(src);
  if (!p) {
    p = fetch(src)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then(
        (data) =>
          // Callback form too: older Safari has no promise-returning decode.
          new Promise<AudioBuffer>((resolve, reject) =>
            c.decodeAudioData(data, resolve, reject),
          ),
      )
      .catch(() => {
        buffers.delete(src); // let a later call retry
        return null;
      });
    buffers.set(src, p);
  }
  return p;
}

function startBuffer(
  buffer: AudioBuffer,
  volume: number,
): AudioBufferSourceNode | null {
  const c = getCtx();
  if (!c) return null;
  if (c.state !== "running") void c.resume().catch(() => {});
  try {
    const source = c.createBufferSource();
    source.buffer = buffer;
    const gain = c.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(c.destination);
    source.start(0);
    return source;
  } catch {
    return null;
  }
}

function stopSource(source: AudioBufferSourceNode | null) {
  if (!source) return;
  try {
    source.stop();
  } catch {
    /* already stopped */
  }
}

// ---- one-shot SFX -----------------------------------------------------------
const SOUNDS = {
  reveal: "/assets/sounds/reveal.mp3", // answer drops
  correct: "/assets/sounds/correct.mp3", // "knew it"
  wrong: "/assets/sounds/wrong.mp3", // "missed it"
  whoosh: "/assets/sounds/whoosh.mp3", // camera flies to a sign
  complete: "/assets/sounds/complete.mp3", // every sign mastered — the fanfare
} as const;
export type SfxName = keyof typeof SOUNDS;

const SFX_VOLUME = 0.45;
const sfxPlaying = new Map<SfxName, AudioBufferSourceNode>();
// Bumped by stopAllSfx, so a clip still decoding when you pause stays quiet.
let sfxGen = 0;

/** Play a one-shot SFX (restarts it if already playing). */
export function playSfx(name: SfxName): void {
  const gen = sfxGen;
  void loadBuffer(SOUNDS[name]).then((buffer) => {
    if (!buffer || gen !== sfxGen) return;
    stopSource(sfxPlaying.get(name) ?? null);
    const source = startBuffer(buffer, SFX_VOLUME);
    if (source) sfxPlaying.set(name, source);
  });
}

/** Stop every SFX (call on pause / exit). */
export function stopAllSfx(): void {
  sfxGen++;
  for (const source of sfxPlaying.values()) stopSource(source);
  sfxPlaying.clear();
}

// ---- per-sign voice clips ---------------------------------------------------
let currentVoice: AudioBufferSourceNode | null = null;
// Bumped on every play/stop, so only the latest request ever sounds.
let voiceGen = 0;

/** Play a sign's voice clip, stopping whichever clip is already playing. */
export function playVoice(src: string | null | undefined): void {
  stopVoice();
  if (!src) return;
  const gen = voiceGen;
  void loadBuffer(src).then((buffer) => {
    if (!buffer || gen !== voiceGen) return;
    currentVoice = startBuffer(buffer, 1);
  });
}

/** Stop the voice clip currently playing, if any. */
export function stopVoice(): void {
  voiceGen++;
  stopSource(currentVoice);
  currentVoice = null;
}

// ---- warming ---------------------------------------------------------------
/** Start fetching and decoding the SFX, so the first whoosh isn't late. */
export function warmSfx(): void {
  for (const src of Object.values(SOUNDS)) void loadBuffer(src);
}

/** Start fetching and decoding a sign's voice clip ahead of its reveal. */
export function warmVoice(src: string | null | undefined): void {
  if (src) void loadBuffer(src);
}

// ---- haptics ------------------------------------------------------------------
/** A small buzz on devices that can. Android only in practice; a no-op elsewhere. */
export function buzz(pattern: number | number[]): void {
  if (typeof navigator !== "undefined") navigator.vibrate?.(pattern);
}

export const BUZZ = { tap: 8, miss: [16, 40, 16] };
