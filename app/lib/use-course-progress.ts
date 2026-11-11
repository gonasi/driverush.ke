import * as React from "react";

import type { CourseProgress } from "./board/curriculum";

/** Where `board-store.ts` keeps its saved state. */
const KEY = "driverush:board";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("focus", onChange);
  };
}

const getSnapshot = () => window.localStorage.getItem(KEY) ?? "";
const getServerSnapshot = () => null;

/**
 * Which levels of the board course are done, read-only, for the pages that
 * list them or link to the next one. It reads the saved key and not the store,
 * so those pages don't load the game's store to draw a button. `null` on the
 * server and during hydration, so saved progress can't cause a mismatch.
 */
export function useCourseProgress(): CourseProgress | null {
  const raw = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return React.useMemo(() => {
    if (raw == null) return null;
    try {
      const state = (JSON.parse(raw || "{}") as { state?: CourseProgress })
        .state;
      return {
        learned: Array.isArray(state?.learned) ? state.learned : [],
        bestStars: state?.bestStars ?? {},
        daily: state?.daily,
        mockBest: state?.mockBest,
      };
    } catch {
      return { learned: [], bestStars: {} };
    }
  }, [raw]);
}
