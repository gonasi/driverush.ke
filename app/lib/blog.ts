/**
 * Blog manifest. Reads every `*.mdx` file under `app/blogs/` via Vite's
 * `import.meta.glob` (`eager: true`), validates each file's frontmatter and
 * returns a typed, date-sorted list of posts.
 *
 * - Each post's `default` export is the MDX component for `<post.Component />`.
 * - The slug is sourced from frontmatter; we fall back to the filename so a
 *   missing slug field is loud, not silent.
 * - Sort order is reverse chronological by `date` (most recent first).
 */
import type { ComponentType } from "react";

export type BlogTone =
  | "practical"
  | "listicle"
  | "explainer"
  | "candid"
  | "essay"
  | "first-person"
  | "literary"
  | "service-piece"
  | "tactical"
  | "observational";

export type BlogCategory =
  | "NTSA"
  | "Road signs"
  | "Driving in Kenya"
  | "Licensing"
  | "Skills";

/** A single FAQ pair, surfaced as visible content + FAQPage JSON-LD. */
export type BlogFaq = { q: string; a: string };

export type BlogFrontmatter = {
  title: string;
  description: string;
  slug: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  readingMinutes: number;
  tone: BlogTone;
  category: BlogCategory;
  /** Short tags for related-post matching. */
  tags: string[];
  /** One-line standfirst shown under the title. */
  lede: string;
  /** Optional kicker, e.g. "Issue № 03 · Licensing". */
  kicker?: string;
  /**
   * Optional FAQ block. When present, the post route emits `FAQPage` JSON-LD
   * referencing these pairs. The post body must render the same questions and
   * answers visibly (Google requires schema and DOM content to match) — keep
   * an `<Accordion>` of `<AccordionItem>`s near the bottom of the MDX.
   */
  faq?: BlogFaq[];
};

export type BlogPost = BlogFrontmatter & {
  Component: ComponentType;
};

type MdxModule = {
  default: ComponentType;
  frontmatter?: Partial<BlogFrontmatter>;
};

// `eager: true` is required so we can read frontmatter at module load time —
// every blog post ships in the same bundle. With ~10 short posts this is a
// few KB of JS; if the list grows past a few dozen we'd swap to async glob
// + a slug → loader map.
const MODULES = import.meta.glob<MdxModule>("../blogs/*.mdx", { eager: true });

function pathToFallbackSlug(path: string) {
  return path
    .replace(/^.*\//, "")
    .replace(/\.mdx$/, "")
    .toLowerCase();
}

function assertFrontmatter(
  path: string,
  fm: Partial<BlogFrontmatter> | undefined,
): BlogFrontmatter {
  if (!fm) {
    throw new Error(`Blog post ${path} is missing frontmatter`);
  }
  const required: (keyof BlogFrontmatter)[] = [
    "title",
    "description",
    "date",
    "readingMinutes",
    "tone",
    "category",
    "lede",
  ];
  for (const key of required) {
    if (fm[key] == null) {
      throw new Error(`Blog post ${path} is missing frontmatter.${key}`);
    }
  }
  return {
    ...fm,
    slug: fm.slug ?? pathToFallbackSlug(path),
    tags: fm.tags ?? [],
  } as BlogFrontmatter;
}

const ALL: BlogPost[] = Object.entries(MODULES)
  .map(([path, mod]) => ({
    ...assertFrontmatter(path, mod.frontmatter),
    Component: mod.default,
  }))
  .sort((a, b) => (a.date < b.date ? 1 : -1));

/** All posts, newest first. */
export function getAllPosts(): BlogPost[] {
  return ALL;
}

/** Resolve a single post by its slug, or `undefined` if unknown. */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return ALL.find((p) => p.slug === slug);
}

/**
 * Picks up to `limit` related posts by tag overlap, breaking ties by recency.
 * Excludes the source post itself. If nothing shares a tag, returns the next
 * most recent posts so the related strip is never empty.
 */
export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const source = getPostBySlug(slug);
  if (!source) return ALL.slice(0, limit);

  const scored = ALL.filter((p) => p.slug !== slug).map((p) => {
    const overlap = p.tags.filter((t) => source.tags.includes(t)).length;
    return { post: p, score: overlap };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.post.date < b.post.date ? 1 : -1;
  });

  return scored.slice(0, limit).map((s) => s.post);
}

/** Site-wide blog keywords appended to meta on every blog page. */
export const BLOG_KEYWORDS = [
  "NTSA blog",
  "learning to drive in Kenya",
  "Kenya driving tips",
  "Kenyan road signs explained",
  "Nairobi driving",
  "driving licence Kenya",
  "NTSA test tips",
] as const;
