import * as React from "react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  Tick02FreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/course-overview";

import type { Lesson } from "~/lib/course-types";
import { getCourse, serialiseCourse } from "~/lib/course";
import {
  getLessonProgress,
  isLessonComplete,
  lessonPct,
  lessonXpEarned,
} from "~/lib/course-progress";
import { selectCourseProgress, useCourseStore } from "~/lib/course-store";
import { absUrl, breadcrumbLd, pageMeta, SITE } from "~/lib/site";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { Rail } from "~/components/brand/rail";

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
      title: `${course.title} — NTSA-aligned online course`,
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

function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
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

        <div className="mt-10 grid gap-10">
          {course.chapters.map((chapter, ci) => (
            <section key={chapter.id} className="grid gap-4">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3 tabular-nums">
                  Chapter {String(ci + 1).padStart(2, "0")}
                </span>
                <h2 className="m-0 font-display text-[clamp(20px,3vw,30px)] font-extrabold uppercase leading-none tracking-tight text-ink">
                  {chapter.title}
                </h2>
              </div>
              <p className="m-0 max-w-2xl text-[14.5px] leading-relaxed text-ink-2">
                {chapter.description}
              </p>
              <div className="grid gap-3">
                {chapter.lessons.map((lesson, li) => (
                  <LessonRow
                    key={lesson.id}
                    courseSlug={course.slug}
                    chapterSlug={chapter.slug}
                    lesson={lesson}
                    n={li + 1}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
          {lessonCount} lesson{lessonCount === 1 ? "" : "s"} live · more of the
          course lands week by week
        </p>
      </div>
    </main>
  );
}

function LessonRow({
  courseSlug,
  chapterSlug,
  lesson,
  n,
}: {
  courseSlug: string;
  chapterSlug: string;
  lesson: Lesson;
  n: number;
}) {
  const mounted = useMounted();
  const cp = useCourseStore(selectCourseProgress(courseSlug));

  const pct = mounted ? lessonPct(cp, lesson) : 0;
  const done = mounted && isLessonComplete(cp, lesson);
  const started = mounted && !!getLessonProgress(cp, lesson);
  const xp = mounted ? lessonXpEarned(cp, lesson) : 0;
  const cta = done ? "Review" : started ? "Resume" : "Start";

  return (
    <article className="grid gap-3 border-2 border-ink bg-surface p-5 shadow-stamp-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 font-mono text-[12px] tabular-nums text-ink-3">
            {String(n).padStart(2, "0")}
          </span>
          <div>
            <h3 className="m-0 font-display text-[clamp(17px,2.4vw,22px)] font-extrabold uppercase leading-tight tracking-tight text-ink">
              {lesson.title}
            </h3>
            <p className="m-0 mt-1 max-w-xl text-[13.5px] leading-relaxed text-ink-2">
              {lesson.objective}
            </p>
          </div>
        </div>
        {done && (
          <Badge variant="green">
            <HugeiconsIcon
              icon={Tick02FreeIcons}
              size={12}
              strokeWidth={2.75}
            />
            Done
          </Badge>
        )}
      </div>

      {started && !done && (
        <Progress value={pct} showTicks={false} aria-label="Lesson progress" />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          ≈ {lesson.estimatedMinutes} min · {lesson.totalXP} XP
          {started ? ` · ${xp} earned` : ""}
        </span>
        <Button variant="rush" size="sm" asChild>
          <Link to={`/courses/${courseSlug}/${chapterSlug}/${lesson.slug}`}>
            {cta}
            <HugeiconsIcon
              icon={ArrowRight02FreeIcons}
              size={14}
              strokeWidth={2.5}
            />
          </Link>
        </Button>
      </div>
    </article>
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
