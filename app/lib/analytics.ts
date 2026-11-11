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

type RunStarted = {
  signsTotal: number;
  categories: readonly string[];
  scope: string;
};

function startedProps(args: RunStarted) {
  return {
    signs_total: args.signsTotal,
    categories: args.categories.length ? args.categories.join(",") : "all",
    scope: args.scope,
  };
}

type RunCompleted = {
  signsTotal: number;
  scope: string;
  /** Only known when the learner graded themselves. */
  graded?: { knewFirstTry: number; missCount: number };
};

function completedProps(args: RunCompleted) {
  return {
    signs_total: args.signsTotal,
    scope: args.scope,
    self_graded: args.graded != null,
    ...(args.graded
      ? {
          knew_first_try: args.graded.knewFirstTry,
          miss_count: args.graded.missCount,
        }
      : {}),
  };
}

/**
 * Typed event dispatcher. One method per event we care about; the keys are
 * the only names that should ever land in GA reports. If you need a new
 * event, add a method here rather than calling `emit` directly — it keeps
 * the report taxonomy stable and surfaces the full event list in one place.
 */
export const analytics = {
  // ----- top of funnel -----
  // The homepage sign check. Started → answered → completed → trainer is one
  // activation funnel; going straight to a trainer is the other.

  /** A sign question appeared in the homepage check. */
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

  /** Visitor finished the ten-sign check on the homepage. */
  signCheckCompleted: (args: { correct: number; total: number }) =>
    emit("sign_check_completed", args),

  // ----- sign trainers -----

  /** Pelican chart run kicked off. */
  pelicanStarted: (args: RunStarted) => emit("pelican_started", startedProps(args)),

  /** Pelican chart run finished. Hands-free runs have no grades to report. */
  pelicanCompleted: (args: RunCompleted) =>
    emit("pelican_completed", completedProps(args)),

  /** 3D signs run kicked off. */
  signs3dStarted: (args: RunStarted) => emit("signs3d_started", startedProps(args)),

  /** 3D signs run finished. Hands-free runs have no grades to report. */
  signs3dCompleted: (args: RunCompleted) =>
    emit("signs3d_completed", completedProps(args)),

  /**
   * One "Knew it" or "Missed it" tap. Higher volume than the rest of this file,
   * and deliberately so: it's the only way to see which signs people actually
   * get wrong.
   */
  signGraded: (args: {
    trainer: "pelican" | "3d";
    sign_code: string;
    category: string;
    result: "knew" | "missed";
    box_before: number;
    box_after: number;
    first_try: boolean;
    scope: string;
    /** On a miss: whether the tip was the sign's own guide or its class rule. */
    miss_tip?: "guide" | "class_rule";
  }) => emit("sign_graded", args),

  // ----- Model Town Board -----

  /** A board round kicked off. */
  boardStarted: (args: { challenges: number; scope: "round" | "drill" }) =>
    emit("board_started", args),

  /** The referee stopped the learner. Shows which rules trip people up. */
  boardFaulted: (args: {
    challenge_id: string;
    rule: string;
    /** Small mistakes cost a star; serious ones end the attempt. */
    severity: "small" | "serious";
    /** 1 for the first fault on this challenge, and so on. */
    fault_number: number;
  }) => emit("board_faulted", args),

  /** A challenge was passed, cleanly or after faults. */
  boardChallengePassed: (args: {
    challenge_id: string;
    clean: boolean;
    faults: number;
    stars: number;
    seconds: number;
  }) => emit("board_challenge_passed", args),

  /** A board round finished. */
  boardCompleted: (args: {
    challenges: number;
    clean: number;
    fault_count: number;
  }) => emit("board_completed", args),

  /** Learn mode opened on the board. */
  boardLearnOpened: () => emit("board_learn_opened", {}),

  /** A lesson's route was played back, or a board feature looked at. */
  boardLessonViewed: (args: {
    kind: "lane" | "feature" | "route" | "parking";
    lesson_id: string;
  }) => emit("board_lesson_viewed", args),

  /** A hint was used on a driving task. */
  boardHintUsed: (args: {
    challenge_id: string;
    kind: "next_step" | "show_me" | "after_fault";
  }) => emit("board_hint_used", args),

  /** Outbound click to a credited source site. */
  partnerClicked: (args: { name: string; url: string }) =>
    emit("partner_clicked", {
      partner_name: args.name,
      partner_url: args.url,
    }),

  /**
   * Learner tapped a contact channel in the footer. Small numbers by design;
   * it's a direct-intent signal, so worth its own event rather than digging
   * it out of autocaptured link clicks.
   */
  contactClicked: (args: { channel: "phone" | "email"; location: string }) =>
    emit("contact_clicked", args),

  // ----- sharing -----
  // opened → completed measures how many people who reach for share actually
  // send something; `share_landing_viewed` closes the loop on the other side.

  /** Share affordance tapped (before any channel is chosen). */
  shareOpened: (args: { kind: string; surface: string }) =>
    emit("share_opened", args),

  /** A share was actually dispatched to a channel. */
  shareCompleted: (args: { kind: string; channel: string }) =>
    emit("share_completed", args),

  /** Someone opened a shared link. `valid: false` means the payload was junk. */
  shareLandingViewed: (args: { kind: string; valid: boolean }) =>
    emit("share_landing_viewed", args),

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
