import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertDiamondFreeIcons,
  Cancel01FreeIcons,
  CheckmarkCircle02FreeIcons,
  InformationCircleFreeIcons,
} from "@hugeicons/core-free-icons";

import type {
  BlockRendererProps,
  SignRecognitionFlashData,
} from "~/lib/course-types";
import { ChoiceCard } from "~/components/brand/choice-card";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";

type SignCategory = "warning" | "regulatory" | "information";

type Question = {
  category: SignCategory;
  prompt: string;
  options: { id: string; text: string; correct: boolean }[];
};

const SIGN_POOL: Record<SignCategory, { name: string; meaning: string }[]> = {
  warning: [
    { name: "Bend ahead (left)", meaning: "Curve to the left" },
    { name: "Steep hill downwards", meaning: "Long downhill — gear down" },
    { name: "Slippery road", meaning: "Reduced grip — slow down" },
    { name: "Pedestrian crossing ahead", meaning: "Pedestrians may cross" },
    { name: "School ahead", meaning: "Children near road" },
    { name: "Roundabout ahead", meaning: "Roundabout — give way to the right" },
    { name: "Road narrows", meaning: "Width reduces ahead" },
    { name: "Junction ahead", meaning: "Side road joins your route" },
  ],
  regulatory: [
    { name: "Stop", meaning: "Full stop required" },
    { name: "Give way", meaning: "Yield to traffic in priority" },
    { name: "No entry", meaning: "Entry prohibited from this side" },
    { name: "No overtaking", meaning: "Overtaking prohibited" },
    { name: "Speed limit 50 km/h", meaning: "Max 50 km/h" },
    { name: "No parking", meaning: "Parking prohibited" },
    { name: "Keep left", meaning: "Pass obstruction on the left" },
    { name: "No U-turn", meaning: "U-turn prohibited" },
  ],
  information: [
    { name: "Hospital", meaning: "Hospital nearby" },
    { name: "Petrol station", meaning: "Fuel ahead" },
    { name: "First aid post", meaning: "First aid available" },
    { name: "Parking", meaning: "Public parking" },
    { name: "Dead end", meaning: "No through road" },
    { name: "Motorway begins", meaning: "Motorway rules apply" },
    { name: "Telephone", meaning: "Public phone nearby" },
    { name: "No through road", meaning: "Road has no exit" },
  ],
};

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(
  signSet: { category: SignCategory; count: number }[],
  totalLimit: number,
): Question[] {
  const out: Question[] = [];
  for (const { category, count } of signSet) {
    const picks = shuffle(SIGN_POOL[category]).slice(
      0,
      Math.min(count, SIGN_POOL[category].length),
    );
    for (const sign of picks) {
      const distractorPool = shuffle(
        SIGN_POOL[category].filter((s) => s.name !== sign.name),
      ).slice(0, 3);
      const options = shuffle([
        { id: "c", text: sign.meaning, correct: true },
        ...distractorPool.map((d, i) => ({
          id: `d${i}`,
          text: d.meaning,
          correct: false,
        })),
      ]);
      out.push({
        category,
        prompt: `What does the "${sign.name}" sign mean?`,
        options,
      });
    }
  }
  return shuffle(out).slice(0, totalLimit);
}

const CAT_ICON: Record<SignCategory, typeof AlertDiamondFreeIcons> = {
  warning: AlertDiamondFreeIcons,
  regulatory: Cancel01FreeIcons,
  information: InformationCircleFreeIcons,
};

/**
 * `sign_recognition_flash` — assessment-style round (scored 0-100 but reports
 * via onAdvance only; the round itself is non-question type). Pulls a per-sign
 * MCQ from the local pool for each sign category requested.
 */
export function SignRecognitionFlashBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as SignRecognitionFlashData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const questions = React.useMemo(
    () =>
      buildQuestions(
        data.signSet,
        Math.min(
          data.totalSigns,
          data.signSet.reduce((s, x) => s + x.count, 0),
        ),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [block.id],
  );

  const [idx, setIdx] = React.useState(0);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [right, setRight] = React.useState(0);
  const [done, setDone] = React.useState(resolved);

  const q = questions[idx];

  function pick(optId: string) {
    if (resolved || done || picked) return;
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
        setDone(true);
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
      }
    }, 900);
  }

  function replay() {
    tap();
    setIdx(0);
    setPicked(null);
    setRight(0);
    setDone(false);
  }

  if (resolved) {
    return (
      <div className="grid gap-3 border-2 border-dashed border-ink bg-paper-3 px-5 py-6 text-center">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Sign recognition · {data.mode}
        </span>
        <p className="m-0 font-display text-lg font-extrabold uppercase tracking-tight text-ink">
          {questions.length} signs done
        </p>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((right / questions.length) * 100);
    return (
      <div className="grid gap-3">
        <ResultBanner
          correct={pct >= 70}
          title={`${right} of ${questions.length} correct`}
          score={pct}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="paper" size="sm" onClick={replay}>
                Try again
              </Button>
              <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
            </div>
          }
        />
      </div>
    );
  }

  const Icon = CAT_ICON[q.category];

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <HugeiconsIcon icon={Icon} size={12} strokeWidth={2.5} />
          {q.category}
        </span>
        <span>
          {idx + 1} / {questions.length} · {right} ✓
        </span>
      </div>

      <p className="m-0 font-display text-[clamp(18px,2.6vw,24px)] font-extrabold uppercase leading-tight tracking-tight text-ink">
        {q.prompt}
      </p>

      <div className="grid gap-2.5">
        {q.options.map((opt, i) => {
          const showVerdict = picked !== null;
          const state = showVerdict
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
              disabled={picked !== null}
              onClick={() => pick(opt.id)}
              meta={
                state === "correct" ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02FreeIcons}
                    size={14}
                    strokeWidth={2.5}
                  />
                ) : undefined
              }
            >
              {opt.text}
            </ChoiceCard>
          );
        })}
      </div>
    </div>
  );
}
