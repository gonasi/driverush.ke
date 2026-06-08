import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleFreeIcons,
  CheckmarkCircle02FreeIcons,
} from "@hugeicons/core-free-icons";

import type {
  BlockRendererProps,
  ScenarioBranchingData,
  ScenarioNode,
} from "~/lib/course-types";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";

/**
 * `scenario_branching` — informational. Narrative choices walk the learner
 * through a small decision tree. A terminal outcome node ends the run; learners
 * can replay to try the other branch. Resolved blocks show the opening + a
 * summary of both branches.
 */
export function ScenarioBranchingBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as ScenarioBranchingData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const byId = React.useMemo(
    () => new Map<string, ScenarioNode>(data.nodes.map((n) => [n.id, n])),
    [data.nodes],
  );

  const root = data.nodes.find((n) => n.id === "root") ?? data.nodes[0];
  const [path, setPath] = React.useState<string[]>([root.id]);

  const terminalNodes = data.nodes.filter(
    (n) => n.type === "outcome" && n.terminal,
  );
  const currentId = path[path.length - 1];
  const current = byId.get(currentId);
  const reachedTerminal = current?.type === "outcome" && !!current.terminal;

  function choose(nextId: string, outcomeHint?: "positive" | "negative") {
    if (!byId.has(nextId)) return;
    if (outcomeHint === "negative") sWrong();
    else if (outcomeHint === "positive") sCorrect();
    else tap();
    setPath((p) => [...p, nextId]);
  }

  function replay() {
    tap();
    setPath([root.id]);
  }

  if (resolved) {
    return (
      <div className="grid gap-4">
        <p className="m-0 font-serif text-[15.5px] leading-snug text-ink">
          {data.opening}
        </p>
        <ul className="grid gap-2">
          {terminalNodes.map((n) => (
            <li
              key={n.id}
              className={cn(
                "grid gap-1.5 border-2 border-ink px-4 py-3",
                n.outcome === "positive"
                  ? "bg-[color-mix(in_oklab,var(--kenya-green)_14%,var(--surface))]"
                  : "bg-[color-mix(in_oklab,var(--rush)_14%,var(--surface))]",
              )}
            >
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                Outcome · {n.outcome}
              </span>
              <span className="font-display text-[15px] font-extrabold uppercase tracking-tight text-ink">
                {n.title}
              </span>
              {n.body && (
                <p className="m-0 font-serif text-[14.5px] leading-snug text-ink-2">
                  {n.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="border-2 border-ink bg-paper-2 px-4 py-3">
        <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Scenario
        </span>
        <p className="m-0 font-serif text-[15.5px] leading-snug text-ink">
          {data.opening}
        </p>
      </div>

      <ol className="grid gap-3">
        {path.map((id, idx) => {
          const node = byId.get(id);
          if (!node) return null;
          if (node.type === "decision") {
            const isActive = idx === path.length - 1;
            return (
              <li key={id + idx} className="grid gap-2">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                  Step {idx + 1} · what do you do?
                </span>
                <div className="grid gap-2">
                  {node.choices?.map((c) => {
                    const next = byId.get(c.nextNode);
                    const o =
                      next?.type === "outcome" ? next.outcome : undefined;
                    const hint: "positive" | "negative" | undefined =
                      o === "positive" || o === "negative" ? o : undefined;
                    return (
                      <Button
                        key={c.id}
                        variant="paper"
                        size="lg"
                        disabled={!isActive}
                        className="!justify-start text-left"
                        onClick={() => choose(c.nextNode, hint)}
                      >
                        {c.text}
                      </Button>
                    );
                  })}
                </div>
              </li>
            );
          }
          const negative = node.outcome === "negative";
          return (
            <li
              key={id + idx}
              className={cn(
                "grid gap-2 border-2 border-ink px-4 py-4",
                negative
                  ? "bg-[color-mix(in_oklab,var(--rush)_14%,var(--surface))]"
                  : "bg-[color-mix(in_oklab,var(--kenya-green)_14%,var(--surface))]",
              )}
            >
              <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-3">
                <HugeiconsIcon
                  icon={
                    negative ? AlertCircleFreeIcons : CheckmarkCircle02FreeIcons
                  }
                  size={14}
                  strokeWidth={2.5}
                />
                Outcome · {node.outcome}
              </span>
              <span className="font-display text-[16px] font-extrabold uppercase tracking-tight text-ink">
                {node.title}
              </span>
              {node.body && (
                <p className="m-0 font-serif text-[14.5px] leading-snug text-ink-2">
                  {node.body}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {reachedTerminal && (
        <div className="flex flex-wrap items-center gap-2">
          <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
          <Button variant="paper" size="sm" onClick={replay}>
            Replay scenario
          </Button>
        </div>
      )}
    </div>
  );
}
