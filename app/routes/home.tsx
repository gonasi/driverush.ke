import * as React from "react";
import { Link, useLocation } from "react-router";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowRight02FreeIcons,
  ArrowUpRight01FreeIcons,
  Menu01FreeIcons,
  PlayCircleFreeIcons,
  TimeQuarterFreeIcons,
  TrafficLightFreeIcons,
  AwardFreeIcons,
  Tick02FreeIcons,
  RefreshFreeIcons,
  Fire02FreeIcons,
  CarFreeIcons,
  Motorbike01FreeIcons,
  DeliveryTruck01FreeIcons,
  BusFreeIcons,
  ChartIncreaseFreeIcons,
  SmartPhone01FreeIcons,
  WifiOffFreeIcons,
  Mortarboard01FreeIcons,
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";

import type { Route } from "./+types/home";

import { absUrl, organizationLd, pageTitle, SITE, websiteLd } from "~/lib/site";
import { getTodaysQuestion } from "~/lib/questions";
import { COURSES, type Course, type CourseAccent } from "~/lib/courses";
import { PARTNERS, type Partner } from "~/lib/partners";
import { SIGN_GAMES } from "~/lib/road-signs";
import { variants } from "~/lib/motion";
import { analytics } from "~/lib/analytics";
import { isNavLinkActive } from "~/lib/nav";
import { addUtm, utmSlug } from "~/lib/utm";

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

import { Accordion, AccordionItem } from "~/components/brand/accordion";
import { AppBar, AppBarLink } from "~/components/brand/app-bar";
import { BoardingCard } from "~/components/brand/boarding-card";
import { ChoiceCard } from "~/components/brand/choice-card";
import { FeedbackBanner } from "~/components/brand/feedback-banner";
import { Logo } from "~/components/brand/logo";
import { QuickAction } from "~/components/brand/quick-action";
import { Rail } from "~/components/brand/rail";
import { SignGameCard } from "~/components/brand/sign-game-card";
import { TicketCard } from "~/components/brand/ticket-card";
import { TrafficLoader } from "~/components/brand/traffic-loader";

/**
 * Common questions surfaced as FAQPage JSON-LD for the answer-box / SGE. Kept
 * here (not in a separate data file) because they only appear in the home
 * `<head>` — moving them would split editorial copy across two places.
 */
const HOME_FAQ = [
  {
    q: "How do I learn to drive in Kenya?",
    a: "Start with the road signs and the NTSA highway code, then move to junction scenarios and timed mock exams. DriveRush walks you through it in order — free road-sign games, the classic NTSA quiz and full Class A, B, C, D courses, online, no signup to start.",
  },
  {
    q: "What is the NTSA test and how do I pass it?",
    a: "The NTSA test is Kenya's official driving theory exam — multiple-choice on road signs, road markings, right of way and basic mechanical knowledge. Pass it by drilling past papers under time pressure and memorising the Kenyan road signs cold. DriveRush bundles both into one practice flow.",
  },
  {
    q: "Can I learn to drive online in Kenya?",
    a: "Yes. The NTSA theory test is sat in person, but everything that prepares you for it — road signs, past papers, junction scenarios, the highway code — works online. DriveRush is the online driving school built for Kenyan roads and pays through M-Pesa when you upgrade.",
  },
  {
    q: "How much does a driving school in Kenya cost?",
    a: "Traditional driving schools in Kenya run roughly KES 8,000–20,000 for the theory + practical package, on top of NTSA fees, with price bands that vary by school and county. The DriveRush directory of driving schools in Kenya compares the major NTSA-registered ones (AA Kenya, Petanns, Glory, Better Brakes, Sunset and Eagle) side by side. Splitting online theory from in-person practical typically saves KES 4,000–7,000 — DriveRush's online theory practice is free.",
  },
  {
    q: "What are the Kenyan road signs and what do they mean?",
    a: "Kenyan road signs follow the NTSA highway code: red triangles warn, red rings and the red octagon forbid, blue circles command, and rectangles inform. DriveRush has the full set with meanings at /road-signs and two recall games that drill them until naming a sign is instant.",
  },
  {
    q: "What's the difference between Class A, B, C and D licences?",
    a: "Class A is motorbikes, Class B is light vehicles (cars), Class C is light goods vehicles and Class D is public service vehicles (matatus, buses). Each class has its own theory and practical test. DriveRush has a full course for each.",
  },
];

export function meta(_: Route.MetaArgs) {
  const title = pageTitle(
    "Learn to drive in Kenya online — NTSA prep & road signs",
  );
  const description =
    "DriveRush is the online driving school for Kenya. NTSA-aligned road signs, past papers, junction scenarios and full Class A, B, C, D courses. Free to start, no signup, pay with M-Pesa when ready.";
  const url = absUrl("/");
  const ogImage = absUrl(SITE.ogImage);

  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: SITE.keywords.join(", ") },
    { name: "application-name", content: SITE.name },
    { name: "apple-mobile-web-app-title", content: SITE.name },
    { name: "author", content: SITE.name },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: String(SITE.ogImageWidth) },
    { property: "og:image:height", content: String(SITE.ogImageHeight) },
    { property: "og:image:alt", content: `${SITE.name} logo` },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    { name: "twitter:image:alt", content: `${SITE.name} logo` },
    // All home-page entities ship in a single @graph so there's exactly one
    // FAQPage on the page (Google's parser was flagging two FAQPage items —
    // one from JSON-LD and one auto-detected from the visible accordion — as
    // "Duplicate field 'FAQPage'"). Single @graph is also the Schema.org-
    // recommended pattern when entities cross-reference each other by @id.
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@graph": [
          stripContext(organizationLd()),
          stripContext(websiteLd()),
          {
            "@type": "FAQPage",
            "@id": `${url}#faq`,
            mainEntity: HOME_FAQ.map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          },
          ...COURSES.map((c) => ({
            "@type": "Course",
            name: c.title,
            description: c.blurb,
            url: absUrl("/courses"),
            inLanguage: ["en", "sw"],
            provider: { "@id": `${SITE.url}#organization` },
          })),
        ],
      },
    },
  ];
}

function stripContext<T extends { "@context"?: unknown }>(
  obj: T,
): Omit<T, "@context"> {
  const { "@context": _ctx, ...rest } = obj;
  return rest;
}

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-6xl px-5 sm:px-9">{children}</div>
);

// Default viewport options for whileInView. once:true means each section
// animates exactly once. -60px margin starts the animation while the section
// is still slightly below the fold so the user perceives it as already there.
const VIEWPORT = { once: true, margin: "-60px" } as const;

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen text-ink">
        <Rail />
        <Hero />
        <RoadSigns />
        <QuickActions />
        <TodaysQuestion />
        <Courses />
        <Curriculum />
        <Features />
        <Principles />
        <Partners />
        <Pricing />
        <Faq />
        <TrustStrip />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}

/* =============================================================
    Top nav. Courses first — that's the path we want most people on.
============================================================= */

const NAV_LINKS = [
  { label: "Courses", href: "/courses" },
  { label: "Practice", href: "/practice" },
  { label: "Quick test", href: "/practice?mode=test" },
  { label: "Signs", href: "/road-signs" },
  { label: "Schools", href: "/driving-schools-kenya" },
  { label: "Blog", href: "/blogs" },
];

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

          {/* Mobile menu — desktop shows the inline nav instead */}
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
                  <SheetClose asChild>
                    <Link
                      to="/practice?mode=challenge"
                      className="border-2 border-ink bg-surface px-4 py-3 font-display text-[13px] font-bold uppercase tracking-wider text-ink shadow-stamp-sm hover:bg-paper-3"
                    >
                      Scenarios
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <a
                      href="#pricing"
                      className="border-2 border-dashed border-ink bg-surface px-4 py-3 font-display text-[13px] font-bold uppercase tracking-wider text-ink-3 hover:text-ink"
                    >
                      Pricing
                    </a>
                  </SheetClose>
                </nav>
                <div className="mt-6">
                  <Button variant="paper" size="lg" asChild className="w-full">
                    <Link to="/practice?mode=test">
                      Take a quick test
                      <HugeiconsIcon
                        icon={ArrowRight02FreeIcons}
                        size={16}
                        strokeWidth={2.5}
                      />
                    </Link>
                  </Button>
                </div>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </>
      }
    />
  );
}

/* =============================================================
   Hero. Road signs first — the live product; the courses, mock
   papers and the rest are next. No entry animation — the page
   transition handles route entry; the only motion here is the
   ambient traffic-signal backdrop bleeding off the left edge.
   ============================================================= */

function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b-2 border-ink py-14 sm:py-20">
      {/* Ambient backdrop — a live traffic-light signal bleeding off the left
          edge, dimmed to ~50% so it reads as motion-y texture behind the
          headline rather than competing with it. Decorative only; hidden on
          phones where it would crowd the copy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-14 top-1/2 -z-10 hidden -translate-y-1/2 opacity-50 sm:block lg:-left-6"
      >
        <TrafficLoader size="xl" aria-hidden />
      </div>

      <Container>
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="rush">★ Road signs · live now</Badge>
            <Badge variant="ink">Courses · coming soon</Badge>
          </div>
          <h1 className="m-0 mt-3 font-display font-extrabold uppercase leading-[0.88] tracking-tighter text-ink text-[clamp(48px,9vw,112px)]">
            Master road signs.{" "}
            <span className="italic text-rush">Start free.</span>
          </h1>
          <p className="mt-5 max-w-2xl font-serif text-[clamp(17px,2.2vw,24px)] leading-tight text-ink-2">
            DriveRush is starting with the part most people get wrong — the
            Kenyan road signs. Quick memory games and the classic quiz, free, no
            signup. The full courses, mock papers and the rest are on the way.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button variant="rush" size="lg" asChild>
              <Link to="/road-signs">
                <HugeiconsIcon
                  icon={TrafficLightFreeIcons}
                  size={18}
                  strokeWidth={2.25}
                />
                Train the signs
              </Link>
            </Button>
            <Button variant="paper" size="lg" asChild>
              <Link to="/practice?mode=signs">
                Or the classic sign quiz
                <HugeiconsIcon
                  icon={ArrowRight02FreeIcons}
                  size={16}
                  strokeWidth={2.5}
                />
              </Link>
            </Button>
          </div>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Free · No signup to start · Built for Kenya
          </p>
        </div>
      </Container>
    </section>
  );
}

/* =============================================================
   Road signs — the first thing you can actually play. Two
   memorisation mini-games: Pelican (recall) and 3D (recognition).
   ============================================================= */

function RoadSigns() {
  return (
    <section id="road-signs" className="border-b-2 border-ink py-12 sm:py-16">
      <Container>
        <SectionHead
          title={
            <>
              Start with the <em>signs</em>
            </>
          }
          stamp="Two mini-games · play now"
        />
        <p className="mb-8 max-w-2xl font-serif text-[clamp(16px,2vw,22px)] leading-tight text-ink-2 [&_em]:text-rush">
          The fastest way in. Two five-minute games that drill the Kenyan road
          signs until they're <em>automatic</em> — recall under pressure, then
          recognition from any angle.
        </p>

        <motion.div
          className="grid gap-5 sm:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={variants.staggerList}
        >
          {SIGN_GAMES.map((g) => (
            <motion.div key={g.slug} variants={variants.fadeUp}>
              <SignGameCard game={g} />
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
          More sign trainers coming ·{" "}
          <Link
            to="/road-signs"
            className="text-rush underline-offset-2 hover:underline"
          >
            all sign training →
          </Link>
        </p>
      </Container>
    </section>
  );
}

/* =============================================================
   Courses — the main path. Two full courses for now; this is
   where we want most people to start.
   ============================================================= */

const COURSE_ACCENT: Record<CourseAccent, { block: string; title: string }> = {
  rush: { block: "bg-rush text-white", title: "text-rush" },
  ink: { block: "bg-ink text-paper", title: "text-ink" },
};

function Courses() {
  return (
    <section
      id="courses"
      className="border-b-2 border-ink bg-paper-3 py-12 sm:py-16"
    >
      <Container>
        <SectionHead
          title={
            <>
              Next up · <em>full courses</em>
            </>
          }
          stamp="Coming soon · in the workshop"
        />
        <p className="mb-8 max-w-2xl font-serif text-[clamp(16px,2vw,22px)] leading-tight text-ink-2 [&_em]:text-rush">
          While you drill the signs, we're building the rest — full courses on
          the highway code, junctions, hazard perception and the mechanical
          basics, each topic <em>in order</em>, with practice and mock papers
          built in. Here's the plan.
        </p>

        <motion.div
          className="grid gap-5 lg:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={variants.staggerList}
        >
          {COURSES.map((c) => (
            <motion.div key={c.slug} variants={variants.fadeUp}>
              <CourseCard course={c} />
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
          Class B first · then A, C &amp; D
        </p>
      </Container>
    </section>
  );
}

function CourseCard({ course }: { course: Course }) {
  const a = COURSE_ACCENT[course.accent];
  return (
    <article className="relative flex h-full flex-col border-2 border-ink bg-surface shadow-stamp">
      {course.tag && (
        <div className="absolute -top-3 right-5">
          <Badge variant="ink">{course.tag}</Badge>
        </div>
      )}

      <header className="flex items-start gap-4 border-b-2 border-dashed border-ink p-5 sm:p-6">
        <div
          className={`flex size-12 shrink-0 items-center justify-center border-2 border-ink ${a.block}`}
        >
          <HugeiconsIcon icon={course.icon} size={24} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            {course.kicker}
          </span>
          <h3
            className={`m-0 mt-1.5 font-display text-[clamp(22px,2.6vw,28px)] font-extrabold uppercase leading-[0.95] tracking-tight ${a.title}`}
          >
            {course.title}
          </h3>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
        <p className="m-0 text-[14.5px] leading-relaxed text-ink-2">
          {course.blurb}
        </p>

        <div>
          <div className="mb-2.5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-ink-3">
            <span className="h-px flex-1 bg-line-soft" aria-hidden />
            What you'll cover
            <span className="h-px flex-1 bg-line-soft" aria-hidden />
          </div>
          <ul className="m-0 grid list-none gap-2 p-0">
            {course.syllabus.map((s, i) => (
              <li
                key={s}
                className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink"
              >
                <span className="mt-px shrink-0 font-mono text-[11px] tabular-nums text-ink-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="mt-auto border-t-2 border-dashed border-ink p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          <span>{course.meta.modules} modules</span>
          <span aria-hidden>·</span>
          <span>{course.meta.lessons} lessons</span>
          <span aria-hidden>·</span>
          <span>{course.meta.hours}</span>
          <span aria-hidden>·</span>
          <span>{course.meta.level}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant={course.accent} size="lg" asChild>
            <Link to={course.to}>
              See what's coming
              <HugeiconsIcon
                icon={ArrowRight02FreeIcons}
                size={16}
                strokeWidth={2.5}
              />
            </Link>
          </Button>
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink-3">
            {course.price}
          </span>
        </div>
      </footer>
    </article>
  );
}

/* =============================================================
   Quick-action tiles — the fast lane. No course, no signup,
   just five minutes of reps. Mobile-first, staggered on view.
   ============================================================= */

function QuickActions() {
  const tiles = [
    {
      to: "/practice",
      icon: PlayCircleFreeIcons,
      accent: "rush" as const,
      title: "Quick practice",
      copy: "Five questions, no timer. Build the habit.",
      meta: "5 Qs · open",
    },
    {
      to: "/practice?mode=test",
      icon: TimeQuarterFreeIcons,
      accent: "ink" as const,
      title: "Quick test",
      copy: "Ten questions, eight minutes. Test centre shape.",
      meta: "10 Qs · 8 min",
    },
    {
      to: "/practice?mode=signs",
      icon: TrafficLightFreeIcons,
      accent: "amber" as const,
      title: "Road signs",
      copy: "Master the Kenyan signs you'll see on the road.",
      meta: "5 Qs · signs",
    },
    {
      to: "/practice?mode=challenge",
      icon: AwardFreeIcons,
      accent: "green" as const,
      title: "Scenarios",
      copy: "Right-of-way and hazards from real junctions.",
      meta: "5 Qs · daily",
    },
  ];

  return (
    <section className="border-b-2 border-ink py-12 sm:py-16">
      <Container>
        <SectionHead
          title={
            <>
              The quick <em>lane</em>
            </>
          }
          stamp="Live now · guest, free"
        />
        <p className="mb-8 max-w-2xl font-serif text-[clamp(16px,2vw,22px)] leading-tight text-ink-2">
          When five minutes is all you've got. Pick a drill, get scored, get on
          with your day — the rest of DriveRush can wait.
        </p>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={variants.staggerList}
        >
          {tiles.map((t) => (
            <motion.div key={t.to} variants={variants.fadeUp}>
              <QuickAction {...t} />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

/* =============================================================
   Today's question. Deterministic per day so SSR matches hydration.
   ============================================================= */

function TodaysQuestion() {
  const question = React.useMemo(() => getTodaysQuestion(), []);
  const [picked, setPicked] = React.useState<number | null>(null);
  const revealed = picked !== null;
  const correct = revealed && picked === question.correctIndex;

  return (
    <motion.section
      id="today"
      className="border-b-2 border-ink bg-paper-3 py-12 sm:py-16"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={variants.fadeUp}
    >
      <Container>
        <div className="grid gap-6 md:grid-cols-[1fr_2fr] md:gap-10">
          <div className="grid gap-3">
            <span className="eyebrow text-ink">Today's question</span>
            <h2 className="m-0 font-display text-[clamp(26px,3.5vw,36px)] font-extrabold uppercase leading-tight tracking-tight text-ink">
              Try one, <span className="italic text-rush">free</span>.
            </h2>
            <p className="text-[14px] leading-relaxed text-ink-2">
              Same shape as the real NTSA paper. Pick an answer, see whether
              it's right, read why. No counter, no streak required — and it's
              here every day.
            </p>
            {revealed && (
              <Button
                variant="rush"
                size="lg"
                asChild
                className="justify-self-start"
              >
                <Link to="/practice">
                  Continue practicing
                  <HugeiconsIcon
                    icon={ArrowRight02FreeIcons}
                    size={16}
                    strokeWidth={2.5}
                  />
                </Link>
              </Button>
            )}
          </div>

          <article className="grid gap-4 border-2 border-ink bg-surface p-5 shadow-stamp sm:p-7">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              Class B ·{" "}
              {question.category === "sign"
                ? "Signs"
                : question.category === "scenario"
                  ? "Scenarios"
                  : "Highway code"}
            </div>
            <p className="m-0 font-display text-[clamp(18px,2.5vw,22px)] font-extrabold uppercase leading-tight tracking-tight text-ink wrap-anywhere">
              {question.prompt}
            </p>

            <div className="grid gap-2.5">
              {question.choices.map((choice, i) => {
                const isThisCorrect = i === question.correctIndex;
                const isPicked = picked === i;
                const state = !revealed
                  ? undefined
                  : isThisCorrect
                    ? "correct"
                    : isPicked
                      ? "wrong"
                      : "disabled";
                return (
                  <ChoiceCard
                    key={i}
                    keyLabel={String.fromCharCode(65 + i)}
                    state={state}
                    onClick={() => setPicked(i)}
                    disabled={revealed}
                  >
                    {choice}
                  </ChoiceCard>
                );
              })}
            </div>

            {revealed && (
              <motion.div
                className="grid gap-2"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
              >
                <FeedbackBanner
                  tone={correct ? "win" : "fail"}
                  title={correct ? "Sawa sawa · Correct" : "Not quite · Wrong"}
                  description={question.explanation}
                />
                <p className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                  {question.rule}
                </p>
                <button
                  type="button"
                  onClick={() => setPicked(null)}
                  className="mt-1 inline-flex items-center gap-1.5 self-start font-mono text-[11px] uppercase tracking-widest text-ink-3 outline-none hover:text-ink focus-visible:text-ink"
                >
                  <HugeiconsIcon
                    icon={RefreshFreeIcons}
                    size={12}
                    strokeWidth={2.5}
                  />
                  Try the answer again
                </button>
              </motion.div>
            )}
          </article>
        </div>
      </Container>
    </motion.section>
  );
}

/* =============================================================
   Curriculum. The Class B course, module by module. Every module
   is reachable from the course; the cards just show what's inside.
   ============================================================= */

const CLASS_B_MODULES = [
  {
    num: 1,
    title: "Highway code & rules of the road",
    lessons: 7,
    questions: 24,
  },
  {
    num: 2,
    title: "Road signs, signals & markings",
    lessons: 8,
    questions: 40,
  },
  {
    num: 3,
    title: "Junctions, roundabouts & right of way",
    lessons: 7,
    questions: 28,
  },
  {
    num: 4,
    title: "Hazard perception on Nairobi streets",
    lessons: 6,
    questions: 26,
  },
  {
    num: 5,
    title: "Mechanical knowledge & vehicle checks",
    lessons: 6,
    questions: 22,
  },
  {
    num: 6,
    title: "Full mock papers & exam-day routine",
    lessons: 8,
    questions: 60,
  },
];

function Curriculum() {
  return (
    <section id="curriculum" className="border-b-2 border-ink py-12 sm:py-16">
      <Container>
        <SectionHead
          title={
            <>
              Inside the Class B course, <em>module by module</em>
            </>
          }
          stamp="Class B course · coming soon"
        />

        <motion.div
          className="grid gap-3.5"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={variants.staggerList}
        >
          {CLASS_B_MODULES.map((m) => (
            <motion.div key={m.num} variants={variants.fadeUp}>
              <Link
                to="/courses"
                className="block outline-none focus-visible:[&_article]:shadow-stamp-rush"
              >
                <BoardingCard
                  num={m.num}
                  eyebrow={`Module № ${m.num} · Class B course`}
                  title={m.title}
                  meta={[
                    `${m.lessons} lessons`,
                    `${m.questions} questions`,
                    <span key="in" className="text-rush">
                      Coming soon
                    </span>,
                  ]}
                  stub={{
                    label: "XP",
                    value: `+${m.lessons * 40}`,
                    code: `B/${String(m.num).padStart(2, "0")}`,
                  }}
                />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

/* =============================================================
   Features — what's in the box. 6 tiles + 4 NTSA class chips.
   ============================================================= */

const FEATURES: Array<{
  icon: IconSvgElement;
  title: string;
  copy: string;
  tone: "rush" | "ink" | "amber" | "green" | "blue" | "cyan";
}> = [
  {
    icon: Mortarboard01FreeIcons,
    title: "Courses, not just quizzes",
    copy: "Full courses that teach a topic in order — highway code to mock papers — with the practice baked into every lesson.",
    tone: "rush",
  },
  {
    icon: TimeQuarterFreeIcons,
    title: "Timed mock exams",
    copy: "Full-length papers — same question count, same minutes, same fail thresholds as the test centre.",
    tone: "ink",
  },
  {
    icon: SmartPhone01FreeIcons,
    title: "M-Pesa, when ready",
    copy: "STK push if you decide to upgrade. KES 499/month for every course. Cancel from inside the app.",
    tone: "green",
  },
  {
    icon: ChartIncreaseFreeIcons,
    title: "Honest stats",
    copy: "Per-module score, per-sign accuracy, weakest topics. We tell you what's broken.",
    tone: "blue",
  },
  {
    icon: Fire02FreeIcons,
    title: "Streaks that matter",
    copy: "A streak only banks if you actually worked. Five lazy minutes won't save it.",
    tone: "amber",
  },
  {
    icon: TrafficLightFreeIcons,
    title: "Built for Kenyan roads",
    copy: "Real Kenyan signs, real Nairobi junctions, hazard clips, defensive driving. Not stock images from a textbook.",
    tone: "cyan",
  },
];

const TONE_BG = {
  rush: "bg-rush",
  ink: "bg-ink",
  amber: "bg-amber",
  green: "bg-kenya-green",
  blue: "bg-plate-blue",
  cyan: "bg-route-cyan",
} as const;

const TONE_FG = {
  rush: "text-white",
  ink: "text-paper",
  amber: "text-ink",
  green: "text-white",
  blue: "text-white",
  cyan: "text-ink",
} as const;

const TONE_TEXT = {
  rush: "text-rush",
  ink: "text-ink",
  amber: "text-amber",
  green: "text-kenya-green",
  blue: "text-plate-blue",
  cyan: "text-route-cyan",
} as const;

function Features() {
  return (
    <section
      id="features"
      className="border-b-2 border-ink bg-paper-3 py-12 sm:py-16"
    >
      <Container>
        <SectionHead
          title={
            <>
              What's in <em>the box</em>
            </>
          }
          stamp="Six things, all working"
        />

        <motion.div
          className="grid gap-0 border-2 border-ink md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={variants.staggerList}
        >
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              variants={variants.fadeUp}
              className={`relative bg-surface p-6 ${
                i % 3 !== 2 ? "md:border-r-2 md:border-ink" : ""
              } ${
                i < FEATURES.length - 3
                  ? "border-b-2 border-ink"
                  : "border-b-2 border-ink md:border-b-0"
              }`}
            >
              <div
                className={`mb-4 flex size-14 items-center justify-center border-2 border-ink ${TONE_BG[f.tone]} ${TONE_FG[f.tone]}`}
              >
                <HugeiconsIcon icon={f.icon} size={26} strokeWidth={2.25} />
              </div>
              <h3
                className={`m-0 mb-2 font-display text-lg font-extrabold uppercase tracking-wide ${TONE_TEXT[f.tone]}`}
              >
                {f.title}
              </h3>
              <p className="m-0 text-sm leading-relaxed text-ink-2">{f.copy}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          className="mt-10 grid gap-3 sm:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={variants.staggerList}
        >
          {[
            { icon: Motorbike01FreeIcons, code: "A", label: "Motorbike" },
            { icon: CarFreeIcons, code: "B", label: "Light vehicle" },
            { icon: DeliveryTruck01FreeIcons, code: "C", label: "Light goods" },
            { icon: BusFreeIcons, code: "D", label: "PSV" },
          ].map((cls) => (
            <motion.div
              key={cls.code}
              variants={variants.fadeUp}
              className="flex items-center gap-3 border-2 border-ink bg-surface p-4"
            >
              <div className="flex size-12 items-center justify-center border-2 border-ink bg-amber text-amber-foreground">
                <HugeiconsIcon icon={cls.icon} size={22} strokeWidth={2.25} />
              </div>
              <div>
                <div className="font-display text-base font-extrabold uppercase">
                  Class {cls.code}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
                  {cls.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

/* =============================================================
   Principles — the three brand rules.
   ============================================================= */

function Principles() {
  return (
    <section className="border-b-2 border-ink py-12 sm:py-16">
      <Container>
        <SectionHead
          title={
            <>
              How we <em>build</em>
            </>
          }
          stamp="Three rules · zero negotiable"
        />

        <motion.div
          className="grid border-2 border-ink md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={variants.staggerList}
        >
          <motion.div variants={variants.fadeUp}>
            <TicketCard
              passLabel="Pass № 01"
              seat="A·01"
              title={
                <>
                  Fast over <em>fancy</em>
                </>
              }
              description="Two taps to learning. Cut transitions. Kill loaders. Default to the action. Students don't have time, and neither do we."
              className="border-r-0 border-t-0 md:border-r-2 md:border-dashed"
            />
          </motion.div>
          <motion.div variants={variants.fadeUp}>
            <TicketCard
              passLabel="Pass № 02"
              seat="B·02"
              title={
                <>
                  Earned, not <em>given</em>
                </>
              }
              description="Streaks, XP and badges only land if work was done. We never inflate. Confidence has to come from a real win."
              className="border-l-0 border-t-2 md:border-l-0 md:border-r-2 md:border-t-0 md:border-dashed"
            />
          </motion.div>
          <motion.div variants={variants.fadeUp}>
            <TicketCard
              passLabel="Pass № 03"
              seat="C·03"
              title={
                <>
                  Kenya, not <em>generic</em>
                </>
              }
              description="NTSA categories. Real Nairobi junctions. KES, M-Pesa, Kiswahili. Woven in, never bolted on."
              className="border-t-2 md:border-t-0"
            />
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

/* =============================================================
   Partners — what the content is built on. Two for now: the NTSA
   (highway code + official sign set) and Pelican Signs (the real
   sign artwork). White logo band, surface caption; linkable cards
   lift on hover like the quick-action tiles.
   ============================================================= */

function Partners() {
  return (
    <section
      id="partners"
      className="border-b-2 border-ink bg-paper-3 py-12 sm:py-16"
    >
      <Container>
        <SectionHead
          title={
            <>
              Straight from <em>the source</em>
            </>
          }
          stamp="NTSA-aligned · genuine sign art"
        />
        <p className="mb-8 max-w-2xl font-serif text-[clamp(16px,2vw,22px)] leading-tight text-ink-2 [&_em]:text-rush">
          We don't redraw the signs from memory. The highway code and the full
          sign set follow the <em>NTSA</em>'s published material, and the
          artwork is the genuine <em>Pelican Signs</em> set you'll see bolted to
          poles on Kenyan roads — so what you learn here is what you'll meet out
          there.
        </p>

        <motion.div
          className="grid max-w-3xl gap-4 sm:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={variants.staggerList}
        >
          {PARTNERS.map((p) => (
            <motion.div key={p.name} variants={variants.fadeUp}>
              <PartnerCard partner={p} />
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-ink-3">
          Logos shown to credit our sources — not an endorsement
        </p>
      </Container>
    </section>
  );
}

const PARTNER_CARD_BASE =
  "group/partner relative flex h-full flex-col overflow-hidden border-2 border-ink bg-surface shadow-stamp";
const PARTNER_CARD_LINK =
  " outline-none transition-[transform,box-shadow] duration-100 ease-snap hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-lg active:translate-x-[3px] active:translate-y-[3px] active:shadow-stamp-sm focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush";

function PartnerCard({ partner }: { partner: Partner }) {
  const body = (
    <>
      {/* White band — the logo art has a white field, so keep it white in
          both themes rather than letting dark surface bleed through. */}
      <div className="flex flex-1 items-center justify-center border-b-2 border-dashed border-ink bg-white px-6 py-7">
        <img
          src={partner.logo}
          alt={`${partner.name} logo`}
          loading="lazy"
          className="h-10 w-auto max-w-[70%] object-contain sm:h-12"
        />
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <div className="font-display text-[13px] font-extrabold uppercase tracking-tight text-ink">
            {partner.name}
          </div>
          <div className="truncate font-mono text-[10px] uppercase tracking-widest text-ink-3">
            {partner.note}
          </div>
        </div>
        {partner.href && (
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center border-2 border-ink bg-paper-3 text-ink transition-colors group-hover/partner:bg-ink group-hover/partner:text-paper"
          >
            <HugeiconsIcon
              icon={ArrowUpRight01FreeIcons}
              size={13}
              strokeWidth={2.5}
            />
          </span>
        )}
      </div>
    </>
  );

  if (partner.href) {
    // Tag the outbound URL so partners see DriveRush in their referrer reports
    // with the campaign attached. We still log the *raw* href to our own GA so
    // the partner_clicked report stays clean.
    const rawHref = partner.href;
    const taggedHref = addUtm(rawHref, {
      source: "driverush",
      medium: "partner_card",
      campaign: utmSlug(partner.name),
    });
    return (
      <a
        href={taggedHref}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`${partner.name} — opens in a new tab`}
        className={PARTNER_CARD_BASE + PARTNER_CARD_LINK}
        onClick={() =>
          analytics.partnerClicked({ name: partner.name, url: rawHref })
        }
      >
        {body}
      </a>
    );
  }
  return <div className={PARTNER_CARD_BASE}>{body}</div>;
}

/* =============================================================
   Pricing. Free is enough to start any course; Premium unlocks
   every course end to end. No "Most popular", no urgency.
   ============================================================= */

function Pricing() {
  return (
    <section id="pricing" className="border-b-2 border-ink py-12 sm:py-16">
      <Container>
        <SectionHead
          title={
            <>
              Free now. <em>Premium</em> when courses land
            </>
          }
          stamp="Sign training free · always"
        />

        <motion.div
          className="grid gap-5 md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={variants.staggerList}
        >
          <motion.div variants={variants.fadeUp}>
            <PriceCard
              name="Free"
              price="KES 0"
              period="forever"
              blurb="Everything that's live today — and it stays free, even after the courses arrive."
              features={[
                "Road-sign trainers (Pelican & 3D)",
                "The classic road-sign quiz",
                "Quick practice & timed tests",
                "Right-of-way scenarios",
                "Daily question, every day",
                "Progress saved on this device",
                "Everything new, as it ships",
              ]}
              cta={{
                label: "Train the signs",
                href: "/road-signs",
                variant: "rush",
              }}
              softTag="Live now"
            />
          </motion.div>
          <motion.div variants={variants.fadeUp}>
            <PriceCard
              name="Premium"
              price="KES 499"
              period="/ month · KES 4,999/yr"
              blurb="Lands with the full courses — the deep question bank, mock exams and cross-device sync."
              features={[
                "Every course, every module",
                "Unlimited timed mock exams",
                "200+ extra past papers",
                "Cross-device progress sync",
                "Offline mode for the bus",
                "New lessons every week",
              ]}
              cta={{
                label: "See what's coming",
                href: "/courses",
                variant: "ink",
              }}
              softTag="Coming soon"
            />
          </motion.div>
        </motion.div>

        <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
          Free now and always · courses, mock exams &amp; Premium land later
        </p>
      </Container>
    </section>
  );
}

/* =============================================================
   FAQ — head queries we want to rank for. Mirrors HOME_FAQ above
   so the FAQPage JSON-LD has a visible match in the DOM (Google
   needs both, otherwise the rich result is dropped).
   ============================================================= */

function Faq() {
  return (
    <section id="faq" className="border-b-2 border-ink py-12 sm:py-16">
      <Container>
        <div className="mb-7 flex flex-wrap items-baseline justify-between gap-3 border-b border-ink pb-3">
          <h2 className="m-0 font-display text-[clamp(24px,3vw,36px)] font-extrabold uppercase leading-tight tracking-tight text-ink">
            Common{" "}
            <span className="italic font-serif font-normal normal-case text-ink-3">
              questions
            </span>
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Learning to drive in Kenya · NTSA
          </span>
        </div>
        <Accordion>
          {HOME_FAQ.map((item, i) => (
            <AccordionItem key={item.q} summary={item.q} open={i === 0}>
              {item.a}
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-ink-3">
          More →{" "}
          <Link
            to="/blogs/learning-to-drive-in-kenya"
            className="text-rush hover:underline"
          >
            Full guide to learning to drive in Kenya
          </Link>{" "}
          ·{" "}
          <Link
            to="/driving-schools-kenya"
            className="text-rush hover:underline"
          >
            Best driving schools in Kenya
          </Link>{" "}
          ·{" "}
          <Link
            to="/blogs/ntsa-test-prep-kenya"
            className="text-rush hover:underline"
          >
            NTSA test prep
          </Link>
        </p>
      </Container>
    </section>
  );
}

/* =============================================================
   Trust strip. Compact, no fake metrics.
   ============================================================= */

function TrustStrip() {
  const items: Array<{ label: string; value: string }> = [
    { label: "Learn", value: "Courses + drills" },
    { label: "Classes", value: "A · B · C · D" },
    { label: "Account", value: "Not required" },
    { label: "Pay", value: "M-Pesa · Premium only" },
  ];
  return (
    <section className="border-b-2 border-ink bg-paper-3 py-8">
      <Container>
        <ul className="m-0 grid list-none grid-cols-2 gap-0 border-2 border-ink bg-surface p-0 sm:grid-cols-4">
          {items.map((it, i, arr) => (
            <li
              key={it.label}
              className={`p-4 text-center ${
                i < arr.length - 1 ? "sm:border-r-2 sm:border-ink" : ""
              } ${
                i < arr.length - 2 ? "border-b-2 border-ink sm:border-b-0" : ""
              }`}
            >
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                {it.label}
              </div>
              <div className="mt-1 font-display text-[14px] font-extrabold uppercase tracking-tight text-ink">
                {it.value}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
          <HugeiconsIcon
            icon={WifiOffFreeIcons}
            size={12}
            strokeWidth={2.5}
            className="text-kenya-green"
          />
          Save your progress on this device. Works offline.
        </p>
      </Container>
    </section>
  );
}

/* =============================================================
   Final CTA. Push to the live thing — road signs. Banner-slam on view.
   ============================================================= */

function FinalCta() {
  return (
    <section className="border-b-2 border-ink py-12 sm:py-14">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={variants.bannerSlam}
        >
          <FeedbackBanner
            tone="win"
            icon={TrafficLightFreeIcons}
            title="Start where it counts — the signs."
            description="Two memory games and the classic quiz. Free, no card, no account."
            action={
              <Button variant="ink" size="lg" asChild>
                <Link to="/road-signs">
                  Train the signs
                  <HugeiconsIcon
                    icon={ArrowRight02FreeIcons}
                    size={16}
                    strokeWidth={2.5}
                  />
                </Link>
              </Button>
            }
          />
        </motion.div>
      </Container>
    </section>
  );
}

/* =============================================================
   Footer.
   ============================================================= */

function SiteFooter() {
  return (
    <footer className="border-t-4 border-double border-ink bg-ink py-12 text-paper">
      <Container>
        <div className="grid gap-6 border-b border-paper/20 pb-7 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Logo variant="plain" height={64} knockout />
            <p className="mt-4 max-w-sm font-serif text-base leading-snug opacity-80">
              Full driving courses and NTSA practice, built for Kenyan roads.
            </p>
          </div>
          <FooterCol
            heading="Courses"
            items={[
              { label: "Class B — full course", href: "/courses" },
              { label: "Confident on Kenyan roads", href: "/courses" },
              { label: "All courses", href: "/courses" },
            ]}
          />
          <FooterCol
            heading="Practice"
            items={[
              { label: "Quick practice", href: "/practice" },
              { label: "Quick test", href: "/practice?mode=test" },
              { label: "Road signs", href: "/road-signs" },
              { label: "Scenarios", href: "/practice?mode=challenge" },
            ]}
          />
          <FooterCol
            heading="More"
            items={[
              { label: "Blog", href: "/blogs" },
              { label: "Pricing", href: "#pricing" },
              { label: "Course outline", href: "#curriculum" },
              { label: "Features", href: "#features" },
              { label: "Design system", href: "/design" },
            ]}
          />
        </div>
        <div className="flex flex-wrap justify-between gap-3 pt-6 font-mono text-[11px] uppercase tracking-widest opacity-60">
          <span>© 2026 DriveRush.ke</span>
          <span>Learn · Drive · Succeed</span>
          <span>Nairobi · KE</span>
        </div>
      </Container>
    </footer>
  );
}

/* =============================================================
   Helpers
   ============================================================= */

function SectionHead({
  title,
  stamp,
}: {
  title: React.ReactNode;
  stamp?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-baseline justify-between gap-3 border-b border-ink pb-3">
      <h2 className="m-0 font-display text-[clamp(24px,3vw,36px)] font-extrabold uppercase leading-tight tracking-tight [&_em]:font-serif [&_em]:font-normal [&_em]:italic [&_em]:normal-case [&_em]:text-ink-3 [&_em]:text-[0.7em]">
        {title}
      </h2>
      {stamp && (
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
          {stamp}
        </span>
      )}
    </div>
  );
}

type PriceCta = {
  label: string;
  href: string;
  variant: "rush" | "ink" | "paper";
};

function PriceCard({
  name,
  price,
  period,
  blurb,
  features,
  cta,
  softTag,
}: {
  name: string;
  price: string;
  period: string;
  blurb: string;
  features: string[];
  cta: PriceCta;
  softTag?: string;
}) {
  const isInternal = cta.href.startsWith("/");
  return (
    <article className="relative flex h-full flex-col border-2 border-ink bg-surface">
      {softTag && (
        <div className="absolute -top-3 left-5">
          <Badge variant="ink">{softTag}</Badge>
        </div>
      )}
      <header className="border-b-2 border-dashed border-ink px-6 py-5">
        <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          {name}
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-display text-[44px] font-extrabold leading-none tracking-tight tabular-nums text-ink">
            {price}
          </span>
          <span className="font-mono text-xs uppercase tracking-wide text-ink-3">
            {period}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">{blurb}</p>
      </header>
      <ul className="m-0 grid list-none gap-2.5 px-6 py-5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-ink">
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center border-2 border-ink ${cta.variant === "rush" ? "bg-rush text-white" : "bg-paper-3 text-ink"}`}
            >
              <HugeiconsIcon icon={Tick02FreeIcons} size={11} strokeWidth={3} />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <footer className="mt-auto border-t-2 border-dashed border-ink p-5">
        <Button variant={cta.variant} size="lg" className="w-full" asChild>
          {isInternal ? (
            <Link to={cta.href}>
              {cta.label}
              <HugeiconsIcon
                icon={ArrowRight02FreeIcons}
                size={16}
                strokeWidth={2.5}
              />
            </Link>
          ) : (
            <a href={cta.href}>
              {cta.label}
              <HugeiconsIcon
                icon={ArrowRight02FreeIcons}
                size={16}
                strokeWidth={2.5}
              />
            </a>
          )}
        </Button>
      </footer>
    </article>
  );
}

function FooterCol({
  heading,
  items,
}: {
  heading: string;
  items: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="m-0 mb-3 font-display text-xs font-extrabold uppercase tracking-widest">
        {heading}
      </h3>
      <ul className="m-0 list-none p-0">
        {items.map((it) => {
          const isInternal = it.href.startsWith("/");
          return (
            <li key={it.label} className="py-1">
              {isInternal ? (
                <Link
                  to={it.href}
                  className="font-mono text-xs tracking-wide opacity-85 hover:underline"
                >
                  {it.label}
                </Link>
              ) : (
                <a
                  href={it.href}
                  className="font-mono text-xs tracking-wide opacity-85 hover:underline"
                >
                  {it.label}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
