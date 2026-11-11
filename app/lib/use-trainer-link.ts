import * as React from "react";
import { useSearchParams } from "react-router";

import { parseTrainerLink, type RunScope } from "./trainer-rounds";

/**
 * Reads a trainer deep link. Parsed during render so server and client agree;
 * the run only starts on a tap or on `?go=1`, and the params are cleared then so
 * a reload doesn't replay it. Links never touch saved settings, or a stale filter
 * would quietly shrink every later run.
 */
export function useTrainerLink(
  signs: readonly { id: string; code?: string; category: string }[],
  store: {
    ready: boolean;
    start: (scope?: RunScope) => void;
    exit: () => void;
  },
) {
  const [params, setParams] = useSearchParams();
  const link = React.useMemo(
    () => parseTrainerLink(params, signs),
    [params, signs],
  );
  const go = params.get("go") === "1";
  const { ready, start, exit } = store;

  const startRun = React.useCallback(
    (scope?: RunScope) => {
      start(scope);
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const key of ["codes", "cat", "go"]) next.delete(key);
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [start, setParams],
  );

  // Arriving from a link while a previous run is still open: close it first.
  const arrivedWithLink = React.useRef(link != null || go);
  React.useEffect(() => {
    if (arrivedWithLink.current) exit();
  }, [exit]);

  React.useEffect(() => {
    if (!go || !ready) return;
    // A tick later, so the player's mount effects have settled. Its cleanup
    // pauses the run, and React re-runs effects on mount in development.
    const id = window.setTimeout(() => startRun(link ?? undefined), 0);
    return () => window.clearTimeout(id);
  }, [go, ready, link, startRun]);

  return { link, startRun };
}
