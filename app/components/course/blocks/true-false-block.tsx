import * as React from "react";

import type { BlockRendererProps, TrueFalseData } from "~/lib/course-types";
import { ChoiceCard } from "~/components/brand/choice-card";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";
import { WhyButton } from "../why-sheet";

const WRONG_PENALTY = 50; // two options — a slip costs half

/**
 * `true_or_false` — assessment (scored). Pick True/False; a wrong pick buzzes,
 * marks that option, and lets you take the other; a correct pick scores
 * 100 − 50·misses and reveals Continue + a "Why?" sheet. Resolved blocks show
 * the correct option highlighted.
 */
export function TrueFalseBlock({
  block,
  status,
  isLast,
  onAttempt,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as TrueFalseData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const [wrongPicks, setWrongPicks] = React.useState<Set<boolean>>(new Set());
  const [solved, setSolved] = React.useState(false);
  const score = Math.max(0, 100 - WRONG_PENALTY * wrongPicks.size);

  function pick(val: boolean) {
    if (resolved || solved || wrongPicks.has(val)) return;
    tap();
    const isCorrect = val === data.correct;
    onAttempt?.(isCorrect);
    if (isCorrect) {
      sCorrect();
      setSolved(true);
    } else {
      sWrong();
      setWrongPicks((s) => new Set(s).add(val));
    }
  }

  const whyBody = (
    <div className="grid gap-2 font-serif text-[15px] leading-relaxed text-ink-2">
      <p className="m-0">
        <strong className="text-ink">
          Answer: {data.correct ? "True" : "False"}.
        </strong>
      </p>
      <p className="m-0">{data.feedback.correct}</p>
    </div>
  );

  return (
    <div className="grid gap-4">
      <p className="m-0 font-display text-[clamp(18px,2.6vw,24px)] font-extrabold uppercase leading-tight tracking-tight text-ink wrap-anywhere">
        {data.statement}
      </p>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {[true, false].map((val) => {
          const isCorrectOpt = val === data.correct;
          const done = resolved || solved;
          const state = done
            ? isCorrectOpt
              ? "correct"
              : "disabled"
            : wrongPicks.has(val)
              ? "wrong"
              : undefined;
          return (
            <ChoiceCard
              key={String(val)}
              keyLabel={val ? "T" : "F"}
              state={state}
              disabled={done || wrongPicks.has(val)}
              onClick={() => pick(val)}
              meta={
                state === "correct" ? (
                  <span className="text-kenya-green">Correct</span>
                ) : state === "wrong" ? (
                  <span className="text-rush">Nope</span>
                ) : undefined
              }
            >
              {val ? "True" : "False"}
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
              <WhyButton body={whyBody} />
              <BlockActionButton
                onClick={() => onAdvance({ score })}
                isLast={isLast}
              />
            </div>
          }
        />
      )}

      {!resolved && !solved && wrongPicks.size > 0 && (
        <ResultBanner
          correct={false}
          title="Not quite"
          description={data.feedback.incorrect}
        />
      )}
    </div>
  );
}
