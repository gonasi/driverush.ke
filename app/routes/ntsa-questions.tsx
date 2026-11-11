/**
 * `/ntsa-test/questions`: every NTSA theory practice question we have, grouped
 * by topic, each with its answer and source (`data/ntsa-practice-questions.ts`).
 * `/ntsa-test` shows a short set and links here.
 */
import { Link } from "react-router";

import type { Route } from "./+types/ntsa-questions";

import Body from "~/guides/ntsa-questions.mdx";
import {
  NTSA_QUESTIONS_CHECKED as CHECKED,
  NTSA_QUESTIONS_DESCRIPTION as DESCRIPTION,
  NTSA_QUESTIONS_PATH as PATH,
  NTSA_QUESTIONS_TITLE as TITLE,
} from "~/lib/ntsa-questions-page";
import { breadcrumbLd, graphLd, guideLd, pageMeta } from "~/lib/site";

import { GuideLayout } from "~/components/brand/guide-layout";
import { PRACTICE_QUESTION_COUNT } from "~/components/brand/practice-questions";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      extraKeywords: [
        "NTSA driving test questions and answers",
        "NTSA theory test questions",
        "Kenya driving test questions",
        "driving school theory questions Kenya",
      ],
    }),
    graphLd(
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "NTSA test", url: "/ntsa-test" },
        { name: "Practice questions", url: PATH },
      ]),
      guideLd({
        title: TITLE,
        description: DESCRIPTION,
        path: PATH,
        published: "2026-11-11",
        checked: CHECKED,
      }),
    ),
  ];
}

export default function NtsaQuestions() {
  return (
    <GuideLayout
      kicker="Guide · NTSA test"
      title={
        <>
          NTSA test questions. <em>With answers.</em>
        </>
      }
      lede={`${PRACTICE_QUESTION_COUNT} practice questions for the theory part of the NTSA test, each with the rule behind the answer and where it comes from.`}
      checked={CHECKED}
      lead={
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3"
        >
          <Link to="/ntsa-test" className="hover:text-ink hover:underline">
            NTSA test
          </Link>
          <span aria-hidden>/</span>
          <span aria-current="page">Practice questions</span>
        </nav>
      }
    >
      <Body />
    </GuideLayout>
  );
}
