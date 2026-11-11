/**
 * "How many can you name?" A ten-sign check on the road signs page, for anyone who
 * wants to find out where they stand before committing to a trainer. Distractors
 * come from the same class so the choice is a real one. The result hands the
 * signs you missed straight to a trainer.
 *
 * SSR-safe: renders the start card on the server and the first paint, and only
 * picks signs after a tap, so there's no hydration mismatch.
 */
import * as React from "react";
import { Link } from "react-router";
import { Icon } from "~/components/brand/icon";
import {
  ArrowRightIcon,
  DoneIcon,
  PlayRoundIcon,
  RefreshIcon,
} from "~/components/brand/icons";

import pelican from "~/data/road-signs-pelican.json";
import { analytics } from "~/lib/analytics";
import { regionSpriteStyle, type FocusRegion } from "~/lib/image-focus";
import { signCrop } from "~/lib/sign-crops";
import { stagger } from "~/lib/motion";
import { BUZZ, buzz, playSfx } from "~/lib/sounds";
import { trainerHref } from "~/lib/trainer-rounds";
import { cn } from "~/lib/utils";

import { Button } from "~/components/ui/button";

const ALL_SIGNS = pelican.regions as FocusRegion[];
const CHART_SRC = pelican.imageSrc as string;
const ROUND_SIZE = 10;
const OPTION_COUNT = 4;

/** Crops are the sign's own edges (code key excluded), so no trim. */
const CROP_PAD = 0;

function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function optionsFor(sign: FocusRegion): FocusRegion[] {
  const others = ALL_SIGNS.filter((r) => r.id !== sign.id);
  const peers = shuffled(others.filter((r) => r.category === sign.category));
  const rest = shuffled(others.filter((r) => r.category !== sign.category));
  return shuffled([sign, ...[...peers, ...rest].slice(0, OPTION_COUNT - 1)]);
}

type Question = { sign: FocusRegion; options: FocusRegion[] };

/** Link into a trainer with just these signs queued, ready to go. */
function drillLink(trainer: string, signs: FocusRegion[]): string {
  return trainerHref(trainer, {
    codes: signs.flatMap((s) => (s.code ? [s.code] : [])),
    go: true,
  });
}

export function SignCheck({
  className = "mx-auto w-full max-w-4xl px-5 pb-10 sm:px-9",
}: {
  /** The page's own width and padding, where it already has a column. */
  className?: string;
}) {
  const [deck, setDeck] = React.useState<FocusRegion[] | null>(null);
  const [position, setPosition] = React.useState(0);
  const [question, setQuestion] = React.useState<Question | null>(null);
  const [chosen, setChosen] = React.useState<string | null>(null);
  const [missed, setMissed] = React.useState<FocusRegion[]>([]);
  const [finished, setFinished] = React.useState(false);

  function ask(sign: FocusRegion) {
    setQuestion({ sign, options: optionsFor(sign) });
    setChosen(null);
    analytics.signChallengeStarted({
      sign_id: sign.id,
      category: sign.category ?? "other",
    });
  }

  function start() {
    const next = shuffled(ALL_SIGNS).slice(0, ROUND_SIZE);
    setDeck(next);
    setPosition(0);
    setMissed([]);
    setFinished(false);
    ask(next[0]);
  }

  function pick(option: FocusRegion) {
    if (chosen || !question) return;
    setChosen(option.id);
    const isCorrect = option.id === question.sign.id;
    playSfx(isCorrect ? "correct" : "wrong");
    buzz(isCorrect ? BUZZ.tap : BUZZ.miss);
    if (!isCorrect) setMissed((m) => [...m, question.sign]);
    analytics.signChallengeAnswered({
      sign_id: question.sign.id,
      category: question.sign.category ?? "other",
      correct: isCorrect,
      question_index: position + 1,
    });
  }

  function next() {
    if (!deck) return;
    const following = position + 1;
    if (following >= deck.length) {
      setFinished(true);
      analytics.signCheckCompleted({
        correct: deck.length - missed.length,
        total: deck.length,
      });
      return;
    }
    setPosition(following);
    ask(deck[following]);
  }

  return (
    <section
      id="sign-check"
      aria-label="Road-sign check"
      className={cn("dr-reveal scroll-mt-20", className)}
    >
      <div className="dr-rise" style={stagger(5)}>
        {finished && deck ? (
          <Result total={deck.length} missed={missed} onAgain={start} />
        ) : question && deck ? (
          <Playing
            question={question}
            position={position}
            total={deck.length}
            chosen={chosen}
            onPick={pick}
            onNext={next}
          />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-ink bg-surface p-5 shadow-stamp sm:p-7">
            <div>
              <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-ink-3">
                Quick check
              </p>
              <h2 className="m-0 mt-1.5 font-display text-[clamp(20px,3.2vw,30px)] font-extrabold uppercase leading-none tracking-tight text-ink">
                {ROUND_SIZE} signs. How many can you name?
              </h2>
            </div>
            <Button variant="ink" onClick={start}>
              <Icon
                icon={PlayRoundIcon}
                size={16}
              />
              Test yourself
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function Playing({
  question,
  position,
  total,
  chosen,
  onPick,
  onNext,
}: {
  question: Question;
  position: number;
  total: number;
  chosen: string | null;
  onPick: (option: FocusRegion) => void;
  onNext: () => void;
}) {
  const answered = chosen !== null;
  const correct = chosen === question.sign.id;
  return (
    <div className="grid items-start gap-5 border-2 border-ink bg-surface p-5 shadow-stamp sm:grid-cols-[220px_1fr] sm:gap-6 sm:p-7">
      <div
        key={question.sign.id}
        className="dr-pop mx-auto aspect-square w-40 border-2 border-ink bg-white sm:w-full"
        style={regionSpriteStyle(signCrop(question.sign), CHART_SRC, CROP_PAD)}
        role="img"
        aria-label="Kenyan road sign"
      />
      <div className="grid gap-3">
        <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-ink-3">
          Sign {position + 1} of {total} · What is this sign?
        </p>
        <ul className="m-0 grid list-none gap-2 p-0">
          {question.options.map((option) => {
            const isAnswer = option.id === question.sign.id;
            const isPicked = chosen === option.id;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => onPick(option)}
                  disabled={answered}
                  className={cn(
                    "w-full border-2 border-ink px-3 py-2.5 text-left font-display text-[14px] font-extrabold uppercase tracking-tight outline-none transition-colors",
                    !answered &&
                      "bg-surface text-ink hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper",
                    answered &&
                      isAnswer &&
                      "bg-kenya-green text-kenya-green-foreground",
                    answered && isAnswer && isPicked && "dr-confirm",
                    answered &&
                      !isAnswer &&
                      isPicked &&
                      "dr-shake bg-rush text-white",
                    answered &&
                      !isAnswer &&
                      !isPicked &&
                      "bg-paper-3 text-ink-3",
                  )}
                >
                  {option.name}
                </button>
              </li>
            );
          })}
        </ul>
        {answered && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3">
            <p className="m-0 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest">
              {correct ? (
                <>
                  <Icon
                    icon={DoneIcon}
                    size={14}
                    className="text-kenya-green"
                  />
                  <span className="text-kenya-green">Correct</span>
                </>
              ) : (
                <span className="text-rush">It's {question.sign.name}.</span>
              )}
            </p>
            <Button variant="ink" size="sm" onClick={onNext}>
              {position + 1 >= total ? "See your score" : "Next sign"}
              <Icon
                icon={ArrowRightIcon}
                size={14}
              />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Result({
  total,
  missed,
  onAgain,
}: {
  total: number;
  missed: FocusRegion[];
  onAgain: () => void;
}) {
  const score = total - missed.length;
  return (
    <div className="dr-pop grid gap-4 border-2 border-ink bg-surface p-5 shadow-stamp sm:p-7">
      <div>
        <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-ink-3">
          Your score
        </p>
        <h2 className="m-0 mt-1.5 font-display text-[clamp(26px,4.4vw,42px)] font-extrabold uppercase leading-none tracking-tight text-ink">
          {score} of {total} right
        </h2>
      </div>

      {missed.length > 0 ? (
        <>
          <p className="m-0 text-[14.5px] leading-snug text-ink-2">
            Train the {missed.length === 1 ? "one" : missed.length} you missed
            now, while they're fresh.
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {missed.map((sign, index) => (
              <li
                key={sign.id}
                title={sign.name}
                aria-label={sign.name}
                className="dr-pop size-14 border-2 border-ink bg-white sm:size-16"
                style={{
                  ...regionSpriteStyle(signCrop(sign), CHART_SRC, CROP_PAD),
                  ...stagger(index + 2),
                }}
              />
            ))}
          </ul>
        </>
      ) : (
        <p className="m-0 text-[14.5px] leading-snug text-ink-2">
          A clean run. Pick a trainer and go through the rest.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <Button variant="rush" asChild>
          <Link to={drillLink("/road-signs/pelican", missed)}>
            Train on the chart
            <Icon
              icon={ArrowRightIcon}
              size={14}
            />
          </Link>
        </Button>
        <Button variant="ink" asChild>
          <Link to={drillLink("/road-signs/3d", missed)}>Train in 3D</Link>
        </Button>
        <Button variant="paper" onClick={onAgain}>
          <Icon icon={RefreshIcon} size={14} />
          Try 10 more
        </Button>
      </div>
    </div>
  );
}
