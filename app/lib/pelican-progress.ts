/**
 * Per-sign memory, shared by both trainers: a Leitner box per sign id. Each box
 * has a review gap, so a sign you keep getting right comes back less often and
 * one you miss comes back soon.
 *
 * - Missed: down a box, due again sooner.
 * - Knew it, and it was due: up a box.
 * - Knew it, but not due yet: no change, so replaying a set can't inflate it.
 *
 * Because of that last rule, reaching {@link MASTERED_BOX} takes recalling a sign
 * on two different days. Saved entries from before `lastAt` existed count as due.
 *
 * Persisted by the trainer stores; this file is just the types + pure helpers.
 */
export type GradeResult = "knew" | "missed";
export type SignBox = {
  box: number;
  seen: number;
  /** When this sign last moved. Missing on entries saved by older versions. */
  lastAt?: number;
};
export type SignProgress = Record<string, SignBox>;

export const MAX_BOX = 5;
export const MASTERED_BOX = 2;

/** Days until a sign is due again, indexed by box. */
const INTERVAL_DAYS = [0, 1, 2, 4, 8, 16];
const DAY_MS = 24 * 60 * 60 * 1000;

/** localStorage key the old (pre-Zustand) progress hook used — for migration. */
export const LEGACY_PROGRESS_KEY = "driverush:pelican:progress";

function startOfLocalDay(time: number): number {
  const day = new Date(time);
  day.setHours(0, 0, 0, 0);
  return day.getTime();
}

export function boxOf(progress: SignProgress, signId: string): number {
  return progress[signId]?.box ?? 0;
}

export function isMastered(progress: SignProgress, signId: string): boolean {
  return boxOf(progress, signId) >= MASTERED_BOX;
}

export function masteredCount(
  progress: SignProgress,
  signIds: readonly string[],
): number {
  return signIds.filter((id) => isMastered(progress, id)).length;
}

/** Is this sign ready to review? Never-reviewed entries always are. */
export function isDue(entry: SignBox | undefined, now = Date.now()): boolean {
  if (!entry || entry.lastAt == null) return true;
  const days = INTERVAL_DAYS[Math.min(entry.box, MAX_BOX)];
  return now >= startOfLocalDay(entry.lastAt) + days * DAY_MS;
}

/** Apply a grade to a single sign (pure). A slip costs a step, never the lot. */
export function applyGrade(
  progress: SignProgress,
  signId: string,
  result: GradeResult,
  now = Date.now(),
): SignProgress {
  const current = progress[signId] ?? { box: 0, seen: 0 };
  const seen = current.seen + 1;
  if (result === "missed") {
    const box = Math.max(0, current.box - 1);
    return { ...progress, [signId]: { box, seen, lastAt: now } };
  }
  if (!isDue(current, now)) {
    return { ...progress, [signId]: { ...current, seen } };
  }
  const box = Math.min(MAX_BOX, current.box + 1);
  return { ...progress, [signId]: { box, seen, lastAt: now } };
}

export type SignCounts = {
  /** Recalled on two different days or more. */
  known: number;
  /** Seen, but not known yet. */
  learning: number;
  /** Seen, and ready to review now. */
  due: number;
};

export function signCounts(
  progress: SignProgress,
  signIds: readonly string[],
  now = Date.now(),
): SignCounts {
  const counts: SignCounts = { known: 0, learning: 0, due: 0 };
  for (const id of signIds) {
    const entry = progress[id];
    if (!entry) continue;
    if (entry.box >= MASTERED_BOX) counts.known += 1;
    else counts.learning += 1;
    if (isDue(entry, now)) counts.due += 1;
  }
  return counts;
}

/** Where each trainer's store persists. Recall and recognition are tracked apart. */
export const TRAINER_STORAGE_KEYS = {
  pelican: "driverush:pelican",
  "3d": "driverush:signs3d",
} as const;

/** Pull the progress out of a store's persisted JSON, without loading the store. */
export function parsePersistedProgress(raw: string | null): SignProgress {
  if (!raw) return {};
  try {
    return (
      (JSON.parse(raw) as { state?: { progress?: SignProgress } }).state
        ?.progress ?? {}
    );
  } catch {
    return {};
  }
}
