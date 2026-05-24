import * as React from "react";

import type {
  BlockRendererProps,
  McqOption,
  McqSingleData,
} from "~/lib/course-types";
import { ChoiceCard } from "~/components/brand/choice-card";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";
import { WhyButton } from "../why-sheet";
import { McqWhy } from "./mcq-why";

const WRONG_PENALTY = 25;

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * `multiple_choice_single` — assessment (scored). One correct option; wrong
 * picks buzz, get marked, and stay disabled so you can take another; the
 * correct pick scores 100 − 25·misses and reveals Continue + "Why?". Options
 * shuffle once per block. Resolved blocks highlight the correct option.
 */
export function McqSingleBlock({
  block,
  status,
  isLast,
  onAttempt,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as McqSingleData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const options = React.useMemo<McqOption[]>(
    () => (data.shuffleOptions ? shuffle(data.options) : data.options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [block.id],
  );
  const [wrongIds, setWrongIds] = React.useState<Set<string>>(new Set());
  const [lastWrongId, setLastWrongId] = React.useState<string | null>(null);
  const [solved, setSolved] = React.useState(false);
  const score = Math.max(0, 100 - WRONG_PENALTY * wrongIds.size);
  const lastWrong = options.find((o) => o.id === lastWrongId);

  function pick(opt: McqOption) {
    if (resolved || solved || wrongIds.has(opt.id)) return;
    tap();
    onAttempt?.(opt.correct);
    if (opt.correct) {
      sCorrect();
      setSolved(true);
    } else {
      sWrong();
      setLastWrongId(opt.id);
      setWrongIds((s) => new Set(s).add(opt.id));
    }
  }

  return (
    <div className="grid gap-4">
      <p className="m-0 font-display text-[clamp(18px,2.6vw,24px)] font-extrabold uppercase leading-tight tracking-tight text-ink wrap-anywhere">
        {data.question}
      </p>

      <div className="grid gap-2.5">
        {options.map((opt, i) => {
          const done = resolved || solved;
          const state = done
            ? opt.correct
              ? "correct"
              : "disabled"
            : wrongIds.has(opt.id)
              ? "wrong"
              : undefined;
          return (
            <ChoiceCard
              key={opt.id}
              keyLabel={String.fromCharCode(65 + i)}
              state={state}
              disabled={done || wrongIds.has(opt.id)}
              onClick={() => pick(opt)}
              meta={
                state === "correct" ? (
                  <span className="text-kenya-green">Correct</span>
                ) : state === "wrong" ? (
                  <span className="text-rush">Nope</span>
                ) : undefined
              }
            >
              {opt.text}
            </ChoiceCard>
          );
        })}
      </div>

      {!resolved && solved && (
        <ResultBanner
          correct
          title="Sawa sawa · Correct"
          score={score}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <WhyButton body={<McqWhy options={options} />} />
              <BlockActionButton
                onClick={() => onAdvance({ score })}
                isLast={isLast}
              />
            </div>
          }
        />
      )}

      {!resolved && !solved && wrongIds.size > 0 && (
        <ResultBanner
          correct={false}
          title="Not quite"
          description={lastWrong?.feedback ?? "Try another option."}
        />
      )}
    </div>
  );
}
