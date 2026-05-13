/**
 * Per-player preferences for the `/road-signs/pelican` trainer. These layer
 * *on top of* the board's authored `ImageFocusData.settings` (timings); only a
 * curated subset is user-tweakable. Persisted (with the mastery progress) by the
 * Zustand store in `pelican-store.ts`.
 */
import type { SignCategoryId } from "./image-focus";

export type SignOrder = "sequential" | "shuffle";
export type RevealMode = "auto" | "manual";

export type PelicanUserSettings = {
  /** Sign categories to practise. Empty array = every category. */
  categories: SignCategoryId[];
  /** Walk signs in board order vs a fresh shuffle each run. */
  order: SignOrder;
  /** Play sequential order last → first (ignored when shuffled). */
  reverse: boolean;
  /** Auto-reveal after a timer, or wait for a tap. */
  revealMode: RevealMode;
  /** Seconds before the auto reveal. */
  revealDelay: number;
  /** After the answer shows, advance automatically (ignored when self-grading). */
  autoAdvance: boolean;
  /** Seconds before the auto-advance. */
  autoAdvanceDelay: number;
  /** Play a sign's audio (if it has one) on reveal, plus the trainer SFX. */
  playAudio: boolean;
  /** Blur radius (px) over the un-focused area. */
  blurIntensity: number;
  /** Dim opacity (0–1) over the un-focused area. */
  dimIntensity: number;
  /** Show "knew it / missed it" taps and track mastery. */
  selfGrading: boolean;
  /** Has the player seen the one-time "make it yours" intro modal? */
  hasSeenIntro: boolean;
};

export const DEFAULT_PELICAN_SETTINGS: PelicanUserSettings = {
  categories: [],
  // Shuffled by default so back-to-back runs don't just memorise positions —
  // the player has to recognise each sign on its own merits.
  order: "shuffle",
  reverse: false,
  revealMode: "auto",
  revealDelay: 3,
  autoAdvance: true,
  autoAdvanceDelay: 3,
  playAudio: true,
  blurIntensity: 8,
  dimIntensity: 0.6,
  // On by default → each answer waits for a "Knew it / Missed it" tap and tracks
  // mastery. While it's on, auto-advance is held off — you control the pace.
  // Turn it off for a hands-free timed run-through.
  selfGrading: true,
  hasSeenIntro: false,
};

/** localStorage key the old (pre-Zustand) settings hook used — for migration. */
export const LEGACY_SETTINGS_KEY = "driverush:pelican:settings";

/** Merge a (possibly partial / untrusted) object onto the defaults. */
export function normalizeSettings(
  raw: Partial<PelicanUserSettings> | null | undefined,
): PelicanUserSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_PELICAN_SETTINGS;
  return {
    ...DEFAULT_PELICAN_SETTINGS,
    ...raw,
    categories: Array.isArray(raw.categories) ? raw.categories : [],
    hasSeenIntro: Boolean(raw.hasSeenIntro),
  };
}
