/**
 * Image-focus quiz model — the shape of a "zoom into one sign at a time, blur
 * the rest, show the name" trainer. DriveRush has no database; this data is
 * authored with the `/tools/image-coords` tool and then hardcoded into a route
 * (e.g. `/road-signs/pelican`).
 *
 * Inspired by Gonasi's `imageFocusQuiz` plugin, trimmed to plain TypeScript
 * (no zod) and extended with Kenyan road-sign metadata (NTSA Highway Code
 * class / category / code / note).
 *
 * Coordinates are normalised percentages (0–100) of the image box, so the same
 * region works for SVG, JPEG or PNG regardless of intrinsic pixel size.
 */

/** The one road-sign sheet every trainer board zooms into. Lives in `public/`. */
export const ROAD_SIGNS_IMAGE_SRC = "/assets/road-signs/road-signs.svg";

/**
 * Kenyan road-sign categories (NTSA Highway Code), keyed by the official code
 * prefix. `count` is how many signs the Code lists in that category — used to
 * show authoring progress ("12 of 34 mapped"). Signs are recognised by shape +
 * colour, so each carries a `shape` hint and an `emoji` for quick scanning.
 *
 *  ⚠️  Warning      W.1–W.32   (34 signs)
 *  🔴  Priority     R.1–R.2    (2 signs)
 *  🔵  Mandatory    M.1–M.11   (11 signs)
 *  🚫  Prohibitory  P.1–P.39   (29 signs)
 *  📋  Additional panels  A.1–A.1b  (4 entries)
 */
export const SIGN_CATEGORIES = [
  {
    id: "warning",
    label: "Warning signs",
    prefix: "W",
    emoji: "⚠️",
    count: 34,
    shape: "Triangle, red border",
  },
  {
    id: "priority",
    label: "Priority signs",
    prefix: "R",
    emoji: "🔴",
    count: 2,
    shape: "Octagon (STOP) / inverted triangle (GIVE WAY)",
  },
  {
    id: "mandatory",
    label: "Mandatory signs",
    prefix: "M",
    emoji: "🔵",
    count: 11,
    shape: "Solid blue circle",
  },
  {
    id: "prohibitory",
    label: "Prohibitory signs",
    prefix: "P",
    emoji: "🚫",
    count: 29,
    shape: "White circle with a red ring",
  },
  {
    id: "additional-panels",
    label: "Additional panels",
    prefix: "A",
    emoji: "📋",
    count: 4,
    shape: "Supplementary plate fixed below another sign",
  },
  {
    id: "other",
    label: "Other",
    prefix: "",
    emoji: "🚧",
    count: 0,
    shape: "",
  },
] as const satisfies readonly {
  id: string;
  label: string;
  prefix: string;
  emoji: string;
  count: number;
  shape: string;
}[];
export type SignCategory = (typeof SIGN_CATEGORIES)[number];
export type SignCategoryId = SignCategory["id"];

/** Look up a category by id, falling back to "other". */
export function getSignCategory(id: string): SignCategory {
  return (
    SIGN_CATEGORIES.find((c) => c.id === id) ??
    SIGN_CATEGORIES.find((c) => c.id === "other")!
  );
}

/** One category as a noun phrase that reads after a count: "34 warning signs". */
function categoryNounPhrase(id: SignCategoryId): string {
  const label = getSignCategory(id).label.toLowerCase();
  return /\b(signs|panels)$/.test(label) ? label : `${label} signs`;
}

/**
 * A readable label for a chosen practice-category set — `[]` means "every sign"
 * (no filter). Used in the trainer's completion copy.
 *   []                       → "every sign"
 *   ["warning"]              → "warning signs"
 *   ["warning","mandatory"]  → "warning signs & mandatory signs"
 *   four or more             → "4 sign categories"
 */
export function describeCategorySet(ids: readonly SignCategoryId[]): string {
  if (ids.length === 0) return "every sign";
  if (ids.length === 1) return categoryNounPhrase(ids[0]);
  if (ids.length <= 3) {
    const parts = ids.map((id) => getSignCategory(id).label.toLowerCase());
    return `${parts.slice(0, -1).join(", ")} & ${parts[parts.length - 1]}`;
  }
  return `${ids.length} sign categories`;
}

/** A single focusable region on the image. */
export type FocusRegion = {
  /** Stable id / slug, e.g. `"pelican-crossing"`. Used for React keys + URLs. */
  id: string;
  /** The answer shown when the region is revealed, e.g. `"Pelican crossing"`. */
  name: string;
  /** Sign category id — see {@link SIGN_CATEGORIES} (Warning / Priority / …). */
  category: SignCategoryId;
  /** Optional NTSA Highway Code reference, e.g. `"W.1"`, `"P.39"`, `"A.1b"`. */
  code?: string;
  /** Optional longer description — rule context, what the driver should do. */
  note?: string;
  /** Optional path to a sound played when the answer is revealed. */
  audioSrc?: string;
  /** Optional per-region reveal-delay override, in seconds. */
  revealDelay?: number;
  /** Playback order (0-based). */
  index: number;

  // ---- Geometry (normalised %, 0–100) ----
  /** Left edge as % of image width. */
  x: number;
  /** Top edge as % of image height. */
  y: number;
  /** Width as % of image width. */
  width: number;
  /** Height as % of image height. */
  height: number;

  // ---- Cropper restoration (react-easy-crop) ----
  /** Saved zoom level so the cropper can re-open exactly where you left it. */
  zoom?: number;
  /** Saved crop x offset for cropper restoration. */
  cropX?: number;
  /** Saved crop y offset for cropper restoration. */
  cropY?: number;
};

/** Playback / presentation settings shared by every region in a board. */
export type ImageFocusSettings = {
  /** `auto` reveals after a timer; `manual` waits for a tap. */
  revealMode: "auto" | "manual";
  /** Default seconds before the answer is revealed (auto mode). */
  defaultRevealDelay: number;
  /** Blur radius (px) applied to everything outside the focused region. */
  blurIntensity: number;
  /** Dim opacity (0–1) over the unfocused area; scaled down internally. */
  dimIntensity: number;
  /** Seconds the full image shows before the first region focuses. */
  initialDisplayDuration: number;
  /** Seconds the full image shows between regions. */
  betweenRegionsDuration: number;
  /** Zoom/blur transition duration, in milliseconds. */
  animationDuration: number;
  /** Whether to auto-advance to the next region after the answer is shown. */
  autoAdvance: boolean;
  /** Seconds to wait before auto-advancing. */
  autoAdvanceDelay: number;
  /** Region order during playback. */
  randomization: "none" | "shuffle";
  /**
   * When playing in order (not shuffled), whether the run wraps from the last
   * region back to the first. If `false`, playback stops at the end.
   */
  loopPlayback: boolean;
  /**
   * 0-based region `index` to begin playback from. Clamped to a valid index;
   * ignored when `randomization === "shuffle"`.
   */
  startIndex: number;
  /** Play regions last → first. Only applies when `randomization === "none"`. */
  reverseOrder: boolean;
  /** Whether to play per-region audio. */
  playAudio: boolean;
};

/** A complete authored board: the image + its settings + its regions. */
export type ImageFocusData = {
  /** Image URL/path, e.g. `/assets/road-signs/road-signs.svg`. */
  imageSrc: string;
  /** Intrinsic image width in px (for reference / coordinate sanity checks). */
  imageWidth: number;
  /** Intrinsic image height in px. */
  imageHeight: number;
  settings: ImageFocusSettings;
  regions: FocusRegion[];
};

export const DEFAULT_IMAGE_FOCUS_SETTINGS: ImageFocusSettings = {
  revealMode: "auto",
  defaultRevealDelay: 4,
  blurIntensity: 8,
  dimIntensity: 0.6,
  initialDisplayDuration: 1,
  betweenRegionsDuration: 0.8,
  animationDuration: 600,
  autoAdvance: true,
  autoAdvanceDelay: 3,
  randomization: "none",
  loopPlayback: true,
  startIndex: 0,
  reverseOrder: false,
  playAudio: true,
};

type RegionBox = Pick<FocusRegion, "x" | "y" | "width" | "height">;

export type RegionTransform = {
  /** Scale factor to apply to the image layer. */
  scale: number;
  /** X translation in % of the (unscaled) image box. */
  translateX: number;
  /** Y translation in % of the (unscaled) image box. */
  translateY: number;
  /** Ready-to-use `transform` string for the zoom layer. */
  transform: string;
};

/**
 * Work out the `transform` that zooms an image (which fills its frame) so the
 * given region fills ~`fill`% of it and sits centred. Used by the authoring
 * preview and the trainer's "ready" card (both `aspect-video` boxes). The
 * fullscreen trainer uses a plainer `background-position` crop instead.
 */
export function computeRegionTransform(
  region: RegionBox,
  { fill = 90, maxScale = 12 }: { fill?: number; maxScale?: number } = {},
): RegionTransform {
  const centerX = region.x + region.width / 2;
  const centerY = region.y + region.height / 2;
  const scale = Math.min(fill / region.width, fill / region.height, maxScale);
  const translateX = -((centerX - 50) * scale);
  const translateY = -((centerY - 50) * scale);
  return {
    scale,
    translateX,
    translateY,
    transform: `translate(${translateX}%, ${translateY}%) scale(${scale})`,
  };
}

/** Identity transform — the un-zoomed full image. */
export const IDENTITY_REGION_TRANSFORM: RegionTransform = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  transform: "translate(0%, 0%) scale(1)",
};

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
 * Build a playback order from a region list: sort by `index`, then either
 * `shuffle` OR (optionally) `reverse`, then rotate so the region whose
 * `index === startIndex` (clamped) comes first. `shuffle` ignores
 * `reverse`/`startIndex`. Pass board settings *or* per-player settings.
 */
export function orderRegions(
  regions: FocusRegion[],
  opts: { shuffle?: boolean; reverse?: boolean; startIndex?: number } = {},
): FocusRegion[] {
  const sorted = [...regions].sort((a, b) => a.index - b.index);
  if (sorted.length === 0) return sorted;
  if (opts.shuffle) return shuffled(sorted);

  const ordered = opts.reverse ? [...sorted].reverse() : sorted;
  const start = clampIndex(opts.startIndex ?? 0, ordered.length);
  const pivot = ordered.findIndex((r) => r.index === start);
  const at = pivot >= 0 ? pivot : 0;
  return [...ordered.slice(at), ...ordered.slice(0, at)];
}

/**
 * Move a region to position `newIndex` in the order, then renumber every
 * region's `index` to be contiguous `0…n-1`. Returns a new array.
 */
export function moveRegionToIndex(
  regions: FocusRegion[],
  id: string,
  newIndex: number,
): FocusRegion[] {
  const sorted = [...regions].sort((a, b) => a.index - b.index);
  const from = sorted.findIndex((r) => r.id === id);
  if (from < 0) return regions;
  const moved = sorted.splice(from, 1)[0]!;
  const to = Math.min(Math.max(0, Math.round(newIndex)), sorted.length);
  sorted.splice(to, 0, moved);
  return sorted.map((r, i) => ({ ...r, index: i }));
}
