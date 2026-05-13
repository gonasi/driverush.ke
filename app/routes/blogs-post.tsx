import { Link, isRouteErrorResponse, useRouteError } from "react-router";

import type { Route } from "./+types/blogs-post";

import {
  absUrl,
  breadcrumbLd,
  faqPageLd,
  keywords,
  pageTitle,
  SITE,
} from "~/lib/site";
import {
  BLOG_KEYWORDS,
  getPostBySlug,
  getRelatedPosts,
  type BlogPost,
} from "~/lib/blog";

import { BlogPostLayout } from "~/components/brand/blog-post-layout";
import { Button } from "~/components/ui/button";
import { Rail } from "~/components/brand/rail";

/**
 * Loader runs on the server (and on client navigations). It resolves the post
 * by slug, throws a 404 Response if unknown, and hands the route component a
 * plain object the renderer can use. The MDX component itself can't be
 * serialised across the loader boundary, so we resolve it again inside the
 * component using the same slug — both calls hit the in-memory manifest.
 */
export async function loader({ params }: Route.LoaderArgs) {
  const post = getPostBySlug(params.slug);
  if (!post) {
    throw new Response("Not found", { status: 404 });
  }
  const related = getRelatedPosts(post.slug, 3);
  return {
    post: serialisePost(post),
    related: related.map(serialisePost),
  };
}

function serialisePost(p: BlogPost) {
  const { Component: _Component, ...rest } = p;
  return rest;
}

export function meta({ data, params }: Route.MetaArgs) {
  if (!data) {
    // 404 path — give the page a clean, non-indexable head.
    return [
      { title: "Post not found · DriveRush Blog" },
      { name: "robots", content: "noindex, follow" },
    ];
  }
  const { post } = data;
  const url = absUrl(`/blogs/${post.slug}`);
  const ogImage = absUrl(SITE.ogImage);
  // Brand suffix on the SERP title only — the OG/Twitter title keeps the
  // editorial wording clean (post titles often already contain "Kenya" or
  // "NTSA", so an extra suffix in social cards would look spammy).
  const title = pageTitle(post.title);

  return [
    { title },
    { name: "description", content: post.description },
    {
      name: "keywords",
      content: keywords(...post.tags, ...BLOG_KEYWORDS),
    },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: post.title },
    { property: "og:description", content: post.description },
    { property: "og:url", content: url },
    { property: "og:type", content: "article" },
    { property: "og:image", content: ogImage },
    { property: "article:published_time", content: post.date },
    { property: "article:modified_time", content: post.date },
    { property: "article:section", content: post.category },
    ...post.tags.map((t) => ({ property: "article:tag", content: t })),
    { name: "twitter:title", content: post.title },
    { name: "twitter:description", content: post.description },
    { name: "twitter:image", content: ogImage },
    {
      "script:ld+json": breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Blog", url: "/blogs" },
        { name: post.title, url: `/blogs/${post.slug}` },
      ]),
    },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.date,
        url,
        inLanguage: SITE.lang,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        author: {
          "@type": "Organization",
          name: SITE.name,
          url: SITE.url,
        },
        publisher: {
          "@type": "Organization",
          name: SITE.name,
          url: SITE.url,
          logo: { "@type": "ImageObject", url: ogImage },
        },
        image: [ogImage],
        keywords: [...post.tags, ...BLOG_KEYWORDS].join(", "),
        articleSection: post.category,
        wordCount: post.readingMinutes * 220,
      },
    },
    // FAQPage rich-result eligibility for cornerstone posts that ship a
    // matching <Accordion> in the body. Guarded — most posts have no `faq`
    // frontmatter, so this is a no-op.
    ...(post.faq && post.faq.length > 0
      ? [{ "script:ld+json": faqPageLd(post.faq) }]
      : []),
  ];
}

export default function BlogPostRoute({ params }: Route.ComponentProps) {
  // The post component lives in the in-memory manifest; resolve it here since
  // it can't ride along on the loader's serialisable response.
  const post = getPostBySlug(params.slug);
  if (!post) {
    return <PostMissing />;
  }
  const related = getRelatedPosts(post.slug, 3);
  const PostBody = post.Component;
  return (
    <BlogPostLayout post={post} related={related}>
      <PostBody />
    </BlogPostLayout>
  );
}

function PostMissing() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Rail />
      <div className="mx-auto w-full max-w-2xl px-5 py-24 text-center sm:px-9">
        <p className="m-0 mb-3 font-mono text-[11px] uppercase tracking-widest text-ink-3">
          404 · post not found
        </p>
        <h1 className="m-0 mb-5 font-display text-4xl font-extrabold uppercase tracking-tight text-ink sm:text-5xl">
          That post has moved on.
        </h1>
        <p className="m-0 mb-7 font-serif text-lg leading-snug text-ink-2">
          Back to the dispatch desk. Plenty more to read.
        </p>
        <Button variant="rush" size="lg" asChild>
          <Link to="/blogs">All blog posts</Link>
        </Button>
      </div>
    </main>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <PostMissing />;
  }
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
        Something went sideways
      </h1>
      <p className="mt-3 font-serif text-ink-2">
        We hit an unexpected error rendering this post.
      </p>
    </main>
  );
}
