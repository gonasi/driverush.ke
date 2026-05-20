/**
 * Per-player preferences for the `/road-signs/3d` recognition trainer. These
 * layer on top of the board's authored `Signs3DData.settings` (timings); only a
 * curated subset is user-tweakable. Persisted (with the mastery progress) by the
 * Zustand store in `signs-3d-store.ts`.
 *
 * A trimmed cousin of `pelican-settings.ts`: there's no blur/dim (the sign is a
 * model, not a crop on a chart), and we add an `autoRotate` turntable toggle.
 */
import type { SignCategoryId } from "./signs-3d";

export type SignOrder = "sequential" | "shuffle";
export type RevealMode = "auto" | "manual";

export type Signs3DUserSettings = {
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
  /** Gently turntable-rotate the sign while you study it. */
  autoRotate: boolean;
  /** Show "knew it / missed it" taps and track mastery. */
  selfGrading: boolean;
  /** Has the player seen the one-time "make it yours" intro modal? */
  hasSeenIntro: boolean;
};

export const DEFAULT_SIGNS_3D_SETTINGS: Signs3DUserSettings = {
  categories: [],
  // Shuffled by default so back-to-back runs don't just memorise positions.
  order: "shuffle",
  reverse: false,
  revealMode: "auto",
  revealDelay: 4,
  autoAdvance: true,
  autoAdvanceDelay: 3,
  playAudio: true,
  autoRotate: true,
  // On by default → each answer waits for a "Knew it / Missed it" tap and tracks
  // mastery. While it's on, auto-advance is held off — you control the pace.
  selfGrading: true,
  hasSeenIntro: false,
};

/** Merge a (possibly partial / untrusted) object onto the defaults. */
export function normalizeSettings(
  raw: Partial<Signs3DUserSettings> | null | undefined,
): Signs3DUserSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_SIGNS_3D_SETTINGS;
  return {
    ...DEFAULT_SIGNS_3D_SETTINGS,
    ...raw,
    categories: Array.isArray(raw.categories) ? raw.categories : [],
    hasSeenIntro: Boolean(raw.hasSeenIntro),
  };
}
