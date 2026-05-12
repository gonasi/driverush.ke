/**
 * Tiny one-shot sound-effects player for the road-sign trainer — plain `Audio`,
 * client-only, one cached element per sound. Files live in `public/assets/sounds/`.
 */
const SOUNDS = {
  reveal: "/assets/sounds/reveal.mp3", // answer drops
  correct: "/assets/sounds/correct.mp3", // "knew it"
  wrong: "/assets/sounds/wrong.mp3", // "missed it"
  whoosh: "/assets/sounds/whoosh.mp3", // camera flies to a sign
} as const;
export type SfxName = keyof typeof SOUNDS;

const VOLUME = 0.45;
const cache = new Map<SfxName, HTMLAudioElement>();

function get(name: SfxName): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  let a = cache.get(name);
  if (!a) {
    a = new Audio(SOUNDS[name]);
    a.volume = VOLUME;
    a.preload = "auto";
    cache.set(name, a);
  }
  return a;
}

/** Play a one-shot SFX (restarts it if already playing). Returns the element. */
export function playSfx(name: SfxName): HTMLAudioElement | null {
  const a = get(name);
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
  for (const a of cache.values()) {
    try {
      a.pause();
      a.currentTime = 0;
    } catch {
      /* ignore */
    }
  }
}

/**
 * Warm the cache and resolve once every sound is buffered (`canplaythrough`),
 * or after `capMs` — whichever comes first. No-ops on the server.
 */
export function preloadSfx(capMs = 3000): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const names = Object.keys(SOUNDS) as SfxName[];
  const ready = names.map((name) => {
    const a = get(name);
    if (!a) return Promise.resolve();
    if (a.readyState >= 3 /* HAVE_FUTURE_DATA */) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const done = () => {
        a.removeEventListener("canplaythrough", done);
        a.removeEventListener("error", done);
        resolve();
      };
      a.addEventListener("canplaythrough", done, { once: true });
      a.addEventListener("error", done, { once: true });
      a.load();
    });
  });
  return Promise.race([
    Promise.all(ready).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, capMs)),
  ]);
}
