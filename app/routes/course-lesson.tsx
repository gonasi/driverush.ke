import { Link, isRouteErrorResponse, useRouteError } from "react-router";

import type { Route } from "./+types/course-lesson";

import { getCourse, getLesson, serialiseLesson } from "~/lib/course";
import { breadcrumbLd, pageMeta } from "~/lib/site";

import { Button } from "~/components/ui/button";
import { Rail } from "~/components/brand/rail";
import { LessonPlayer } from "~/components/course/lesson-player";

/**
 * Lesson player route. The loader resolves serialisable lesson data (for the
 * head + 404). The MDX block components can't ride the loader boundary, so the
 * component re-resolves the live lesson from the in-memory manifest — the same
 * split `blogs-post.tsx` uses.
 */
export async function loader({ params }: Route.LoaderArgs) {
  const lesson = getLesson(
    params.courseSlug,
    params.chapterSlug,
    params.lessonSlug,
  );
  if (!lesson) {
    throw new Response("Not found", { status: 404 });
  }
  return {
    courseSlug: params.courseSlug,
    courseTitle: getCourse(params.courseSlug)?.title ?? "Course",
    lesson: serialiseLesson(lesson),
  };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data) {
    return [
      { title: "Lesson not found · DriveRush" },
      { name: "robots", content: "noindex, follow" },
    ];
  }
  const { lesson, courseSlug, courseTitle } = data;
  const path = `/courses/${courseSlug}/${lesson.chapterSlug}/${lesson.slug}`;
  return [
    ...pageMeta({
      title: `${lesson.title} — ${courseTitle}`,
      description: lesson.objective,
      path,
      extraKeywords: [
        "NTSA driving course",
        "learn to drive Kenya online",
        "Highway Code Kenya lesson",
      ],
    }),
    {
      "script:ld+json": breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Courses", url: "/courses" },
        { name: courseTitle, url: `/courses/${courseSlug}` },
        { name: lesson.title, url: path },
      ]),
    },
  ];
}

export default function CourseLessonRoute({ params }: Route.ComponentProps) {
  const lesson = getLesson(
    params.courseSlug,
    params.chapterSlug,
    params.lessonSlug,
  );
  if (!lesson) {
    return <LessonMissing courseSlug={params.courseSlug} />;
  }
  // Full-screen / immersive — the player owns all chrome (sticky progress
  // boxes, sound + haptics, the stacked progressive-reveal blocks).
  return <LessonPlayer courseSlug={params.courseSlug} lesson={lesson} />;
}

function LessonMissing({ courseSlug }: { courseSlug?: string }) {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Rail />
      <div className="mx-auto w-full max-w-2xl px-5 py-24 text-center sm:px-9">
        <p className="m-0 mb-3 font-mono text-[11px] uppercase tracking-widest text-ink-3">
          404 · lesson not found
        </p>
        <h1 className="m-0 mb-5 font-display text-4xl font-extrabold uppercase tracking-tight text-ink sm:text-5xl">
          That lesson isn't here.
        </h1>
        <p className="m-0 mb-7 font-serif text-lg leading-snug text-ink-2">
          It may not be built yet. Head back to the course outline.
        </p>
        <Button variant="rush" size="lg" asChild>
          <Link to={courseSlug ? `/courses/${courseSlug}` : "/courses"}>
            Back to course
          </Link>
        </Button>
      </div>
    </main>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <LessonMissing />;
  }
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
        Something went sideways
      </h1>
      <p className="mt-3 font-serif text-ink-2">
        We hit an unexpected error rendering this lesson.
      </p>
    </main>
  );
}
