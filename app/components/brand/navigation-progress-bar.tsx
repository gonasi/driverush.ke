import * as React from "react";
import { useNavigation } from "react-router";

import { cn } from "~/lib/utils";

/**
 * Navigation phase the bar shows.
 * - `submitting` — a form post is in flight (rush red, a short way across)
 * - `loading` — route data is loading (amber, most of the way)
 * - `finishing` — the route landed; bar snaps to full (signal green) then fades
 * - `idle` — nothing happening; bar is collapsed and hidden
 */
export type NavigationProgressPhase =
  | "idle"
  | "submitting"
  | "loading"
  | "finishing";

// Width + colour per phase. The colour SNAPS between phases (no colour
// transition) — a traffic light flips, it doesn't cross-fade — while the width
// eases. `idle` collapses with transitions off so it just disappears.
const PHASE_STYLE: Record<NavigationProgressPhase, string> = {
  idle: "w-0 opacity-0 transition-none",
  submitting: "w-4/12 bg-rush",
  loading: "w-10/12 bg-amber",
  finishing: "w-full bg-signal-green",
};

type NavigationProgressTrackProps = {
  phase: NavigationProgressPhase;
  /** Ref onto the moving fill — {@link NavigationProgressBar} watches its
   *  animations so it can hold "finishing" until the width has caught up. */
  barRef?: React.Ref<HTMLDivElement>;
};

/**
 * Presentational top-of-viewport progress bar — a hard-edged stamp strip that
 * runs the colours like a signal (rush red on submit, amber mid-load, signal
 * green as it lands) over a flat ink underline, with an ink tick leading the
 * edge. Width eases on `--ease-snap`; the colour snaps.
 *
 * Pair it with {@link NavigationProgressBar} for the router-wired version, or
 * render it directly with a fixed `phase` (Storybook, tests, design review).
 */
export function NavigationProgressTrack({
  phase,
  barRef,
}: NavigationProgressTrackProps) {
  const active = phase === "submitting" || phase === "loading";
  return (
    <div
      role="progressbar"
      aria-label="Page navigation progress"
      aria-hidden={phase === "idle"}
      aria-valuetext={active ? "Loading" : undefined}
      className="pointer-events-none fixed inset-x-0 top-0 z-100 h-1"
    >
      <div
        ref={barRef}
        className={cn(
          "h-full border-r-2 border-ink shadow-[0_2px_0_var(--ink)]",
          "transition-[width,opacity] duration-500 ease-snap motion-reduce:transition-none",
          PHASE_STYLE[phase],
        )}
      />
    </div>
  );
}

/**
 * Top-of-page navigation progress bar wired to React Router's navigation state.
 * Mount it once near the top of the tree (e.g. inside `<body>` in `root.tsx`):
 * it sweeps across while a route transition or form submission is in flight,
 * lands green, then fades. `aria-hidden` when idle; honours
 * `prefers-reduced-motion` (skips the width easing, still shows + colours).
 *
 * This is the route-transition indicator only — for in-content async loading
 * use the traffic-light `<LoadingPanel>` / `<TrafficLoader>`.
 *
 * Ported from gonasi's `NavigationProgressBar`, re-skinned to the DriveRush
 * brutalist-editorial system (flat ink, signal colours, no blur, no pulse).
 */
export function NavigationProgressBar() {
  const navigation = useNavigation();
  const active = navigation.state !== "idle";

  const ref = React.useRef<HTMLDivElement>(null);
  // false while the width transition is still catching up after the route has
  // landed — keeps the bar at "finishing" (full + green) for that beat.
  const [fillSettled, setFillSettled] = React.useState(true);

  React.useEffect(() => {
    if (!ref.current) return;
    if (active) setFillSettled(false);

    Promise.allSettled(
      ref.current.getAnimations().map(({ finished }) => finished),
    ).then(() => {
      if (!active) setFillSettled(true);
    });
  }, [active]);

  const phase: NavigationProgressPhase =
    navigation.state === "submitting"
      ? "submitting"
      : navigation.state === "loading"
        ? "loading"
        : fillSettled
          ? "idle"
          : "finishing";

  return <NavigationProgressTrack phase={phase} barRef={ref} />;
}
