/**
 * Everything under a trainer's preview before a run: the one big Start, the
 * whole-chart option, where you stand, and settings. Shared by both trainers.
 */
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Configuration01FreeIcons,
  PlayFreeIcons,
} from "@hugeicons/core-free-icons";

import type { SignCounts } from "~/lib/pelican-progress";
import { ROUND_SIZE, type RunScope } from "~/lib/trainer-rounds";

import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";

export function TrainerReadyPanel({
  link,
  poolSize,
  chartSize,
  selfGrading,
  counts,
  savedRun,
  onStart,
  onResume,
  onSettings,
}: {
  /** A deep link to honour, if the learner arrived on one. */
  link: RunScope | null;
  /** Signs a round would draw from, after any category filter. */
  poolSize: number;
  /** Signs in a whole-chart run. */
  chartSize: number;
  selfGrading: boolean;
  counts: SignCounts;
  /** A paused whole-chart run, if there is one. */
  savedRun: { nextSign: number; total: number } | null;
  onStart: (scope?: RunScope) => void;
  onResume: () => void;
  onSettings: () => void;
}) {
  const roundSize = Math.min(ROUND_SIZE, poolSize);
  const primaryLabel =
    link?.kind === "drill"
      ? `Drill ${link.ids.length === 1 ? "this sign" : `these ${link.ids.length} signs`}`
      : selfGrading
        ? `Start ${roundSize} signs`
        : `Start ${chartSize} signs`;
  const knownPct = chartSize > 0 ? (counts.known / chartSize) * 100 : 0;
  const started = counts.known + counts.learning > 0;

  return (
    <div className="grid gap-3 border-2 border-t-0 border-ink bg-surface p-4">
      <Button
        variant="rush"
        size="lg"
        className="w-full"
        onClick={() => onStart(link ?? undefined)}
      >
        <HugeiconsIcon icon={PlayFreeIcons} size={18} strokeWidth={2.5} />
        {primaryLabel}
      </Button>

      {savedRun ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="paper" className="flex-1" onClick={onResume}>
            Resume whole chart · sign {savedRun.nextSign} of {savedRun.total}
          </Button>
          <Button
            variant="paper"
            size="sm"
            onClick={() => onStart({ kind: "chart" })}
          >
            Start over
          </Button>
        </div>
      ) : (
        selfGrading && (
          <Button
            variant="paper"
            className="w-full"
            onClick={() => onStart({ kind: "chart" })}
          >
            Whole chart · {chartSize}
          </Button>
        )
      )}

      <div className="flex items-end justify-between gap-3 pt-1">
        <div className="min-w-0 flex-1">
          {selfGrading && (
            <>
              <p className="m-0 mb-1.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                {started
                  ? `${counts.known} known · ${counts.learning} learning · ${counts.due} due`
                  : "Weakest signs come first"}
              </p>
              <Progress
                value={knownPct}
                tone="green"
                showTicks={false}
                aria-label="Signs known"
                className="h-2.5"
              />
            </>
          )}
        </div>
        <Button
          variant="paper"
          size="sm"
          onClick={onSettings}
          aria-label="Settings"
        >
          <HugeiconsIcon
            icon={Configuration01FreeIcons}
            size={14}
            strokeWidth={2.5}
          />
          Settings
        </Button>
      </div>
    </div>
  );
}
