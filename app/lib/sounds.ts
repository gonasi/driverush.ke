/**
 * Audio for the road-sign trainer — plain `Audio`, client-only, two flavours:
 *
 *   • one-shot **SFX** (whoosh / reveal / correct / wrong / complete) — one
 *     cached element each, files in `public/assets/sounds/`;
 *   • the per-sign **voice** clips authored into a board (`FocusRegion.audioSrc`,
 *     under `public/assets/road-signs/sounds/`) — also cached, so the moment a
 *     sign is revealed its name plays with no network round-trip.
 *
 * Everything can be warmed up front via {@link preloadSfx} / {@link preloadVoices}
 * (the trainer page holds the loader until both resolve), so a run never stalls
 * waiting on an asset. All exports no-op on the server.
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

// ---- preloading -------------------------------------------------------------
/**
 * Resolve once every element is buffered enough to play through without
 * stalling (`canplaythrough`), calling `onOne()` as each one settles (success
 * or error). Ones already ready resolve — and report — immediately.
 */
function whenAllBuffered(
  els: readonly (HTMLAudioElement | null)[],
  onOne?: () => void,
): Promise<void> {
  const waits = els.map((a) => {
    if (!a || a.readyState >= 3 /* HAVE_FUTURE_DATA */) {
      onOne?.();
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const done = () => {
        a.removeEventListener("canplaythrough", done);
        a.removeEventListener("error", done);
        onOne?.();
        resolve();
      };
      a.addEventListener("canplaythrough", done, { once: true });
      a.addEventListener("error", done, { once: true });
      a.load();
    });
  });
  return Promise.all(waits).then(() => undefined);
}

/** Race a preload against a hard cap so one slow/hung file can't wedge it. */
function withCap(p: Promise<void>, capMs: number): Promise<void> {
  return Promise.race([
    p,
    new Promise<void>((resolve) => setTimeout(resolve, capMs)),
  ]);
}

/**
 * Warm the SFX cache; resolves once every clip is buffered (`canplaythrough`)
 * or after `capMs` — whichever comes first.
 */
export function preloadSfx(capMs = 3000): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const els = (Object.keys(SOUNDS) as SfxName[]).map(getSfx);
  return withCap(whenAllBuffered(els), capMs);
}

/**
 * Warm a board's per-sign voice clips. `onProgress(done, total)` fires after
 * each clip settles (so the loader can show a percentage). Resolves once every
 * clip is buffered or after `capMs` — whichever comes first — so one slow file
 * can't keep the player gated forever.
 */
export function preloadVoices(
  srcs: readonly string[],
  {
    capMs = 45000,
    onProgress,
  }: {
    capMs?: number;
    onProgress?: (done: number, total: number) => void;
  } = {},
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const unique = [...new Set(srcs)];
  if (unique.length === 0) return Promise.resolve();
  let done = 0;
  const els = unique.map(getVoice);
  return withCap(
    whenAllBuffered(els, () => {
      done += 1;
      onProgress?.(done, unique.length);
    }),
    capMs,
  );
}
