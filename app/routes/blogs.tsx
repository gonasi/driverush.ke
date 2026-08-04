import * as React from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02FreeIcons,
  TrafficLightFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/blogs";

import { absUrl, breadcrumbLd, keywords, SITE } from "~/lib/site";
import { BLOG_KEYWORDS, getAllPosts } from "~/lib/blog";
import { variants } from "~/lib/motion";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

import { BlogCard } from "~/components/brand/blog-card";
import { Masthead } from "~/components/brand/masthead";
import { Rail } from "~/components/brand/rail";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";

const PATH = "/blogs";

// `meta()` runs on every request — keep it self-contained so the static
// import-cost of the posts list (~10 frontmatters) is the only work.
export function meta(_: Route.MetaArgs) {
  const title =
    "DriveRush Blog · NTSA, road signs and learning to drive in Kenya";
  const description =
    "Honest, practical writing on the NTSA test, Kenyan road signs, getting your driving licence, and surviving Nairobi traffic, from the team behind DriveRush.";
  const url = absUrl(PATH);
  const ogImage = absUrl(SITE.ogImage);
  const posts = getAllPosts();

  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords(...BLOG_KEYWORDS) },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: "website" },
    { property: "og:image", content: ogImage },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    {
      "script:ld+json": breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Blog", url: PATH },
      ]),
    },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: `${SITE.name} Blog`,
        url: absUrl(PATH),
        description,
        inLanguage: SITE.lang,
        publisher: {
          "@type": "Organization",
          name: SITE.name,
          url: SITE.url,
          logo: { "@type": "ImageObject", url: absUrl(SITE.ogImage) },
        },
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          description: p.description,
          datePublished: p.date,
          dateModified: p.date,
          url: absUrl(`${PATH}/${p.slug}`),
          author: { "@type": "Organization", name: SITE.name },
          mainEntityOfPage: absUrl(`${PATH}/${p.slug}`),
          keywords: p.tags.join(", "),
        })),
      },
    },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${SITE.name} Blog posts`,
        itemListElement: posts.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: absUrl(`${PATH}/${p.slug}`),
          name: p.title,
        })),
      },
    },
  ];
}

const VIEWPORT = { once: true, margin: "-60px" } as const;

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-6xl px-5 sm:px-9">{children}</div>
);

export default function BlogsIndex() {
  const posts = getAllPosts();
  const [hero, ...rest] = posts;

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-paper text-ink">
        <Rail />

        <Container>
          <div className="pt-6 sm:pt-10">
            <Masthead
              kicker={`Issue · ${posts.length} dispatches`}
              stamp="★ DRIVERUSH · BLOG ★"
              dateline="Nairobi · Kenya"
              title={
                <>
                  Drive<em>Rush</em> Dispatch
                </>
              }
              leftCol="From the editors"
              centerLede={
                <>
                  Honest, practical writing on the <em>NTSA test</em>, Kenyan
                  road signs, and the long road from L-plate to <em>licence</em>
                  .
                </>
              }
              rightCol="Updated weekly"
            />
          </div>

          {/* Featured hero post — first one in date order. */}
          {hero && (
            <section className="border-b-2 border-ink py-10">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <Badge variant="rush">★ Featured · just in</Badge>
                <Badge variant="ink">{hero.category}</Badge>
              </div>

              <div className="grid items-end gap-6 md:grid-cols-[2fr_1fr]">
                <div>
                  <h2
                    className={[
                      "m-0 font-display font-extrabold uppercase leading-[0.92] tracking-tight text-ink",
                      "text-[clamp(36px,6vw,64px)]",
                      "[&_em]:font-serif [&_em]:font-normal [&_em]:normal-case [&_em]:italic [&_em]:text-rush",
                    ].join(" ")}
                  >
                    <Link
                      to={`/blogs/${hero.slug}`}
                      className="outline-none hover:[&>span]:underline focus-visible:[&>span]:underline"
                    >
                      <span>{hero.title}</span>
                    </Link>
                  </h2>
                  <p className="mt-5 font-serif text-[clamp(17px,2.2vw,22px)] leading-snug text-ink-2">
                    {hero.lede}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button variant="rush" size="lg" asChild>
                      <Link to={`/blogs/${hero.slug}`}>
                        Read it
                        <HugeiconsIcon
                          icon={ArrowRight02FreeIcons}
                          size={16}
                          strokeWidth={2.5}
                        />
                      </Link>
                    </Button>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                      {hero.readingMinutes} min read · By DriveRush editors
                    </span>
                  </div>
                </div>

                <aside className="border-l-2 border-dashed border-ink pl-5">
                  <p className="m-0 mb-3 font-mono text-[11px] uppercase tracking-widest text-ink-3">
                    Why we wrote this →
                  </p>
                  <p className="m-0 font-serif text-base leading-snug text-ink-2">
                    {hero.description}
                  </p>
                  <p className="mt-4 font-mono text-[10.5px] uppercase tracking-widest text-rush">
                    Tone: {hero.tone}
                  </p>
                </aside>
              </div>
            </section>
          )}

          {/* The rest as a grid. */}
          <section className="py-12">
            <div className="mb-6 flex items-baseline justify-between border-b-2 border-ink pb-3">
              <h2 className="m-0 font-display text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-3xl">
                More from the editors
              </h2>
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                {rest.length} more
              </span>
            </div>

            <motion.div
              className="grid gap-5 sm:grid-cols-2 sm:auto-rows-fr lg:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              variants={variants.staggerList}
            >
              {rest.map((p) => (
                <motion.div
                  key={p.slug}
                  variants={variants.fadeUp}
                  className="h-full"
                >
                  <BlogCard post={p} />
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* Outbound CTA strip — keep the live product within one click. */}
          <section className="mb-14 border-2 border-ink bg-ink p-6 text-paper sm:p-8">
            <p className="m-0 mb-2 font-mono text-[11px] uppercase tracking-widest opacity-70">
              The reading is great. The practice is greater.
            </p>
            <h2 className="m-0 mb-4 font-display text-2xl font-extrabold uppercase leading-[0.98] tracking-tight sm:text-3xl">
              Try the live <span className="italic text-rush">games</span> the
              blog keeps pointing at.
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
                <Link to="/road-signs/3d">3D sign recognition</Link>
              </Button>
              <Button variant="paper" size="lg" asChild>
                <Link to="/practice?mode=test">Quick NTSA test</Link>
              </Button>
            </div>
          </section>
        </Container>

        <SiteFooter />
      </main>
    </>
  );
}
