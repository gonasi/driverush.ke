/**
 * Resume-target hook — surfaces the lesson a returning learner should pick up
 * next inside the given course. SSR-safe: returns `null` until the persisted
 * course-store has hydrated so the homepage never flashes a stale "Continue"
 * card for first-time visitors.
 *
 * Priority order:
 *   1. A lesson the learner started but hasn't finished → resume it.
 *   2. Otherwise, if at least one lesson is complete → next untouched lesson.
 *   3. Otherwise → null (cold-start; show the first-time hero).
 */
import * as React from "react";

import type { Lesson } from "./course-types";
import {
  getLessonProgress,
  isLessonComplete,
  lessonPct,
} from "./course-progress";
import { getCourse } from "./course";
import { selectCourseProgress, useCourseStore } from "./course-store";

export type ResumeTarget = {
  lesson: Lesson;
  chapterSlug: string;
  /** 0-100 weighted completion of the lesson. */
  pct: number;
  /** True if the learner has started this lesson; false = next-up suggestion. */
  inProgress: boolean;
};

export function useResumeTarget(courseSlug: string): ResumeTarget | null {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Subscribe so the hook re-runs whenever progress changes.
  const cp = useCourseStore(selectCourseProgress(courseSlug));

  return React.useMemo(() => {
    if (!mounted) return null;
    const course = getCourse(courseSlug);
    if (!course || !cp) return null;

    const lessons: Array<{ lesson: Lesson; chapterSlug: string }> = [];
    for (const ch of course.chapters) {
      for (const lesson of ch.lessons) {
        lessons.push({ lesson, chapterSlug: ch.slug });
      }
    }

    // 1) A lesson started but not finished — resume it.
    for (const { lesson, chapterSlug } of lessons) {
      if (getLessonProgress(cp, lesson) && !isLessonComplete(cp, lesson)) {
        return {
          lesson,
          chapterSlug,
          pct: lessonPct(cp, lesson),
          inProgress: true,
        };
      }
    }
    // 2) Everything touched is done — point at the next untouched lesson.
    const anyComplete = lessons.some((l) => isLessonComplete(cp, l.lesson));
    if (anyComplete) {
      const next = lessons.find(({ lesson }) => !getLessonProgress(cp, lesson));
      if (next) {
        return {
          lesson: next.lesson,
          chapterSlug: next.chapterSlug,
          pct: 0,
          inProgress: false,
        };
      }
    }
    return null;
  }, [mounted, courseSlug, cp]);
}
