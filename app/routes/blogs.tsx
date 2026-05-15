import * as React from "react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02FreeIcons,
  Menu01FreeIcons,
  TrafficLightFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/blogs";

import { absUrl, breadcrumbLd, keywords, SITE } from "~/lib/site";
import { BLOG_KEYWORDS, getAllPosts } from "~/lib/blog";
import { variants } from "~/lib/motion";
import { isNavLinkActive } from "~/lib/nav";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetTrigger,
} from "~/components/ui/sheet";

import { AppBar, AppBarLink } from "~/components/brand/app-bar";
import { BlogCard } from "~/components/brand/blog-card";
import { Logo } from "~/components/brand/logo";
import { Masthead } from "~/components/brand/masthead";
import { PoweredByGonasi } from "~/components/brand/powered-by-gonasi";
import { Rail } from "~/components/brand/rail";

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

const NAV_LINKS = [
  { label: "Courses", href: "/courses" },
  { label: "Practice", href: "/practice" },
  { label: "Signs", href: "/road-signs" },
  { label: "Blog", href: "/blogs" },
];

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

function SiteNav() {
  const { pathname, search } = useLocation();
  return (
    <AppBar
      nav={NAV_LINKS.map((l) => (
        <AppBarLink
          key={l.href}
          asChild
          active={isNavLinkActive(l.href, pathname, search)}
        >
          <Link to={l.href}>{l.label}</Link>
        </AppBarLink>
      ))}
      trailing={
        <>
          <Button variant="rush" size="sm" asChild>
            <Link to="/courses">
              <span className="hidden sm:inline">Browse courses</span>
              <span className="sm:hidden">Courses</span>
              <HugeiconsIcon
                icon={ArrowRight02FreeIcons}
                size={14}
                strokeWidth={2.5}
              />
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="paper"
                size="sm"
                aria-label="Open menu"
                className="md:hidden"
              >
                <HugeiconsIcon
                  icon={Menu01FreeIcons}
                  size={16}
                  strokeWidth={2.5}
                />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <SheetBody>
                <nav className="grid gap-3">
                  <SheetClose asChild>
                    <Link
                      to="/courses"
                      className="flex items-center justify-between gap-3 border-2 border-ink bg-rush px-4 py-3 font-display text-[13px] font-bold uppercase tracking-wider text-white shadow-stamp-sm"
                    >
                      Courses
                      <HugeiconsIcon
                        icon={ArrowRight02FreeIcons}
                        size={14}
                        strokeWidth={2.5}
                      />
                    </Link>
                  </SheetClose>
                  {NAV_LINKS.filter((l) => l.href !== "/courses").map((l) => (
                    <SheetClose asChild key={l.href}>
                      <Link
                        to={l.href}
                        className="border-2 border-ink bg-surface px-4 py-3 font-display text-[13px] font-bold uppercase tracking-wider text-ink shadow-stamp-sm hover:bg-paper-3"
                      >
                        {l.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </>
      }
    />
  );
}

function SiteFooter() {
  return (
    <footer className="border-t-4 border-double border-ink bg-ink py-12 text-paper">
      <Container>
        <div className="grid gap-6 border-b border-paper/20 pb-7 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo variant="plain" height={56} knockout />
            <p className="mt-4 max-w-sm font-serif text-base leading-snug opacity-80">
              Full driving courses and NTSA practice, built for Kenyan roads.
            </p>
          </div>
          <FooterCol
            heading="Practice"
            items={[
              { label: "Pelican trainer", href: "/road-signs/pelican" },
              { label: "3D sign recognition", href: "/road-signs/3d" },
              { label: "Quick test", href: "/practice?mode=test" },
              { label: "All road signs", href: "/road-signs" },
            ]}
          />
          <FooterCol
            heading="More"
            items={[
              { label: "Home", href: "/" },
              { label: "Courses", href: "/courses" },
              { label: "All blog posts", href: "/blogs" },
            ]}
          />
        </div>
        <div className="flex flex-col items-start gap-5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <PoweredByGonasi
            variant="lockup"
            tone="on-dark"
            utmMedium="blog_footer"
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-widest opacity-60">
            <span>© 2026 DriveRush.ke</span>
            <span aria-hidden>·</span>
            <span>Learn · Drive · Succeed</span>
            <span aria-hidden>·</span>
            <span>Nairobi · KE</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({
  heading,
  items,
}: {
  heading: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="m-0 mb-3 font-mono text-[11px] font-bold uppercase tracking-widest opacity-70">
        {heading}
      </h3>
      <ul className="m-0 list-none p-0">
        {items.map((it) => (
          <li key={it.href} className="mb-1.5 last:mb-0">
            <Link
              to={it.href}
              className="font-serif text-base text-paper opacity-90 hover:opacity-100 hover:underline"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
