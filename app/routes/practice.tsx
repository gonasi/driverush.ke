import { Link, useSearchParams } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02FreeIcons } from "@hugeicons/core-free-icons";

import type { Route } from "./+types/practice";

import { absUrl } from "~/lib/site";
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

export function meta({ location }: Route.MetaArgs) {
  const sp = new URLSearchParams(location.search);
  const mode = asMode(sp.get("mode"));
  const label = MODE_LABELS[mode].title;
  const title = `${label} · DriveRush`;
  const description = `${MODE_LABELS[mode].copy} No signup. No card. Built for Kenya.`;
  return [
    { title },
    { name: "description", content: description },
    // The same surface, four modes — keep one canonical to avoid duplicate
    // content. Mode-specific URLs still work, they just don't compete in SERP.
    { tagName: "link", rel: "canonical", href: absUrl("/practice") },
    // Page-specific OG / Twitter overrides
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
}

export default function Practice() {
  const [searchParams] = useSearchParams();
  const mode = asMode(searchParams.get("mode"));
  const questions = getQuestionsForMode(mode);

  return (
    <main className="min-h-screen bg-paper text-ink">
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
