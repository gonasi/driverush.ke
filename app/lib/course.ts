/**
 * File-based course manifest. Reads the course content tree under
 * `app/courses/**` via Vite's `import.meta.glob` (eager) — `.mdx` blocks for
 * their frontmatter + body component, and `.json` files for the course /
 * chapter / lesson manifests — and assembles them into the typed shapes in
 * `course-types.ts`. Modeled on `app/lib/blog.ts`.
 *
 * - Lesson `totalXP` / `totalWeight` are DERIVED from block frontmatter; the
 *   JSON values are advisory (dev-warns on mismatch).
 * - Roadmap entries (a chapter/lesson listed in a manifest whose files don't
 *   exist yet) are skipped silently, so the full 8-chapter course.json can ship
 *   while only authored lessons materialise. A block file referenced by a
 *   lesson.json that ISN'T on disk is a hard error — the lesson is broken.
 */
import type { ComponentType } from "react";

import type {
  BaseBlockFrontmatter,
  BlockData,
  Chapter,
  Course,
  CourseBlock,
  Lesson,
  SerialisedBlock,
  SerialisedLesson,
  Unit,
  UnitTheme,
} from "./course-types";

type MdxModule = {
  default: ComponentType<{ components?: Record<string, unknown> }>;
  frontmatter?: BaseBlockFrontmatter & { data?: BlockData };
};

// Eager so the manifest is available synchronously at module load (same trade
// off as the blog: the whole course ships in the bundle). `import: "default"`
// on the JSON glob hands back the parsed object directly, not `{ default }`.
const BLOCK_MODULES = import.meta.glob<MdxModule>("../courses/**/*.mdx", {
  eager: true,
});
const JSON_MODULES = import.meta.glob<unknown>("../courses/**/*.json", {
  eager: true,
  import: "default",
});

// ---- raw manifest shapes (as authored in the .json files) ----
type RawUnit = {
  id: string;
  title: string;
  theme: UnitTheme;
  chapterIds: string[];
  checkpoint?: { questionCount?: number } | null;
};
type RawCourse = {
  id: string;
  title: string;
  tagline: string;
  version: string;
  locale: string;
  totalXP: number;
  passMark: number;
  chapters: { id: string; dir: string }[];
  units?: RawUnit[];
};
type RawChapter = {
  id: string;
  title: string;
  description: string;
  outcomes?: string[];
  badgeId?: string;
  badgeThreshold?: number;
  totalXP?: number;
  lessons: { id: string; dir: string }[];
};
type RawLesson = {
  id: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  totalXP?: number;
  totalWeight?: number;
  blocks: { id: string; file: string }[];
};

const isDev = import.meta.env.DEV;

/** First JSON module whose glob key ends with `suffix`, or undefined. */
function findJson<T>(suffix: string): T | undefined {
  const key = Object.keys(JSON_MODULES).find((k) => k.endsWith(suffix));
  return key ? (JSON_MODULES[key] as T) : undefined;
}

/** The directory immediately under `courses/` for a glob key. */
function courseDirOf(path: string): string {
  const m = path.match(/\/courses\/([^/]+)\//);
  return m ? m[1] : "";
}

function assertFrontmatter(
  path: string,
  fm: (BaseBlockFrontmatter & { data?: BlockData }) | undefined,
): BaseBlockFrontmatter & { data?: BlockData } {
  if (!fm) {
    throw new Error(`Course block ${path} is missing frontmatter`);
  }
  const required: (keyof BaseBlockFrontmatter)[] = [
    "id",
    "type",
    "order",
    "weight",
    "xp",
    "completion",
  ];
  for (const key of required) {
    if (fm[key] == null) {
      throw new Error(`Course block ${path} is missing frontmatter.${key}`);
    }
  }
  return { ...fm, required: fm.required ?? true };
}

function buildLesson(
  courseDir: string,
  chapterId: string,
  chapterDir: string,
  lessonDir: string,
  raw: RawLesson,
): Lesson {
  const base = `/${courseDir}/chapters/${chapterDir}/lessons/${lessonDir}`;
  const blocks: CourseBlock[] = raw.blocks.map(({ file }) => {
    const suffix = `${base}/${file}`;
    const key = Object.keys(BLOCK_MODULES).find((k) => k.endsWith(suffix));
    if (!key) {
      throw new Error(`Course block file not found on disk: ...${suffix}`);
    }
    const mod = BLOCK_MODULES[key];
    const fm = assertFrontmatter(suffix, mod.frontmatter);
    return { ...fm, Component: mod.default };
  });
  blocks.sort((a, b) => a.order - b.order);

  const totalWeight = blocks.reduce((sum, b) => sum + b.weight, 0);
  const totalXP = blocks.reduce((sum, b) => sum + b.xp, 0);
  if (isDev) {
    if (raw.totalWeight != null && raw.totalWeight !== totalWeight) {
      console.warn(
        `[course] ${raw.id}: lesson.json totalWeight ${raw.totalWeight} ≠ derived ${totalWeight}`,
      );
    }
    if (raw.totalXP != null && raw.totalXP !== totalXP) {
      console.warn(
        `[course] ${raw.id}: lesson.json totalXP ${raw.totalXP} ≠ derived ${totalXP}`,
      );
    }
  }

  return {
    id: raw.id,
    dir: lessonDir,
    slug: lessonDir,
    title: raw.title,
    objective: raw.objective,
    estimatedMinutes: raw.estimatedMinutes,
    totalXP,
    totalWeight,
    blocks,
    chapterId,
    chapterSlug: chapterDir,
  };
}

function buildChapter(
  courseDir: string,
  chapterDir: string,
  raw: RawChapter,
): Chapter {
  const lessons: Lesson[] = [];
  for (const { dir } of raw.lessons) {
    const lsRaw = findJson<RawLesson>(
      `/${courseDir}/chapters/${chapterDir}/lessons/${dir}/lesson.json`,
    );
    if (!lsRaw) continue; // roadmap entry, not yet authored — skip
    lessons.push(buildLesson(courseDir, raw.id, chapterDir, dir, lsRaw));
  }
  return {
    id: raw.id,
    dir: chapterDir,
    slug: chapterDir,
    title: raw.title,
    description: raw.description,
    outcomes: raw.outcomes ?? [],
    badgeId: raw.badgeId,
    badgeThreshold: raw.badgeThreshold,
    totalXP: raw.totalXP,
    lessons,
  };
}

function buildUnits(raw: RawCourse, chapters: Chapter[]): Unit[] {
  if (raw.units && raw.units.length > 0) {
    // Filter to chapterIds we actually built (drop roadmap-only refs silently).
    const builtIds = new Set(chapters.map((c) => c.id));
    return raw.units
      .map((u) => ({
        id: u.id,
        title: u.title,
        theme: u.theme,
        chapterIds: u.chapterIds.filter((id) => builtIds.has(id)),
        checkpoint: u.checkpoint ?? undefined,
      }))
      .filter((u) => u.chapterIds.length > 0);
  }
  // Backwards-compat: one default unit holding every built chapter.
  return [
    {
      id: "unit-default",
      title: raw.title,
      theme: "kenya-green",
      chapterIds: chapters.map((c) => c.id),
      checkpoint: undefined,
    },
  ];
}

function buildCourse(courseDir: string, raw: RawCourse): Course {
  const chapters: Chapter[] = [];
  for (const { dir } of raw.chapters) {
    const chRaw = findJson<RawChapter>(
      `/${courseDir}/chapters/${dir}/chapter.json`,
    );
    if (!chRaw) continue; // roadmap entry, not yet authored — skip
    chapters.push(buildChapter(courseDir, dir, chRaw));
  }
  return {
    id: raw.id,
    slug: courseDir,
    title: raw.title,
    tagline: raw.tagline,
    version: raw.version,
    locale: raw.locale,
    totalXP: raw.totalXP,
    passMark: raw.passMark,
    chapters,
    units: buildUnits(raw, chapters),
  };
}

const COURSES: Course[] = Object.entries(JSON_MODULES)
  .filter(([key]) => key.endsWith("/course.json"))
  .map(([path, raw]) => buildCourse(courseDirOf(path), raw as RawCourse));

const BY_SLUG = new Map(COURSES.map((c) => [c.slug, c]));

// ---- public API ----

export function getAllCourses(): Course[] {
  return COURSES;
}

export function getCourse(slug: string): Course | undefined {
  return BY_SLUG.get(slug);
}

export function getLesson(
  courseSlug: string,
  chapterSlug: string,
  lessonSlug: string,
): Lesson | undefined {
  const chapter = BY_SLUG.get(courseSlug)?.chapters.find(
    (c) => c.slug === chapterSlug,
  );
  return chapter?.lessons.find((l) => l.slug === lessonSlug);
}

// ---- serialisation across the loader boundary (MDX Component can't ride along) ----

export function serialiseBlock(b: CourseBlock): SerialisedBlock {
  const { Component: _omit, ...rest } = b;
  return rest;
}

export function serialiseLesson(l: Lesson): SerialisedLesson {
  return { ...l, blocks: l.blocks.map(serialiseBlock) };
}

/** Course tree with every block's MDX Component stripped (for `loader` returns). */
export function serialiseCourse(c: Course) {
  return {
    ...c,
    chapters: c.chapters.map((ch) => ({
      ...ch,
      lessons: ch.lessons.map(serialiseLesson),
    })),
    // Units already store `chapterIds` (strings), so they ride the loader
    // boundary verbatim.
    units: c.units,
  };
}
