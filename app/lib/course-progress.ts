/**
 * Pure progress helpers for the course engine — a trimmed version of the spec
 * §9 `ntsa_progress` shape. Block-level (locked/unlocked/complete) + lesson +
 * chapter + course XP. The Zustand store in `course-store.ts` persists this and
 * wraps these helpers; this file is just types + immutable transitions, so it's
 * trivially testable and SSR-safe.
 *
 * Fields the spec §9 carries that L01 doesn't need yet (lives, streakDays,
 * weakAreas, reviewSet, missedBlocks) are intentionally omitted from v1.
 */
import type { BlockStatus, Lesson } from "./course-types";

export type BlockProgress = {
  status: BlockStatus;
  xpEarned: number;
  attempts: number;
  /** 0–100 for assessment blocks; null for non-assessment (reveal/read) blocks. */
  score?: number | null;
};

export type LessonStatus = "locked" | "in_progress" | "complete";

export type LessonProgress = {
  status: LessonStatus;
  xpEarned: number;
  currentBlockId?: string;
  completedAt?: string;
  blocks: Record<string, BlockProgress>;
};

export type ChapterStatus = "locked" | "in_progress" | "complete";

export type ChapterProgress = {
  status: ChapterStatus;
  xpEarned: number;
  lessons: Record<string, LessonProgress>;
};

export type CourseProgress = {
  courseId: string;
  lastUpdated: string;
  totalXP: number;
  chapters: Record<string, ChapterProgress>;
};

export function emptyCourseProgress(courseId: string): CourseProgress {
  return {
    courseId,
    lastUpdated: new Date().toISOString(),
    totalXP: 0,
    chapters: {},
  };
}

export function getLessonProgress(
  cp: CourseProgress | undefined,
  lesson: Lesson,
): LessonProgress | undefined {
  return cp?.chapters[lesson.chapterId]?.lessons[lesson.id];
}

export function getBlockStatus(
  cp: CourseProgress | undefined,
  lesson: Lesson,
  blockId: string,
): BlockStatus {
  return getLessonProgress(cp, lesson)?.blocks[blockId]?.status ?? "locked";
}

/** Weighted completion 0–100: Σ complete-block weight / lesson totalWeight. */
export function lessonPct(
  cp: CourseProgress | undefined,
  lesson: Lesson,
): number {
  const lp = getLessonProgress(cp, lesson);
  if (!lp || lesson.totalWeight === 0) return 0;
  const done = lesson.blocks.reduce(
    (sum, b) => sum + (lp.blocks[b.id]?.status === "complete" ? b.weight : 0),
    0,
  );
  return Math.round((done / lesson.totalWeight) * 100);
}

export function lessonXpEarned(
  cp: CourseProgress | undefined,
  lesson: Lesson,
): number {
  return getLessonProgress(cp, lesson)?.xpEarned ?? 0;
}

export function isLessonComplete(
  cp: CourseProgress | undefined,
  lesson: Lesson,
): boolean {
  const lp = getLessonProgress(cp, lesson);
  return (
    !!lp && lesson.blocks.every((b) => lp.blocks[b.id]?.status === "complete")
  );
}

/**
 * Seed a lesson's progress if absent — block[0] `unlocked`, the rest `locked`,
 * lesson `in_progress` with `currentBlockId` at the first block. Idempotent:
 * returns the same reference if the lesson already has a record.
 */
export function seedLesson(cp: CourseProgress, lesson: Lesson): CourseProgress {
  if (getLessonProgress(cp, lesson)) return cp;

  const blocks: Record<string, BlockProgress> = {};
  lesson.blocks.forEach((b, i) => {
    blocks[b.id] = {
      status: i === 0 ? "unlocked" : "locked",
      xpEarned: 0,
      attempts: 0,
    };
  });

  const lessonProg: LessonProgress = {
    status: "in_progress",
    xpEarned: 0,
    currentBlockId: lesson.blocks[0]?.id,
    blocks,
  };

  const chapter = cp.chapters[lesson.chapterId] ?? {
    status: "in_progress" as ChapterStatus,
    xpEarned: 0,
    lessons: {},
  };

  return {
    ...cp,
    chapters: {
      ...cp.chapters,
      [lesson.chapterId]: {
        ...chapter,
        status: "in_progress",
        lessons: { ...chapter.lessons, [lesson.id]: lessonProg },
      },
    },
  };
}

/** Increment a block's attempt count (call on each submit, before completion). */
export function applyAttempt(
  cp: CourseProgress,
  lesson: Lesson,
  blockId: string,
): CourseProgress {
  const lp = getLessonProgress(cp, lesson);
  const bp = lp?.blocks[blockId];
  if (!lp || !bp) return cp;
  const chapter = cp.chapters[lesson.chapterId];
  return {
    ...cp,
    chapters: {
      ...cp.chapters,
      [lesson.chapterId]: {
        ...chapter,
        lessons: {
          ...chapter.lessons,
          [lesson.id]: {
            ...lp,
            blocks: {
              ...lp.blocks,
              [blockId]: { ...bp, attempts: bp.attempts + 1 },
            },
          },
        },
      },
    },
  };
}

/**
 * Mark a block complete: award its XP **once** (no-op if already complete),
 * unlock the next block, advance `currentBlockId`, roll XP up to lesson /
 * chapter / course totals, and mark the lesson complete when every block is.
 */
export function applyBlockComplete(
  cp: CourseProgress,
  lesson: Lesson,
  blockId: string,
  opts?: { score?: number },
): CourseProgress {
  const seeded = seedLesson(cp, lesson);
  const chapter = seeded.chapters[lesson.chapterId];
  const lp = chapter.lessons[lesson.id];
  const bp = lp.blocks[blockId];
  if (!bp || bp.status === "complete") return seeded; // award once

  const block = lesson.blocks.find((b) => b.id === blockId);
  if (!block) return seeded;
  const xp = block.xp;

  const newBlocks = {
    ...lp.blocks,
    [blockId]: {
      ...bp,
      status: "complete" as BlockStatus,
      xpEarned: xp,
      score: opts?.score ?? bp.score ?? null,
    },
  };

  // Unlock the next block in order.
  const idx = lesson.blocks.findIndex((b) => b.id === blockId);
  const next = lesson.blocks[idx + 1];
  if (next && newBlocks[next.id]?.status === "locked") {
    newBlocks[next.id] = { ...newBlocks[next.id], status: "unlocked" };
  }

  const allComplete = lesson.blocks.every(
    (b) => newBlocks[b.id]?.status === "complete",
  );
  const now = new Date().toISOString();

  const newLesson: LessonProgress = {
    ...lp,
    blocks: newBlocks,
    xpEarned: lp.xpEarned + xp,
    status: allComplete ? "complete" : "in_progress",
    completedAt: allComplete ? now : lp.completedAt,
    currentBlockId: allComplete ? blockId : (next?.id ?? lp.currentBlockId),
  };

  return {
    ...seeded,
    totalXP: seeded.totalXP + xp,
    lastUpdated: now,
    chapters: {
      ...seeded.chapters,
      [lesson.chapterId]: {
        ...chapter,
        xpEarned: chapter.xpEarned + xp,
        lessons: { ...chapter.lessons, [lesson.id]: newLesson },
      },
    },
  };
}

/**
 * Mark every block in a lesson as complete in one transition. Used by the
 * placement-test to unlock all lessons preceding the target after a successful
 * skip-ahead — bypasses block-by-block ordering. XP is awarded once per block.
 * Idempotent: lessons already complete are returned as-is.
 */
export function markLessonComplete(
  cp: CourseProgress,
  lesson: Lesson,
  opts?: { scorePerBlock?: number },
): CourseProgress {
  const seeded = seedLesson(cp, lesson);
  if (isLessonComplete(seeded, lesson)) return seeded;

  const chapter = seeded.chapters[lesson.chapterId];
  const lp = chapter.lessons[lesson.id];

  let xpDelta = 0;
  const newBlocks: Record<string, BlockProgress> = { ...lp.blocks };
  for (const block of lesson.blocks) {
    const bp = newBlocks[block.id];
    if (!bp || bp.status === "complete") continue;
    xpDelta += block.xp;
    newBlocks[block.id] = {
      ...bp,
      status: "complete",
      xpEarned: block.xp,
      score: opts?.scorePerBlock ?? bp.score ?? null,
    };
  }

  const now = new Date().toISOString();
  const lastBlockId = lesson.blocks[lesson.blocks.length - 1]?.id;
  const newLesson: LessonProgress = {
    ...lp,
    blocks: newBlocks,
    xpEarned: lp.xpEarned + xpDelta,
    status: "complete",
    completedAt: now,
    currentBlockId: lastBlockId ?? lp.currentBlockId,
  };

  return {
    ...seeded,
    totalXP: seeded.totalXP + xpDelta,
    lastUpdated: now,
    chapters: {
      ...seeded.chapters,
      [lesson.chapterId]: {
        ...chapter,
        xpEarned: chapter.xpEarned + xpDelta,
        lessons: { ...chapter.lessons, [lesson.id]: newLesson },
      },
    },
  };
}

/** Drop a lesson's progress (and back out its XP) so it can be replayed fresh. */
export function resetLessonProgress(
  cp: CourseProgress,
  lesson: Lesson,
): CourseProgress {
  const chapter = cp.chapters[lesson.chapterId];
  const lp = chapter?.lessons[lesson.id];
  if (!chapter || !lp) return cp;
  const { [lesson.id]: _removed, ...restLessons } = chapter.lessons;
  return {
    ...cp,
    totalXP: Math.max(0, cp.totalXP - lp.xpEarned),
    chapters: {
      ...cp.chapters,
      [lesson.chapterId]: {
        ...chapter,
        xpEarned: Math.max(0, chapter.xpEarned - lp.xpEarned),
        lessons: restLessons,
      },
    },
  };
}
