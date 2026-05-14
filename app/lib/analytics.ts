import * as React from "react";
import { useLocation } from "react-router";
import ReactGA from "react-ga4";

import { getPersistedUtms } from "./utm";
import type { AdBlockReason, AdSlotId, AdTriggerEvent } from "./ads/ad-types";

/**
 * Google Analytics 4 — thin wrapper around `react-ga4`. The package handles
 * loading the gtag script and the `window.dataLayer` boilerplate; we drive
 * pageviews ourselves off `useLocation()` so SPA navigations are captured
 * (gtag's auto page_view only fires on full document loads).
 *
 * Disabled in dev so localhost doesn't pollute the production property.
 * Custom events go through {@link analytics} — a typed dispatch object so
 * call sites can't typo event names or invent ad-hoc params.
 */

export const GA_MEASUREMENT_ID = "G-SPS89YRDGL";

const GA_ENABLED = import.meta.env.PROD;

let initialized = false;

/** Initialise once on the client. Safe to call repeatedly. */
export function initAnalytics() {
  if (initialized || !GA_ENABLED || typeof window === "undefined") return;
  ReactGA.initialize(GA_MEASUREMENT_ID);
  initialized = true;
}

/**
 * Initialises GA on first run, then fires a `page_view` on every React Router
 * navigation. Call once from the root component. No-op on the server and when
 * GA is disabled.
 */
export function usePageviews() {
  const location = useLocation();
  React.useEffect(() => {
    initAnalytics();
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
  // without firing a real GA hit. PROD: GA only.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${name}`, params ?? {});
  }
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
  /** User opened a practice quiz session. */
  quizStarted: (mode: string, total: number) =>
    emit("quiz_started", { mode, total }),

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

  /** Outbound click to a partner driving school — primary monetisation signal. */
  partnerClicked: (args: { name: string; url: string }) =>
    emit("partner_clicked", {
      partner_name: args.name,
      partner_url: args.url,
    }),

  /** User tapped "Save progress" on the post-quiz card — signup intent proxy. */
  saveProgressClicked: () => emit("save_progress_clicked"),

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
