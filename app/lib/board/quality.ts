/**
 * How sharp the table is drawn, and how it backs off on a phone that can't
 * keep up.
 *
 * The rule is: sharp unless the device is plainly not up to it. Every phone
 * starts on the full picture, and only one that then runs slowly gives things
 * up, one at a time, the shadows first and the sharpness last. Nothing here
 * touches three.js, so the rules can be tested on their own.
 */
import type { BoardQuality } from "~/lib/board-store";

export type BoardTier = "low" | "high";

/** What can be read about the device before the scene is built. */
export type Device = {
  /** Gigabytes, as the browser rounds it. Safari and Firefox don't say. */
  memory?: number;
  cores?: number;
  /** The graphics chip's name, where the browser gives it. */
  renderer?: string;
  /** The largest picture the chip can hold, in pixels across. */
  maxTexture?: number;
};

/**
 * Chips that can't draw the full scene at a steady rate: the browser drawing
 * in software, and phone chips from before about 2015.
 */
const WEAK_GPU =
  /swiftshader|llvmpipe|softpipe|software|basic render|mali-4\d\d|mali-t6|mali-t7[0-2]|adreno \(tm\) [23]\d\d|adreno [23]\d\d|powervr sgx|videocore|tegra 3/i;

export function isWeakGpu(renderer: string | undefined): boolean {
  return renderer != null && WEAK_GPU.test(renderer);
}

/**
 * The picture a device starts on. Only a device that is plainly short of
 * memory, cores or graphics gets the lighter one without being asked.
 */
export function tierFor(quality: BoardQuality, device: Device): BoardTier {
  if (quality !== "auto") return quality;
  if (device.memory != null && device.memory <= 2) return "low";
  if (device.cores != null && device.cores <= 2) return "low";
  if (device.maxTexture != null && device.maxTexture < 4096) return "low";
  if (isWeakGpu(device.renderer)) return "low";
  return "high";
}

/** One step of the ladder: what is still drawn at it. */
export type Rung = {
  /** The shadow picture's size in pixels, or 0 for no cast shadows. */
  shadow: 0 | 1024 | 2048;
  /** The most screen pixels drawn per CSS pixel. */
  dpr: number;
};

/**
 * The steps a struggling device goes down, in order. Shadows go before any
 * sharpness does, and the full picture never drops to one pixel per pixel:
 * a blurred board is the last thing to give up.
 */
export const LADDER: Record<BoardTier, readonly Rung[]> = {
  high: [
    { shadow: 2048, dpr: 3 },
    { shadow: 1024, dpr: 3 },
    { shadow: 0, dpr: 3 },
    { shadow: 0, dpr: 2 },
    { shadow: 0, dpr: 1.5 },
    { shadow: 0, dpr: 1.25 },
  ],
  low: [
    { shadow: 0, dpr: 1.5 },
    { shadow: 0, dpr: 1.25 },
    { shadow: 0, dpr: 1 },
  ],
};

/**
 * The most pixels the scene draws at once. A 3x phone stays at or near its
 * own resolution; a 4K monitor is held back, where nobody would see the gain.
 */
export const PIXEL_BUDGET = 3_500_000;

export type Screen = {
  /** The device's own pixels per CSS pixel. */
  native: number;
  /** The scene's size in CSS pixels. */
  width: number;
  height: number;
};

/** Pixels per CSS pixel at a rung, on this screen. */
export function pixelRatio(rung: Rung, screen: Screen): number {
  const area = Math.max(1, screen.width * screen.height);
  const budget = Math.sqrt(PIXEL_BUDGET / area);
  const ratio = Math.min(rung.dpr, screen.native || 1, budget);
  return Math.max(1, Math.round(ratio * 100) / 100);
}

const clampRung = (tier: BoardTier, rung: number) =>
  Math.min(LADDER[tier].length - 1, Math.max(0, Math.floor(rung)));

export function rungAt(tier: BoardTier, rung: number): Rung {
  return LADDER[tier][clampRung(tier, rung)];
}

/**
 * The next step down that changes anything on this screen, or the same step
 * when there is none. A step that only lowers a cap the screen was already
 * under would cost a wait and gain nothing, so it is passed over.
 */
export function stepDown(
  tier: BoardTier,
  rung: number,
  screen: Screen,
): number {
  const from = clampRung(tier, rung);
  const now = rungAt(tier, from);
  const ratio = pixelRatio(now, screen);
  for (let next = from + 1; next < LADDER[tier].length; next += 1) {
    const step = LADDER[tier][next];
    if (step.shadow !== now.shadow || pixelRatio(step, screen) < ratio) {
      return next;
    }
  }
  return from;
}

// ---- noticing a device that can't keep up ----------------------------------------

/** Slower than this, averaged over a stretch of driving, is too slow. */
export const SLOW_FRAME = 1 / 26;
/** Frames in one stretch. */
const WINDOW = 60;
/** Frames let go by after the scene starts or changes, while it settles. */
const SETTLE = 45;
/** A gap this long is the tab being away, not the device being slow. */
const AWAY = 0.25;

export type Pace = {
  settle: number;
  frames: number;
  total: number;
  /** Slow stretches in a row. */
  slow: number;
};

export function newPace(): Pace {
  return { settle: SETTLE, frames: 0, total: 0, slow: 0 };
}

/**
 * Count one frame of driving. Returns true when the device has been slow for
 * two stretches running, which is the moment to step down. One slow stretch
 * is forgiven: a download finishing or a shader being built looks the same.
 */
export function paceFrame(pace: Pace, seconds: number): boolean {
  if (seconds > AWAY) return false;
  if (pace.settle > 0) {
    pace.settle -= 1;
    return false;
  }
  pace.frames += 1;
  pace.total += seconds;
  if (pace.frames < WINDOW) return false;
  const slow = pace.total / pace.frames > SLOW_FRAME;
  pace.frames = 0;
  pace.total = 0;
  pace.slow = slow ? pace.slow + 1 : 0;
  if (pace.slow < 2) return false;
  pace.slow = 0;
  pace.settle = SETTLE;
  return true;
}

// ---- remembering where a device settled -------------------------------------------

const RUNG_KEY = "driverush:board-rung";
/** After this long the device gets another go at the full picture. */
const RUNG_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

type Saved = { tier: BoardTier; rung: number; at: number };

/** Read what was saved, if it is for this tier and still fresh. */
export function parseRung(
  raw: string | null,
  tier: BoardTier,
  now: number,
): number {
  if (!raw) return 0;
  try {
    const saved = JSON.parse(raw) as Partial<Saved>;
    if (saved.tier !== tier) return 0;
    if (typeof saved.rung !== "number" || typeof saved.at !== "number") {
      return 0;
    }
    if (now - saved.at > RUNG_DAYS * DAY || now < saved.at) return 0;
    return clampRung(tier, saved.rung);
  } catch {
    return 0;
  }
}

/**
 * The step this device starts on: where it settled last time, so a phone that
 * struggled doesn't stutter through the same steps on every visit. Asking for
 * "Sharp" wipes that and starts from the top.
 */
export function startRung(quality: BoardQuality, tier: BoardTier): number {
  try {
    if (quality === "high") {
      window.localStorage.removeItem(RUNG_KEY);
      return 0;
    }
    return parseRung(window.localStorage.getItem(RUNG_KEY), tier, Date.now());
  } catch {
    return 0;
  }
}

export function saveRung(tier: BoardTier, rung: number): void {
  try {
    const saved: Saved = { tier, rung, at: Date.now() };
    window.localStorage.setItem(RUNG_KEY, JSON.stringify(saved));
  } catch {
    // Private mode, or storage full: the device just starts from the top.
  }
}
