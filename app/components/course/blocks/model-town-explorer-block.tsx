import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02FreeIcons } from "@hugeicons/core-free-icons";

import type {
  BlockRendererProps,
  ModelTownExplorerData,
} from "~/lib/course-types";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";

const WAYPOINT_LABEL: Record<string, string> = {
  entry_dual: "Dual carriageway entry",
  entry_two_way: "Two-way entry",
  roundabout: "Roundabout",
  roundabout_straight: "Roundabout · straight through",
  roundabout_left: "Roundabout · take left exit",
  roundabout_exit_two_way: "Roundabout · two-way exit",
  flush_parking: "Flush parking zone",
  angle_parking: "Angle parking zone",
  pedestrian_crossing: "Pedestrian crossing",
  stop_sign: "Stop sign",
  give_way: "Give way",
  yellow_kerb: "Yellow kerb (no stopping)",
  one_way_road: "One-way road",
  two_way_road: "Two-way road",
};

function label(id: string) {
  return WAYPOINT_LABEL[id] ?? id.replace(/_/g, " ");
}

/**
 * `model_town_explorer` — informational. Two phases: first the learner
 * "explores" the town's interactive elements; then they must build the correct
 * route by picking waypoints in order for each challenge. Wrong path resets;
 * correct unlocks the next challenge.
 */
export function ModelTownExplorerBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as ModelTownExplorerData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const elements = data.interactiveElements ?? [];
  const [explored, setExplored] = React.useState<Set<string>>(
    resolved ? new Set(elements) : new Set(),
  );

  const [idx, setIdx] = React.useState(0);
  const [path, setPath] = React.useState<string[]>([]);
  const [cleared, setCleared] = React.useState<Set<string>>(
    resolved ? new Set(data.challenges.map((c) => c.id)) : new Set(),
  );
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const c = data.challenges[idx];
  const correctPath = c?.correctPath ?? [];
  const pickOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const ch of data.challenges) ch.correctPath.forEach((w) => set.add(w));
    return Array.from(set);
  }, [data.challenges]);

  function pick(w: string) {
    if (resolved || !c || cleared.has(c.id)) return;
    tap();
    const next = [...path, w];
    setPath(next);
    setFeedback(null);
    if (next.length === correctPath.length) {
      const correct =
        next.length === correctPath.length &&
        next.every((step, i) => step === correctPath[i]);
      if (correct) {
        sCorrect();
        setCleared((s) => new Set(s).add(c.id));
        setFeedback("Route correct. Smooth driving.");
        window.setTimeout(() => {
          if (idx + 1 < data.challenges.length) {
            setIdx(idx + 1);
            setPath([]);
            setFeedback(null);
          }
        }, 1000);
      } else {
        sWrong();
        setFeedback(c.failFeedback);
        window.setTimeout(() => {
          setPath([]);
          setFeedback(null);
        }, 1500);
      }
    }
  }

  function reset() {
    tap();
    setPath([]);
    setFeedback(null);
  }

  function inspect(id: string) {
    if (resolved) return;
    tap();
    setExplored((s) => {
      const ns = new Set(s);
      ns.add(id);
      return ns;
    });
  }

  const exploreDone =
    elements.length === 0 || explored.size === elements.length;
  const allDone = cleared.size === data.challenges.length;

  if (resolved) {
    return (
      <div className="grid gap-3 border-2 border-dashed border-ink bg-paper-3 px-5 py-6 text-center">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Model town
        </span>
        <p className="m-0 font-display text-lg font-extrabold uppercase tracking-tight text-ink">
          {data.challenges.length} routes navigated
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {!exploreDone && (
        <div className="grid gap-3 border-2 border-ink bg-paper-2 p-4">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Step 1 · explore the town
          </span>
          <p className="m-0 font-serif text-[14.5px] leading-snug text-ink">
            Tap each landmark to acknowledge it. Then you'll plan routes between
            them.
          </p>
          <ul className="flex flex-wrap gap-2">
            {elements.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => inspect(id)}
                  className={cn(
                    "border-2 border-ink px-3 py-2 font-serif text-[13px] transition-[transform,box-shadow] duration-100 ease-snap",
                    explored.has(id)
                      ? "bg-kenya-green text-kenya-green-foreground"
                      : "bg-surface text-ink hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-sm",
                  )}
                >
                  {label(id)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {exploreDone && !allDone && c && (
        <div className="grid gap-3">
          <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            <span>
              Challenge {idx + 1} / {data.challenges.length}
            </span>
            <span>{cleared.size} cleared</span>
          </div>

          <div className="grid gap-2 border-2 border-ink bg-paper-2 p-4">
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              Step 2 · build the route
            </span>
            <p className="m-0 font-serif text-[15px] leading-snug text-ink">
              {c.prompt}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-2 border-dashed border-ink bg-paper px-3 py-3">
            {path.length === 0 ? (
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                Pick waypoints in order ↓
              </span>
            ) : (
              path.map((w, i) => (
                <React.Fragment key={i}>
                  <span className="inline-block border-2 border-ink bg-ink px-2 py-1 font-serif text-[12.5px] text-paper">
                    {label(w)}
                  </span>
                  {i < path.length - 1 && (
                    <HugeiconsIcon
                      icon={ArrowRight02FreeIcons}
                      size={12}
                      strokeWidth={2.5}
                    />
                  )}
                </React.Fragment>
              ))
            )}
          </div>

          <ul className="flex flex-wrap gap-2">
            {pickOptions.map((w) => (
              <li key={w}>
                <button
                  type="button"
                  onClick={() => pick(w)}
                  disabled={path.includes(w)}
                  className={cn(
                    "border-2 border-ink px-3 py-2 font-serif text-[13.5px] transition-[transform,box-shadow] duration-100 ease-snap",
                    path.includes(w)
                      ? "bg-paper-3 text-ink-3 opacity-60"
                      : "bg-surface text-ink hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-sm",
                  )}
                >
                  {label(w)}
                </button>
              </li>
            ))}
          </ul>

          {feedback && (
            <p className="m-0 border-l-4 border-ink bg-paper-2 px-4 py-2 font-serif text-[14px] leading-snug text-ink-2">
              {feedback}
            </p>
          )}

          {path.length > 0 && !cleared.has(c.id) && (
            <div>
              <Button variant="paper" size="sm" onClick={reset}>
                Reset route
              </Button>
            </div>
          )}
        </div>
      )}

      {allDone && (
        <ResultBanner
          correct
          title="Town navigated"
          actions={
            <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
          }
        />
      )}
    </div>
  );
}
