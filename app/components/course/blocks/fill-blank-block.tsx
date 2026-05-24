import * as React from "react";

import type { BlockRendererProps, FillBlankData } from "~/lib/course-types";
import { Button } from "~/components/ui/button";
import { FeedbackBanner } from "~/components/brand/feedback-banner";
import { cn } from "~/lib/utils";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";
import { WhyButton } from "../why-sheet";

const WRONG_PENALTY = 25;

function normalize(s: string, caseSensitive?: boolean): string {
  let v = s.trim().replace(/\s+/g, " ");
  if (!caseSensitive) v = v.toLowerCase();
  return v.replace(/[.,/#!$%^&*;:{}=\-_`~()'"]/g, "");
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Conservative match: exact-after-normalize, or a single-edit typo on words ≥4 chars. */
function matches(
  input: string,
  answer: string,
  caseSensitive?: boolean,
): boolean {
  const ni = normalize(input, caseSensitive);
  const na = normalize(answer, caseSensitive);
  if (!ni) return false;
  if (ni === na) return true;
  return na.length >= 4 && levenshtein(ni, na) <= 1;
}

/**
 * `fill_in_the_blank` — assessment (scored). Dual mode: N blanks + N answers →
 * positional; 1 blank → answers are alternatives. A wrong check buzzes and
 * offers Try again / Show answer; a correct check scores 100 − 25·misses. "Show
 * answer" fills the blanks and scores 0. Resolved blocks show the answer filled.
 */
export function FillBlankBlock({
  block,
  status,
  isLast,
  onAttempt,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as FillBlankData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const segments = React.useMemo(
    () => data.prompt.split(/_{2,}/),
    [data.prompt],
  );
  const blankCount = Math.max(1, segments.length - 1);
  const positional = blankCount > 1 && blankCount === data.answers.length;
  const inputCount = positional ? blankCount : 1;
  const answerFor = (idx: number) =>
    positional ? (data.answers[idx] ?? "") : (data.answers[0] ?? "");

  const [values, setValues] = React.useState<string[]>(() =>
    resolved
      ? Array.from({ length: inputCount }, (_, i) => answerFor(i))
      : Array(inputCount).fill(""),
  );
  const [wrongCount, setWrongCount] = React.useState(0);
  const [solved, setSolved] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const [lastWrong, setLastWrong] = React.useState(false);
  const finished = resolved || solved || shown;
  const score = shown ? 0 : Math.max(0, 100 - WRONG_PENALTY * wrongCount);

  function setValue(idx: number, v: string) {
    setValues((prev) => prev.map((x, k) => (k === idx ? v : x)));
  }

  function evaluate(): boolean {
    if (positional) {
      return data.answers.every((ans, i) =>
        matches(values[i] ?? "", ans, data.caseSensitive),
      );
    }
    return data.answers.some((ans) =>
      matches(values[0] ?? "", ans, data.caseSensitive),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (finished) return;
    const ok = evaluate();
    onAttempt?.(ok);
    if (ok) {
      sCorrect();
      setSolved(true);
      setLastWrong(false);
    } else {
      sWrong();
      setWrongCount((c) => c + 1);
      setLastWrong(true);
    }
  }

  function showAnswer() {
    setValues(Array.from({ length: inputCount }, (_, i) => answerFor(i)));
    setShown(true);
    setLastWrong(false);
  }

  const canSubmit = values.some((v) => v.trim().length > 0);
  const whyBody = (
    <div className="grid gap-2 font-serif text-[15px] leading-relaxed text-ink-2">
      <p className="m-0">
        <strong className="text-ink">Answer: {data.answers.join(", ")}.</strong>
      </p>
      <p className="m-0">{data.feedback.correct}</p>
    </div>
  );

  let blankIdx = 0;
  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="font-serif text-[clamp(17px,2.2vw,20px)] leading-relaxed text-ink">
        {segments.map((seg, i) => {
          const hasBlankAfter = i < segments.length - 1;
          const renderInput = hasBlankAfter && (positional || blankIdx === 0);
          const idx = blankIdx;
          if (hasBlankAfter) blankIdx += 1;
          return (
            <React.Fragment key={i}>
              <span>{seg}</span>
              {renderInput && (
                <input
                  type="text"
                  value={values[idx] ?? ""}
                  onChange={(e) => setValue(idx, e.target.value)}
                  disabled={finished}
                  autoComplete="off"
                  aria-label={`Blank ${idx + 1}`}
                  aria-invalid={lastWrong ? true : undefined}
                  className={cn(
                    "mx-1 inline-block w-40 border-b-2 border-ink bg-transparent px-1 py-0.5 text-center font-semibold text-ink outline-none",
                    "focus:border-rush disabled:opacity-80",
                    solved && "border-kenya-green",
                    lastWrong && "border-rush",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {!finished && (
        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="submit" variant="rush" size="lg" disabled={!canSubmit}>
            Check answer
          </Button>
          {wrongCount > 0 && (
            <Button
              type="button"
              variant="paper"
              size="lg"
              onClick={showAnswer}
            >
              Show answer
            </Button>
          )}
        </div>
      )}

      {!finished && lastWrong && (
        <ResultBanner
          correct={false}
          title="Not quite"
          description={data.feedback.incorrect}
        />
      )}

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

      {!resolved && shown && (
        <FeedbackBanner
          tone="info"
          title="Answer revealed"
          description={data.feedback.correct}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <WhyButton body={whyBody} />
              <BlockActionButton
                onClick={() => onAdvance({ score: 0 })}
                isLast={isLast}
              />
            </div>
          }
        />
      )}
    </form>
  );
}
