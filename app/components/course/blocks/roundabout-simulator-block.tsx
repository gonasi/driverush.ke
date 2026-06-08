import * as React from "react";

import type {
  BlockRendererProps,
  RoundaboutSimulatorData,
} from "~/lib/course-types";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";

const RADII = [42, 60, 78, 96]; // four concentric lanes (innermost first → 1)
const CENTER = 110;

/**
 * `roundabout_simulator` — informational. Four concentric lanes drawn as a
 * top-down SVG. For each challenge, the learner picks the lane(s) that can
 * take that route. Wrong picks buzz with feedback; correct unlock the next.
 * Completes once all challenges have been passed.
 */
export function RoundaboutSimulatorBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as RoundaboutSimulatorData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const [idx, setIdx] = React.useState(0);
  const [picked, setPicked] = React.useState<Set<number>>(new Set());
  const [solvedIds, setSolvedIds] = React.useState<Set<string>>(
    resolved ? new Set(data.challenges.map((c) => c.id)) : new Set(),
  );
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const c = data.challenges[idx];
  const correctSet = React.useMemo(() => new Set(c?.correctLanes ?? []), [c]);
  const allDone = solvedIds.size === data.challenges.length;

  function togglePick(lane: number) {
    if (resolved || !c || solvedIds.has(c.id)) return;
    tap();
    setPicked((s) => {
      const ns = new Set(s);
      if (ns.has(lane)) ns.delete(lane);
      else ns.add(lane);
      return ns;
    });
    setFeedback(null);
  }

  function submit() {
    if (!c) return;
    const exact =
      picked.size === correctSet.size &&
      [...picked].every((l) => correctSet.has(l));
    if (exact) {
      sCorrect();
      setSolvedIds((s) => new Set(s).add(c.id));
      setFeedback(c.successFeedback);
      window.setTimeout(() => {
        if (idx + 1 < data.challenges.length) {
          setIdx(idx + 1);
          setPicked(new Set());
          setFeedback(null);
        }
      }, 1200);
    } else {
      sWrong();
      setFeedback(c.failFeedback);
    }
  }

  if (resolved) {
    return (
      <div className="grid gap-3 border-2 border-dashed border-ink bg-paper-3 px-5 py-6 text-center">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Roundabout simulator
        </span>
        <p className="m-0 font-display text-lg font-extrabold uppercase tracking-tight text-ink">
          {data.challenges.length} challenges cleared
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        <span>
          Challenge {idx + 1} / {data.challenges.length}
        </span>
        <span>{solvedIds.size} cleared</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
        <div className="grid gap-2 border-2 border-ink bg-paper-2 p-4">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Pick the lane(s) for this route
          </span>
          <p className="m-0 font-serif text-[15px] leading-snug text-ink">
            {c.prompt}
          </p>
          {data.showLaneLabels && (
            <p className="m-0 mt-1 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              Lane 1 = innermost (most powerful). Lane 4 = outermost.
            </p>
          )}
        </div>

        <svg
          viewBox="0 0 220 220"
          role="img"
          aria-label="Top-down roundabout"
          className="w-full border-2 border-ink bg-paper"
        >
          {/* outer→inner backplate */}
          {RADII.slice()
            .reverse()
            .map((r, i) => {
              const lane = 4 - i; // outermost is lane 4
              const sel = picked.has(lane);
              return (
                <circle
                  key={lane}
                  cx={CENTER}
                  cy={CENTER}
                  r={r}
                  fill={sel ? "var(--rush)" : "var(--paper-3)"}
                  fillOpacity={sel ? 0.55 : 0.4}
                  stroke="var(--ink)"
                  strokeWidth={2}
                  onClick={() => togglePick(lane)}
                  style={{ cursor: "pointer" }}
                />
              );
            })}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={28}
            fill="var(--paper)"
            stroke="var(--ink)"
            strokeWidth={2}
          />
          {/* arrows around as cardinal exits */}
          {[
            { x: CENTER, y: 12, label: "N" },
            { x: 208, y: CENTER, label: "E" },
            { x: CENTER, y: 208, label: "S" },
            { x: 12, y: CENTER, label: "W" },
          ].map((p) => (
            <text
              key={p.label}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="monospace"
              fontSize="11"
              fontWeight="bold"
              fill="var(--ink)"
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((lane) => (
          <button
            key={lane}
            type="button"
            onClick={() => togglePick(lane)}
            disabled={resolved || solvedIds.has(c.id)}
            className={cn(
              "border-2 border-ink px-3 py-2 font-display text-sm font-extrabold uppercase transition-[transform,box-shadow] duration-100 ease-snap",
              picked.has(lane)
                ? "-translate-x-px -translate-y-px bg-ink text-paper shadow-stamp-rush"
                : "bg-surface text-ink hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-sm",
            )}
          >
            Lane {lane}
          </button>
        ))}
      </div>

      <div>
        <Button
          variant="rush"
          size="lg"
          disabled={picked.size === 0 || solvedIds.has(c.id)}
          onClick={submit}
        >
          Submit pick
        </Button>
      </div>

      {feedback && (
        <p className="m-0 border-l-4 border-ink bg-paper-2 px-4 py-2 font-serif text-[14px] leading-snug text-ink-2">
          {feedback}
        </p>
      )}

      {allDone && (
        <ResultBanner
          correct
          title="All routes cleared"
          actions={
            <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
          }
        />
      )}
    </div>
  );
}
