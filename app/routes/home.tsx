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
  Mortarboard01FreeIcons,
  ThreeDViewFreeIcons,
  RoadLocation01FreeIcons,
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";

import type { Route } from "./+types/home";

import {
  absUrl,
  GONASI,
  organizationLd,
  pageTitle,
  SITE,
  websiteLd,
} from "~/lib/site";
import { getTodaysQuestion } from "~/lib/questions";
import { COURSES, type Course, type CourseAccent } from "~/lib/courses";
import { PARTNERS, type Partner } from "~/lib/partners";
import { SIGN_GAMES } from "~/lib/road-signs";
import { variants } from "~/lib/motion";
import { analytics } from "~/lib/analytics";
import { isNavLinkActive } from "~/lib/nav";
import { addUtm, utmSlug } from "~/lib/utm";

import { getCourse } from "~/lib/course";
import type { Lesson } from "~/lib/course-types";
import {
  getLessonProgress,
  isLessonComplete,
  lessonPct,
} from "~/lib/course-progress";
import { selectCourseProgress, useCourseStore } from "~/lib/course-store";

import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";
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
import { ChoiceCard } from "~/components/brand/choice-card";
import { FeedbackBanner } from "~/components/brand/feedback-banner";
import { Logo } from "~/components/brand/logo";
import { PoweredByGonasi } from "~/components/brand/powered-by-gonasi";
import { QuickAction } from "~/components/brand/quick-action";
import { Rail } from "~/components/brand/rail";
import { SignGameCard } from "~/components/brand/sign-game-card";
import { TicketCard } from "~/components/brand/ticket-card";
import { TrafficLoader } from "~/components/brand/traffic-loader";

/** The live course the launchpad + resume strip point at. */
const LIVE_COURSE_SLUG = "ntsa-drive-kenya";

export function meta(_: Route.MetaArgs) {
  const title = pageTitle(
    "Learn to drive in Kenya: free road signs & NTSA prep",
  );
  const description =
    "Free road-sign trainers, NTSA practice tests and a full Class B course, built for Kenyan roads. No signup to start.";
  const url = absUrl("/");
  const ogImage = absUrl(SITE.ogImage);

  return [
    { title },
    { name: "description", content: description },
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
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@graph": [stripContext(organizationLd()), stripContext(websiteLd())],
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

function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen text-ink">
        <Rail />
        <Hero />
        <Launchpad />
        <RoadSigns />
        <TodaysQuestion />
        <Courses />
        <Features />
        <Partners />
        <Pricing />
        <Principles />
        <FinalCta />
        <ParentCompany />
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
            <Link to="/road-signs/pelican">
              <span className="hidden sm:inline">Start free</span>
              <span className="sm:hidden">Start</span>
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
                      to="/road-signs/pelican"
                      className="flex items-center justify-between gap-3 border-2 border-ink bg-rush px-4 py-3 font-display text-[13px] font-bold uppercase tracking-wider text-white shadow-stamp-sm"
                    >
                      Train the signs
                      <HugeiconsIcon
                        icon={ArrowRight02FreeIcons}
                        size={14}
                        strokeWidth={2.5}
                      />
                    </Link>
                  </SheetClose>
                  {NAV_LINKS.map((l) => (
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
                <div className="mt-6 border-t border-dashed border-ink pt-4">
                  <PoweredByGonasi
                    variant="inline"
                    tone="auto"
                    utmMedium="mobile_menu"
                  />
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
   Hero. One headline, one line, the free promise — then straight
   into the launchpad. The ambient traffic-signal backdrop now
   shows on phones too: smaller and fainter, tucked top-right
   behind the copy so it reads as texture, not clutter.
   ============================================================= */

function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b-2 border-ink py-12 sm:py-16">
      {/* Mobile backdrop — a small, faint signal in the top corner. Hidden on
          sm+ where the larger left-edge one takes over. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-5 top-1 -z-10 opacity-20 sm:hidden"
      >
        <TrafficLoader size="lg" aria-hidden />
      </div>

      {/* Desktop backdrop — a live signal bleeding off the left edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-14 top-1/2 -z-10 hidden -translate-y-1/2 opacity-50 sm:block lg:-left-6"
      >
        <TrafficLoader size="xl" aria-hidden />
      </div>

      {/* Parent-company "maker's mark", desktop only. */}
      <div className="pointer-events-auto absolute right-5 top-5 z-10 hidden sm:right-9 sm:block">
        <PoweredByGonasi variant="stamp" tone="auto" utmMedium="hero_stamp" />
      </div>

      <Container>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="rush">★ Free · no signup</Badge>
          <Badge variant="ink">Built for Kenyan roads</Badge>
        </div>
        <h1 className="m-0 mt-4 max-w-4xl font-display font-extrabold uppercase leading-[0.88] tracking-tighter text-ink text-[clamp(40px,8vw,96px)]">
          Pass the NTSA test.{" "}
          <span className="italic text-rush">Start now.</span>
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-[clamp(17px,2.2vw,24px)] leading-tight text-ink-2">
          Road-sign trainers, mock tests and a full Class B course. Pick one and
          go, no account, nothing to read first.
        </p>
      </Container>
    </section>
  );
}

/* =============================================================
   Launchpad — the whole point of the home page. Resume strip (if
   you've started the course), then the four primary paths, then a
   quick lane of five-minute drills.
   ============================================================= */

const PRIMARY = [
  {
    to: "/road-signs/pelican",
    icon: TrafficLightFreeIcons,
    accent: "rush" as const,
    title: "Train road signs",
    copy: "Drill every Kenyan sign with a five-minute recall game.",
    meta: "Free · play now",
  },
  {
    to: `/courses/${LIVE_COURSE_SLUG}`,
    icon: Mortarboard01FreeIcons,
    accent: "ink" as const,
    title: "Start the course",
    copy: "Class B, taught in order. First lessons live now.",
    meta: "Class B · live",
  },
  {
    to: "/practice?mode=test",
    icon: TimeQuarterFreeIcons,
    accent: "amber" as const,
    title: "Quick test",
    copy: "Ten questions, eight minutes, test-centre shape.",
    meta: "10 Qs · 8 min",
  },
  {
    to: "/road-signs/3d",
    icon: ThreeDViewFreeIcons,
    accent: "blue" as const,
    title: "Spin signs in 3D",
    copy: "Read a sign from any angle, the way you see them out there.",
    meta: "Free · play now",
  },
];

const QUICK_LANE = [
  {
    to: "/practice",
    icon: PlayCircleFreeIcons,
    accent: "rush" as const,
    title: "Quick practice",
    copy: "Five questions, no timer.",
    meta: "5 Qs · open",
  },
  {
    to: "/practice?mode=signs",
    icon: TrafficLightFreeIcons,
    accent: "amber" as const,
    title: "Sign quiz",
    copy: "The classic road-sign quiz.",
    meta: "5 Qs · signs",
  },
  {
    to: "/practice?mode=challenge",
    icon: AwardFreeIcons,
    accent: "green" as const,
    title: "Scenarios",
    copy: "Right-of-way from real junctions.",
    meta: "5 Qs · daily",
  },
  {
    to: "/road-signs",
    icon: RoadLocation01FreeIcons,
    accent: "ink" as const,
    title: "Every sign",
    copy: "Browse the full chart by class.",
    meta: "Reference",
  },
];

function Launchpad() {
  return (
    <section className="border-b-2 border-ink py-10 sm:py-14">
      <Container>
        <ResumeStrip />

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={variants.staggerList}
        >
          {PRIMARY.map((t) => (
            <motion.div key={t.to} variants={variants.fadeUp}>
              <QuickAction {...t} />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-8 flex items-center gap-3">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Five-minute drills
          </span>
          <span className="h-px flex-1 bg-line-soft" aria-hidden />
        </div>

        <motion.div
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={variants.staggerList}
        >
          {QUICK_LANE.map((t) => (
            <motion.div key={t.to} variants={variants.fadeUp}>
              <QuickAction {...t} density="compact" />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

/* =============================================================
   Resume strip. Client-only: reads the saved course progress and
   surfaces the lesson you should pick up next. Renders nothing on
   the server / before mount (no progress to read yet), so there's
   no hydration mismatch and no empty box for first-time visitors.
   ============================================================= */

type ResumeTarget = { lesson: Lesson; chapterSlug: string; pct: number };

function findResumeTarget(courseSlug: string): ResumeTarget | null {
  const course = getCourse(courseSlug);
  if (!course) return null;
  const cp = useCourseStore.getState().byCourse[courseSlug];
  if (!cp) return null;

  const lessons: Array<{ lesson: Lesson; chapterSlug: string }> = [];
  for (const ch of course.chapters) {
    for (const lesson of ch.lessons) {
      lessons.push({ lesson, chapterSlug: ch.slug });
    }
  }

  // 1) A lesson started but not finished — resume it.
  for (const { lesson, chapterSlug } of lessons) {
    if (getLessonProgress(cp, lesson) && !isLessonComplete(cp, lesson)) {
      return { lesson, chapterSlug, pct: lessonPct(cp, lesson) };
    }
  }
  // 2) Everything touched is done — point at the next untouched lesson.
  const anyComplete = lessons.some((l) => isLessonComplete(cp, l.lesson));
  if (anyComplete) {
    const next = lessons.find(({ lesson }) => !getLessonProgress(cp, lesson));
    if (next)
      return { lesson: next.lesson, chapterSlug: next.chapterSlug, pct: 0 };
  }
  return null;
}

function ResumeStrip() {
  const mounted = useMounted();
  // Subscribe so the strip updates if progress changes while mounted.
  useCourseStore(selectCourseProgress(LIVE_COURSE_SLUG));
  const target = mounted ? findResumeTarget(LIVE_COURSE_SLUG) : null;
  if (!target) return null;

  const { lesson, chapterSlug, pct } = target;
  const resuming = pct > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      className="mb-6"
    >
      <Link
        to={`/courses/${LIVE_COURSE_SLUG}/${chapterSlug}/${lesson.slug}`}
        className="group flex flex-col gap-3 border-2 border-ink bg-paper-3 p-4 shadow-stamp outline-none transition-[transform,box-shadow] duration-100 ease-snap hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-lg focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush sm:flex-row sm:items-center sm:gap-5 sm:p-5"
      >
        <div className="flex size-11 shrink-0 items-center justify-center border-2 border-ink bg-rush text-white">
          <HugeiconsIcon
            icon={PlayCircleFreeIcons}
            size={22}
            strokeWidth={2.25}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            {resuming ? "Continue where you left off" : "Pick up the course"}
          </div>
          <div className="mt-0.5 truncate font-display text-[18px] font-extrabold uppercase tracking-tight text-ink">
            {lesson.title}
          </div>
          {resuming && (
            <div className="mt-2 max-w-sm">
              <Progress
                value={pct}
                showTicks={false}
                aria-label="Lesson progress"
              />
            </div>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 self-start border-2 border-ink bg-ink px-4 py-2.5 font-display text-[12px] font-bold uppercase tracking-wider text-paper sm:self-auto">
          {resuming ? "Resume" : "Continue"}
          <HugeiconsIcon
            icon={ArrowRight02FreeIcons}
            size={14}
            strokeWidth={2.5}
          />
        </span>
      </Link>
    </motion.div>
  );
}

/* =============================================================
   Road signs — the first thing you can actually play, explained.
   Two memorisation mini-games: Pelican (recall) and 3D
   (recognition). The blurbs say what each one is and how it works.
   ============================================================= */

function RoadSigns() {
  return (
    <section
      id="road-signs"
      className="border-b-2 border-ink bg-paper-3 py-12 sm:py-16"
    >
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
          signs until they're <em>automatic</em>: recall under pressure with the
          Pelican trainer, then recognition from any angle in 3D.
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
   Today's question. Deterministic per day so SSR matches hydration.
   Value you get without leaving the page.
   ============================================================= */

function TodaysQuestion() {
  const question = React.useMemo(() => getTodaysQuestion(), []);
  const [picked, setPicked] = React.useState<number | null>(null);
  const revealed = picked !== null;
  const correct = revealed && picked === question.correctIndex;

  return (
    <motion.section
      id="today"
      className="border-b-2 border-ink py-12 sm:py-16"
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
              it's right, read why. A fresh one every day.
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
   Courses — the deeper path. Class B is live; the rest of the
   catalogue lands topic by topic.
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
              Go deeper · <em>full courses</em>
            </>
          }
          stamp="Class B live · more coming"
        />
        <p className="mb-8 max-w-2xl font-serif text-[clamp(16px,2vw,22px)] leading-tight text-ink-2 [&_em]:text-rush">
          When you're ready for the whole thing. The Class B course is{" "}
          <em>live</em>: work through it one idea at a time, with the practice
          and mock papers built into each lesson. The rest, on junctions, hazard
          perception and the mechanical basics, lands topic by topic.
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
  const isLive = course.to.startsWith("/courses/");
  return (
    <Link
      to={course.to}
      aria-label={
        isLive
          ? `Start the course: ${course.title}`
          : `${course.title} — see what's coming`
      }
      className="group relative flex h-full flex-col border-2 border-ink bg-surface shadow-stamp outline-none transition-[transform,box-shadow] duration-100 ease-snap hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-lg focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush"
    >
      {course.tag && (
        <div className="absolute -top-3 right-5 z-10">
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
          <span
            className={cn(
              buttonVariants({ variant: course.accent, size: "lg" }),
              "group-hover:-translate-x-px group-hover:-translate-y-px",
            )}
          >
            {isLive ? "Start the course" : "See what's coming"}
            <HugeiconsIcon
              icon={ArrowRight02FreeIcons}
              size={16}
              strokeWidth={2.5}
            />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink-3">
            {course.price}
          </span>
        </div>
      </footer>
    </Link>
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
    copy: "Full courses that teach a topic in order, from highway code to mock papers, with the practice baked into every lesson.",
    tone: "rush",
  },
  {
    icon: TimeQuarterFreeIcons,
    title: "Timed mock exams",
    copy: "Full-length papers with the same question count, the same minutes and the same fail thresholds as the test centre.",
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
    <section id="features" className="border-b-2 border-ink py-12 sm:py-16">
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
   Partners — what the content is built on. The NTSA (highway code
   + official sign set) and Pelican Signs (the real sign artwork),
   so learners know the signs they drill are the real ones.
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
          poles on Kenyan roads, so what you learn here is what you'll meet out
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
          Logos shown to credit our sources, not an endorsement
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
              blurb="Everything that's live today, and it stays free even after the courses arrive."
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
              blurb="Lands with the full courses: the deep question bank, mock exams and cross-device sync."
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
   Principles — the three brand rules.
   ============================================================= */

function Principles() {
  return (
    <section className="border-b-2 border-ink bg-paper-3 py-12 sm:py-16">
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
   Final CTA. One short push to the strongest free thing.
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
            title="Start where it counts: the signs."
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
   Parent company — DriveRush is a Gonasi product.
   ============================================================= */

function ParentCompany() {
  const utmHref = `${GONASI.url}/?utm_source=driverush&utm_medium=parent_strip&utm_campaign=powered_by_gonasi`;
  return (
    <section
      aria-labelledby="parent-company-heading"
      className="border-b-2 border-ink bg-paper-3 py-12 sm:py-14"
    >
      <Container>
        <div className="grid items-center gap-7 border-2 border-ink bg-surface p-6 shadow-stamp sm:p-9 md:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Parent company
            </span>
            <h2
              id="parent-company-heading"
              className="m-0 mt-2 font-display text-[clamp(24px,3vw,36px)] font-extrabold uppercase leading-tight tracking-tight text-ink"
            >
              Made by{" "}
              <span className="italic font-serif font-normal normal-case text-rush">
                Gonasi
              </span>
              .
            </h2>
            <p className="mt-4 max-w-xl font-serif text-[clamp(15px,1.7vw,19px)] leading-snug text-ink-2">
              {GONASI.blurb} DriveRush is that idea applied to driving school:
              the NTSA highway code, the signs, the test, in a shape that
              sticks.
            </p>
            <div className="mt-5">
              <a
                href={utmHref}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-4 py-2.5 font-display text-[12px] font-bold uppercase tracking-wider text-paper outline-none transition-[transform,box-shadow] duration-100 ease-snap hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush"
              >
                Visit {GONASI.name}
                <HugeiconsIcon
                  icon={ArrowUpRight01FreeIcons}
                  size={14}
                  strokeWidth={2.5}
                />
              </a>
            </div>
          </div>
          {/* Logo on its own. The square asset has its own field colour, so
              we don't wrap it in a coloured band; the link itself is the
              square box (aspect-square + max-w cap) and the images cover it. */}
          <a
            href={utmHref}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`Visit ${GONASI.name}. Opens gonasi.com in a new tab.`}
            className="group/gonasi-band relative mx-auto block aspect-square w-full max-w-70 overflow-hidden border-2 border-ink outline-none transition-[transform,box-shadow] duration-100 ease-snap hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush md:ml-auto md:mr-0"
          >
            <img
              src={GONASI.logoOnLight}
              alt={`${GONASI.name} logo`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover dark:hidden"
            />
            <img
              src={GONASI.logoOnDark}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 hidden h-full w-full object-cover dark:block"
            />
          </a>
        </div>
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
            <Logo variant="plain" height={64} themed="on-ink" />
            <p className="mt-4 max-w-sm font-serif text-base leading-snug opacity-80">
              Full driving courses and NTSA practice, built for Kenyan roads.
            </p>
          </div>
          <FooterCol
            heading="Learn"
            items={[
              { label: "Class B course", href: `/courses/${LIVE_COURSE_SLUG}` },
              { label: "All courses", href: "/courses" },
              { label: "Road signs", href: "/road-signs" },
            ]}
          />
          <FooterCol
            heading="Practice"
            items={[
              { label: "Quick practice", href: "/practice" },
              { label: "Quick test", href: "/practice?mode=test" },
              { label: "Sign quiz", href: "/practice?mode=signs" },
              { label: "Scenarios", href: "/practice?mode=challenge" },
            ]}
          />
          <FooterCol
            heading="More"
            items={[
              { label: "Driving schools", href: "/driving-schools-kenya" },
              { label: "Blog", href: "/blogs" },
              { label: "Pricing", href: "#pricing" },
              { label: "Design system", href: "/design" },
            ]}
          />
        </div>
        <div className="flex flex-col items-start gap-5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <PoweredByGonasi
            variant="lockup"
            tone="on-dark"
            utmMedium="home_footer"
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
