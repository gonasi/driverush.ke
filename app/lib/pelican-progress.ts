/**
 * Per-sign mastery for the Pelican trainer — a tiny Leitner box per region id.
 * Missed → box − 1 (and re-queued soon within the run by the engine); knew →
 * box + 1; box ≥ {@link MASTERED_BOX} counts as "mastered". This is a "you've
 * really got this set" badge, not a gate on anything. Persisted by the Zustand
 * store in `pelican-store.ts`; this file is just the types + pure helpers.
 */
export type GradeResult = "knew" | "missed";
export type SignBox = { box: number; seen: number };
export type SignProgress = Record<string, SignBox>;

export const MAX_BOX = 5;
export const MASTERED_BOX = 2;

/** localStorage key the old (pre-Zustand) progress hook used — for migration. */
export const LEGACY_PROGRESS_KEY = "driverush:pelican:progress";

export function boxOf(progress: SignProgress, regionId: string): number {
  return progress[regionId]?.box ?? 0;
}

export function isMastered(progress: SignProgress, regionId: string): boolean {
  return boxOf(progress, regionId) >= MASTERED_BOX;
}

export function masteredCount(
  progress: SignProgress,
  regionIds: string[],
): number {
  return regionIds.filter((id) => isMastered(progress, id)).length;
}

/** Apply a grade to a single region's box (pure). Missed knocks it down one;
 *  knew bumps it up one — never a full reset, so a slip costs you a step, not
 *  the lot. */
export function applyGrade(
  progress: SignProgress,
  regionId: string,
  result: GradeResult,
): SignProgress {
  const cur = progress[regionId] ?? { box: 0, seen: 0 };
  const box =
    result === "missed"
      ? Math.max(0, cur.box - 1)
      : Math.min(MAX_BOX, cur.box + 1);
  return { ...progress, [regionId]: { box, seen: cur.seen + 1 } };
}
