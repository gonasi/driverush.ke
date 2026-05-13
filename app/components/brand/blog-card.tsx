import * as React from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02FreeIcons } from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils";
import type { BlogPost } from "~/lib/blog";

type BlogCardProps = React.ComponentProps<"article"> & {
  post: BlogPost;
  /** Compact layout for the related-posts strip. */
  compact?: boolean;
};

/**
 * Newspaper-style post card. Top stub shows category + date, then the title,
 * the lede, and a footer with tone + reading time. Clicks anywhere on the
 * card route to the post — a screen-reader-only "Read" link sits on top so
 * the anchor target is announced clearly.
 */
function BlogCard({ post, compact, className, ...props }: BlogCardProps) {
  return (
    // `h-full` lets the card fill its grid cell; `line-clamp` on the title
    // and lede caps content height so adjacent cards stay the same size
    // regardless of how long the source frontmatter is. `mt-auto` pins the
    // footer to the bottom of the card no matter how short the body is.
    <article
      data-slot="blog-card"
      className={cn(
        "group relative flex h-full flex-col border-2 border-ink bg-surface transition hover:bg-paper-2 focus-within:bg-paper-2",
        compact ? "p-5" : "p-6 sm:p-7",
        className,
      )}
      {...props}
    >
      <div className="mb-4 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        <span className="bg-ink px-2 py-0.5 font-bold text-paper">
          {post.category}
        </span>
        <time dateTime={post.date}>{formatDate(post.date)}</time>
      </div>

      <h3
        className={cn(
          "m-0 mb-3 font-display font-extrabold uppercase leading-[1.05] tracking-tight text-ink",
          compact
            ? "text-lg line-clamp-3"
            : "text-2xl sm:text-[26px] line-clamp-2",
          "[&_em]:font-serif [&_em]:font-normal [&_em]:normal-case [&_em]:italic [&_em]:text-rush",
        )}
      >
        <Link
          to={`/blogs/${post.slug}`}
          className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:[&_::after]:outline focus-visible:[&_::after]:outline-2 focus-visible:[&_::after]:outline-rush"
        >
          {post.title}
        </Link>
      </h3>

      <p
        className={cn(
          "m-0 font-serif leading-snug text-ink-2 line-clamp-3",
          compact ? "text-sm" : "text-base",
        )}
      >
        {post.lede}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-dashed border-ink pt-4 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        <span>{post.readingMinutes} min read</span>
        <span className="inline-flex items-center gap-1.5 text-rush group-hover:gap-2 transition-[gap]">
          Read
          <HugeiconsIcon
            icon={ArrowRight02FreeIcons}
            size={12}
            strokeWidth={2.5}
          />
        </span>
      </div>
    </article>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export { BlogCard, formatDate };
