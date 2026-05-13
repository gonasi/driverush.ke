import * as React from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02FreeIcons,
  RefreshFreeIcons,
  Tick02FreeIcons,
  Cancel01FreeIcons,
  BookmarkAdd02FreeIcons,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { cn } from "~/lib/utils";
import { type Question, type QuizMode, MODE_LABELS } from "~/lib/questions";
import { recordAnswer } from "~/lib/progress";
import { analytics } from "~/lib/analytics";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { ChoiceCard } from "~/components/brand/choice-card";
import { FeedbackBanner } from "~/components/brand/feedback-banner";

type QuizFlowProps = {
  questions: Question[];
  mode: QuizMode;
};

type Answer = {
  questionId: string;
  pickedIndex: number;
  correct: boolean;
};

/**
 * Client-only quiz state machine. Renders one question at a time, instant
 * reveal on click, advance on Next, result screen at end. Records each
 * answer to localStorage via recordAnswer() so guest progress accrues
 * without an account.
 */
export function QuizFlow({ questions, mode }: QuizFlowProps) {
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Answer[]>([]);
  const [picked, setPicked] = React.useState<number | null>(null);
  const [done, setDone] = React.useState(false);

  // Track session start once per quiz mount with a non-empty bank.
  React.useEffect(() => {
    if (questions.length > 0) analytics.quizStarted(mode, questions.length);
  }, [mode, questions.length]);

  if (questions.length === 0) {
    return <EmptyMode mode={mode} />;
  }

  if (done) {
    return <ResultScreen questions={questions} answers={answers} mode={mode} />;
  }

  const question = questions[index];
  const revealed = picked !== null;
  const correct = revealed && picked === question.correctIndex;
  const total = questions.length;
  const isLast = index === total - 1;
  const progressValue = ((index + (revealed ? 1 : 0)) / total) * 100;

  function handlePick(choiceIndex: number) {
    if (revealed) return;
    setPicked(choiceIndex);
    const isCorrect = choiceIndex === question.correctIndex;
    setAnswers((prev) => [
      ...prev,
      {
        questionId: question.id,
        pickedIndex: choiceIndex,
        correct: isCorrect,
      },
    ]);
    // Persist for guest streak / accuracy tracking.
    recordAnswer(question.id, isCorrect);
  }

  function handleNext() {
    if (isLast) {
      const finalAnswers = answers;
      const correctCount = finalAnswers.filter((a) => a.correct).length;
      const scorePct = Math.round((correctCount / total) * 100);
      analytics.quizCompleted({
        mode,
        total,
        correct: correctCount,
        scorePct,
        passed: scorePct >= 70,
      });
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="ink">{MODE_LABELS[mode].title}</Badge>
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3 tabular-nums">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </span>
        </div>
        <Progress value={progressValue} showTicks={total >= 4} />
      </header>

      <article className="grid gap-4 border-2 border-ink bg-surface p-5 sm:p-7">
        <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Question {index + 1}
        </div>
        <h1 className="m-0 font-display text-[clamp(20px,3vw,28px)] font-extrabold uppercase leading-tight tracking-tight text-ink wrap-anywhere">
          {question.prompt}
        </h1>

        <div className="grid gap-2.5">
          {question.choices.map((choice, i) => {
            const isThisCorrect = i === question.correctIndex;
            const isPicked = picked === i;
            const state = !revealed
              ? undefined
              : isThisCorrect
                ? "correct"
                : isPicked
                  ? "wrong"
                  : "disabled";
            return (
              <ChoiceCard
                key={i}
                keyLabel={String.fromCharCode(65 + i)}
                state={state}
                onClick={() => handlePick(i)}
                disabled={revealed}
                meta={
                  revealed && isThisCorrect ? (
                    <span className="text-kenya-green">Correct</span>
                  ) : revealed && isPicked && !isThisCorrect ? (
                    <span className="text-rush">Your pick</span>
                  ) : undefined
                }
              >
                {choice}
              </ChoiceCard>
            );
          })}
        </div>
      </article>

      {revealed && (
        <div className="grid gap-3">
          <FeedbackBanner
            tone={correct ? "win" : "fail"}
            title={correct ? "Sawa sawa · Correct" : "Not quite · Wrong"}
            description={question.explanation}
          />
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
            {question.rule}
          </p>
          <div className="flex justify-end">
            <Button variant="rush" size="lg" onClick={handleNext}>
              {isLast ? "See your score" : "Next question"}
              <HugeiconsIcon
                icon={ArrowRight02FreeIcons}
                size={16}
                strokeWidth={2.5}
              />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyMode({ mode }: { mode: QuizMode }) {
  return (
    <div className="border-2 border-dashed border-ink bg-surface p-8 text-center">
      <p className="font-display text-base font-extrabold uppercase tracking-wide text-ink">
        No questions yet for {MODE_LABELS[mode].title}
      </p>
      <p className="mt-2 text-[13px] text-ink-3">
        We're adding more questions weekly. Try Quick practice in the meantime.
      </p>
      <div className="mt-5">
        <Button variant="paper" size="sm" asChild>
          <Link to="/practice">Quick practice</Link>
        </Button>
      </div>
    </div>
  );
}

/* =============================================================
   Result screen
   ============================================================= */

type ResultProps = {
  questions: Question[];
  answers: Answer[];
  mode: QuizMode;
};

function ResultScreen({ questions, answers, mode }: ResultProps) {
  const total = questions.length;
  const correctCount = answers.filter((a) => a.correct).length;
  const pct = Math.round((correctCount / total) * 100);
  const passed = pct >= 70;

  return (
    <div className="grid gap-6">
      <FeedbackBanner
        tone={passed ? "win" : "fail"}
        icon={passed ? Tick02FreeIcons : Cancel01FreeIcons}
        title={
          passed
            ? `Sawa sawa · ${correctCount} of ${total}`
            : `Not yet · ${correctCount} of ${total}`
        }
        description={
          passed
            ? "Above the 70% threshold. Keep the pace and the real test will feel familiar."
            : "Review the answers below, then run it again. Most people pass within a week of daily practice."
        }
      />

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3">
        <ScoreTile
          label="Score"
          value={`${pct}%`}
          tone={passed ? "green" : "rush"}
        />
        <ScoreTile label="Correct" value={`${correctCount}`} />
        <ScoreTile label="Wrong" value={`${total - correctCount}`} />
      </div>

      <section className="grid gap-3">
        <h2 className="m-0 font-display text-base font-extrabold uppercase tracking-wide text-ink">
          Review every answer
        </h2>
        <ol className="m-0 grid list-none gap-3 p-0">
          {questions.map((q, i) => {
            const a = answers[i];
            const correct = a?.correct ?? false;
            const picked = a?.pickedIndex ?? -1;
            return (
              <li
                key={q.id}
                className={cn(
                  "border-2 border-ink p-4",
                  correct
                    ? "bg-[color-mix(in_oklab,var(--kenya-green)_8%,var(--surface))]"
                    : "bg-[color-mix(in_oklab,var(--rush)_8%,var(--surface))]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="m-0 font-display text-[14px] font-extrabold uppercase leading-tight tracking-tight text-ink wrap-anywhere">
                    {i + 1}. {q.prompt}
                  </p>
                  <Badge variant={correct ? "green" : "rush"}>
                    {correct ? "Correct" : "Wrong"}
                  </Badge>
                </div>
                <ul className="mt-3 grid list-none gap-1.5 p-0 text-[13px]">
                  {q.choices.map((c, ci) => {
                    const isCorrect = ci === q.correctIndex;
                    const isPicked = ci === picked;
                    return (
                      <li
                        key={ci}
                        className={cn(
                          "flex gap-2",
                          isCorrect && "font-bold text-kenya-green",
                          isPicked && !isCorrect && "text-rush line-through",
                          !isCorrect && !isPicked && "text-ink-3",
                        )}
                      >
                        <span className="font-mono text-[11px]">
                          {String.fromCharCode(65 + ci)}.
                        </span>
                        <span>{c}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
                  {q.explanation}
                </p>
                <p className="mt-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                  {q.rule}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button variant="rush" size="lg" asChild>
          <Link to={`/practice?mode=${mode}`} reloadDocument>
            <HugeiconsIcon
              icon={RefreshFreeIcons}
              size={16}
              strokeWidth={2.5}
            />
            Try again
          </Link>
        </Button>
        <Button variant="paper" size="lg" asChild>
          <Link to="/practice?mode=test">
            Take a quick test
            <HugeiconsIcon
              icon={ArrowRight02FreeIcons}
              size={16}
              strokeWidth={2.5}
            />
          </Link>
        </Button>
      </div>

      <SoftSignupCard />

      <p className="text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
        Want more questions?{" "}
        <a href="#" className="text-rush underline-offset-2 hover:underline">
          Browse premium options
        </a>
      </p>
    </div>
  );
}

function ScoreTile({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "ink" | "rush" | "green";
}) {
  const toneClass = {
    ink: "text-ink",
    rush: "text-rush",
    green: "text-kenya-green",
  }[tone];
  return (
    <div className="border-2 border-ink bg-surface p-3.5 text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-display text-[clamp(24px,4vw,32px)] font-extrabold leading-none tracking-tight tabular-nums",
          toneClass,
        )}
      >
        {value}
      </div>
    </div>
  );
}

function SoftSignupCard() {
  function handleSave() {
    analytics.saveProgressClicked();
    toast.success("Your progress is safe on this device", {
      description:
        "Account sync is coming soon. Keep practicing and we'll bring it across automatically.",
    });
  }
  return (
    <div className="grid gap-3 border-2 border-dashed border-ink bg-paper-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="m-0 font-display text-base font-extrabold uppercase tracking-wide text-ink">
          Save your progress
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
          We're keeping your scores on this device. Save to your account to
          carry them across phones — or just keep playing.
        </p>
      </div>
      <Button variant="ink" size="lg" onClick={handleSave}>
        <HugeiconsIcon
          icon={BookmarkAdd02FreeIcons}
          size={16}
          strokeWidth={2.5}
        />
        Save progress
      </Button>
    </div>
  );
}
