import type { AdSlotId, UserAdTier } from "./ad-types";

/**
 * Static config for ad orchestration. Pure module — no side effects, no
 * window reads. Tweak rules here; trigger sites and providers read them.
 */

/** AdSense publisher ID. Used by the loader script and every <ins> unit. */
export const AD_CLIENT = "ca-pub-9749836423673560";

/**
 * Real ad-unit slot IDs from the AdSense dashboard. Empty strings mean
 * "no real slot configured yet" — the factory falls back to the mock provider
 * for that slot in development. Populate before flipping AdSense to live.
 */
export const AD_SLOTS: Record<AdSlotId, string> = {
  lesson_complete: "",
  chapter_complete: "",
  gameplay_milestone: "",
};

/**
 * Active-session pacing — the single knob that gates every ad in the app.
 *
 * The user must accumulate ACTIVE_SESSION_BUDGET_MS of *active* time before
 * any trigger can fire. "Active" = tab visible AND not idle (no input within
 * IDLE_THRESHOLD_MS) AND on an interruptible route. Once the budget hits,
 * the next natural trigger event fires the ad and resets the accumulator.
 */
export const ACTIVE_SESSION_BUDGET_MS = 5 * 60 * 1000; // 5 min
export const IDLE_THRESHOLD_MS = 30 * 1000; // 30 s
export const TICK_MS = 1000; // 1 s heartbeat

/**
 * Wall-clock gap that resets the accumulator. If the user closes the tab and
 * comes back hours later, we don't credit them for the gap — fresh session.
 */
export const ACCUMULATOR_TTL_MS = 60 * 60 * 1000; // 1 hour

export const AD_STORAGE_KEYS = {
  /**
   * Persists active-session accumulator across reload + cross-tab sync.
   * Old `dr-ads-v1` key (cooldown-era) is orphaned but harmless.
   */
  activeSession: "dr-ad-session-v1",
} as const;

/**
 * Hard dismiss grace. For this window the close (X) and Continue are hidden /
 * disabled and a visible countdown is shown. After it elapses the user can
 * dismiss freely. 10s is standard for rewarded/interstitial-style units and
 * keeps revenue-per-impression sensible without trapping the user for long.
 */
export const MIN_DISPLAY_MS = 10_000;

/** AdRenderer gives up and shows the unavailable fallback after this long. */
export const PROVIDER_LOAD_TIMEOUT_MS = 5000;

/**
 * User-tier source. Hardcoded for v1 (no auth). When auth lands, replace this
 * with a value derived from the auth context and feed it into the engine via
 * `engine.setUserTier(...)`. Premium short-circuits all triggers.
 */
export const currentUserTier: UserAdTier = "free";
