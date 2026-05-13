import { Link, useSearchParams } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02FreeIcons } from "@hugeicons/core-free-icons";

import type { Route } from "./+types/practice";

import { pageMeta } from "~/lib/site";
import {
  getQuestionsForMode,
  MODE_LABELS,
  type QuizMode,
} from "~/lib/questions";

import { Rail } from "~/components/brand/rail";
import { QuizFlow } from "~/components/brand/quiz-flow";

const VALID_MODES: QuizMode[] = ["quick", "test", "signs", "challenge"];

function asMode(raw: string | null): QuizMode {
  return (VALID_MODES as string[]).includes(raw ?? "")
    ? (raw as QuizMode)
    : "quick";
}

// Lead phrase per mode — keyword-rich so the head of the title is what a Kenyan
// learner would actually search for. Brand suffix is added by `pageTitle()`.
const MODE_TITLE: Record<QuizMode, string> = {
  quick: "NTSA practice questions for Kenya — quick drills",
  test: "NTSA test simulator for Kenya — timed mock exam",
  signs: "Kenyan road signs quiz — NTSA practice",
  challenge: "Kenyan driving scenarios — right of way & hazards",
};

export function meta({ location }: Route.MetaArgs) {
  const sp = new URLSearchParams(location.search);
  const mode = asMode(sp.get("mode"));
  const description = `${MODE_LABELS[mode].copy} Free, no signup, no card. Built for Kenyan roads and the NTSA test.`;
  // The same surface, four modes — keep one canonical at `/practice` to avoid
  // duplicate-content competition between mode URLs in SERP.
  return pageMeta({
    title: MODE_TITLE[mode],
    description,
    path: "/practice",
    extraKeywords: [
      "NTSA practice questions",
      "NTSA past papers Kenya",
      "Kenya driving test online",
      "NTSA mock exam",
      "Kenya road signs quiz",
    ],
  });
}

export default function Practice() {
  const [searchParams] = useSearchParams();
  const mode = asMode(searchParams.get("mode"));
  const questions = getQuestionsForMode(mode);

  return (
    <main className="min-h-screen text-ink">
      <Rail />

      <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-6 sm:px-9 sm:pt-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-3 outline-none hover:text-ink focus-visible:text-ink"
          >
            <HugeiconsIcon
              icon={ArrowLeft02FreeIcons}
              size={14}
              strokeWidth={2.5}
            />
            Back
          </Link>
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            {MODE_LABELS[mode].copy}
          </span>
        </div>

        <QuizFlow questions={questions} mode={mode} />
      </div>
    </main>
  );
}
