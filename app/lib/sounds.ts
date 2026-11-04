/**
 * Audio for the road-sign trainers: plain `Audio`, client-only, two flavours:
 *
 *   • one-shot **SFX** (whoosh / reveal / correct / wrong / complete) — one
 *     cached element each, files in `public/assets/sounds/`;
 *   • the per-sign **voice** clips authored into a board (`FocusRegion.audioSrc`,
 *     under `public/assets/road-signs/sounds/`) — also cached, so the moment a
 *     sign is revealed its name plays with no network round-trip.
 *
 * Nothing blocks on these. SFX warm when a trainer opens and voice clips warm a
 * few signs ahead of play ({@link warmVoice}); a clip that's late just plays late.
 * All exports no-op on the server.
 */

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
const sfxCache = new Map<SfxName, HTMLAudioElement>();

function getSfx(name: SfxName): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  let a = sfxCache.get(name);
  if (!a) {
    a = new Audio(SOUNDS[name]);
    a.volume = SFX_VOLUME;
    a.preload = "auto";
    sfxCache.set(name, a);
  }
  return a;
}

/** Play a one-shot SFX (restarts it if already playing). Returns the element. */
export function playSfx(name: SfxName): HTMLAudioElement | null {
  const a = getSfx(name);
  if (!a) return null;
  try {
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {
    /* autoplay blocked / not ready — ignore */
  }
  return a;
}

/** Stop every SFX (call on pause / exit). */
export function stopAllSfx(): void {
  for (const a of sfxCache.values()) {
    try {
      a.pause();
      a.currentTime = 0;
    } catch {
      /* ignore */
    }
  }
}

// ---- per-sign voice clips ---------------------------------------------------
const voiceCache = new Map<string, HTMLAudioElement>();
let currentVoice: HTMLAudioElement | null = null;

function getVoice(src: string): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  let a = voiceCache.get(src);
  if (!a) {
    a = new Audio(src);
    a.preload = "auto";
    voiceCache.set(src, a);
  }
  return a;
}

/** Play a sign's voice clip, stopping whichever clip is already playing. */
export function playVoice(src: string | null | undefined): void {
  stopVoice();
  if (!src) return;
  const a = getVoice(src);
  if (!a) return;
  currentVoice = a;
  try {
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {
    /* not ready — ignore */
  }
}

/** Stop the voice clip currently playing, if any. */
export function stopVoice(): void {
  if (currentVoice) {
    try {
      currentVoice.pause();
    } catch {
      /* ignore */
    }
    currentVoice = null;
  }
}

// ---- warming ---------------------------------------------------------------
/** Start buffering the SFX, so the first whoosh isn't late. Doesn't wait. */
export function warmSfx(): void {
  if (typeof window === "undefined") return;
  for (const name of Object.keys(SOUNDS) as SfxName[]) getSfx(name);
}

/** Start buffering a sign's voice clip ahead of its reveal. Doesn't wait. */
export function warmVoice(src: string | null | undefined): void {
  if (src) getVoice(src);
}
