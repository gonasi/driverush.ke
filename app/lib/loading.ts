import * as React from "react";

/** Default loader floor — a fast load still shows the loader for this long. */
export const MIN_LOADER_MS = 3000;

/**
 * Hold a busy / loading flag `true` for at least `minMs` once it first goes up,
 * so a load that finishes in a few hundred milliseconds doesn't flash the
 * loader on and straight back off (which reads as a glitch, not a load).
 *
 * - While `active` is `true`, the result is `true`.
 * - When `active` drops to `false`, the result stays `true` until `minMs` has
 *   elapsed since `active` first rose, then follows `active`.
 * - A genuinely slow load (longer than `minMs`) is never padded — the loader
 *   disappears as soon as `active` does.
 *
 * @param active  the underlying "is it still loading?" flag
 * @param minMs   minimum time the flag stays up (default {@link MIN_LOADER_MS})
 *
 * @example
 *   const showLoader = useLoadingFloor(status !== "ready");
 *   return showLoader ? <LoadingPanel /> : <Content />;
 */
export function useLoadingFloor(
  active: boolean,
  minMs: number = MIN_LOADER_MS,
): boolean {
  const [shown, setShown] = React.useState(active);
  const startedAtRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (active) {
      startedAtRef.current ??= Date.now();
      setShown(true);
      return;
    }
    if (startedAtRef.current == null) {
      setShown(false);
      return;
    }
    const remaining = minMs - (Date.now() - startedAtRef.current);
    if (remaining <= 0) {
      startedAtRef.current = null;
      setShown(false);
      return;
    }
    const id = window.setTimeout(() => {
      startedAtRef.current = null;
      setShown(false);
    }, remaining);
    return () => window.clearTimeout(id);
  }, [active, minMs]);

  return shown;
}
