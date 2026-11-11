/**
 * Days in a row a learner has practised, shared by both trainers. Any grade in
 * either trainer counts as practice for that day.
 *
 * Kept under its own localStorage key rather than in a trainer store, so adding
 * it never bumps a store's persist version (which would wipe progress).
 */
import * as React from "react";

export const STREAK_KEY = "driverush:streak";

export type PracticeStreak = {
  /** Days in a row, ending on `lastDay`. */
  days: number;
  best: number;
  /** Local calendar day, `YYYY-MM-DD`. */
  lastDay: string;
};

export function dayKey(time: number): string {
  const d = new Date(time);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function yesterdayKey(now: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return dayKey(d.getTime());
}

/** Count today as practised (pure). Same day twice changes nothing. */
export function recordPracticeDay(
  state: PracticeStreak | null,
  now = Date.now(),
): PracticeStreak {
  const today = dayKey(now);
  if (state?.lastDay === today) return state;
  const days = state?.lastDay === yesterdayKey(now) ? state.days + 1 : 1;
  return { days, best: Math.max(days, state?.best ?? 0), lastDay: today };
}

/**
 * The streak as it stands now: still alive if the last practice was today or
 * yesterday, otherwise 0. `practisedToday` says whether today is already in.
 */
export function liveStreak(
  state: PracticeStreak | null,
  now = Date.now(),
): { days: number; practisedToday: boolean } {
  if (!state) return { days: 0, practisedToday: false };
  if (state.lastDay === dayKey(now)) {
    return { days: state.days, practisedToday: true };
  }
  if (state.lastDay === yesterdayKey(now)) {
    return { days: state.days, practisedToday: false };
  }
  return { days: 0, practisedToday: false };
}

export function parseStreak(raw: string | null): PracticeStreak | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<PracticeStreak>;
    if (typeof v.days !== "number" || typeof v.lastDay !== "string") {
      return null;
    }
    return { days: v.days, best: v.best ?? v.days, lastDay: v.lastDay };
  } catch {
    return null;
  }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STREAK_KEY);
  } catch {
    return null;
  }
}

/** Mark today as practised. Called on every grade; cheap after the first. */
export function bumpPracticeStreak(now = Date.now()): PracticeStreak | null {
  if (typeof window === "undefined") return null;
  const before = parseStreak(readRaw());
  const after = recordPracticeDay(before, now);
  if (after !== before) {
    try {
      window.localStorage.setItem(STREAK_KEY, JSON.stringify(after));
    } catch {
      // Private mode / storage full: the streak just won't stick.
    }
  }
  return after;
}

/** Read the saved streak outside React (e.g. in a store, at run end). */
export function readPracticeStreak(): PracticeStreak | null {
  if (typeof window === "undefined") return null;
  return parseStreak(readRaw());
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("focus", onChange);
  };
}

// "" on the client when nothing is saved, so `null` only ever means "server".
const getSnapshot = () => readRaw() ?? "";
const getServerSnapshot = () => null;

/**
 * The live streak for pages outside the trainers. `null` on the server and
 * during hydration, so a saved streak can't cause a mismatch.
 */
export function usePracticeStreak(): ReturnType<typeof liveStreak> | null {
  const raw = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return React.useMemo(
    () => (raw === null ? null : liveStreak(parseStreak(raw || null))),
    [raw],
  );
}
