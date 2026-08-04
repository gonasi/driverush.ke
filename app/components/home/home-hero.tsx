/**
 * Smart homepage hero. Three states share the same vertical rhythm so the
 * page doesn't shift as it hydrates:
 *
 *  1. Cold-start (no progress): brand headline + live sign challenge.
 *  2. Returning learner with an in-progress lesson: "Continue X" card,
 *     streak flame + daily-goal ring inline.
 *  3. Returning learner who finished a lesson today: "Keep the streak" CTA
 *     pointing at the next untouched lesson.
 *
 * All three paths (Train / Test / Master) render under the variant card so
 * the user always has the secondary options visible.
 */
import * as React from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02FreeIcons,
  AwardFreeIcons,
  Fire02FreeIcons,
  Mortarboard01FreeIcons,
  PlayCircleFreeIcons,
  TimeQuarterFreeIcons,
  TrafficLightFreeIcons,
} from "@hugeicons/core-free-icons";

import { useResumeTarget } from "~/lib/use-resume-target";
import { useStreakStoreHydrated } from "~/lib/use-streak-store";
import { cn } from "~/lib/utils";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";

import { PathCard } from "./path-card";
import { SignOfTheMoment } from "./sign-of-the-moment";

const LIVE_COURSE_SLUG = "ntsa-drive-kenya";

const PATHS = {
  train: {
    to: "/road-signs/pelican",
    voice: "amber" as const,
    icon: TrafficLightFreeIcons,
    eyebrow: "Train",
    title: "5-minute sign drill",
    description:
      "Spot every Kenyan road sign on instinct. Pelican-style recall, no signup.",
    metaLeft: "~ 5 min",
  },
  test: {
    to: "/practice?mode=test",
    voice: "rush" as const,
    icon: TimeQuarterFreeIcons,
    eyebrow: "Test",
    title: "Timed mock exam",
    description:
      "Sit the NTSA-style mock. 10 questions, 8 minutes, instant verdict.",
    metaLeft: "~ 8 min",
  },
  master: {
    to: `/courses/${LIVE_COURSE_SLUG}`,
    voice: "kenya-green" as const,
    icon: Mortarboard01FreeIcons,
    eyebrow: "Master",
    title: "Full Class B course",
    description:
      "48 lessons. Built around the NTSA test. Streaks, units, and unit checkpoints.",
    metaLeft: "Class B",
  },
};

export function HomeHero() {
  const target = useResumeTarget(LIVE_COURSE_SLUG);
  const { hydrated, state: streak } = useStreakStoreHydrated();

  const showResume = !!target;

  return (
    <section
      id="try-now"
      className="mx-auto w-full max-w-5xl px-5 pb-10 pt-6 sm:px-9 sm:pt-12"
    >
      <header className="grid gap-4">
        <span className="inline-flex items-center gap-2">
          <Badge variant="green">★ Free · No signup</Badge>
          <Badge variant="default">Built for Kenyan roads</Badge>
        </span>
        <h1 className="m-0 font-display text-[clamp(36px,6.5vw,72px)] font-extrabold uppercase leading-[0.9] tracking-tighter text-ink">
          Pass the NTSA test.{" "}
          <span className="italic text-rush">Start now.</span>
        </h1>
        <p className="m-0 max-w-2xl font-serif text-[clamp(17px,2.2vw,22px)] leading-snug text-ink-2">
          Tap a road sign below to start, jump into a 10-minute mock exam, or
          take the full Class B course. Everything's free.
        </p>
      </header>

      <div className="mt-7">
        {showResume ? (
          <ResumeCard
            target={target!}
            streakDays={hydrated ? streak.currentStreak : 0}
            dailyXpEarned={hydrated ? streak.dailyXpEarned : 0}
            dailyGoal={hydrated ? streak.dailyGoal : 50}
          />
        ) : (
          <SignOfTheMoment />
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <PathCard {...PATHS.train} />
        <PathCard {...PATHS.test} />
        <PathCard {...PATHS.master} />
      </div>
    </section>
  );
}

function ResumeCard({
  target,
  streakDays,
  dailyXpEarned,
  dailyGoal,
}: {
  target: NonNullable<ReturnType<typeof useResumeTarget>>;
  streakDays: number;
  dailyXpEarned: number;
  dailyGoal: number;
}) {
  const goalPct = Math.min(100, Math.round((dailyXpEarned / dailyGoal) * 100));
  return (
    <div className="grid items-stretch gap-5 border-2 border-ink bg-surface p-5 shadow-stamp sm:grid-cols-[1fr_auto] sm:gap-7 sm:p-7">
      <div className="grid gap-3">
        <p className="m-0 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-3">
          <HugeiconsIcon
            icon={PlayCircleFreeIcons}
            size={14}
            strokeWidth={2.5}
          />
          {target.inProgress
            ? "Continue where you left off"
            : "Pick up the course"}
        </p>
        <h2 className="m-0 font-display text-[clamp(22px,3.4vw,32px)] font-extrabold uppercase leading-[1] tracking-tight text-ink">
          {target.lesson.title}
        </h2>
        <p className="m-0 max-w-md text-[14.5px] leading-snug text-ink-2">
          {target.lesson.objective}
        </p>
        {target.inProgress && target.pct > 0 && (
          <div className="max-w-sm">
            <Progress
              value={target.pct}
              showTicks={false}
              aria-label="Lesson progress"
            />
          </div>
        )}
        <div className="mt-2">
          <Button variant="rush" size="lg" asChild>
            <Link
              to={`/courses/${LIVE_COURSE_SLUG}/${target.chapterSlug}/${target.lesson.slug}`}
            >
              {target.inProgress ? "Resume" : "Continue"}
              <HugeiconsIcon
                icon={ArrowRight02FreeIcons}
                size={16}
                strokeWidth={2.5}
              />
            </Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-row items-stretch gap-3 sm:flex-col sm:items-end">
        <ChipStat
          icon={Fire02FreeIcons}
          tone="amber"
          label="Streak"
          value={streakDays > 0 ? `${streakDays}d` : "Start today"}
        />
        <ChipStat
          icon={AwardFreeIcons}
          tone="green"
          label="Today"
          value={`${dailyXpEarned} / ${dailyGoal} XP`}
          accent={goalPct >= 100}
        />
      </div>
    </div>
  );
}

function ChipStat({
  icon,
  tone,
  label,
  value,
  accent = false,
}: {
  icon: typeof Fire02FreeIcons;
  tone: "amber" | "green";
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid min-w-[140px] gap-1 border-2 border-ink px-3 py-2.5",
        tone === "amber" && "bg-amber text-amber-foreground",
        tone === "green" && accent
          ? "bg-kenya-green text-kenya-green-foreground"
          : tone === "green"
            ? "bg-surface text-ink"
            : "",
      )}
    >
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest opacity-80">
        <HugeiconsIcon icon={icon} size={12} strokeWidth={2.5} />
        {label}
      </span>
      <span className="font-display text-[18px] font-extrabold leading-none tabular-nums">
        {value}
      </span>
    </div>
  );
}
