import type {
  AdBlockReason,
  AdSlotId,
  AdState,
  AdTriggerEvent,
  UserAdTier,
} from "./ad-types";

/**
 * Pure decision logic. No I/O, no React, no clock. Everything that varies
 * comes through the `ctx` argument — that's what makes the rules unit-testable
 * and the engine deterministic.
 *
 * Pacing is now driven entirely by the active-session budget. There is no
 * per-event or global cooldown — `budgetMet` is the only temporal gate.
 */

export const AD_RULES = {
  enabled: true,
} as const;

/**
 * Which logical slot a given event maps to. `null` means "no ad for this
 * event yet" — the trigger is wired but currently inactive.
 *
 * `route_change` reuses the generic interstitial slot for now; if AdSense
 * reporting per surface becomes valuable, split it out — engine doesn't care.
 */
export const EVENT_SLOT_MAP: Record<AdTriggerEvent, AdSlotId | null> = {
  app_open: null,
  lesson_start: null,
  lesson_complete: "lesson_complete",
  chapter_complete: "chapter_complete",
  gameplay_milestone: "gameplay_milestone",
  route_change: "lesson_complete",
  idle_resume: null,
};

export type EvaluateContext = {
  tier: UserAdTier;
  routeInterruptible: boolean;
  budgetMet: boolean;
  now: number;
};

export type EvaluateResult =
  | { allow: true; slot: AdSlotId }
  | { allow: false; reason: AdBlockReason };

/**
 * Evaluation order: cheap/global checks first (disabled, premium), then
 * context (route, slot), then the active-session budget (the only pacing
 * gate), then provider readiness last so we don't waste an opportunity
 * because the script hasn't loaded yet.
 */
export function evaluate(
  state: AdState,
  event: AdTriggerEvent,
  ctx: EvaluateContext,
): EvaluateResult {
  if (!AD_RULES.enabled) return { allow: false, reason: "ads_disabled" };
  if (ctx.tier === "premium") return { allow: false, reason: "premium" };
  if (!ctx.routeInterruptible)
    return { allow: false, reason: "route_uninterruptible" };

  const slot = EVENT_SLOT_MAP[event];
  if (!slot) return { allow: false, reason: "no_slot_for_event" };

  if (!ctx.budgetMet) return { allow: false, reason: "session_budget_not_met" };

  if (state.providerStatus !== "ready")
    return { allow: false, reason: "provider_not_ready" };

  return { allow: true, slot };
}
