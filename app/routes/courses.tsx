/**
 * Courses catalog — while there's only one live course (NTSA Class B), this
 * route 308s straight to that course's overview so learners aren't asked to
 * pick from a menu of one. When ≥ 2 file-based courses ship, the loader
 * stops redirecting and falls back to the catalog UI below.
 *
 * 308 (permanent redirect with method preservation) is the right choice for
 * SEO link equity — bookmarks and inbound links to `/courses` flow through
 * to the live course overview.
 */
import { Link, redirect } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  Mortarboard01FreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/courses";

import { absUrl, breadcrumbLd, pageMeta, SITE } from "~/lib/site";
import { COURSES } from "~/lib/courses";
import { getAllCourses } from "~/lib/course";

import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { FeedbackBanner } from "~/components/brand/feedback-banner";
import { Rail } from "~/components/brand/rail";
import { SiteNav } from "~/components/brand/site-nav";

export async function loader(_args: Route.LoaderArgs) {
  const live = getAllCourses();
  if (live.length === 1) {
    throw redirect(`/courses/${live[0].slug}`, { status: 308 });
  }
  return null;
}

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title:
        "Driving courses in Kenya — Class B, NTSA-aligned, online & self-paced",
      description:
        "Full online driving courses for Kenya: highway code, Kenyan road signs, junctions, hazard perception and real-road driving. Class B first, then A, C and D. Free practice, M-Pesa for Premium.",
      path: "/courses",
      extraKeywords: [
        "driving courses Kenya",
        "Kenya driving course online",
        "Class B course Kenya",
        "online driving course Kenya",
        "NTSA driving course",
      ],
    }),
    {
      "script:ld+json": breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Courses", url: "/courses" },
      ]),
    },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "DriveRush driving courses",
        itemListElement: COURSES.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Course",
            name: c.title,
            description: c.blurb,
            url: absUrl("/courses"),
            inLanguage: ["en", "sw"],
            provider: {
              "@type": "Organization",
              "@id": `${SITE.url}#organization`,
              name: SITE.name,
              sameAs: SITE.url,
            },
          },
        })),
      },
    },
  ];
}

export default function Courses() {
  return (
    <>
      <SiteNav />
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
              Driving, taught <span className="italic text-rush">in order</span>
              .
            </h1>
            <p className="mt-5 max-w-2xl font-serif text-[clamp(17px,2.2vw,24px)] leading-tight text-ink-2">
              Quizzes get you reps. A course gets you ready — every topic in
              sequence, with the practice and mock papers built into each
              lesson.
            </p>
          </header>

          <div className="mt-7">
            <FeedbackBanner
              tone="info"
              icon={Mortarboard01FreeIcons}
              title="Class B is live"
              description="The Class B course is playable now — lessons run one idea at a time, with the quizzes and checks built in. The second course and the rest of the chapters land week by week."
              action={
                <Button variant="ink" size="lg" asChild>
                  <Link to="/courses/ntsa-drive-kenya">
                    Start the course
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
            {COURSES.map((c) => {
              const isLive = c.to.startsWith("/courses/");
              return (
                <article
                  key={c.slug}
                  className={cn(
                    "relative grid gap-4 border-2 border-ink bg-surface p-6 shadow-stamp transition-[transform,box-shadow] duration-100 ease-snap sm:p-8",
                    isLive &&
                      "hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-lg",
                  )}
                >
                  {isLive && (
                    <Link
                      to={c.to}
                      aria-label={`Start the course: ${c.title}`}
                      className="absolute inset-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rush"
                    />
                  )}
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
                      <HugeiconsIcon
                        icon={c.icon}
                        size={24}
                        strokeWidth={2.25}
                      />
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
                    {isLive ? (
                      <span
                        className={cn(
                          buttonVariants({ variant: c.accent, size: "lg" }),
                        )}
                      >
                        Start the course
                        <HugeiconsIcon
                          icon={ArrowRight02FreeIcons}
                          size={16}
                          strokeWidth={2.5}
                        />
                      </span>
                    ) : (
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
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
            More courses in the workshop · Class A, C &amp; D next
          </p>
        </div>
      </main>
    </>
  );
}
