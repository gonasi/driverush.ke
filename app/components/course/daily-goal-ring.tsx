/**
 * Daily-goal ring shown on the course overview. SVG ring that fills toward
 * `dailyGoal` as the learner racks up XP today. Goal options are 30/50/100/150;
 * a small select underneath lets the learner switch. Hidden until hydrated.
 */
import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Fire02FreeIcons } from "@hugeicons/core-free-icons";

import {
  useStreakStoreHydrated,
  useStreakStore,
  type DailyGoal,
} from "~/lib/use-streak-store";
import { cn } from "~/lib/utils";

const GOAL_OPTIONS: DailyGoal[] = [30, 50, 100, 150];

const SIZE = 88;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function DailyGoalRing({ className }: { className?: string }) {
  const { hydrated, state, todayMet } = useStreakStoreHydrated();
  const setDailyGoal = useStreakStore((s) => s.setDailyGoal);

  if (!hydrated) {
    return <div className={cn("h-[110px]", className)} aria-hidden="true" />;
  }

  const earned = state.dailyXpEarned;
  const goal = state.dailyGoal;
  const pct = Math.min(1, earned / goal);
  const dashOffset = CIRC * (1 - pct);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-4 border-2 border-ink bg-surface px-4 py-3 shadow-stamp-sm",
        className,
      )}
    >
      <div className="relative inline-flex shrink-0 items-center justify-center">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden="true"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-line-soft)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={todayMet ? "var(--color-kenya-green)" : "var(--color-rush)"}
            strokeWidth={STROKE}
            strokeLinecap="square"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{
              transition: "stroke-dashoffset 0.6s var(--ease-out-quart)",
            }}
          />
        </svg>
        <span className="pointer-events-none absolute inset-0 inline-flex flex-col items-center justify-center text-ink">
          <span className="font-display text-[20px] font-extrabold leading-none tabular-nums">
            {earned}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-ink-3">
            of {goal}
          </span>
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          <HugeiconsIcon icon={Fire02FreeIcons} size={12} strokeWidth={2.5} />
          Daily goal
        </span>
        <p className="m-0 font-display text-[16px] font-extrabold uppercase leading-tight tracking-tight">
          {todayMet ? "Goal hit. Nice." : "Keep going"}
        </p>
        <label className="mt-1 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-3">
          Goal
          <select
            value={goal}
            onChange={(e) => setDailyGoal(Number(e.target.value) as DailyGoal)}
            className="border-2 border-ink bg-paper px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase tabular-nums text-ink outline-none"
            aria-label="Daily XP goal"
          >
            {GOAL_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g} XP
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
