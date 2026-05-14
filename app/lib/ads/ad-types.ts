/**
 * Ad orchestration — shared types.
 *
 * The whole point of this module is that the app emits semantic events and a
 * central engine decides whether an ad appears. Everything outside `app/lib/ads/`
 * and `app/components/brand/ad-*` should depend on these types only, never on
 * provider concretes.
 */

/** Things the app can announce. Not every event has a slot — see EVENT_SLOT_MAP. */
export type AdTriggerEvent =
  | "app_open"
  | "lesson_start"
  | "lesson_complete"
  | "chapter_complete"
  | "gameplay_milestone"
  | "route_change"
  | "idle_resume";

export type UserAdTier = "free" | "premium";

/** Logical ad placements. Real provider slot IDs map from these in constants. */
export type AdSlotId =
  | "lesson_complete"
  | "chapter_complete"
  | "gameplay_milestone";

/** Discriminated reasons so analytics can pinpoint which guard fired. */
export type AdBlockReason =
  | "ads_disabled"
  | "premium"
  | "route_uninterruptible"
  | "no_slot_for_event"
  | "session_budget_not_met"
  | "provider_not_ready";

export type AdProviderStatus = "idle" | "loading" | "ready" | "failed";

export type AdState = {
  isOpen: boolean;
  currentSlot: AdSlotId | null;
  currentEvent: AdTriggerEvent | null;
  /** Increments on each successful open. Forces a fresh <ins> via React key. */
  triggerSeq: number;
  providerStatus: AdProviderStatus;
};

/**
 * Provider contract. The modal owns the DOM node; the provider just paints
 * into it and returns a cleanup. This keeps `adsbygoogle` (or any future SDK)
 * fully encapsulated.
 */
export interface AdProvider {
  readonly id: string;
  initialize(): Promise<void>;
  canShow(slot: AdSlotId): boolean;
  renderInto(el: HTMLElement, slot: AdSlotId): () => void;
}

/**
 * Route opt-out. Any route can export
 *   `export const handle: AdRouteHandle = { ads: { interruptible: false } }`
 * to block ads while it's the active match.
 */
export type AdRouteHandle = { ads?: { interruptible?: boolean } };
