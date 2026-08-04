/**
 * Deterministic sampler that builds a "Unit Checkpoint" — a mini-test pulled
 * from the assessment blocks already authored across a unit's chapters. The
 * sample is seeded by `unit.id + a completion signature` so a learner sees the
 * same checkpoint every time until they complete more lessons (at which point
 * fresh questions can enter the pool).
 *
 * Returns a synthetic `Lesson`-shaped object so existing block renderers can
 * play it through with zero changes.
 */
import type {
  Chapter,
  Course,
  CourseBlock,
  Lesson,
  Unit,
} from "./course-types";
import { ASSESSMENT_BLOCK_TYPES } from "./course-types";

/** Tiny seedable PRNG (mulberry32) so no deps + reproducible output. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function unitChapters(course: Course, unit: Unit): Chapter[] {
  const ids = new Set(unit.chapterIds);
  return course.chapters.filter((c) => ids.has(c.id));
}

function collectAssessmentBlocks(chapters: Chapter[]): CourseBlock[] {
  const out: CourseBlock[] = [];
  for (const ch of chapters) {
    for (const lesson of ch.lessons) {
      for (const b of lesson.blocks) {
        if (ASSESSMENT_BLOCK_TYPES.has(b.type)) out.push(b);
      }
    }
  }
  return out;
}

/** Deterministic Fisher-Yates using the given PRNG. */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type CheckpointSample = {
  unit: Unit;
  blocks: CourseBlock[];
  totalXP: number;
  totalWeight: number;
};

/**
 * Sample N assessment blocks from a unit. Prefers higher-weight blocks (more
 * cognitive load = better discrimination), shuffled within weight tiers so the
 * sample isn't always the same N first.
 *
 * @param seedExtra Extra string mixed into the seed — pass a completion
 *   signature (e.g. `${completedLessonCount}`) so the sample evolves as the
 *   learner makes progress.
 */
export function sampleCheckpoint(
  course: Course,
  unit: Unit,
  count: number,
  seedExtra: string = "",
): CheckpointSample {
  const chapters = unitChapters(course, unit);
  const pool = collectAssessmentBlocks(chapters);
  const rng = mulberry32(hashString(`${unit.id}::${seedExtra}`));

  // Sort by weight desc, then shuffle within each weight tier to avoid the
  // same N-from-the-top every run.
  const tiers = new Map<number, CourseBlock[]>();
  for (const b of pool) {
    const arr = tiers.get(b.weight) ?? [];
    arr.push(b);
    tiers.set(b.weight, arr);
  }
  const weightsDesc = Array.from(tiers.keys()).sort((a, b) => b - a);
  const ordered: CourseBlock[] = [];
  for (const w of weightsDesc) {
    ordered.push(...shuffle(tiers.get(w) ?? [], rng));
  }
  const picked = ordered.slice(0, Math.min(count, ordered.length));

  return {
    unit,
    blocks: picked,
    totalXP: picked.reduce((sum, b) => sum + b.xp, 0),
    totalWeight: picked.reduce((sum, b) => sum + b.weight, 0),
  };
}

/**
 * Wrap a checkpoint sample in a synthetic `Lesson` so existing renderers + the
 * lesson player can host it without special-casing. The synthetic lesson is
 * tagged with a stable id (`checkpoint::<unitId>`) so its progress survives in
 * the same `CourseProgress` store as the real lessons.
 */
export function buildCheckpointLesson(sample: CheckpointSample): Lesson {
  const orderedBlocks: CourseBlock[] = sample.blocks.map((b, i) => ({
    ...b,
    // Re-number so the player's ordering invariant holds even when blocks come
    // from different lessons (each lesson started at order=1).
    order: i + 1,
  }));
  const lessonId = `checkpoint::${sample.unit.id}`;
  return {
    id: lessonId,
    dir: lessonId,
    slug: lessonId,
    title: `${sample.unit.title} checkpoint`,
    objective: `Prove you've got ${sample.unit.title.toLowerCase()} locked in.`,
    estimatedMinutes: Math.max(3, Math.round(sample.blocks.length * 0.6)),
    totalXP: sample.totalXP,
    totalWeight: sample.totalWeight,
    blocks: orderedBlocks,
    chapterId: `checkpoint::${sample.unit.id}`,
    chapterSlug: `checkpoint::${sample.unit.id}`,
  };
}
