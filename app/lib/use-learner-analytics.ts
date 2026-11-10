/**
 * Learner profile sync: turns the localStorage progress this app already keeps
 * into PostHog person properties.
 *
 * There are no accounts, so without this every learner is a shapeless anonymous
 * id and questions like "do people who know 20 signs come back?" can't be asked.
 * These properties make them segmentable instead: break trends down by
 * `learner_stage`, build cohorts on `signs_mastered_pelican`.
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
 * stores: this runs from the root component, and importing the stores there
 * would drag their dependency graphs into the entry chunk.
 */
import * as React from "react";
import { useLocation } from "react-router";

import { getPostHog } from "./posthog";
import {
  masteredCount,
  parsePersistedProgress,
  TRAINER_STORAGE_KEYS,
  type SignProgress,
} from "./pelican-progress";
import { liveStreak, readPracticeStreak } from "./practice-streak";

const FIRST_SEEN_KEY = "driverush:first-seen";

function readProgress(key: string): SignProgress {
  return parsePersistedProgress(window.localStorage.getItem(key));
}

function masteredSigns(progress: SignProgress): number {
  return masteredCount(progress, Object.keys(progress));
}

/**
 * Coarse lifecycle bucket. Low cardinality on purpose — it's registered as a
 * super property, so it lands on every event and shows up as a breakdown.
 */
function learnerStage(
  signsMastered: number,
): "visitor" | "sampler" | "practising" | "committed" {
  if (signsMastered >= 40) return "committed";
  if (signsMastered >= 5) return "practising";
  if (signsMastered > 0) return "sampler";
  return "visitor";
}

type LearnerProfile = Record<string, string | number | boolean>;

function buildProfile(): LearnerProfile {
  const pelican = readProgress(TRAINER_STORAGE_KEYS.pelican);
  const signs3d = readProgress(TRAINER_STORAGE_KEYS["3d"]);

  const pelicanMastered = masteredSigns(pelican);
  const signs3dMastered = masteredSigns(signs3d);

  return {
    signs_mastered_pelican: pelicanMastered,
    signs_mastered_3d: signs3dMastered,
    learner_stage: learnerStage(pelicanMastered + signs3dMastered),
    practice_streak_days: liveStreak(readPracticeStreak()).days,
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
 * when the tab regains focus (a run finished in another tab counts).
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
