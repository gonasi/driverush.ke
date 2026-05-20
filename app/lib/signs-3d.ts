/**
 * 3D road-sign trainer model — the shape of a "show one sign at a time as a
 * spinnable 3D model, name it, reveal" recognition trainer. The sibling of the
 * Pelican image-focus trainer (`image-focus.ts`): same Kenyan road-sign
 * metadata + same audio, but each sign is a GLB model instead of a crop on a
 * chart.
 *
 * DriveRush has no database; this data is authored with the `/tools/sign-3d`
 * tool and hardcoded into `app/data/road-signs-3d.json`, then loaded by the
 * `/road-signs/3d` route.
 *
 * Categories are shared with the Pelican trainer — re-exported here so callers
 * don't need to know which file the road-sign taxonomy lives in.
 */
import {
  describeCategorySet,
  getSignCategory,
  SIGN_CATEGORIES,
  type SignCategory,
  type SignCategoryId,
} from "./image-focus";

export {
  describeCategorySet,
  getSignCategory,
  SIGN_CATEGORIES,
  type SignCategory,
  type SignCategoryId,
};

/** Where the GLB models live under `public/`. */
export const ROAD_SIGNS_MODELS_BASE = "/assets/road-signs/models";

/** A single 3D road sign — one GLB model + its NTSA Highway Code metadata. */
export type Sign3D = {
  /** Stable id / slug, e.g. `"sign-3d-p1"`. Used for React keys + progress. */
  id: string;
  /** The answer shown on reveal, e.g. `"No entry"`. */
  name: string;
  /** Sign category id — see {@link SIGN_CATEGORIES}. */
  category: SignCategoryId;
  /** NTSA Highway Code reference, e.g. `"P.1"`, `"W.13(a)"`. */
  code?: string;
  /** Longer description — rule context, what the driver should do. */
  note?: string;
  /** Path to the GLB model, e.g. `/assets/road-signs/models/P_1.glb`. */
  modelSrc: string;
  /** Path to the spoken-name clip (shared with the Pelican trainer). */
  audioSrc?: string;
  /** Per-sign reveal-delay override, in seconds. */
  revealDelay?: number;
  /** Playback order (0-based). */
  index: number;

  // ---- 3D framing overrides (authored in /tools/sign-3d) ----
  /** Initial Y-axis rotation of the model, in degrees. */
  yaw?: number;
  /** Initial X-axis tilt of the model, in degrees. */
  pitch?: number;
  /** Dolly multiplier on the auto-fit distance (1 = default, <1 = closer). */
  zoom?: number;
};

/** Playback / presentation settings shared by every sign in the board. */
export type Signs3DSettings = {
  /** `auto` reveals after a timer; `manual` waits for a tap. */
  revealMode: "auto" | "manual";
  /** Default seconds before the answer is revealed (auto mode). */
  defaultRevealDelay: number;
  /** Seconds the first sign shows before the recall window opens. */
  initialDisplayDuration: number;
  /** Seconds between signs. */
  betweenRegionsDuration: number;
  /** Auto-advance to the next sign after the answer is shown. */
  autoAdvance: boolean;
  /** Seconds to wait before auto-advancing. */
  autoAdvanceDelay: number;
  /** Sign order during playback. */
  randomization: "none" | "shuffle";
  /** Wrap from the last sign back to the first when playing in order. */
  loopPlayback: boolean;
  /** 0-based `index` to begin playback from. */
  startIndex: number;
  /** Play signs last → first (ignored when shuffled). */
  reverseOrder: boolean;
  /** Whether to play per-sign audio. */
  playAudio: boolean;
  /** Gently turntable-rotate the sign (off under prefers-reduced-motion). */
  autoRotate: boolean;
  /** Auto-rotate speed (drei OrbitControls units). */
  autoRotateSpeed: number;
};

/** A complete authored board: the model base + its settings + its signs. */
export type Signs3DData = {
  /** Base path the GLBs live under (for the authoring tool). */
  modelsBase: string;
  settings: Signs3DSettings;
  signs: Sign3D[];
};

export const DEFAULT_SIGNS_3D_SETTINGS: Signs3DSettings = {
  revealMode: "auto",
  defaultRevealDelay: 4,
  initialDisplayDuration: 1,
  betweenRegionsDuration: 0.8,
  autoAdvance: true,
  autoAdvanceDelay: 3,
  randomization: "none",
  loopPlayback: true,
  startIndex: 0,
  reverseOrder: false,
  playAudio: true,
  autoRotate: true,
  autoRotateSpeed: 1.2,
};

export function emptyBoard3D(): Signs3DData {
  return {
    modelsBase: ROAD_SIGNS_MODELS_BASE,
    settings: { ...DEFAULT_SIGNS_3D_SETTINGS },
    signs: [],
  };
}

/** Fisher–Yates shuffle (non-mutating). */
function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function clampIndex(n: number, len: number): number {
  if (len <= 0) return 0;
  return Math.min(Math.max(0, Math.round(n)), len - 1);
}

/**
 * Build a playback order from a sign list: sort by `index`, then `shuffle` OR
 * `reverse`, then rotate so the sign whose `index === startIndex` comes first.
 * Mirrors `orderRegions` in `image-focus.ts`.
 */
export function orderSigns(
  signs: Sign3D[],
  opts: { shuffle?: boolean; reverse?: boolean; startIndex?: number } = {},
): Sign3D[] {
  const sorted = [...signs].sort((a, b) => a.index - b.index);
  if (sorted.length === 0) return sorted;
  if (opts.shuffle) return shuffled(sorted);

  const ordered = opts.reverse ? [...sorted].reverse() : sorted;
  const start = clampIndex(opts.startIndex ?? 0, ordered.length);
  const pivot = ordered.findIndex((r) => r.index === start);
  const at = pivot >= 0 ? pivot : 0;
  return [...ordered.slice(at), ...ordered.slice(0, at)];
}

/**
 * Move a sign to position `newIndex` in the order, then renumber every sign's
 * `index` to be contiguous `0…n-1`. Returns a new array. Used by the tool.
 */
export function moveSignToIndex(
  signs: Sign3D[],
  id: string,
  newIndex: number,
): Sign3D[] {
  const sorted = [...signs].sort((a, b) => a.index - b.index);
  const from = sorted.findIndex((r) => r.id === id);
  if (from < 0) return signs;
  const moved = sorted.splice(from, 1)[0]!;
  const to = Math.min(Math.max(0, Math.round(newIndex)), sorted.length);
  sorted.splice(to, 0, moved);
  return sorted.map((r, i) => ({ ...r, index: i }));
}
