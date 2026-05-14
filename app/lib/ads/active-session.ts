import {
  ACCUMULATOR_TTL_MS,
  ACTIVE_SESSION_BUDGET_MS,
  AD_STORAGE_KEYS,
  IDLE_THRESHOLD_MS,
  TICK_MS,
} from "./ad-constants";

/**
 * Active-session tracker — the single pacing knob for the entire ad system.
 *
 * Accumulates "real engagement" time: tab visible + user not idle + on an
 * interruptible route. When `accumulatedMs` crosses `ACTIVE_SESSION_BUDGET_MS`,
 * the next trigger event fires the ad and resets the accumulator to 0.
 *
 * Persisted to `localStorage` so the budget survives reloads. Cross-tab sync
 * via the `storage` event — when one tab fires an ad and consumes the budget,
 * every other tab hears it and resets its in-memory accumulator.
 *
 * SSR-safe: `start()` is a no-op without `window`. Construction does no I/O.
 */

type Persisted = {
  accumulatedMs: number;
  lastTickAt: number;
  lastFireAt: number;
};

const EMPTY: Persisted = {
  accumulatedMs: 0,
  lastTickAt: 0,
  lastFireAt: 0,
};

type Listener = () => void;

const ACTIVITY_EVENTS: ReadonlyArray<keyof WindowEventMap> = [
  "mousemove",
  "keydown",
  "touchstart",
  "pointerdown",
  "scroll",
  "wheel",
];

class ActiveSessionTracker {
  private accumulatedMs = 0;
  private lastTickAt = 0;
  private lastActivityAt = 0;
  private lastFireAt = 0;
  private routeInterruptible = true;
  private started = false;
  private intervalId: number | null = null;
  private mousemoveLastSeen = 0;
  private readonly listeners = new Set<Listener>();

  /** Begin the heartbeat + listeners. Idempotent; SSR-safe. */
  start(): void {
    if (this.started) return;
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    this.started = true;
    this.load();
    this.lastActivityAt = Date.now();
    this.lastTickAt = Date.now();
    this.attachListeners();
    this.intervalId = window.setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    if (this.intervalId != null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.detachListeners();
  }

  isBudgetMet(): boolean {
    return this.accumulatedMs >= ACTIVE_SESSION_BUDGET_MS;
  }

  getAccumulatedMs(): number {
    return this.accumulatedMs;
  }

  /** Reset accumulator. Called by the engine after a successful ad fire. */
  consumeBudget(): void {
    this.accumulatedMs = 0;
    this.lastFireAt = Date.now();
    this.persist();
    this.notify();
  }

  setRouteInterruptible(v: boolean): void {
    this.routeInterruptible = v;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): { accumulatedMs: number; budgetMet: boolean } {
    return {
      accumulatedMs: this.accumulatedMs,
      budgetMet: this.isBudgetMet(),
    };
  }

  // ----- internals -----

  private tick(): void {
    const now = Date.now();
    const delta = now - this.lastTickAt;
    this.lastTickAt = now;

    // Wall-clock gap (suspended tab / device sleep / closed for hours) — treat
    // as a fresh session rather than crediting the gap.
    if (delta > ACCUMULATOR_TTL_MS) {
      if (this.accumulatedMs !== 0) {
        this.accumulatedMs = 0;
        this.persist();
        this.notify();
      }
      return;
    }

    const visible = document.visibilityState === "visible";
    const idle = now - this.lastActivityAt > IDLE_THRESHOLD_MS;
    if (!visible || idle || !this.routeInterruptible) return;

    this.accumulatedMs += delta;
    this.persist();
    this.notify();
  }

  private onActivity = (e: Event): void => {
    // Throttle high-frequency events; one update per second is plenty.
    const now = Date.now();
    if (e.type === "mousemove" || e.type === "scroll" || e.type === "wheel") {
      if (now - this.mousemoveLastSeen < 1000) return;
      this.mousemoveLastSeen = now;
    }
    this.lastActivityAt = now;
  };

  private onVisibilityChange = (): void => {
    // Reset the tick anchor so the just-elapsed background time isn't
    // credited as active on the next tick.
    this.lastTickAt = Date.now();
    if (document.visibilityState === "visible") {
      this.lastActivityAt = Date.now();
    }
  };

  private onStorage = (e: StorageEvent): void => {
    if (e.key !== AD_STORAGE_KEYS.activeSession) return;
    // Another tab updated the shared state. Re-load so this tab matches —
    // most importantly so a fire in one tab consumes the budget everywhere.
    this.load();
    this.notify();
  };

  private attachListeners(): void {
    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, this.onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("storage", this.onStorage);
  }

  private detachListeners(): void {
    for (const evt of ACTIVITY_EVENTS) {
      window.removeEventListener(evt, this.onActivity);
    }
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("storage", this.onStorage);
  }

  private load(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(AD_STORAGE_KEYS.activeSession);
      if (!raw) {
        this.accumulatedMs = EMPTY.accumulatedMs;
        this.lastFireAt = EMPTY.lastFireAt;
        return;
      }
      const parsed = JSON.parse(raw) as Partial<Persisted> | null;
      const accum =
        typeof parsed?.accumulatedMs === "number" ? parsed.accumulatedMs : 0;
      const tickAt =
        typeof parsed?.lastTickAt === "number" ? parsed.lastTickAt : 0;
      // TTL: if the stored lastTickAt is older than the TTL window relative
      // to now, treat as expired and reset.
      const now = Date.now();
      if (tickAt !== 0 && now - tickAt > ACCUMULATOR_TTL_MS) {
        this.accumulatedMs = 0;
      } else {
        this.accumulatedMs = Math.max(0, accum);
      }
      this.lastFireAt =
        typeof parsed?.lastFireAt === "number" ? parsed.lastFireAt : 0;
    } catch {
      this.accumulatedMs = 0;
      this.lastFireAt = 0;
    }
  }

  private persist(): void {
    if (typeof window === "undefined") return;
    try {
      const blob: Persisted = {
        accumulatedMs: this.accumulatedMs,
        lastTickAt: this.lastTickAt,
        lastFireAt: this.lastFireAt,
      };
      window.localStorage.setItem(
        AD_STORAGE_KEYS.activeSession,
        JSON.stringify(blob),
      );
    } catch {
      // Quota exceeded / private mode / storage disabled — silently degrade.
    }
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }
}

export const activeSession = new ActiveSessionTracker();
