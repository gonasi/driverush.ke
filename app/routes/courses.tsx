import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  Mortarboard01FreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/courses";

import { absUrl, SITE } from "~/lib/site";
import { COURSES } from "~/lib/courses";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { FeedbackBanner } from "~/components/brand/feedback-banner";
import { Rail } from "~/components/brand/rail";

export function meta(_: Route.MetaArgs) {
  const title = "Courses · DriveRush";
  const description =
    "Full driving courses for Kenya — highway code, road signs, junctions, hazard perception and real-road driving. Taught in order, with practice and mock papers built in.";
  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: SITE.keywords.join(", ") },
    { tagName: "link", rel: "canonical", href: absUrl("/courses") },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: absUrl("/courses") },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
}

export default function Courses() {
  return (
    <main className="min-h-screen text-ink">
      <Rail />

      <div className="mx-auto w-full max-w-5xl px-5 pb-20 pt-6 sm:px-9 sm:pt-10">
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
            Courses · {COURSES.length} so far
          </span>
        </div>

        <header className="border-b-2 border-ink pb-7">
          <span className="eyebrow text-ink">DriveRush courses</span>
          <h1 className="m-0 mt-3 font-display text-[clamp(40px,7vw,84px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
            Driving, taught <span className="italic text-rush">in order</span>.
          </h1>
          <p className="mt-5 max-w-2xl font-serif text-[clamp(17px,2.2vw,24px)] leading-tight text-ink-2">
            Quizzes get you reps. A course gets you ready — every topic in
            sequence, with the practice and mock papers built into each lesson.
          </p>
        </header>

        <div className="mt-7">
          <FeedbackBanner
            tone="info"
            icon={Mortarboard01FreeIcons}
            title="We're building these now"
            description="The two courses below are first to land. The lesson player and per-course pages are on the way — for now, start with quick practice and we'll carry your progress over."
            action={
              <Button variant="ink" size="lg" asChild>
                <Link to="/practice">
                  Start practising
                  <HugeiconsIcon
                    icon={ArrowRight02FreeIcons}
                    size={16}
                    strokeWidth={2.5}
                  />
                </Link>
              </Button>
            }
          />
        </div>

        <div className="mt-10 grid gap-5">
          {COURSES.map((c) => (
            <article
              key={c.slug}
              className="grid gap-4 border-2 border-ink bg-surface p-6 shadow-stamp sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                  {c.kicker}
                </span>
                {c.tag && <Badge variant="ink">{c.tag}</Badge>}
              </div>

              <div className="flex items-start gap-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center border-2 border-ink ${c.accent === "rush" ? "bg-rush text-white" : "bg-ink text-paper"}`}
                >
                  <HugeiconsIcon icon={c.icon} size={24} strokeWidth={2.25} />
                </div>
                <h2
                  className={`m-0 font-display text-[clamp(24px,4vw,40px)] font-extrabold uppercase leading-[0.95] tracking-tight ${c.accent === "rush" ? "text-rush" : "text-ink"}`}
                >
                  {c.title}
                </h2>
              </div>

              <p className="m-0 max-w-2xl text-[15px] leading-relaxed text-ink-2">
                {c.blurb}
              </p>

              <div>
                <div className="mb-2.5 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                  Modules · in order
                </div>
                <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
                  {c.syllabus.map((s, i) => (
                    <li
                      key={s}
                      className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink"
                    >
                      <span className="mt-px shrink-0 font-mono text-[11px] tabular-nums text-ink-3">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-line-soft pt-4 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                <span>{c.meta.modules} modules</span>
                <span aria-hidden>·</span>
                <span>{c.meta.lessons} lessons</span>
                <span aria-hidden>·</span>
                <span>{c.meta.hours}</span>
                <span aria-hidden>·</span>
                <span>{c.meta.level}</span>
                <span aria-hidden>·</span>
                <span className="text-ink">{c.price}</span>
              </div>

              <div>
                <Button variant={c.accent} size="lg" asChild>
                  <Link to="/practice">
                    Preview with practice
                    <HugeiconsIcon
                      icon={ArrowRight02FreeIcons}
                      size={16}
                      strokeWidth={2.5}
                    />
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
          More courses in the workshop · Class A, C &amp; D next
        </p>
      </div>
    </main>
  );
}
