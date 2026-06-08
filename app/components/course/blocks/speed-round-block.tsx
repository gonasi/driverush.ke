import * as React from "react";

import type {
  BlockRendererProps,
  SpeedRoundData,
  SpeedRoundQuestion,
} from "~/lib/course-types";
import { ChoiceCard } from "~/components/brand/choice-card";
import { Button } from "~/components/ui/button";
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
 * `speed_round` — a small timed quiz. Inline `data.questions` is treated as the
 * pool (the spec's `questionPool` ID is informational only — no DB-backed bank).
 * Final score = % correct, rendered as a banner with optional per-Q explanations.
 */
export function SpeedRoundBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as SpeedRoundData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const pool = data.questions ?? [];
  const questions = React.useMemo<SpeedRoundQuestion[]>(
    () => shuffle(pool).slice(0, Math.min(data.questionCount, pool.length)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [block.id],
  );

  const [started, setStarted] = React.useState(false);
  const [idx, setIdx] = React.useState(0);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [right, setRight] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(data.timeLimitSeconds);
  const [finished, setFinished] = React.useState(resolved);

  React.useEffect(() => {
    if (!started || finished || resolved) return;
    if (timeLeft <= 0) {
      setFinished(true);
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [started, timeLeft, finished, resolved]);

  if (resolved || finished) {
    const total = questions.length || 1;
    const pct = Math.round((right / total) * 100);
    const pass = pct >= (data.passMark ?? 70);
    return (
      <div className="grid gap-4">
        <ResultBanner
          correct={pass}
          title={
            pass
              ? `Round done · ${right}/${total}`
              : `Round done · ${right}/${total} — review the gaps`
          }
          score={pct}
          actions={
            !resolved && (
              <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
            )
          }
        />
        {data.showExplanationsAtEnd && (
          <ul className="grid gap-2">
            {questions.map((q, i) => (
              <li
                key={q.id}
                className="border-2 border-ink bg-paper-2 px-4 py-3"
              >
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                  Q{i + 1}
                </span>
                <p className="m-0 mt-1 font-serif text-[14px] text-ink">
                  {q.prompt}
                </p>
                <p className="m-0 mt-1 font-serif text-[14px] text-ink-2">
                  Answer:{" "}
                  <strong>{q.options.find((o) => o.correct)?.text}</strong>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (!started) {
    return (
      <div className="grid gap-3 border-2 border-dashed border-ink bg-paper-2 px-5 py-6 text-center">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Speed round · {data.questionCount} questions · {data.timeLimitSeconds}
          s
        </span>
        <p className="m-0 font-serif text-[15px] leading-snug text-ink">
          Beat the clock. Pass mark: {data.passMark ?? 70}%.
        </p>
        <div>
          <Button
            variant="rush"
            size="lg"
            onClick={() => {
              tap();
              setStarted(true);
            }}
          >
            Start round
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  if (!q) {
    setFinished(true);
    return null;
  }

  function pick(optId: string) {
    if (picked) return;
    const opt = q.options.find((o) => o.id === optId);
    if (!opt) return;
    if (opt.correct) {
      sCorrect();
      setRight((r) => r + 1);
    } else {
      sWrong();
    }
    setPicked(optId);
    window.setTimeout(() => {
      if (idx + 1 >= questions.length) {
        setFinished(true);
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
      }
    }, 600);
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        <span>
          Q{idx + 1} / {questions.length} · {right} ✓
        </span>
        <span>{timeLeft}s</span>
      </div>

      <p className="m-0 font-display text-[clamp(17px,2.5vw,22px)] font-extrabold uppercase leading-tight tracking-tight text-ink">
        {q.prompt}
      </p>

      <div className="grid gap-2.5">
        {q.options.map((opt, i) => {
          const state = picked
            ? opt.correct
              ? "correct"
              : picked === opt.id
                ? "wrong"
                : "disabled"
            : undefined;
          return (
            <ChoiceCard
              key={opt.id}
              keyLabel={String.fromCharCode(65 + i)}
              state={state}
              disabled={!!picked}
              onClick={() => pick(opt.id)}
            >
              {opt.text}
            </ChoiceCard>
          );
        })}
      </div>
    </div>
  );
}
