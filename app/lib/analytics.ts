import * as React from "react";
import { useLocation } from "react-router";
import ReactGA from "react-ga4";
import { getPersistedUtms } from "./utm";
import { getPostHog, initPostHog } from "./posthog";
import type { AdBlockReason, AdSlotId, AdTriggerEvent } from "./ads/ad-types";

/**
 * Two sinks, one taxonomy.
 *
 * PostHog is the product-analytics system of record: it is initialised in
 * `entry.client.tsx` before hydration and handles pageviews, autocapture,
 * replay, heatmaps and exceptions on its own. Everything below adds the
 * *semantic* events autocapture can't infer — was the answer right, did the
 * lesson finish, did the learner hit a locked node.
 *
 * Google Analytics 4 (via `react-ga4`) rides along for the legacy reports:
 * it loads the gtag script and we drive pageviews off `useLocation()` so SPA
 * navigations register. GA stays disabled in dev so localhost doesn't
 * pollute the property; PostHog captures in dev too but stamps
 * `app_env: development` so it can be filtered out.
 *
 * Custom events go through {@link analytics} — a typed dispatch object so
 * call sites can't typo event names or invent ad-hoc params.
 */

export const GA_MEASUREMENT_ID = "G-SPS89YRDGL";

const GA_ENABLED = import.meta.env.PROD;

let initialized = false;

/** Initialise analytics clients once on the client. Safe to call repeatedly. */
export async function initAnalytics() {
  if (typeof window === "undefined") return;

  if (!initialized && GA_ENABLED) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    initialized = true;
  }

  // Normally already done in `entry.client.tsx`; this covers call sites that
  // can run before hydration finishes (e.g. the root ErrorBoundary).
  initPostHog();
}

export { getPostHog };

/**
 * Initialises GA on first run, then fires a `page_view` on every React Router
 * navigation. Call once from the root component. No-op on the server and when
 * GA is disabled.
 */
export function usePageviews() {
  const location = useLocation();
  React.useEffect(() => {
    void initAnalytics();
    if (!initialized) return;
    ReactGA.send({
      hitType: "pageview",
      page: location.pathname + location.search,
      title: typeof document !== "undefined" ? document.title : undefined,
    });
  }, [location.pathname, location.search]);
}

function emit(name: string, params?: Record<string, unknown>) {
  // In DEV, mirror the event to the console so we can verify dispatch
  // without digging through the network tab.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${name}`, params ?? {});
  }
  // PostHog is initialised before hydration, so this is normally a straight
  // capture; `initPostHog()` is the belt-and-braces path for anything that
  // fires earlier.
  (getPostHog() ?? initPostHog())?.capture(name, params);
  if (!initialized) return;
  // Auto-merge the session's landing UTMs so every event carries attribution
  // for custom reports. Explicit `params` always win on key collision.
  const utms = getPersistedUtms();
  const utmParams: Record<string, unknown> = {};
  if (utms.source) utmParams.session_utm_source = utms.source;
  if (utms.medium) utmParams.session_utm_medium = utms.medium;
  if (utms.campaign) utmParams.session_utm_campaign = utms.campaign;
  if (utms.term) utmParams.session_utm_term = utms.term;
  if (utms.content) utmParams.session_utm_content = utms.content;
  ReactGA.event(name, { ...utmParams, ...params });
}

/**
 * Typed event dispatcher. One method per event we care about; the keys are
 * the only names that should ever land in GA reports. If you need a new
 * event, add a method here rather than calling `emit` directly — it keeps
 * the report taxonomy stable and surfaces the full event list in one place.
 */
export const analytics = {
  // ----- top of funnel -----
  // The homepage sign challenge is the first thing a cold visitor can do.
  // Started → answered → (practice | course) is the activation funnel.

  /** Visitor tapped "Start the challenge" on the homepage sign game. */
  signChallengeStarted: (args: { sign_id: string; category: string }) =>
    emit("sign_challenge_started", args),

  /** Visitor answered a homepage sign question. */
  signChallengeAnswered: (args: {
    sign_id: string;
    category: string;
    correct: boolean;
    /** 1-based index within this page visit — measures how many they play. */
    question_index: number;
  }) => emit("sign_challenge_answered", args),

  /** Learner chooses a practice mode. */
  practiceModeSelected: (args: { mode: string; source: string }) =>
    emit("practice_mode_selected", args),

  /** User opened a practice quiz session. */
  quizStarted: (mode: string, total: number) =>
    emit("quiz_started", { mode, total }),

  /**
   * A single practice answer. Higher volume than the rest of this file, and
   * deliberately so — it's the only way to see *which* questions the country
   * gets wrong, which drives content fixes.
   */
  quizQuestionAnswered: (args: {
    mode: string;
    question_id: string;
    question_index: number;
    total: number;
    correct: boolean;
  }) => emit("quiz_question_answered", args),

  /** Learner left a quiz before the result screen. Churn signal per mode. */
  quizAbandoned: (args: {
    mode: string;
    total: number;
    answered: number;
    correct: number;
  }) => emit("quiz_abandoned", args),

  /** User reached the result screen of a practice quiz. */
  quizCompleted: (args: {
    mode: string;
    total: number;
    correct: number;
    scorePct: number;
    passed: boolean;
  }) =>
    emit("quiz_completed", {
      mode: args.mode,
      total: args.total,
      correct: args.correct,
      score_pct: args.scorePct,
      passed: args.passed,
    }),

  /** Pelican recall run kicked off. */
  pelicanStarted: (args: { signsTotal: number; categories: string[] }) =>
    emit("pelican_started", {
      signs_total: args.signsTotal,
      categories: args.categories.length ? args.categories.join(",") : "all",
    }),

  /** Pelican recall run finished (every sign eventually recalled). */
  pelicanCompleted: (args: {
    signsTotal: number;
    knewFirstTry: number;
    missCount: number;
  }) =>
    emit("pelican_completed", {
      signs_total: args.signsTotal,
      knew_first_try: args.knewFirstTry,
      miss_count: args.missCount,
    }),

  /** 3D recognition run kicked off. */
  signs3dStarted: (args: { signsTotal: number; categories: string[] }) =>
    emit("signs3d_started", {
      signs_total: args.signsTotal,
      categories: args.categories.length ? args.categories.join(",") : "all",
    }),

  /** 3D recognition run finished (every sign eventually recalled). */
  signs3dCompleted: (args: {
    signsTotal: number;
    knewFirstTry: number;
    missCount: number;
  }) =>
    emit("signs3d_completed", {
      signs_total: args.signsTotal,
      knew_first_try: args.knewFirstTry,
      miss_count: args.missCount,
    }),

  /** Outbound click to a partner driving school — primary monetisation signal. */
  partnerClicked: (args: { name: string; url: string }) =>
    emit("partner_clicked", {
      partner_name: args.name,
      partner_url: args.url,
    }),

  /** User tapped "Save progress" on the post-quiz card — signup intent proxy. */
  saveProgressClicked: () => emit("save_progress_clicked"),

  /**
   * Learner tapped a contact channel in the footer. Small numbers by design;
   * it's a direct-intent signal, so worth its own event rather than digging
   * it out of autocaptured link clicks.
   */
  contactClicked: (args: { channel: "phone" | "email"; location: string }) =>
    emit("contact_clicked", args),

  // ----- habit loop -----
  // Streak + daily goal are the retention mechanics; these two events are what
  // make "learners who hit a 3-day streak retain N× better" answerable.

  /** Daily streak ticked up (first lesson completed on a new day). */
  streakExtended: (args: {
    days: number;
    longest: number;
    /** True when a banked freeze covered a skipped day. */
    freeze_spent: boolean;
  }) => emit("streak_extended", args),

  /** Learner crossed their daily XP goal. Fires once per day. */
  dailyGoalMet: (args: { goal: number; xp_earned: number; streak: number }) =>
    emit("daily_goal_met", args),

  /**
   * Learner opened a lesson they can actually access. Pairs with
   * `lesson_completed` for the per-lesson drop-off funnel — without it we can
   * only see finishes, not abandons.
   */
  lessonStarted: (args: {
    course_slug: string;
    lesson_id: string;
    chapter_id: string;
    blocks_total: number;
    /** `fresh` on a first open, `resume` when progress already existed. */
    entry: "fresh" | "resume" | "review";
  }) => emit("lesson_started", args),

  /** Learner tapped a locked node on the path. Friction / paywall signal. */
  lessonLockedTapped: (args: {
    course_slug: string;
    lesson_id: string;
    unit_index: number;
    lesson_index: number;
  }) => emit("lesson_locked_tapped", args),

  /** Learner advances from a course lesson block. */
  lessonBlockCompleted: (args: {
    course_slug: string;
    lesson_id: string;
    block_id: string;
    block_type: string;
    score?: number;
  }) => emit("lesson_block_completed", args),

  /** Learner completes the final block of a course lesson. */
  lessonCompleted: (args: {
    course_slug: string;
    lesson_id: string;
    blocks_total: number;
    xp_earned: number;
  }) => emit("lesson_completed", args),

  /** Learner restarts a completed course lesson. */
  lessonReplayed: (args: { course_slug: string; lesson_id: string }) =>
    emit("lesson_replayed", args),

  /** Learner opens a placement test for a locked lesson. */
  placementTestStarted: (args: {
    course_slug: string;
    target_lesson_id: string;
  }) => emit("placement_test_started", args),

  /** Learner reaches a placement-test verdict. */
  placementTestCompleted: (args: {
    course_slug: string;
    target_lesson_id: string;
    total: number;
    correct: number;
    passed: boolean;
  }) => emit("placement_test_completed", args),

  /** Learner retries a failed placement test. */
  placementTestRetaken: (args: {
    course_slug: string;
    target_lesson_id: string;
  }) => emit("placement_test_retaken", args),

  /** Learner applies a passing placement-test result. */
  placementTestPassed: (args: {
    course_slug: string;
    target_lesson_id: string;
    lessons_unlocked: number;
  }) => emit("placement_test_passed", args),

  // ----- ad orchestration -----
  // Every decision the ad engine makes flows through here, including blocks.
  // That gives us one place to look for "why didn't an ad show?" answers.

  /** A controlled ad modal opened for a given event/slot/provider. */
  adShown: (args: {
    event: AdTriggerEvent;
    slot: AdSlotId;
    provider: string;
  }) =>
    emit("ad_shown", {
      event: args.event,
      slot: args.slot,
      provider: args.provider,
    }),

  /** Modal closed via X / Continue / Escape. `dwellMs` measures attention. */
  adClosed: (args: { slot: AdSlotId; dwellMs: number }) =>
    emit("ad_closed", { slot: args.slot, dwell_ms: args.dwellMs }),

  /** Provider couldn't paint an impression in time. */
  adFailed: (args: { slot: AdSlotId; reason: string }) =>
    emit("ad_failed", { slot: args.slot, reason: args.reason }),

  /** Trigger arrived while a modal was already open — we suppressed it. */
  adSkipped: (args: { slot: AdSlotId }) => emit("ad_skipped", args),

  /** Engine refused a trigger. `reason` pinpoints which guard fired. */
  adBlockedByRules: (args: { event: AdTriggerEvent; reason: AdBlockReason }) =>
    emit("ad_blocked_by_rules", { event: args.event, reason: args.reason }),
};
