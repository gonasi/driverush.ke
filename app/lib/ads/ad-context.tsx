import * as React from "react";
import { useMatches } from "react-router";

import { activeSession } from "./active-session";
import { AdEngine, registerAdEngineSingleton } from "./ad-engine";
import { currentUserTier } from "./ad-constants";
import { createAdProvider } from "./providers/adsense-provider";
import type { AdRouteHandle, AdState, AdTriggerEvent } from "./ad-types";

/**
 * React adapter for the ad engine.
 *
 *  - Constructs one `AdEngine` per app instance (post-hydration, never during SSR).
 *  - Bootstraps the provider on mount so the loader script downloads in parallel
 *    with the user reading the page.
 *  - Exposes a small hook surface — components shouldn't need to know the engine
 *    class exists; they call `triggerAd("...")` and read open/state.
 *  - Registers the engine as a module-level singleton so non-React callers
 *    (Zustand stores, plain modules) can fire triggers via `triggerAdFromNonReact`.
 */

type AdContextValue = {
  engine: AdEngine;
};

const AdContext = React.createContext<AdContextValue | null>(null);

export function AdProvider({ children }: { children: React.ReactNode }) {
  // Lazy `useState` initializer keeps the engine instance stable across
  // re-renders AND ensures no construction work happens during SSR setup
  // beyond reading (empty) ad-session storage.
  const [engine] = React.useState<AdEngine>(
    () => new AdEngine({ provider: createAdProvider() }),
  );

  React.useEffect(() => {
    engine.setUserTier(currentUserTier);
    registerAdEngineSingleton(engine);
    void engine.bootstrap();
    // Kick off the active-session heartbeat. Idempotent + SSR-safe — it
    // attaches activity / visibility / storage listeners and starts the
    // 1s tick that accrues active time toward the 5-min budget.
    activeSession.start();
    // Dev affordance: poke the engine and tracker from the browser console
    // to validate flows. Gated to DEV so prod stays clean.
    if (import.meta.env.DEV) {
      const w = window as unknown as {
        __adEngine?: AdEngine;
        __activeSession?: typeof activeSession;
      };
      w.__adEngine = engine;
      w.__activeSession = activeSession;
    }
    return () => {
      registerAdEngineSingleton(null);
      activeSession.stop();
      if (import.meta.env.DEV) {
        try {
          const w = window as unknown as {
            __adEngine?: AdEngine;
            __activeSession?: typeof activeSession;
          };
          delete w.__adEngine;
          delete w.__activeSession;
        } catch {}
      }
    };
  }, [engine]);

  const value = React.useMemo<AdContextValue>(() => ({ engine }), [engine]);

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}

function useEngine(): AdEngine {
  const ctx = React.useContext(AdContext);
  if (!ctx) {
    throw new Error("useAdEngine must be used inside <AdProvider>");
  }
  return ctx.engine;
}

/**
 * Subscribe to engine state. `useSyncExternalStore` keeps the rendered view
 * in lockstep with the engine snapshot and is SSR-safe — the third arg is
 * the server snapshot, identical here because the engine starts closed.
 */
function useAdState(): AdState {
  const engine = useEngine();
  return React.useSyncExternalStore(
    engine.subscribe,
    engine.getSnapshot,
    engine.getSnapshot,
  );
}

export function useAdEngine() {
  const engine = useEngine();
  const state = useAdState();

  const triggerAd = React.useCallback(
    (event: AdTriggerEvent) => engine.trigger(event),
    [engine],
  );
  const dismiss = React.useCallback(() => engine.dismiss(), [engine]);
  const markFailed = React.useCallback(
    (reason: string) => engine.markFailed(reason),
    [engine],
  );

  return { state, triggerAd, dismiss, markFailed, engine };
}

/**
 * Read route-level ad gates and push them into the engine. Any match whose
 * `handle.ads.interruptible` is `false` blocks ads while it's active —
 * route-level escape hatch for focused flows (tools, future onboarding).
 *
 * Lives in its own component so it can use `useMatches()` without forcing
 * the whole AdProvider to re-render on every route change.
 */
export function RouteAdGate() {
  const matches = useMatches();
  const engine = useEngine();
  const interruptible = React.useMemo(
    () =>
      matches.every((m) => {
        const handle = m.handle as AdRouteHandle | undefined;
        return handle?.ads?.interruptible !== false;
      }),
    [matches],
  );

  React.useEffect(() => {
    engine.setRouteInterruptible(interruptible);
    // The accumulator also pauses on uninterruptible routes — time spent
    // in /tools/* shouldn't earn ads on the *next* navigation.
    activeSession.setRouteInterruptible(interruptible);
  }, [engine, interruptible]);

  return null;
}
