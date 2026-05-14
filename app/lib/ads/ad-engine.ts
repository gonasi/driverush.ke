import { analytics } from "~/lib/analytics";

import { activeSession } from "./active-session";
import { evaluate } from "./ad-rules";
import type {
  AdProvider,
  AdProviderStatus,
  AdState,
  AdTriggerEvent,
  UserAdTier,
} from "./ad-types";

/**
 * Framework-agnostic ad engine.
 *
 * Decision logic and state live here — no React imports, no direct `window`
 * access. The React adapter (`ad-context.tsx`) constructs one engine per app
 * instance, subscribes to its snapshot via `useSyncExternalStore`, and
 * exposes a tiny hook surface.
 *
 * Pacing is delegated entirely to `activeSession` (the 5-min active-time
 * budget). The engine just asks "budget met?" and, on a successful fire,
 * tells it to consume.
 *
 * Why a class (not Zustand): the engine has clear external dependencies
 * (provider, rules, clock) that benefit from DI for tests, and most of its
 * behaviour isn't UI state — it's a small state machine that drives a modal.
 */

export type EngineDeps = {
  provider: AdProvider;
  rules?: typeof evaluate;
  now?: () => number;
};

type Listener = () => void;

const INITIAL_STATE: AdState = {
  isOpen: false,
  currentSlot: null,
  currentEvent: null,
  triggerSeq: 0,
  providerStatus: "idle",
};

export class AdEngine {
  private state: AdState = INITIAL_STATE;
  private listeners = new Set<Listener>();
  private tier: UserAdTier = "free";
  private routeInterruptible = true;
  private bootstrapped = false;
  private dwellStartedAt = 0;

  constructor(private readonly deps: EngineDeps) {}

  // ----- subscription (used by useSyncExternalStore) -----
  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): AdState => this.state;

  private emit() {
    for (const l of this.listeners) l();
  }

  private setState(patch: Partial<AdState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  private setProviderStatus(status: AdProviderStatus) {
    if (this.state.providerStatus === status) return;
    this.setState({ providerStatus: status });
  }

  // ----- lifecycle -----

  /**
   * Load the provider's SDK. Idempotent. Called from the React provider on
   * mount so the script loads in parallel with the user reading the page.
   */
  bootstrap(): Promise<void> {
    if (this.bootstrapped) return Promise.resolve();
    this.bootstrapped = true;
    this.setProviderStatus("loading");
    return this.deps.provider
      .initialize()
      .then(() => this.setProviderStatus("ready"))
      .catch(() => this.setProviderStatus("failed"));
  }

  setRouteInterruptible(v: boolean): void {
    this.routeInterruptible = v;
  }

  setUserTier(t: UserAdTier): void {
    this.tier = t;
  }

  // ----- triggering -----

  /**
   * Evaluate rules, open the modal if allowed, otherwise log a block reason.
   * Synchronous so call sites can fire-and-forget right after their analytics.
   */
  trigger(event: AdTriggerEvent): void {
    if (this.state.isOpen) {
      // Already showing — don't stack. Quiet skip; the trigger site won fair
      // and square but the user is mid-impression.
      analytics.adSkipped({
        slot: this.state.currentSlot ?? "lesson_complete",
      });
      return;
    }
    const rules = this.deps.rules ?? evaluate;
    const now = (this.deps.now ?? Date.now)();
    const decision = rules(this.state, event, {
      tier: this.tier,
      routeInterruptible: this.routeInterruptible,
      budgetMet: activeSession.isBudgetMet(),
      now,
    });
    if (!decision.allow) {
      analytics.adBlockedByRules({ event, reason: decision.reason });
      return;
    }
    // Consume the active-session budget — accumulator resets to 0, persisted
    // to localStorage, and cross-tab tabs are notified via storage event.
    activeSession.consumeBudget();
    this.dwellStartedAt = now;
    this.setState({
      isOpen: true,
      currentSlot: decision.slot,
      currentEvent: event,
      triggerSeq: this.state.triggerSeq + 1,
    });
    analytics.adShown({
      event,
      slot: decision.slot,
      provider: this.deps.provider.id,
    });
  }

  /**
   * Renderer signals it couldn't load an ad in time. Closes the modal and
   * reports — the budget was already consumed in `trigger`; we accept that
   * as the cost of keeping evaluation in one place.
   */
  markFailed(reason: string): void {
    if (!this.state.isOpen || !this.state.currentSlot) return;
    analytics.adFailed({ slot: this.state.currentSlot, reason });
    this.close();
  }

  dismiss(): void {
    if (!this.state.isOpen || !this.state.currentSlot) return;
    const now = (this.deps.now ?? Date.now)();
    analytics.adClosed({
      slot: this.state.currentSlot,
      dwellMs: Math.max(0, now - this.dwellStartedAt),
    });
    this.close();
  }

  private close() {
    this.setState({ isOpen: false, currentSlot: null, currentEvent: null });
  }

  get provider(): AdProvider {
    return this.deps.provider;
  }
}

// ---------------------------------------------------------------------------
// Singleton bridge for non-React callers (Zustand stores, plain modules).
// `<AdProvider>` registers its engine instance on mount; non-React triggers
// silently no-op until then.
// ---------------------------------------------------------------------------

let singleton: AdEngine | null = null;

export function registerAdEngineSingleton(engine: AdEngine | null): void {
  singleton = engine;
}

export function getAdEngineSingleton(): AdEngine | null {
  return singleton;
}

/**
 * For modules that can't use React hooks (e.g. Zustand stores). A silent
 * no-op if the provider hasn't mounted yet — never throws into the calling
 * flow. Same evaluation as the React `triggerAd`.
 */
export function triggerAdFromNonReact(event: AdTriggerEvent): void {
  singleton?.trigger(event);
}

/**
 * Fire a trigger AND get notified when the user dismisses the resulting
 * modal — so non-React callers (game state machines) can pause/resume their
 * own world around the impression.
 *
 * Returns `true` if a modal actually opened (caller should pause). Returns
 * `false` if the engine isn't ready or the rules blocked the trigger
 * (caller should not pause — there's nothing to wait for).
 *
 * `onClose` is invoked exactly once when the engine flips `isOpen` back to
 * `false`. Subscription is cleaned up automatically.
 */
export function triggerAdAndAwaitClose(
  event: AdTriggerEvent,
  onClose: () => void,
): boolean {
  const engine = singleton;
  if (!engine) return false;
  const before = engine.getSnapshot().isOpen;
  engine.trigger(event);
  const opened = engine.getSnapshot().isOpen && !before;
  if (!opened) return false;
  const unsubscribe = engine.subscribe(() => {
    if (!engine.getSnapshot().isOpen) {
      unsubscribe();
      onClose();
    }
  });
  return true;
}
