import * as React from "react";

import type {
  BlockRendererProps,
  SkidRecoverySimData,
} from "~/lib/course-types";
import { ChoiceCard } from "~/components/brand/choice-card";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";

/**
 * `skid_recovery_sim` — informational. Cycle through every skid type. For each,
 * pick the correct recovery option; wrong picks buzz and give feedback, correct
 * unlocks the next type. Completes once every type has been answered.
 */
export function SkidRecoverySimBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as SkidRecoverySimData;
  const resolved = status === "complete";
  const { correct: sCorrect, wrong: sWrong } = useFeedback();

  const [idx, setIdx] = React.useState(0);
  const [wrongIds, setWrongIds] = React.useState<Set<string>>(new Set());
  const [solved, setSolved] = React.useState<Set<string>>(
    resolved ? new Set(data.skidTypes.map((t) => t.id)) : new Set(),
  );
  const [lastWrongFeedback, setLastWrongFeedback] = React.useState<
    string | null
  >(null);

  const skid = data.skidTypes[idx];
  const allDone = solved.size === data.skidTypes.length;

  function pick(optId: string) {
    if (!skid) return;
    const opt = skid.options.find((o) => o.id === optId);
    if (!opt) return;
    const key = `${skid.id}:${optId}`;
    if (opt.correct) {
      sCorrect();
      setSolved((s) => {
        const ns = new Set(s);
        ns.add(skid.id);
        return ns;
      });
      setLastWrongFeedback(null);
      window.setTimeout(() => {
        if (idx + 1 < data.skidTypes.length) setIdx(idx + 1);
      }, 700);
    } else {
      sWrong();
      setLastWrongFeedback(opt.feedback ?? null);
      setWrongIds((s) => new Set(s).add(key));
    }
  }

  if (resolved) {
    return (
      <div className="grid gap-3">
        {data.skidTypes.map((t) => {
          const correctOpt = t.options.find((o) => o.correct);
          return (
            <div
              key={t.id}
              className="border-2 border-ink bg-paper-2 px-4 py-3"
            >
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                Skid · {t.id}
              </span>
              <p className="m-0 mt-1 font-serif text-[14.5px] text-ink">
                {t.prompt}
              </p>
              <p className="m-0 mt-1 font-serif text-[14.5px] text-kenya-green">
                Answer: <strong>{correctOpt?.text}</strong>
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  if (!skid) return null;
  const isSolved = solved.has(skid.id);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        <span>
          Skid {idx + 1} / {data.skidTypes.length}
        </span>
        <span>{solved.size} resolved</span>
      </div>

      <p className="m-0 font-display text-[clamp(17px,2.5vw,22px)] font-extrabold uppercase leading-tight tracking-tight text-ink">
        {skid.prompt}
      </p>

      <div className="grid gap-2.5">
        {skid.options.map((opt, i) => {
          const key = `${skid.id}:${opt.id}`;
          const state = isSolved
            ? opt.correct
              ? "correct"
              : "disabled"
            : wrongIds.has(key)
              ? "wrong"
              : undefined;
          return (
            <ChoiceCard
              key={opt.id}
              keyLabel={String.fromCharCode(65 + i)}
              state={state}
              disabled={isSolved || wrongIds.has(key)}
              onClick={() => pick(opt.id)}
            >
              {opt.text}
            </ChoiceCard>
          );
        })}
      </div>

      {!isSolved && lastWrongFeedback && (
        <ResultBanner
          correct={false}
          title="Not the right move"
          description={lastWrongFeedback}
        />
      )}

      {allDone && (
        <ResultBanner
          correct
          title="All skid types answered"
          actions={
            <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
          }
        />
      )}
    </div>
  );
}
