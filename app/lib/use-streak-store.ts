/**
 * Daily streak + XP-goal store. Persists across reloads (localStorage) and is
 * surfaced only inside course routes (not the global Rail). The daily XP
 * counter resets at local midnight; the streak ticks up on the first lesson
 * completed on a new day and resets if a full day is skipped (unless a freeze
 * is available — auto-spent silently with a Sonner toast from the caller).
 *
 * Date math runs entirely on local time. NEVER read "today" during render or
 * hydration mismatches will fire — components should pull state behind a
 * mounted gate (see `useStreakStoreHydrated`).
 */
import * as React from "react";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export type DailyGoal = 30 | 50 | 100 | 150;

type StreakState = {
  currentStreak: number;
  longestStreak: number;
  /** ISO date string `YYYY-MM-DD` of the last day a lesson completed. */
  lastActiveDate: string | null;
  dailyXpEarned: number;
  /** ISO date string the daily counter is currently tallying for. */
  dailyXpDate: string | null;
  dailyGoal: DailyGoal;
  freezesAvailable: number;
  /** Days completed since the last freeze grant (every 7 = +1 freeze). */
  daysSinceFreezeGrant: number;

  recordLessonComplete: (xp: number) => { freezeSpent: boolean };
  setDailyGoal: (goal: DailyGoal) => void;
};

/** Local-time `YYYY-MM-DD`. */
function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const ad = new Date(a + "T00:00:00");
  const bd = new Date(b + "T00:00:00");
  return Math.round((bd.getTime() - ad.getTime()) / 86_400_000);
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      dailyXpEarned: 0,
      dailyXpDate: null,
      dailyGoal: 50,
      freezesAvailable: 0,
      daysSinceFreezeGrant: 0,

      recordLessonComplete: (xp) => {
        const today = toLocalISO(new Date());
        const s = get();
        let {
          currentStreak,
          longestStreak,
          freezesAvailable,
          daysSinceFreezeGrant,
        } = s;
        let freezeSpent = false;

        if (s.lastActiveDate === null) {
          currentStreak = 1;
          daysSinceFreezeGrant = 1;
        } else {
          const gap = daysBetween(s.lastActiveDate, today);
          if (gap === 0) {
            // already counted today; no streak change
          } else if (gap === 1) {
            currentStreak += 1;
            daysSinceFreezeGrant += 1;
          } else if (gap > 1 && freezesAvailable > 0) {
            // freeze auto-spent (single day saved; gaps >1 cost one freeze)
            freezesAvailable -= 1;
            freezeSpent = true;
            currentStreak += 1;
            daysSinceFreezeGrant += 1;
          } else {
            currentStreak = 1;
            daysSinceFreezeGrant = 1;
          }
        }

        // Grant a freeze every 7 days of unbroken progress, capped at 2 banked.
        if (daysSinceFreezeGrant >= 7) {
          freezesAvailable = Math.min(2, freezesAvailable + 1);
          daysSinceFreezeGrant = 0;
        }

        longestStreak = Math.max(longestStreak, currentStreak);

        // Daily XP rolls over at local midnight.
        const dailyXpEarned =
          s.dailyXpDate === today ? s.dailyXpEarned + xp : xp;

        set({
          currentStreak,
          longestStreak,
          lastActiveDate: today,
          dailyXpEarned,
          dailyXpDate: today,
          freezesAvailable,
          daysSinceFreezeGrant,
        });

        return { freezeSpent };
      },

      setDailyGoal: (goal) => set({ dailyGoal: goal }),
    }),
    {
      name: "driverush:ntsa-streak",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage,
      ),
    },
  ),
);

/**
 * Convenience: returns the streak state behind a mounted gate so SSR markup
 * always matches a "no streak yet" first paint, then swaps in the persisted
 * values once the client hydrates. Components that surface streak info should
 * use this and render a placeholder while `hydrated` is false.
 */
export function useStreakStoreHydrated(): {
  hydrated: boolean;
  state: StreakState;
  todayMet: boolean;
} {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const state = useStreakStore();
  const today = hydrated ? toLocalISO(new Date()) : null;
  const todayMet =
    hydrated &&
    state.dailyXpDate === today &&
    state.dailyXpEarned >= state.dailyGoal;
  return { hydrated, state, todayMet };
}
