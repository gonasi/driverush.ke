/**
 * Guest progress storage. Lives in localStorage so a user can practice,
 * close the tab, come back tomorrow, and pick up where they left off — all
 * without an account. When/if accounts ship, this same shape will sync to
 * the backend (the keys map cleanly).
 */

const STORAGE_KEY = "dr-progress-v1";

export type Progress = {
  /** Per-question record so we can suggest under-practiced ones later. */
  answered: Record<string, { correct: boolean; at: number }>;
  totalAnswered: number;
  totalCorrect: number;
  /** Day-streak count. Bumps when a different day records an answer. */
  streak: number;
  /** Last day the user practiced, ISO YYYY-MM-DD. */
  lastDay: string | null;
};

export function emptyProgress(): Progress {
  return {
    answered: {},
    totalAnswered: 0,
    totalCorrect: 0,
    streak: 0,
    lastDay: null,
  };
}

const isBrowser = () => typeof window !== "undefined";

export function loadProgress(): Progress {
  if (!isBrowser()) return emptyProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { ...emptyProgress(), ...parsed };
  } catch {
    // Corrupt or unparseable. Start clean rather than crashing the app.
    return emptyProgress();
  }
}

export function saveProgress(p: Progress): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // Quota exceeded or storage disabled. Fail silently — losing progress is
    // better than crashing the practice flow.
  }
}

function todayIso(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function bumpStreak(prev: Progress, today: string): number {
  if (!prev.lastDay) return 1;
  if (prev.lastDay === today) return prev.streak;
  // Was yesterday? Continue the streak. Anything older? Reset.
  const last = new Date(prev.lastDay);
  const ms = new Date(today).getTime() - last.getTime();
  const oneDay = 86_400_000;
  return ms <= oneDay * 1.5 ? prev.streak + 1 : 1;
}

/** Record a single answer. Updates totals + streak. Idempotent per call. */
export function recordAnswer(questionId: string, correct: boolean): Progress {
  const prev = loadProgress();
  const today = todayIso();
  const next: Progress = {
    ...prev,
    answered: {
      ...prev.answered,
      [questionId]: { correct, at: Date.now() },
    },
    totalAnswered: prev.totalAnswered + 1,
    totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
    streak: bumpStreak(prev, today),
    lastDay: today,
  };
  saveProgress(next);
  return next;
}

/** Wipe local progress. Returns a fresh empty Progress. */
export function clearProgress(): Progress {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  return emptyProgress();
}

export type Stats = {
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number; // 0–100
  streak: number;
  hasProgress: boolean;
};

export function getStats(p: Progress = loadProgress()): Stats {
  const accuracy =
    p.totalAnswered === 0
      ? 0
      : Math.round((p.totalCorrect / p.totalAnswered) * 100);
  return {
    totalAnswered: p.totalAnswered,
    totalCorrect: p.totalCorrect,
    accuracy,
    streak: p.streak,
    hasProgress: p.totalAnswered > 0,
  };
}
