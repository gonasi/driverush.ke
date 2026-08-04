/**
 * Learner profile sync — turns the localStorage progress this app already
 * keeps into PostHog person properties.
 *
 * There are no accounts, so without this every learner is a shapeless
 * anonymous id and questions like "do people who reach a 3-day streak come
 * back?" or "how do course finishers practice differently?" can't be asked.
 * These properties make them segmentable instead: build cohorts on
 * `current_streak`, break trends down by `learner_stage`, run retention
 * against `lessons_completed`.
 *
 * Cost control: the project runs `person_profiles: 'identified_only'`, and
 * `setPersonProperties` is what creates a profile. We therefore hold off until
 * the visitor has actually done something (`learner_stage` past `visitor`), so
 * SEO drive-by traffic stays anonymous — cheaper events, and a person list
 * that means something. `learner_stage` is registered as a super property for
 * everyone either way, so funnels can still be split by it from the first
 * pageview.
 *
 * Deliberately reads the persisted JSON rather than importing the zustand
 * stores: this runs from the root component, and importing the pelican / 3D
 * stores there would drag their (large) dependency graphs into the entry
 * chunk. The shapes below mirror the stores' `partialize` output — keep them
 * in sync if a store's persisted shape changes.
 */
import * as React from "react";
import { useLocation } from "react-router";

import { getPostHog } from "./posthog";
import { MASTERED_BOX, type SignProgress } from "./pelican-progress";
import type { CourseProgress } from "./course-progress";

const COURSE_KEY = "driverush:ntsa-progress";
const STREAK_KEY = "driverush:ntsa-streak";
const PELICAN_KEY = "driverush:pelican";
const SIGNS_3D_KEY = "driverush:signs3d";
const PRACTICE_KEY = "dr-progress-v1";
const FIRST_SEEN_KEY = "driverush:first-seen";

/** zustand's persist envelope. */
type Persisted<T> = { state?: T; version?: number };

function readJson<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

function masteredSigns(progress: SignProgress | undefined): number {
  if (!progress) return 0;
  return Object.values(progress).filter((s) => s.box >= MASTERED_BOX).length;
}

/**
 * Coarse lifecycle bucket. Low cardinality on purpose — it's registered as a
 * super property, so it lands on every event and shows up as a breakdown.
 */
function learnerStage(p: {
  lessonsCompleted: number;
  practiceAnswered: number;
  signsMastered: number;
  currentStreak: number;
}): "visitor" | "sampler" | "practising" | "learning" | "committed" {
  if (p.currentStreak >= 3 || p.lessonsCompleted >= 5) return "committed";
  if (p.lessonsCompleted >= 1) return "learning";
  if (p.practiceAnswered >= 10 || p.signsMastered >= 5) return "practising";
  if (p.practiceAnswered > 0 || p.signsMastered > 0) return "sampler";
  return "visitor";
}

type LearnerProfile = Record<string, string | number | boolean>;

function buildProfile(): LearnerProfile {
  const course =
    readJson<Persisted<{ byCourse: Record<string, CourseProgress> }>>(
      COURSE_KEY,
    )?.state?.byCourse;
  const streak = readJson<
    Persisted<{
      currentStreak: number;
      longestStreak: number;
      dailyGoal: number;
      dailyXpEarned: number;
      freezesAvailable: number;
    }>
  >(STREAK_KEY)?.state;
  const pelican =
    readJson<Persisted<{ progress: SignProgress }>>(PELICAN_KEY)?.state
      ?.progress;
  const signs3d =
    readJson<Persisted<{ progress: SignProgress }>>(SIGNS_3D_KEY)?.state
      ?.progress;
  const practice = readJson<{
    totalAnswered: number;
    totalCorrect: number;
    streak: number;
  }>(PRACTICE_KEY);

  let lessonsCompleted = 0;
  let lessonsStarted = 0;
  let courseXp = 0;
  const coursesStarted = course ? Object.keys(course).length : 0;
  for (const cp of Object.values(course ?? {})) {
    courseXp += cp.totalXP ?? 0;
    for (const chapter of Object.values(cp.chapters ?? {})) {
      for (const lesson of Object.values(chapter.lessons ?? {})) {
        lessonsStarted += 1;
        if (lesson.status === "complete") lessonsCompleted += 1;
      }
    }
  }

  const pelicanMastered = masteredSigns(pelican);
  const signs3dMastered = masteredSigns(signs3d);
  const practiceAnswered = practice?.totalAnswered ?? 0;
  const practiceCorrect = practice?.totalCorrect ?? 0;

  return {
    lessons_completed: lessonsCompleted,
    lessons_started: lessonsStarted,
    courses_started: coursesStarted,
    course_xp: courseXp,
    practice_answered: practiceAnswered,
    practice_correct: practiceCorrect,
    practice_accuracy:
      practiceAnswered === 0
        ? 0
        : Math.round((practiceCorrect / practiceAnswered) * 100),
    signs_mastered_pelican: pelicanMastered,
    signs_mastered_3d: signs3dMastered,
    current_streak: streak?.currentStreak ?? 0,
    longest_streak: streak?.longestStreak ?? 0,
    daily_goal: streak?.dailyGoal ?? 0,
    daily_xp_earned: streak?.dailyXpEarned ?? 0,
    streak_freezes: streak?.freezesAvailable ?? 0,
    learner_stage: learnerStage({
      lessonsCompleted,
      practiceAnswered,
      signsMastered: pelicanMastered + signs3dMastered,
      currentStreak: streak?.currentStreak ?? 0,
    }),
  };
}

/** Stable stamp for `$set_once`, so "days since first visit" is answerable. */
function firstSeenAt(): string {
  const existing = window.localStorage.getItem(FIRST_SEEN_KEY);
  if (existing) return existing;
  const now = new Date().toISOString();
  try {
    window.localStorage.setItem(FIRST_SEEN_KEY, now);
  } catch {
    // Private mode / storage full — the property just won't stick.
  }
  return now;
}

/**
 * Push the learner profile to PostHog on mount, on every route change, and
 * when the tab regains focus (a lesson finished in another tab counts).
 * Writes only when something actually changed, so it costs one `$set` at most
 * per navigation.
 */
export function useLearnerAnalytics() {
  const { pathname } = useLocation();
  const lastSent = React.useRef<string | null>(null);

  React.useEffect(() => {
    const sync = () => {
      const posthog = getPostHog();
      if (!posthog) return;
      const profile = buildProfile();

      // Free for everyone: super properties don't create a person profile, so
      // even a bouncing visitor's events carry their stage.
      posthog.register({ learner_stage: profile.learner_stage });

      // Billable: `setPersonProperties` creates the profile under
      // `identified_only`. Hold off until they've done something real.
      if (profile.learner_stage === "visitor") return;

      const fingerprint = JSON.stringify(profile);
      if (fingerprint === lastSent.current) return;
      lastSent.current = fingerprint;

      posthog.setPersonProperties(profile, { first_seen_at: firstSeenAt() });
    };

    const syncOnHide = () => {
      // Leaving the tab is the last chance to record what someone did on the
      // page they're on — otherwise a learner who opens one lesson and closes
      // the tab never gets a profile, since the write is deferred to the next
      // navigation.
      if (document.visibilityState === "hidden") sync();
    };

    sync();
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", syncOnHide);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", syncOnHide);
    };
  }, [pathname]);
}
