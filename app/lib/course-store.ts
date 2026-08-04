/**
 * Course progress store — Zustand + localStorage, keyed by course slug so a
 * learner's per-block / per-lesson progress survives reloads without an
 * account. Mirrors the SSR-safe persistence recipe from `pelican-store.ts`
 * (real localStorage on the client, a no-op on the server). All transition
 * logic lives in the pure helpers in `course-progress.ts`; this store just
 * wraps them per course slug.
 */
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import type { Lesson } from "./course-types";
import {
  applyAttempt,
  applyBlockComplete,
  emptyCourseProgress,
  getLessonProgress,
  markLessonComplete,
  resetLessonProgress,
  seedLesson,
  type CourseProgress,
} from "./course-progress";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

type CourseState = {
  /** Progress per course slug (the `/courses/:courseSlug` URL segment). */
  byCourse: Record<string, CourseProgress>;
  initLesson: (courseSlug: string, lesson: Lesson) => void;
  recordAttempt: (courseSlug: string, lesson: Lesson, blockId: string) => void;
  markBlockComplete: (
    courseSlug: string,
    lesson: Lesson,
    blockId: string,
    opts?: { score?: number },
  ) => void;
  markLessonsAsMastered: (
    courseSlug: string,
    lessons: Lesson[],
    opts?: { scorePerBlock?: number },
  ) => void;
  resetLesson: (courseSlug: string, lesson: Lesson) => void;
  resetCourse: (courseSlug: string) => void;
};

/** Apply a pure transition to one course's progress, creating it if absent. */
function withCourse(
  byCourse: Record<string, CourseProgress>,
  courseSlug: string,
  fn: (cp: CourseProgress) => CourseProgress,
): Record<string, CourseProgress> {
  const cp = byCourse[courseSlug] ?? emptyCourseProgress(courseSlug);
  return { ...byCourse, [courseSlug]: fn(cp) };
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      byCourse: {},

      initLesson: (courseSlug, lesson) => {
        // Idempotent — skip the write entirely if the lesson is already seeded,
        // so calling this on every mount can't churn the store.
        const cp = get().byCourse[courseSlug];
        if (cp && getLessonProgress(cp, lesson)) return;
        set((s) => ({
          byCourse: withCourse(s.byCourse, courseSlug, (c) =>
            seedLesson(c, lesson),
          ),
        }));
      },

      recordAttempt: (courseSlug, lesson, blockId) =>
        set((s) => ({
          byCourse: withCourse(s.byCourse, courseSlug, (c) =>
            applyAttempt(c, lesson, blockId),
          ),
        })),

      markBlockComplete: (courseSlug, lesson, blockId, opts) =>
        set((s) => ({
          byCourse: withCourse(s.byCourse, courseSlug, (c) =>
            applyBlockComplete(c, lesson, blockId, opts),
          ),
        })),

      markLessonsAsMastered: (courseSlug, lessons, opts) =>
        set((s) => ({
          byCourse: withCourse(s.byCourse, courseSlug, (c) =>
            lessons.reduce(
              (acc, lesson) => markLessonComplete(acc, lesson, opts),
              c,
            ),
          ),
        })),

      resetLesson: (courseSlug, lesson) =>
        set((s) => ({
          byCourse: withCourse(s.byCourse, courseSlug, (c) =>
            resetLessonProgress(c, lesson),
          ),
        })),

      resetCourse: (courseSlug) =>
        set((s) => {
          const { [courseSlug]: _omit, ...rest } = s.byCourse;
          return { byCourse: rest };
        }),
    }),
    {
      name: "driverush:ntsa-progress",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage,
      ),
      partialize: (s) => ({ byCourse: s.byCourse }),
    },
  ),
);

/** Selector factory: subscribe to one course's progress object. */
export const selectCourseProgress = (courseSlug: string) => (s: CourseState) =>
  s.byCourse[courseSlug];
