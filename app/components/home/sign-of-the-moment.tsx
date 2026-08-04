/**
 * Live sign challenge embedded in the homepage hero. Picks one road sign from
 * the Pelican dataset, displays it cropped via CSS sprite math, and offers a
 * 4-option multiple choice with 3 distractors pulled from the same category so
 * the choice is meaningful (not "yield vs. school crossing" — easy give-away).
 *
 * SSR-safe: renders a "Tap to start" placeholder on the server and the first
 * paint; the actual sign + options are picked client-side after mount so we
 * don't ship a hydration mismatch.
 */
import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02FreeIcons,
  CheckmarkCircle02FreeIcons,
  PlayCircleFreeIcons,
  RefreshFreeIcons,
} from "@hugeicons/core-free-icons";

import pelican from "~/data/road-signs-pelican.json";
import { useFeedback } from "~/lib/use-feedback";
import { cn } from "~/lib/utils";

import { Button } from "~/components/ui/button";

type Region = {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const ALL_REGIONS = pelican.regions as Region[];
const IMAGE_SRC = pelican.imageSrc as string;
const LAST_SEEN_KEY = "driverush:sign-of-the-moment:last";

function pickRandom<T>(arr: T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickQuestion(skipId?: string): { sign: Region; options: Region[] } {
  const available = skipId
    ? ALL_REGIONS.filter((r) => r.id !== skipId)
    : ALL_REGIONS;
  const sign = pickRandom(available);
  const peers = ALL_REGIONS.filter(
    (r) => r.category === sign.category && r.id !== sign.id,
  );
  const distractors: Region[] = [];
  const pool = [...peers];
  while (distractors.length < 3 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    distractors.push(pool.splice(idx, 1)[0]);
  }
  // Fall back to any other category if we somehow don't have 3 peers.
  while (distractors.length < 3) {
    const filler = pickRandom(
      ALL_REGIONS.filter(
        (r) => r.id !== sign.id && !distractors.some((d) => d.id === r.id),
      ),
    );
    distractors.push(filler);
  }
  const options = [sign, ...distractors].sort(() => Math.random() - 0.5);
  return { sign, options };
}

/** Background math for a CSS-sprite crop showing only this region of the sheet. */
function cropStyle(sign: Region): React.CSSProperties {
  const sizeX = (100 / sign.width) * 100;
  const sizeY = (100 / sign.height) * 100;
  const posX = (sign.x / (100 - sign.width)) * 100;
  const posY = (sign.y / (100 - sign.height)) * 100;
  return {
    backgroundImage: `url(${IMAGE_SRC})`,
    backgroundSize: `${sizeX}% ${sizeY}%`,
    backgroundPosition: `${posX}% ${posY}%`,
    backgroundRepeat: "no-repeat",
  };
}

export function SignOfTheMoment({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const [question, setQuestion] = React.useState<{
    sign: Region;
    options: Region[];
  } | null>(null);
  const [chosen, setChosen] = React.useState<string | null>(null);
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  React.useEffect(() => setMounted(true), []);

  function start() {
    const last =
      typeof window !== "undefined"
        ? (window.localStorage.getItem(LAST_SEEN_KEY) ?? undefined)
        : undefined;
    setQuestion(pickQuestion(last));
    setChosen(null);
  }

  function pick(opt: Region) {
    if (chosen || !question) return;
    tap();
    setChosen(opt.id);
    const isCorrect = opt.id === question.sign.id;
    if (isCorrect) sCorrect();
    else sWrong();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_SEEN_KEY, question.sign.id);
    }
  }

  function next() {
    start();
  }

  // SSR + cold first paint: render a deterministic call-to-action.
  if (!mounted || !question) {
    return (
      <div
        className={cn(
          "grid items-center gap-5 border-2 border-ink bg-surface p-5 shadow-stamp sm:grid-cols-[200px_1fr] sm:gap-6 sm:p-7",
          className,
        )}
      >
        <div
          className="aspect-square w-full border-2 border-ink bg-paper-3"
          aria-hidden="true"
        />
        <div className="grid gap-4">
          <div>
            <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Try a sign · 5 seconds
            </p>
            <h2 className="m-0 mt-2 font-display text-[clamp(22px,3.4vw,30px)] font-extrabold uppercase leading-[1] tracking-tight text-ink">
              Know your Kenyan road signs?
            </h2>
          </div>
          <p className="m-0 text-[14.5px] leading-snug text-ink-2">
            One real NTSA sign. Tap the right name. No signup, nothing to read
            first.
          </p>
          <div>
            <Button
              variant="rush"
              size="lg"
              onClick={mounted ? start : undefined}
              disabled={!mounted}
            >
              <HugeiconsIcon
                icon={PlayCircleFreeIcons}
                size={16}
                strokeWidth={2.5}
              />
              Start the challenge
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const correct = chosen === question.sign.id;
  const showResult = chosen !== null;

  return (
    <div
      className={cn(
        "grid items-start gap-5 border-2 border-ink bg-surface p-5 shadow-stamp sm:grid-cols-[200px_1fr] sm:gap-6 sm:p-7",
        className,
      )}
    >
      <div
        className="aspect-square w-full border-2 border-ink bg-paper"
        style={cropStyle(question.sign)}
        role="img"
        aria-label="Kenyan road sign"
      />
      <div className="grid gap-3">
        <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-ink-3">
          What is this sign?
        </p>
        <ul className="m-0 grid list-none gap-2 p-0">
          {question.options.map((opt) => {
            const isCorrectOpt = opt.id === question.sign.id;
            const isPicked = chosen === opt.id;
            const state = showResult
              ? isCorrectOpt
                ? "correct"
                : isPicked
                  ? "wrong"
                  : "muted"
              : "active";
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => pick(opt)}
                  disabled={showResult}
                  className={cn(
                    "w-full border-2 border-ink px-3 py-2.5 text-left font-display text-[14px] font-extrabold uppercase tracking-tight outline-none transition-colors",
                    state === "active" &&
                      "bg-surface text-ink hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper",
                    state === "correct" &&
                      "bg-kenya-green text-kenya-green-foreground",
                    state === "wrong" && "bg-rush text-white",
                    state === "muted" && "bg-paper-3 text-ink-3",
                  )}
                >
                  {opt.name}
                </button>
              </li>
            );
          })}
        </ul>
        {showResult && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3">
            <p className="m-0 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest">
              {correct ? (
                <>
                  <HugeiconsIcon
                    icon={CheckmarkCircle02FreeIcons}
                    size={14}
                    strokeWidth={2.5}
                    className="text-kenya-green"
                  />
                  <span className="text-kenya-green">Correct</span>
                </>
              ) : (
                <span className="text-rush">
                  Nope. It's {question.sign.name}.
                </span>
              )}
            </p>
            <Button variant="ink" size="sm" onClick={next}>
              <HugeiconsIcon
                icon={RefreshFreeIcons}
                size={14}
                strokeWidth={2.5}
              />
              Next sign
              <HugeiconsIcon
                icon={ArrowRight02FreeIcons}
                size={14}
                strokeWidth={2.5}
              />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
