/**
 * Streak indicator for the lesson-player header. Shows the current day count
 * inside a brutalist box-bordered chip with a flame icon. A small ice-cube
 * badge appears when the learner has at least one streak freeze banked.
 *
 * SSR-safe: hidden until `useStreakStoreHydrated` reports hydration, then
 * fades in so we never render a "day 0" placeholder while persisted state is
 * still loading.
 */
import { HugeiconsIcon } from "@hugeicons/react";
import { Fire02FreeIcons, SnowFreeIcons } from "@hugeicons/core-free-icons";

import { useStreakStoreHydrated } from "~/lib/use-streak-store";
import { cn } from "~/lib/utils";

export function StreakFlame({ className }: { className?: string }) {
  const { hydrated, state } = useStreakStoreHydrated();
  if (!hydrated || state.currentStreak === 0) {
    // Reserve the same footprint so the header doesn't shift when streak
    // appears mid-session.
    return <span className={cn("inline-flex size-9 shrink-0", className)} />;
  }
  return (
    <span
      className={cn(
        "relative inline-flex h-9 shrink-0 items-center gap-1 border-2 border-ink bg-amber px-2 text-amber-foreground",
        className,
      )}
      title={`${state.currentStreak}-day streak${
        state.freezesAvailable > 0
          ? ` · ${state.freezesAvailable} freeze${state.freezesAvailable === 1 ? "" : "s"} banked`
          : ""
      }`}
      aria-label={`${state.currentStreak} day streak`}
    >
      <HugeiconsIcon icon={Fire02FreeIcons} size={16} strokeWidth={2.5} />
      <span className="font-mono text-[12px] font-bold tabular-nums">
        {state.currentStreak}
      </span>
      {state.freezesAvailable > 0 && (
        <span
          className="absolute -right-1.5 -top-1.5 inline-flex size-4 items-center justify-center border-2 border-ink bg-plate-blue text-plate-blue-foreground"
          aria-hidden="true"
        >
          <HugeiconsIcon icon={SnowFreeIcons} size={8} strokeWidth={3} />
        </span>
      )}
    </span>
  );
}
