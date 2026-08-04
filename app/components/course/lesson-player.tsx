import * as React from "react";
import { Link } from "react-router";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  AwardFreeIcons,
  RefreshFreeIcons,
  SmartPhone01FreeIcons,
  VolumeHighFreeIcons,
} from "@hugeicons/core-free-icons";

import type { BlockResult, Lesson } from "~/lib/course-types";
import {
  getLessonProgress,
  isLessonComplete,
  lessonPct,
  lessonXpEarned,
} from "~/lib/course-progress";
import { selectCourseProgress, useCourseStore } from "~/lib/course-store";
import { useCourseUiStore } from "~/lib/course-ui-store";
import { useFeedback } from "~/lib/use-feedback";
import { analytics } from "~/lib/analytics";
import { preloadSfx } from "~/lib/sounds";
import { useProgression } from "~/lib/use-progression";
import { useStreakStore } from "~/lib/use-streak-store";
import { cn } from "~/lib/utils";

import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { CelebrationConfetti } from "~/components/brand/celebration-confetti";
import { ShareButton } from "~/components/brand/share-button";
import { LoadingPanel } from "~/components/brand/traffic-loader";
import { getBlockRenderer } from "./block-registry";
import { LockedPanel } from "./locked-panel";
import { SegmentedProgress } from "./segmented-progress";
import { StreakFlame } from "./streak-flame";
import { WhySheet } from "./why-sheet";

function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

type LessonPlayerProps = {
  courseSlug: string;
  lesson: Lesson;
};

/**
 * Full-screen, Gonasi-style lesson player. All revealed blocks stack on one
 * page; completing the active block reveals the next below it and smooth-scrolls
 * to it (with a whoosh). A sticky header shows the segmented progress boxes and
 * the sound / haptics toggles. Progress is persisted by `useCourseStore`; we
 * gate on a mounted flag so persisted state can't cause a hydration mismatch.
 */
export function LessonPlayer({ courseSlug, lesson }: LessonPlayerProps) {
  const mounted = useMounted();

  const cp = useCourseStore(selectCourseProgress(courseSlug));
  const initLesson = useCourseStore((s) => s.initLesson);
  const markBlockComplete = useCourseStore((s) => s.markBlockComplete);
  const recordAttempt = useCourseStore((s) => s.recordAttempt);
  const resetLesson = useCourseStore((s) => s.resetLesson);

  const isSoundEnabled = useCourseUiStore((s) => s.isSoundEnabled);
  const isVibrationEnabled = useCourseUiStore((s) => s.isVibrationEnabled);
  const toggleSound = useCourseUiStore((s) => s.toggleSound);
  const toggleVibration = useCourseUiStore((s) => s.toggleVibration);

  const progression = useProgression(courseSlug);
  const unlocked = progression.isLessonUnlocked(lesson.chapterId, lesson.id);
  const recordStreak = useStreakStore((s) => s.recordLessonComplete);

  const { scroll } = useFeedback();

  // Only seed once we know the learner can actually access the lesson —
  // otherwise a deep-link to a locked lesson would silently mark it as
  // started and skew the progression UI on the path.
  React.useEffect(() => {
    if (!mounted || !unlocked) return;
    initLesson(courseSlug, lesson);
    preloadSfx();
  }, [initLesson, courseSlug, lesson, mounted, unlocked]);

  // `lesson_started` fires once per lesson open, after the persisted store has
  // hydrated so `entry` can tell a first attempt from a resume or a review.
  const startedFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!mounted || !unlocked) return;
    if (startedFor.current === lesson.id) return;
    startedFor.current = lesson.id;
    const existing = getLessonProgress(cp, lesson);
    analytics.lessonStarted({
      course_slug: courseSlug,
      lesson_id: lesson.id,
      chapter_id: lesson.chapterId,
      blocks_total: lesson.blocks.length,
      entry: !existing
        ? "fresh"
        : isLessonComplete(cp, lesson)
          ? "review"
          : "resume",
    });
    // `cp` is intentionally read, not depended on: we want the snapshot at
    // open time, and re-running on every block completion would spam starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, unlocked, lesson, courseSlug]);

  const lp = getLessonProgress(cp, lesson);
  const complete = isLessonComplete(cp, lesson);
  const currentBlockId = lp?.currentBlockId ?? lesson.blocks[0]?.id;

  // Streak + daily-XP credit fires exactly once per completion. `completedAt`
  // is stable per attempt; a fresh replay generates a new timestamp so we re-
  // credit then too.
  const streakRecordedFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!mounted || !complete || !lp?.completedAt) return;
    const key = `${lesson.id}::${lp.completedAt}`;
    if (streakRecordedFor.current === key) return;
    streakRecordedFor.current = key;
    const before = useStreakStore.getState();
    const result = recordStreak(lp.xpEarned);
    if (result.freezeSpent) {
      toast("Streak freeze used — back tomorrow.");
    }
    // Read back the post-write state so the events carry the real numbers
    // rather than our guess at what the reducer did.
    const after = useStreakStore.getState();
    if (after.currentStreak !== before.currentStreak) {
      analytics.streakExtended({
        days: after.currentStreak,
        longest: after.longestStreak,
        freeze_spent: result.freezeSpent,
      });
    }
    // The daily counter rolls over at local midnight, so yesterday's total
    // doesn't count as "already met" for today.
    const xpBeforeToday =
      before.dailyXpDate === after.dailyXpDate ? before.dailyXpEarned : 0;
    const goalWasMet = xpBeforeToday >= before.dailyGoal;
    const goalNowMet = after.dailyXpEarned >= after.dailyGoal;
    if (!goalWasMet && goalNowMet) {
      analytics.dailyGoalMet({
        goal: after.dailyGoal,
        xp_earned: after.dailyXpEarned,
        streak: after.currentStreak,
      });
    }
  }, [
    mounted,
    complete,
    lp?.completedAt,
    lp?.xpEarned,
    lesson.id,
    recordStreak,
  ]);

  const statusOf = (blockId: string) =>
    lp?.blocks[blockId]?.status ??
    (blockId === currentBlockId ? "unlocked" : "locked");

  // Revealed = every completed block + the active one. Locked-ahead blocks stay
  // hidden until reached (Gonasi's progressive reveal).
  const revealed = lp
    ? lesson.blocks.filter((b) => {
        const st = lp.blocks[b.id]?.status;
        return st === "complete" || st === "unlocked";
      })
    : lesson.blocks.slice(0, 1);

  const lastBlockId = lesson.blocks[lesson.blocks.length - 1]?.id;

  // --- auto-scroll to the active block when it changes (skip the first one) ---
  const blockRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const prevActive = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (!mounted || !currentBlockId) return;
    if (prevActive.current === undefined) {
      prevActive.current = currentBlockId;
      return;
    }
    if (prevActive.current === currentBlockId) return;
    prevActive.current = currentBlockId;
    const el = blockRefs.current[currentBlockId];
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => scroll(), 120);
    });
  }, [currentBlockId, mounted, scroll]);

  function advance(blockId: string, result?: BlockResult) {
    const block = lesson.blocks.find((candidate) => candidate.id === blockId);
    const score =
      result && typeof result.score === "number" ? result.score : undefined;
    analytics.lessonBlockCompleted({
      course_slug: courseSlug,
      lesson_id: lesson.id,
      block_id: blockId,
      block_type: block?.type ?? "unknown",
      ...(score !== undefined ? { score } : {}),
    });
    if (blockId === lastBlockId) {
      analytics.lessonCompleted({
        course_slug: courseSlug,
        lesson_id: lesson.id,
        blocks_total: lesson.blocks.length,
        xp_earned: lessonXpEarned(cp, lesson) + (block?.xp ?? 0),
      });
    }
    markBlockComplete(
      courseSlug,
      lesson,
      blockId,
      score !== undefined ? { score } : undefined,
    );
  }

  function handleReplay() {
    analytics.lessonReplayed({ course_slug: courseSlug, lesson_id: lesson.id });
    resetLesson(courseSlug, lesson);
    prevActive.current = undefined;
    initLesson(courseSlug, lesson);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const segments = lesson.blocks.map((b) => ({
    id: b.id,
    weight: b.weight,
    complete: statusOf(b.id) === "complete",
  }));
  const xp = lessonXpEarned(cp, lesson);

  // Lock guard: once mounted (so the persisted store has hydrated) divert
  // locked deep-links into the placement-test entry point. SSR + first paint
  // continue to render the loading panel so we never flash the locked state
  // to a returning learner who legitimately has access.
  if (mounted && !unlocked) {
    return (
      <LockedPanel
        courseSlug={courseSlug}
        chapterSlug={lesson.chapterSlug}
        lesson={lesson}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col text-ink">
      {/* sticky header: exit · progress boxes · sound / haptics · streak */}
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-9">
          <Link
            to={`/courses/${courseSlug}`}
            aria-label="Exit lesson"
            className="inline-flex size-9 shrink-0 items-center justify-center border-2 border-ink bg-surface text-ink outline-none transition-colors hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper"
          >
            <HugeiconsIcon
              icon={ArrowLeft02FreeIcons}
              size={16}
              strokeWidth={2.5}
            />
          </Link>
          <div className="flex-1">
            <SegmentedProgress segments={segments} activeId={currentBlockId} />
          </div>
          <StreakFlame />
          <HeaderToggle
            icon={VolumeHighFreeIcons}
            active={isSoundEnabled}
            onClick={toggleSound}
            label={isSoundEnabled ? "Mute sound" : "Unmute sound"}
          />
          <HeaderToggle
            icon={SmartPhone01FreeIcons}
            active={isVibrationEnabled}
            onClick={toggleVibration}
            label={isVibrationEnabled ? "Turn off haptics" : "Turn on haptics"}
          />
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 px-5 pb-32 pt-6 sm:px-9">
        {!mounted ? (
          <div className="flex min-h-72 items-center justify-center border-2 border-ink bg-paper-3">
            <LoadingPanel label="Loading the lesson" size="lg" />
          </div>
        ) : complete ? (
          <LessonComplete
            courseSlug={courseSlug}
            lesson={lesson}
            xpEarned={xp}
            onReplay={handleReplay}
          />
        ) : (
          <>
            <header className="mb-8 border-b-2 border-dashed border-ink pb-5">
              <div className="flex items-center justify-between gap-3">
                <span className="eyebrow text-ink">Lesson</span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                  <HugeiconsIcon
                    icon={AwardFreeIcons}
                    size={12}
                    strokeWidth={2.5}
                  />
                  {xp} / {lesson.totalXP} XP
                </span>
              </div>
              <h1 className="m-0 mt-2 font-display text-[clamp(26px,5vw,46px)] font-extrabold uppercase leading-[0.95] tracking-tighter">
                {lesson.title}
              </h1>
              <p className="mt-3 max-w-2xl font-serif text-[clamp(15px,2vw,18px)] leading-snug text-ink-2">
                {lesson.objective}
              </p>
            </header>

            <div className="grid gap-6">
              {revealed.map((b) => {
                const Renderer = getBlockRenderer(b.type);
                const status = statusOf(b.id);
                return (
                  <section
                    key={b.id}
                    ref={(el) => {
                      blockRefs.current[b.id] = el;
                    }}
                    className={cn(
                      "scroll-mt-24 border-2 border-ink bg-surface p-5 transition-opacity sm:p-7",
                      status === "complete" && "opacity-80",
                    )}
                  >
                    <Renderer
                      block={b}
                      status={status}
                      isLast={b.id === lastBlockId}
                      onAttempt={() => recordAttempt(courseSlug, lesson, b.id)}
                      onAdvance={(result) => advance(b.id, result)}
                    />
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>

      <WhySheet />
    </div>
  );
}

function HeaderToggle({
  icon,
  active,
  onClick,
  label,
}: {
  icon: IconSvgElement;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center border-2 border-ink outline-none transition-colors",
        active ? "bg-ink text-paper" : "bg-surface text-ink-3",
      )}
    >
      <HugeiconsIcon icon={icon} size={16} strokeWidth={2.5} />
    </button>
  );
}

function LessonComplete({
  courseSlug,
  lesson,
  xpEarned,
  onReplay,
}: {
  courseSlug: string;
  lesson: Lesson;
  xpEarned: number;
  onReplay: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const { complete } = useFeedback();
  const played = React.useRef(false);
  React.useEffect(() => {
    if (played.current) return;
    played.current = true;
    complete();
  }, [complete]);

  return (
    <div className="relative grid justify-items-center gap-5 overflow-hidden border-2 border-ink bg-surface px-6 py-14 text-center shadow-stamp">
      {!reduced && <CelebrationConfetti />}
      <span className="flex size-16 items-center justify-center border-2 border-ink bg-kenya-green text-kenya-green-foreground">
        <HugeiconsIcon icon={AwardFreeIcons} size={30} strokeWidth={2.25} />
      </span>
      <div>
        <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-ink-3">
          Lesson complete
        </p>
        <h2 className="m-0 mt-2 font-display text-[clamp(28px,5vw,44px)] font-extrabold uppercase leading-[0.95] tracking-tight text-ink">
          {lesson.title}
        </h2>
      </div>
      <p className="m-0 max-w-md font-serif text-[17px] leading-snug text-ink-2">
        You earned <span className="font-bold text-ink">{xpEarned} XP</span>{" "}
        across {lesson.blocks.length} blocks. The next lesson builds straight on
        this one.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="rush" size="lg" asChild>
          <Link to={`/courses/${courseSlug}`}>
            Back to course
            <HugeiconsIcon
              icon={ArrowRight02FreeIcons}
              size={16}
              strokeWidth={2.5}
            />
          </Link>
        </Button>
        <ShareButton
          surface="lesson_complete"
          payload={{
            kind: "lesson",
            courseSlug,
            lessonId: lesson.id,
            xp: xpEarned,
          }}
        />
        <Button variant="paper" size="lg" onClick={onReplay}>
          <HugeiconsIcon icon={RefreshFreeIcons} size={16} strokeWidth={2.5} />
          Replay lesson
        </Button>
      </div>
    </div>
  );
}
