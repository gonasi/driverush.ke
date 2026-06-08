import * as React from "react";

import type {
  BlockRendererProps,
  GearShiftTrainerData,
} from "~/lib/course-types";
import { cn } from "~/lib/utils";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";

/**
 * `gear_shift_trainer` — informational. For each prompt, tap the correct gear
 * on an H-pattern stick. Wrong picks buzz with feedback; correct advances.
 * Completes once all prompts have been answered correctly.
 */
export function GearShiftTrainerBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as GearShiftTrainerData;
  const resolved = status === "complete";
  const { correct: sCorrect, wrong: sWrong } = useFeedback();

  const [idx, setIdx] = React.useState(0);
  const [wrong, setWrong] = React.useState<number | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const done = idx >= data.prompts.length;

  const prompt = data.prompts[idx];

  function pick(gear: number) {
    if (resolved || done || !prompt) return;
    if (gear === prompt.correctGear) {
      sCorrect();
      setWrong(null);
      setFeedback(prompt.feedback);
      window.setTimeout(() => {
        setFeedback(null);
        setIdx((i) => i + 1);
      }, 900);
    } else {
      sWrong();
      setWrong(gear);
      setFeedback(`Not gear ${gear}. ${prompt.feedback}`);
    }
  }

  const layout: { label: string; gear: number; col: 1 | 2 | 3; row: 1 | 2 }[] =
    [
      { label: "1", gear: 1, col: 1, row: 1 },
      { label: "3", gear: 3, col: 2, row: 1 },
      { label: "5", gear: 5, col: 3, row: 1 },
      { label: "2", gear: 2, col: 1, row: 2 },
      { label: "4", gear: 4, col: 2, row: 2 },
      { label: "R", gear: 0, col: 3, row: 2 },
    ];

  if (resolved) {
    return (
      <div className="grid gap-3 border-2 border-dashed border-ink bg-paper-3 px-5 py-6 text-center">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Gear shift trainer
        </span>
        <p className="m-0 font-display text-lg font-extrabold uppercase tracking-tight text-ink">
          {data.prompts.length} prompts mastered
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <ResultBanner
        correct
        title="All gears mastered"
        actions={
          <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
        }
      />
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        <span>
          Prompt {idx + 1} / {data.prompts.length}
        </span>
        <span>{data.transmission ?? "manual"}</span>
      </div>

      <div className="grid gap-2 border-2 border-ink bg-paper-2 p-4">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Speed {prompt.speed} km/h
        </span>
        <p className="m-0 font-serif text-[15px] leading-snug text-ink">
          {prompt.context}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {layout.map((g) => {
          const isWrong = wrong === g.gear;
          return (
            <button
              key={g.label}
              type="button"
              onClick={() => pick(g.gear)}
              className={cn(
                "flex h-20 items-center justify-center border-2 border-ink font-display text-3xl font-extrabold transition-[transform,box-shadow,background] duration-150 ease-snap",
                isWrong
                  ? "bg-[color-mix(in_oklab,var(--rush)_18%,var(--surface))] text-rush"
                  : "bg-surface text-ink hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-sm",
                g.row === 1 ? "border-b-0" : g.row === 2 ? "border-t-0" : "",
              )}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      {feedback && (
        <p className="m-0 border-l-4 border-ink bg-paper-2 px-4 py-2 font-serif text-[14px] leading-snug text-ink-2">
          {feedback}
        </p>
      )}
    </div>
  );
}
