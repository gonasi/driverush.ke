import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01FreeIcons,
  ArrowUp01FreeIcons,
} from "@hugeicons/core-free-icons";

import type {
  BlockRendererProps,
  SequenceBuilderData,
} from "~/lib/course-types";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * `sequence_builder` — informational. The steps are shuffled; learner reorders
 * with up/down arrows then submits. A wrong order buzzes and unlocks "Try again";
 * the correct order shows the explanation + Continue.
 */
export function SequenceBuilderBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as SequenceBuilderData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const sortedByCorrect = React.useMemo(
    () => [...data.steps].sort((a, b) => a.correctPosition - b.correctPosition),
    [data.steps],
  );

  const [order, setOrder] = React.useState<string[]>(() =>
    resolved
      ? sortedByCorrect.map((s) => s.id)
      : shuffle(data.steps.map((s) => s.id)),
  );
  const [solved, setSolved] = React.useState(resolved);
  const [tried, setTried] = React.useState(false);

  const byId = React.useMemo(
    () => new Map(data.steps.map((s) => [s.id, s])),
    [data.steps],
  );

  function move(idx: number, dir: -1 | 1) {
    if (resolved || solved) return;
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    tap();
    setOrder((curr) => {
      const next = [...curr];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  function submit() {
    if (resolved || solved) return;
    const correct = order.every((id, i) => {
      const s = byId.get(id);
      return s ? s.correctPosition === i + 1 : false;
    });
    setTried(true);
    if (correct) {
      sCorrect();
      setSolved(true);
    } else {
      sWrong();
    }
  }

  function reshuffle() {
    tap();
    setOrder(shuffle(data.steps.map((s) => s.id)));
    setTried(false);
  }

  return (
    <div className="grid gap-4">
      <p className="m-0 font-display text-[clamp(18px,2.6vw,24px)] font-extrabold uppercase leading-tight tracking-tight text-ink wrap-anywhere">
        {data.prompt}
      </p>

      <ol className="grid gap-2">
        {order.map((id, i) => {
          const s = byId.get(id);
          if (!s) return null;
          const correctHere =
            (resolved || solved) && s.correctPosition === i + 1;
          return (
            <li
              key={id}
              className={cn(
                "grid grid-cols-[42px_1fr_auto] items-center gap-3 border-2 border-ink bg-surface px-4 py-3",
                correctHere &&
                  "bg-[color-mix(in_oklab,var(--kenya-green)_14%,var(--surface))]",
              )}
            >
              <span className="inline-flex size-9 items-center justify-center border-2 border-ink bg-paper-3 font-display text-sm font-extrabold text-ink">
                {i + 1}
              </span>
              <span className="font-serif text-[15px] leading-snug text-ink">
                {s.text}
              </span>
              {!resolved && !solved && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <HugeiconsIcon
                      icon={ArrowUp01FreeIcons}
                      size={14}
                      strokeWidth={2.5}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Move down"
                    disabled={i === order.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <HugeiconsIcon
                      icon={ArrowDown01FreeIcons}
                      size={14}
                      strokeWidth={2.5}
                    />
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!resolved && !solved && (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="rush" size="lg" onClick={submit}>
            Check order
          </Button>
          <Button variant="paper" size="sm" onClick={reshuffle}>
            Reshuffle
          </Button>
        </div>
      )}

      {!resolved && !solved && tried && (
        <ResultBanner
          correct={false}
          title="Not quite that order"
          description="Look at the sequence again — what has to happen first?"
        />
      )}

      {(resolved || solved) && data.feedbackOnComplete && (
        <div className="border-2 border-ink bg-paper-2 px-5 py-4">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            In short
          </div>
          <p className="m-0 font-serif text-[16px] leading-snug text-ink">
            {data.feedbackOnComplete}
          </p>
        </div>
      )}

      {!resolved && solved && (
        <ResultBanner
          correct
          title="Correct order · Sawa"
          actions={
            <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
          }
        />
      )}
    </div>
  );
}
