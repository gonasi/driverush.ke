/**
 * Snaking learning path. Renders every unit in order:
 *  unit header → all lessons in that unit on a snake → unit checkpoint node.
 *
 * Lesson nodes alternate left/right of a centre ink connector for the
 * Duolingo-style serpent. Unit headers + checkpoint nodes span both columns.
 * The first lesson is always available; everything else respects the unlock
 * rules in `useProgression`.
 */
import * as React from "react";

import type { Chapter, Course, Lesson } from "~/lib/course-types";
import {
  getLessonProgress,
  isLessonComplete,
  lessonPct,
} from "~/lib/course-progress";
import { selectCourseProgress, useCourseStore } from "~/lib/course-store";
import { useProgression } from "~/lib/use-progression";
import { cn } from "~/lib/utils";

import { CheckpointNode } from "./checkpoint-node";
import { PathNode, type PathNodeState } from "./path-node";
import { UnitHeader } from "./unit-header";

import "./learning-path.css";

function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

/** Lessons in this unit, paired with their owning chapter (display order). */
function unitChaptersWithLessons(
  course: Course,
  chapterIds: string[],
): Array<{ chapter: Chapter; lesson: Lesson; lessonIdxInUnit: number }> {
  const ids = new Set(chapterIds);
  const out: Array<{
    chapter: Chapter;
    lesson: Lesson;
    lessonIdxInUnit: number;
  }> = [];
  let idx = 0;
  for (const ch of course.chapters) {
    if (!ids.has(ch.id)) continue;
    for (const lesson of ch.lessons) {
      idx += 1;
      out.push({ chapter: ch, lesson, lessonIdxInUnit: idx });
    }
  }
  return out;
}

function lessonStars(pct: number, accuracy?: number): 0 | 1 | 2 | 3 {
  // PR-1: no per-block accuracy aggregator yet, so fall back to pct as a
  // proxy. PR-2 will swap this for an assessment-aware score.
  const score = typeof accuracy === "number" ? accuracy : pct;
  if (score >= 100) return 3;
  if (score >= 85) return 2;
  if (score >= 70) return 1;
  return 0;
}

export function LearningPath({ course }: { course: Course }) {
  const mounted = useMounted();
  const cp = useCourseStore(selectCourseProgress(course.slug));
  const progression = useProgression(course.slug);

  return (
    <div className="grid gap-12">
      {course.units.map((unit, unitIdx) => {
        const entries = unitChaptersWithLessons(course, unit.chapterIds);
        const completed = mounted
          ? entries.filter((e) => isLessonComplete(cp, e.lesson)).length
          : 0;
        const checkpointUnlocked = progression.isCheckpointUnlocked(unit.id);

        return (
          <section key={unit.id} className="grid gap-6">
            <UnitHeader
              number={unitIdx + 1}
              title={unit.title}
              theme={unit.theme}
              lessonsComplete={completed}
              lessonsTotal={entries.length}
            />

            <div className={cn("dr-path-grid")}>
              {entries.map(({ chapter, lesson, lessonIdxInUnit }) => {
                const unlocked = progression.isLessonUnlocked(
                  chapter.id,
                  lesson.id,
                );
                const complete = mounted && isLessonComplete(cp, lesson);
                const started =
                  mounted && !!getLessonProgress(cp, lesson) && !complete;
                const pct = mounted ? lessonPct(cp, lesson) : 0;

                let state: PathNodeState = "locked";
                if (complete) state = "complete";
                else if (started) state = "in-progress";
                else if (unlocked) state = "available";

                const side = lessonIdxInUnit % 2 === 1 ? "left" : "right";

                return (
                  <div key={lesson.id} className="dr-path-row" data-side={side}>
                    <PathNode
                      state={state}
                      to={
                        unlocked
                          ? `/courses/${course.slug}/${chapter.slug}/${lesson.slug}`
                          : undefined
                      }
                      index={lessonIdxInUnit}
                      title={lesson.title}
                      minutes={lesson.estimatedMinutes}
                      xp={lesson.totalXP}
                      pct={pct}
                      stars={complete ? lessonStars(pct) : 0}
                    />
                  </div>
                );
              })}

              {unit.checkpoint !== null && (
                <div className="dr-path-row" data-full="true">
                  <CheckpointNode
                    unitTitle={unit.title}
                    theme={unit.theme}
                    unlocked={checkpointUnlocked}
                  />
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
