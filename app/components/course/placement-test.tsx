/**
 * Placement test — a short quiz pulled from assessment blocks across every
 * chapter preceding the target lesson. Pass = bulk-mastery on every preceding
 * lesson and jump straight into the target. Fail = polite "keep at it" with
 * a link back to the learning path.
 *
 * Uses the existing assessment renderers verbatim so behaviour matches the
 * real lesson player (sounds, "Why?", retry).
 */
import * as React from "react";
import { Link, useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  CheckmarkCircle02FreeIcons,
  RefreshFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Chapter, CourseBlock, Lesson, Unit } from "~/lib/course-types";
import { getCourse } from "~/lib/course";
import { sampleCheckpoint } from "~/lib/checkpoint";
import { useCourseStore } from "~/lib/course-store";
import { analytics } from "~/lib/analytics";

import { Button } from "~/components/ui/button";
import { getBlockRenderer } from "./block-registry";

const QUESTION_COUNT = 6;
const PASS_THRESHOLD = 0.7; // ≥70% correct on first attempt

function precedingChapters(
  course: ReturnType<typeof getCourse>,
  targetChapterSlug: string,
): Chapter[] {
  if (!course) return [];
  const idx = course.chapters.findIndex((c) => c.slug === targetChapterSlug);
  if (idx <= 0) return [];
  return course.chapters.slice(0, idx);
}

function precedingLessonsForBulk(
  course: ReturnType<typeof getCourse>,
  targetChapterSlug: string,
  targetLessonSlug: string,
): Lesson[] {
  if (!course) return [];
  const out: Lesson[] = [];
  for (const ch of course.chapters) {
    for (const lesson of ch.lessons) {
      if (ch.slug === targetChapterSlug && lesson.slug === targetLessonSlug) {
        return out; // stop at the target
      }
      out.push(lesson);
    }
  }
  return out;
}

export function PlacementTest({
  courseSlug,
  chapterSlug,
  targetLesson,
  onCancel,
}: {
  courseSlug: string;
  chapterSlug: string;
  targetLesson: Lesson;
  onCancel: () => void;
}) {
  const navigate = useNavigate();
  const markLessonsAsMastered = useCourseStore((s) => s.markLessonsAsMastered);

  const course = getCourse(courseSlug);

  // Sample once per mount; reseed if the underlying course slug changes.
  const sample = React.useMemo(() => {
    if (!course) return null;
    const chapters = precedingChapters(course, chapterSlug);
    if (chapters.length === 0) return null;
    const fakeUnit: Unit = {
      id: `placement::${chapterSlug}::${targetLesson.slug}`,
      title: "Placement",
      theme: "rush",
      chapterIds: chapters.map((c) => c.id),
    };
    return sampleCheckpoint(course, fakeUnit, QUESTION_COUNT);
  }, [course, chapterSlug, targetLesson.slug]);

  const blocks: CourseBlock[] = sample?.blocks ?? [];
  const [current, setCurrent] = React.useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = React.useState(0);
  const [missedThisBlock, setMissedThisBlock] = React.useState(false);
  const [verdict, setVerdict] = React.useState<"pass" | "fail" | null>(null);

  if (!course || !sample || blocks.length === 0) {
    return (
      <main className="min-h-screen text-ink">
        <div className="mx-auto w-full max-w-2xl px-5 py-24 text-center sm:px-9">
          <p className="m-0 mb-3 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            No placement test available
          </p>
          <p className="m-0 mb-6 font-serif text-ink-2">
            This lesson is at the start of the course; nothing earlier to test.
          </p>
          <Button variant="rush" size="lg" asChild>
            <Link to={`/courses/${courseSlug}`}>Back to path</Link>
          </Button>
        </div>
      </main>
    );
  }

  function handleAttempt(correct: boolean) {
    if (!correct) setMissedThisBlock(true);
  }

  function handleAdvance() {
    const newCount = firstTryCorrect + (missedThisBlock ? 0 : 1);
    setFirstTryCorrect(newCount);
    setMissedThisBlock(false);
    if (current + 1 >= blocks.length) {
      const passed = newCount / blocks.length >= PASS_THRESHOLD;
      analytics.placementTestCompleted({
        course_slug: courseSlug,
        target_lesson_id: targetLesson.id,
        total: blocks.length,
        correct: newCount,
        passed,
      });
      setVerdict(passed ? "pass" : "fail");
    } else {
      setCurrent((i) => i + 1);
    }
  }

  function applyMasteryAndContinue() {
    const lessons = precedingLessonsForBulk(
      course,
      chapterSlug,
      targetLesson.slug,
    );
    analytics.placementTestPassed({
      course_slug: courseSlug,
      target_lesson_id: targetLesson.id,
      lessons_unlocked: lessons.length,
    });
    markLessonsAsMastered(courseSlug, lessons, { scorePerBlock: 100 });
    navigate(`/courses/${courseSlug}/${chapterSlug}/${targetLesson.slug}`);
  }

  function retake() {
    analytics.placementTestRetaken({
      course_slug: courseSlug,
      target_lesson_id: targetLesson.id,
    });
    setCurrent(0);
    setFirstTryCorrect(0);
    setMissedThisBlock(false);
    setVerdict(null);
  }

  const block = blocks[current];
  const Renderer = block ? getBlockRenderer(block.type) : null;

  return (
    <main className="min-h-screen text-ink">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-9">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel placement test"
            className="inline-flex size-9 shrink-0 items-center justify-center border-2 border-ink bg-surface text-ink outline-none transition-colors hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper"
          >
            <HugeiconsIcon
              icon={ArrowLeft02FreeIcons}
              size={16}
              strokeWidth={2.5}
            />
          </button>
          <p className="m-0 flex-1 font-mono text-[11px] uppercase tracking-widest text-ink-3 tabular-nums">
            Placement · question {Math.min(current + 1, blocks.length)} of{" "}
            {blocks.length}
          </p>
          <span className="inline-flex items-center gap-1 border-2 border-ink bg-surface px-2 py-1 font-mono text-[10.5px] font-bold uppercase tracking-widest tabular-nums">
            {firstTryCorrect}/{blocks.length}
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-8 sm:px-9">
        {verdict === null && Renderer && block ? (
          <section
            key={block.id}
            className="border-2 border-ink bg-surface p-5 sm:p-7"
          >
            <Renderer
              block={block}
              status="unlocked"
              isLast={current + 1 === blocks.length}
              onAttempt={handleAttempt}
              onAdvance={handleAdvance}
            />
          </section>
        ) : verdict === "pass" ? (
          <div className="grid justify-items-center gap-5 border-2 border-ink bg-surface px-6 py-14 text-center shadow-stamp">
            <span className="inline-flex size-16 items-center justify-center border-2 border-ink bg-kenya-green text-kenya-green-foreground">
              <HugeiconsIcon
                icon={CheckmarkCircle02FreeIcons}
                size={30}
                strokeWidth={2.5}
              />
            </span>
            <div>
              <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-ink-3">
                You're cleared
              </p>
              <h1 className="m-0 mt-2 font-display text-[clamp(28px,5vw,44px)] font-extrabold uppercase leading-[0.95] tracking-tight">
                Skip the prequel
              </h1>
            </div>
            <p className="m-0 max-w-md font-serif text-[16px] leading-snug text-ink-2">
              You aced {firstTryCorrect} of {blocks.length}. We'll mark every
              earlier lesson as mastered so you can pick up at{" "}
              <span className="font-bold text-ink">{targetLesson.title}</span>.
            </p>
            <Button variant="rush" size="lg" onClick={applyMasteryAndContinue}>
              Continue to lesson
              <HugeiconsIcon
                icon={ArrowRight02FreeIcons}
                size={16}
                strokeWidth={2.5}
              />
            </Button>
          </div>
        ) : (
          <div className="grid justify-items-center gap-5 border-2 border-ink bg-surface px-6 py-14 text-center shadow-stamp">
            <div>
              <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-ink-3">
                Almost
              </p>
              <h1 className="m-0 mt-2 font-display text-[clamp(28px,5vw,44px)] font-extrabold uppercase leading-[0.95] tracking-tight">
                Take the earlier lessons
              </h1>
            </div>
            <p className="m-0 max-w-md font-serif text-[16px] leading-snug text-ink-2">
              You got {firstTryCorrect} of {blocks.length} on the first try.
              Work through the path; you'll fly through this lesson when you
              come back.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="rush" size="lg" asChild>
                <Link to={`/courses/${courseSlug}`}>Back to path</Link>
              </Button>
              <Button variant="paper" size="lg" onClick={retake}>
                <HugeiconsIcon
                  icon={RefreshFreeIcons}
                  size={16}
                  strokeWidth={2.5}
                />
                Try again
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
