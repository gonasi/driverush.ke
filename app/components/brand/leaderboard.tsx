import * as React from "react";

import { cn } from "~/lib/utils";

type LeaderboardMedal = "gold" | "silver" | "bronze";

type LeaderboardEntry = {
  /** Rank shown in the badge. */
  rank: React.ReactNode;
  /** Display name, e.g. "Wanjiru K." or "You · Brian". */
  name: React.ReactNode;
  /** Mono caps sub-line, e.g. "NAIROBI · CLASS B". */
  meta?: React.ReactNode;
  /** Secondary mono column, e.g. "12d". */
  side?: React.ReactNode;
  /** Points / score, e.g. "3,420 XP". */
  points: React.ReactNode;
  /** Tint the rank badge gold / silver / bronze for the podium. */
  medal?: LeaderboardMedal;
  /** Highlight this row — the signed-in user. Overrides `medal`. */
  you?: boolean;
};

const MEDAL_BADGE: Record<LeaderboardMedal, string> = {
  gold: "bg-amber text-amber-foreground",
  silver: "bg-paper-2 text-ink",
  bronze: "bg-rust text-cream",
};

type LeaderboardProps = React.ComponentProps<"div"> & {
  entries: LeaderboardEntry[];
};

/**
 * Weekly leaderboard — ranked rows with podium-tinted badges and a highlighted
 * "you" row. Each row is its own grid, ledger-style with dashed perforations.
 */
function Leaderboard({ className, entries, ...props }: LeaderboardProps) {
  return (
    <div
      data-slot="leaderboard"
      className={cn("border-2 border-ink bg-surface", className)}
      {...props}
    >
      {entries.map((e, i) => (
        <div
          key={i}
          data-you={e.you || undefined}
          className={cn(
            "grid grid-cols-[48px_1fr_auto_auto] items-center gap-3.5 border-b border-dashed border-ink px-4 py-3 last:border-b-0",
            e.you && "bg-[color-mix(in_oklab,var(--rush)_14%,var(--surface))]",
          )}
        >
          <span
            className={cn(
              "inline-flex size-9 items-center justify-center border-2 border-ink font-display text-sm font-extrabold tabular-nums",
              e.you
                ? "bg-rush text-white"
                : e.medal
                  ? MEDAL_BADGE[e.medal]
                  : "bg-paper-3 text-ink",
            )}
          >
            {e.rank}
          </span>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-bold uppercase tracking-[0.02em]">
              {e.name}
            </div>
            {e.meta != null && (
              <div className="truncate font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                {e.meta}
              </div>
            )}
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
            {e.side}
          </span>
          <span className="font-mono text-[13px] font-bold tabular-nums text-rush">
            {e.points}
          </span>
        </div>
      ))}
    </div>
  );
}

export { Leaderboard };
export type { LeaderboardEntry, LeaderboardMedal };
