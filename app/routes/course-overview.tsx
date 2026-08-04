import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02FreeIcons } from "@hugeicons/core-free-icons";

import type { Route } from "./+types/course-overview";

import { getCourse, serialiseCourse } from "~/lib/course";
import { absUrl, breadcrumbLd, pageMeta, SITE } from "~/lib/site";

import { Button } from "~/components/ui/button";
import { Rail } from "~/components/brand/rail";
import { SiteNav } from "~/components/brand/site-nav";
import { DailyGoalRing } from "~/components/course/daily-goal-ring";
import { LearningPath } from "~/components/course/learning-path";

export async function loader({ params }: Route.LoaderArgs) {
  const course = getCourse(params.courseSlug);
  if (!course) {
    throw new Response("Not found", { status: 404 });
  }
  return { course: serialiseCourse(course) };
}

export function meta({ data, params }: Route.MetaArgs) {
  if (!data) {
    return [
      { title: "Course not found · DriveRush" },
      { name: "robots", content: "noindex, follow" },
    ];
  }
  const { course } = data;
  const path = `/courses/${params.courseSlug}`;
  return [
    ...pageMeta({
      title: `${course.title} · NTSA-aligned online course`,
      description: course.tagline,
      path,
      extraKeywords: [
        "NTSA driving course",
        "Class B course Kenya",
        "online driving course Kenya",
        "Highway Code Kenya",
      ],
    }),
    {
      "script:ld+json": breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Courses", url: "/courses" },
        { name: course.title, url: path },
      ]),
    },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "Course",
        name: course.title,
        description: course.tagline,
        url: absUrl(path),
        inLanguage: ["en", "sw"],
        provider: {
          "@type": "Organization",
          "@id": `${SITE.url}#organization`,
          name: SITE.name,
          sameAs: SITE.url,
        },
      },
    },
  ];
}

export default function CourseOverviewRoute({ params }: Route.ComponentProps) {
  const course = getCourse(params.courseSlug);
  if (!course) {
    return <CourseMissing />;
  }

  const lessonCount = course.chapters.reduce(
    (sum, ch) => sum + ch.lessons.length,
    0,
  );

  return (
    <>
      <SiteNav />
      <main className="min-h-screen text-ink">
        <Rail />

        <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-6 sm:px-9 sm:pt-10">
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-3 outline-none hover:text-ink focus-visible:text-ink"
            >
              <HugeiconsIcon
                icon={ArrowLeft02FreeIcons}
                size={14}
                strokeWidth={2.5}
              />
              Courses
            </Link>
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              Pass mark {course.passMark}%
            </span>
          </div>

          <header className="border-b-2 border-ink pb-7">
            <span className="eyebrow text-ink">Course</span>
            <h1 className="m-0 mt-3 font-display text-[clamp(34px,6.5vw,68px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
              {course.title}
            </h1>
            <p className="mt-5 max-w-2xl font-serif text-[clamp(17px,2.2vw,22px)] leading-tight text-ink-2">
              {course.tagline}
            </p>
          </header>

          <div className="mt-8 flex flex-wrap items-start gap-4">
            <DailyGoalRing />
            <p className="m-0 max-w-md font-serif text-[14.5px] leading-snug text-ink-2">
              One short lesson a day keeps the licence in sight. Each unit ends
              in a checkpoint that proves you've got the whole section locked
              in.
            </p>
          </div>

          <div className="mt-10">
            <LearningPath course={course} />
          </div>

          <p className="mt-14 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
            {lessonCount} lessons · {course.totalXP.toLocaleString()} XP · pass
            at {course.passMark}%
          </p>
        </div>
      </main>
    </>
  );
}

function CourseMissing() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Rail />
      <div className="mx-auto w-full max-w-2xl px-5 py-24 text-center sm:px-9">
        <p className="m-0 mb-3 font-mono text-[11px] uppercase tracking-widest text-ink-3">
          404 · course not found
        </p>
        <h1 className="m-0 mb-5 font-display text-4xl font-extrabold uppercase tracking-tight text-ink sm:text-5xl">
          No course here.
        </h1>
        <p className="m-0 mb-7 font-serif text-lg leading-snug text-ink-2">
          Browse the catalogue for what's live.
        </p>
        <Button variant="rush" size="lg" asChild>
          <Link to="/courses">All courses</Link>
        </Button>
      </div>
    </main>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <CourseMissing />;
  }
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
        Something went sideways
      </h1>
      <p className="mt-3 font-serif text-ink-2">
        We hit an unexpected error loading this course.
      </p>
    </main>
  );
}
