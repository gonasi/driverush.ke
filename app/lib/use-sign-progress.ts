import * as React from "react";

import {
  parsePersistedProgress,
  TRAINER_STORAGE_KEYS,
  type SignProgress,
} from "./pelican-progress";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("focus", onChange);
  };
}

function getSnapshot(): string {
  return [
    window.localStorage.getItem(TRAINER_STORAGE_KEYS.pelican) ?? "",
    window.localStorage.getItem(TRAINER_STORAGE_KEYS["3d"]) ?? "",
  ].join("\n");
}

const getServerSnapshot = () => null;

/**
 * Saved progress for both trainers, read-only, for pages outside the trainers
 * (home, the signs hub). Reads the persisted keys rather than the stores, which
 * would hydrate from localStorage at import. `null` on the server and during
 * hydration, so saved progress can't cause a mismatch.
 */
export function useSignProgress(): Record<
  keyof typeof TRAINER_STORAGE_KEYS,
  SignProgress
> | null {
  const raw = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return React.useMemo(() => {
    if (raw == null) return null;
    const [pelican, threeD] = raw.split("\n");
    return {
      pelican: parsePersistedProgress(pelican),
      "3d": parsePersistedProgress(threeD),
    };
  }, [raw]);
}
