import * as React from "react";

import { LoadingPanel } from "~/components/brand/traffic-loader";
import { PROVIDER_LOAD_TIMEOUT_MS } from "~/lib/ads/ad-constants";
import { useAdEngine } from "~/lib/ads/ad-context";
import type { AdSlotId } from "~/lib/ads/ad-types";

import "./ad-renderer.css";

/**
 * Provider-agnostic surface for an ad impression.
 *
 * The renderer:
 *   - Hands the provider a DOM node to paint into; cleans up on unmount.
 *   - Forces a fresh DOM node per impression via `key={triggerSeq}` on the
 *     host container — defeats AdSense's "this <ins> already has an ad"
 *     warning when the same slot fires twice in a tab.
 *   - Shows the brand loader while the provider warms up, and falls back
 *     to "Ad unavailable" if nothing paints within the load timeout.
 */

type AdRendererProps = {
  slot: AdSlotId;
  /** Bumps every time the engine opens a new impression — forces remount. */
  triggerSeq: number;
};

export function AdRenderer({ slot, triggerSeq }: AdRendererProps) {
  const { engine, markFailed } = useAdEngine();
  const [phase, setPhase] = React.useState<"loading" | "rendered" | "failed">(
    "loading",
  );
  const hostRef = React.useRef<HTMLDivElement | null>(null);

  // Mount the provider into our host node once it's available. The cleanup
  // tears down the provider DOM so the next impression starts clean. Because
  // the parent keys on `triggerSeq`, this effect re-runs per impression.
  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setPhase("loading");
    let cleanup: (() => void) | null = null;
    try {
      cleanup = engine.provider.renderInto(host, slot);
    } catch {
      setPhase("failed");
      markFailed("render_threw");
      return;
    }
    // Mock provider paints synchronously; real AdSense fills async. Either
    // way, we trust the provider to have at least *attempted* paint — we
    // flip to "rendered" right away. The watchdog below catches no-fill.
    setPhase("rendered");
    return () => {
      cleanup?.();
    };
  }, [engine, slot, triggerSeq, markFailed]);

  // Watchdog. If AdSense never marks the <ins> as filled inside the timeout
  // we close the modal and surface a failure event. Mock provider always
  // satisfies the check immediately (its placeholder div is its own signal).
  React.useEffect(() => {
    if (phase !== "rendered") return;
    const host = hostRef.current;
    if (!host) return;
    const filled = () => {
      const ins = host.querySelector<HTMLElement>("ins.adsbygoogle");
      if (!ins) {
        // Mock provider path — its placeholder counts as filled.
        return host.querySelector("[data-mock-ad]") != null;
      }
      return ins.getAttribute("data-adsbygoogle-status") === "done";
    };
    if (filled()) return;
    const t = window.setTimeout(() => {
      if (!filled()) {
        setPhase("failed");
        markFailed("timeout");
      }
    }, PROVIDER_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [phase, triggerSeq, markFailed]);

  return (
    <div className="dr-ad-renderer" data-slot={slot}>
      {/* Mandatory user-visible label adjacent to the unit — AdSense policy
          requires clear distinction from content. */}
      <div className="dr-ad-renderer__label">Advertisement</div>

      <div className="dr-ad-renderer__surface" aria-live="polite">
        {/* The host that the provider paints into. Keyed so each impression
            gets a guaranteed-clean DOM node. */}
        <div
          key={triggerSeq}
          ref={hostRef}
          className="dr-ad-renderer__host"
          data-state={phase}
        />
        {phase === "loading" && (
          <div className="dr-ad-renderer__loader">
            <LoadingPanel label="Loading…" size="sm" />
          </div>
        )}
        {phase === "failed" && (
          <div className="dr-ad-renderer__fallback">
            <p>Ad unavailable.</p>
            <p>Carrying on…</p>
          </div>
        )}
      </div>
    </div>
  );
}
