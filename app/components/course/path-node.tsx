/**
 * A single node on the learning path. Four states:
 *  - locked      → dimmed, lock icon, not clickable
 *  - available   → bg-amber, play icon, pulses
 *  - in-progress → bg-amber, lesson number, % ring
 *  - complete    → bg-kenya-green, checkmark, 1-3 star meter below
 *
 * Kept brutalist: square box, 2px ink border, stamp shadow. No rounded
 * corners, no gradients. Star meter uses voice-gold for filled stars to match
 * the existing podium tinting elsewhere in the app.
 */
import * as React from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02FreeIcons,
  LockFreeIcons,
  PlayFreeIcons,
  StarFreeIcons,
} from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils";

export type PathNodeState = "locked" | "available" | "in-progress" | "complete";

export type PathNodeProps = {
  state: PathNodeState;
  to?: string;
  /** Lesson index within the unit (1-based), displayed inside the node. */
  index: number;
  title: string;
  /** Estimated minutes for the metadata strip. */
  minutes: number;
  xp: number;
  /** Percent (0-100) — drives the ring when in-progress. */
  pct?: number;
  /** Stars earned (0-3) when complete. */
  stars?: 0 | 1 | 2 | 3;
  /** Locked-reason tooltip text for the disabled node. */
  lockedHint?: string;
  /** Fired when a learner taps a locked node — see `lesson_locked_tapped`. */
  onLockedTap?: () => void;
};

const STATE_STYLES: Record<PathNodeState, string> = {
  locked: "bg-paper-3 text-ink-3 shadow-none",
  available:
    "bg-amber text-amber-foreground shadow-stamp-sm animate-[dr-pulse_2.2s_ease-in-out_infinite]",
  "in-progress": "bg-amber text-amber-foreground shadow-stamp-sm",
  complete: "bg-kenya-green text-kenya-green-foreground shadow-stamp-sm",
};

export function PathNode({
  state,
  to,
  index,
  title,
  minutes,
  xp,
  pct,
  stars = 0,
  lockedHint,
  onLockedTap,
}: PathNodeProps) {
  const interactive = state !== "locked" && !!to;
  const inner = (
    <>
      <span
        className={cn(
          "relative inline-flex size-[88px] shrink-0 items-center justify-center border-2 border-ink transition-colors",
          STATE_STYLES[state],
        )}
        aria-hidden="true"
      >
        {state === "locked" && (
          <HugeiconsIcon icon={LockFreeIcons} size={28} strokeWidth={2.25} />
        )}
        {state === "available" && (
          <HugeiconsIcon icon={PlayFreeIcons} size={30} strokeWidth={2.5} />
        )}
        {state === "in-progress" && (
          <span className="font-display text-3xl font-extrabold leading-none tabular-nums">
            {String(index).padStart(2, "0")}
          </span>
        )}
        {state === "complete" && (
          <HugeiconsIcon
            icon={CheckmarkCircle02FreeIcons}
            size={36}
            strokeWidth={2.5}
          />
        )}
        {state === "in-progress" && typeof pct === "number" && (
          <span
            className="pointer-events-none absolute -bottom-1 left-0 h-1 bg-ink"
            style={{ width: `${Math.max(4, pct)}%` }}
          />
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3 tabular-nums">
          Lesson {String(index).padStart(2, "0")}
        </span>
        <span className="font-display text-[15px] font-extrabold uppercase leading-tight tracking-tight text-ink line-clamp-2">
          {title}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3 tabular-nums">
          ≈ {minutes} min · {xp} XP
        </span>
        {state === "complete" && (
          <span className="mt-0.5 inline-flex items-center gap-0.5">
            {[1, 2, 3].map((i) => (
              <HugeiconsIcon
                key={i}
                icon={StarFreeIcons}
                size={12}
                strokeWidth={2.5}
                className={cn(
                  i <= stars ? "text-kenya-gold" : "text-ink-3 opacity-40",
                )}
              />
            ))}
          </span>
        )}
      </span>
    </>
  );

  const className = cn(
    "group inline-flex max-w-[260px] items-center gap-3 outline-none",
    !interactive && "cursor-not-allowed opacity-90",
  );

  if (!interactive) {
    return (
      // Still non-interactive to assistive tech (aria-disabled, no role) — the
      // click handler only exists to record that someone tried, which is how
      // we find out whether the unlock rules are frustrating people.
      <span
        className={className}
        aria-disabled="true"
        title={lockedHint ?? "Complete the previous lesson to unlock"}
        onClick={onLockedTap}
      >
        {inner}
      </span>
    );
  }

  return (
    <Link
      to={to!}
      className={cn(className, "focus-visible:[&>span:first-child]:bg-ink")}
      aria-label={`${state === "complete" ? "Review" : state === "in-progress" ? "Resume" : "Start"} lesson ${index}: ${title}`}
    >
      {inner}
    </Link>
  );
}
