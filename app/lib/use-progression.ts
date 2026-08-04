/**
 * Progression hook — derives lesson + checkpoint unlock state from
 * `useCourseStore` and the in-memory course manifest. No new persisted state:
 * everything is a pure function of `CourseProgress` + the `Course` tree.
 *
 * Rule of thumb:
 * - The very first lesson in the course is always unlocked (cold-start access).
 * - Any subsequent lesson is unlocked once the lesson immediately before it
 *   (within its chapter) is complete.
 * - The first lesson of chapter N (N > 1) is unlocked once the last lesson of
 *   chapter N-1 is complete.
 * - A unit checkpoint is unlocked once every lesson in that unit is complete.
 */
import * as React from "react";

import type { Chapter, Course, Lesson, Unit } from "./course-types";
import { isLessonComplete } from "./course-progress";
import { getCourse } from "./course";
import { selectCourseProgress, useCourseStore } from "./course-store";

export type ProgressionApi = {
  isLessonUnlocked: (chapterId: string, lessonId: string) => boolean;
  isCheckpointUnlocked: (unitId: string) => boolean;
  nextLesson: (
    chapterId: string,
    lessonId: string,
  ) => { chapterSlug: string; lesson: Lesson } | null;
};

const STUB: ProgressionApi = {
  isLessonUnlocked: () => false,
  isCheckpointUnlocked: () => false,
  nextLesson: () => null,
};

function flattenLessons(course: Course): Array<{
  chapter: Chapter;
  lesson: Lesson;
}> {
  const out: Array<{ chapter: Chapter; lesson: Lesson }> = [];
  for (const ch of course.chapters) {
    for (const lesson of ch.lessons) out.push({ chapter: ch, lesson });
  }
  return out;
}

function unitLessons(course: Course, unit: Unit): Lesson[] {
  const ids = new Set(unit.chapterIds);
  const out: Lesson[] = [];
  for (const ch of course.chapters) {
    if (!ids.has(ch.id)) continue;
    for (const lesson of ch.lessons) out.push(lesson);
  }
  return out;
}

export function useProgression(courseSlug: string): ProgressionApi {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const cp = useCourseStore(selectCourseProgress(courseSlug));

  return React.useMemo<ProgressionApi>(() => {
    const resolved = getCourse(courseSlug);
    if (!resolved) return STUB;
    const course: Course = resolved;

    const flat = flattenLessons(course);
    const indexOf = new Map(
      flat.map((entry, i) => [`${entry.chapter.id}::${entry.lesson.id}`, i]),
    );

    function isLessonUnlocked(chapterId: string, lessonId: string): boolean {
      // Pre-hydration: only the first lesson is exposed so locked badges don't
      // flash. Once mounted we trust the persisted store.
      const key = `${chapterId}::${lessonId}`;
      const idx = indexOf.get(key);
      if (idx === undefined) return false;
      if (idx === 0) return true; // cold-start access for the very first lesson
      if (!mounted) return false;
      const prev = flat[idx - 1];
      return isLessonComplete(cp, prev.lesson);
    }

    function isCheckpointUnlocked(unitId: string): boolean {
      const unit = course.units.find((u) => u.id === unitId);
      if (!unit) return false;
      if (!mounted) return false;
      const lessons = unitLessons(course, unit);
      if (lessons.length === 0) return false;
      return lessons.every((l) => isLessonComplete(cp, l));
    }

    function nextLesson(
      chapterId: string,
      lessonId: string,
    ): { chapterSlug: string; lesson: Lesson } | null {
      const idx = indexOf.get(`${chapterId}::${lessonId}`);
      if (idx === undefined) return null;
      const next = flat[idx + 1];
      if (!next) return null;
      return { chapterSlug: next.chapter.slug, lesson: next.lesson };
    }

    return { isLessonUnlocked, isCheckpointUnlocked, nextLesson };
  }, [courseSlug, cp, mounted]);
}
