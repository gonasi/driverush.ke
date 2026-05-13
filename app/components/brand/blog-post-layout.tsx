import * as React from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  TrafficLightFreeIcons,
} from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils";
import type { BlogPost } from "~/lib/blog";
import { Rail } from "~/components/brand/rail";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { BlogCard, formatDate } from "~/components/brand/blog-card";

type BlogPostLayoutProps = {
  post: BlogPost;
  related: BlogPost[];
  children: React.ReactNode;
};

/**
 * Chrome around the rendered MDX body — top breadcrumb, masthead-style header
 * with kicker / title / lede / byline, a constrained reading column for the
 * post body, then a related-posts strip and a CTA tail. The MDX content is
 * the `children`; everything else lives here.
 */
export function BlogPostLayout({
  post,
  related,
  children,
}: BlogPostLayoutProps) {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Rail />

      <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-6 sm:px-9 sm:pt-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-3 outline-none hover:text-ink focus-visible:text-ink"
          >
            <HugeiconsIcon
              icon={ArrowLeft02FreeIcons}
              size={14}
              strokeWidth={2.5}
            />
            All posts
          </Link>
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Blog · {post.category}
          </span>
        </div>

        <header className="border-b-2 border-ink pb-8">
          <div className="flex items-baseline justify-between border-b border-dashed border-ink pb-2.5 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            <span>{post.kicker ?? `${post.category} · ${post.tone}`}</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </div>

          <h1
            className={cn(
              "m-0 mt-6 font-display font-extrabold uppercase leading-[0.92] tracking-tight text-ink",
              "text-[clamp(36px,7vw,72px)]",
              "[&_em]:font-serif [&_em]:font-normal [&_em]:normal-case [&_em]:italic [&_em]:text-rush",
            )}
          >
            {post.title}
          </h1>

          <p className="mt-5 font-serif text-[clamp(17px,2.2vw,22px)] leading-snug text-ink-2">
            {post.lede}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            <span>{post.readingMinutes} min read</span>
            <span aria-hidden>·</span>
            <span>By DriveRush editors</span>
            {post.tags.length > 0 && (
              <>
                <span aria-hidden>·</span>
                <span className="flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map((t) => (
                    <Badge key={t} variant="outline" className="lowercase">
                      {t}
                    </Badge>
                  ))}
                </span>
              </>
            )}
          </div>
        </header>

        <article className="pt-8 pb-12">{children}</article>

        {/* CTA tail — keep nudging readers toward the live product. */}
        <section className="border-t-2 border-ink bg-paper-2 px-5 py-8 sm:px-7">
          <p className="m-0 mb-4 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Skip the theory. Practise the signs.
          </p>
          <h2 className="m-0 mb-5 font-display text-2xl font-extrabold uppercase leading-[0.98] tracking-tight text-ink sm:text-3xl">
            The fastest way to remember Kenyan road signs is{" "}
            <em className="font-serif font-normal normal-case italic text-rush">
              to play with them
            </em>
            .
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="rush" size="lg" asChild>
              <Link to="/road-signs/pelican">
                <HugeiconsIcon
                  icon={TrafficLightFreeIcons}
                  size={18}
                  strokeWidth={2.25}
                />
                Train with Pelican
              </Link>
            </Button>
            <Button variant="paper" size="lg" asChild>
              <Link to="/practice?mode=test">
                Try a quick NTSA test
                <HugeiconsIcon
                  icon={ArrowRight02FreeIcons}
                  size={16}
                  strokeWidth={2.5}
                />
              </Link>
            </Button>
            <Button variant="paper" size="lg" asChild>
              <Link to="/courses">Browse the full courses</Link>
            </Button>
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-14">
            <div className="mb-5 flex items-baseline justify-between border-b-2 border-ink pb-3">
              <h2 className="m-0 font-display text-xl font-extrabold uppercase tracking-tight text-ink sm:text-2xl">
                Keep reading
              </h2>
              <Link
                to="/blogs"
                className="font-mono text-[11px] uppercase tracking-widest text-rush hover:underline"
              >
                All posts →
              </Link>
            </div>
            <div className="grid gap-4 sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <BlogCard key={p.slug} post={p} compact />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
