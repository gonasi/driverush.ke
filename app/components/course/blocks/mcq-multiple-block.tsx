import * as React from "react";

import type {
  BlockRendererProps,
  McqMultipleData,
  McqOption,
} from "~/lib/course-types";
import { ChoiceCard } from "~/components/brand/choice-card";
import { Button } from "~/components/ui/button";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";
import { WhyButton } from "../why-sheet";
import { McqWhy } from "./mcq-why";

const WRONG_PENALTY = 15;

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * `multiple_choice_multiple` — assessment (scored). "Select all that apply":
 * toggle options, Check the set; a wrong set buzzes and locks (revealing which
 * picks were right/wrong) until Try again; the exact correct set scores
 * 100 − 15·misses and reveals Continue + "Why?". Resolved blocks highlight every
 * correct option.
 */
export function McqMultipleBlock({
  block,
  status,
  isLast,
  onAttempt,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as McqMultipleData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const options = React.useMemo<McqOption[]>(
    () => (data.shuffleOptions ? shuffle(data.options) : data.options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [block.id],
  );
  const correctIds = React.useMemo(
    () => new Set(options.filter((o) => o.correct).map((o) => o.id)),
    [options],
  );

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [locked, setLocked] = React.useState(false);
  const [solved, setSolved] = React.useState(false);
  const [wrongCount, setWrongCount] = React.useState(0);
  const score = Math.max(0, 100 - WRONG_PENALTY * wrongCount);
  const done = resolved || solved;

  function toggle(id: string) {
    if (done || locked) return;
    tap();
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function check() {
    if (selected.size === 0) return;
    const exact =
      selected.size === correctIds.size &&
      [...selected].every((id) => correctIds.has(id));
    onAttempt?.(exact);
    if (exact) {
      sCorrect();
      setSolved(true);
    } else {
      sWrong();
      setWrongCount((c) => c + 1);
      setLocked(true);
    }
  }

  function tryAgain() {
    setLocked(false);
    setSelected(new Set());
  }

  return (
    <div className="grid gap-4">
      <p className="m-0 font-display text-[clamp(18px,2.6vw,24px)] font-extrabold uppercase leading-tight tracking-tight text-ink wrap-anywhere">
        {data.question}
      </p>
      {!done && (
        <p className="m-0 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Select all that apply
        </p>
      )}

      <div className="grid gap-2.5">
        {options.map((opt, i) => {
          let state: React.ComponentProps<typeof ChoiceCard>["state"];
          if (done) state = opt.correct ? "correct" : "disabled";
          else if (locked)
            state = selected.has(opt.id)
              ? opt.correct
                ? "correct"
                : "wrong"
              : "disabled";
          else state = selected.has(opt.id) ? "selected" : undefined;
          return (
            <ChoiceCard
              key={opt.id}
              keyLabel={String.fromCharCode(65 + i)}
              state={state}
              disabled={done || locked}
              onClick={() => toggle(opt.id)}
              meta={
                done && opt.correct ? (
                  <span className="text-kenya-green">Correct</span>
                ) : locked && selected.has(opt.id) && !opt.correct ? (
                  <span className="text-rush">Nope</span>
                ) : undefined
              }
            >
              {opt.text}
            </ChoiceCard>
          );
        })}
      </div>

      {!done && !locked && (
        <div>
          <Button
            variant="rush"
            size="lg"
            disabled={selected.size === 0}
            onClick={check}
          >
            Check answer
          </Button>
        </div>
      )}

      {!resolved && locked && (
        <ResultBanner
          correct={false}
          title="Not quite"
          description="You didn't have them all. Take another look."
          actions={
            <Button variant="paper" size="lg" onClick={tryAgain}>
              Try again
            </Button>
          }
        />
      )}

      {!resolved && solved && (
        <ResultBanner
          correct
          title="Sawa sawa · Correct"
          score={score}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <WhyButton
                body={<McqWhy options={options} note={data.feedbackOnSubmit} />}
              />
              <BlockActionButton
                onClick={() => onAdvance({ score })}
                isLast={isLast}
              />
            </div>
          }
        />
      )}
    </div>
  );
}
