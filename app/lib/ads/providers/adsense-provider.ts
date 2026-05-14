import { AD_CLIENT, AD_SLOTS } from "../ad-constants";
import type { AdProvider, AdSlotId } from "../ad-types";

/**
 * AdSense provider — the only module in the app that knows `adsbygoogle` exists.
 *
 * Architecture choice: manual ad units (no Auto-Ads). The loader script is
 * loaded once; impressions are mounted explicitly inside our controlled modal.
 * This keeps orchestration in our engine and avoids Google overlaying its own
 * interstitials on top of ours.
 *
 * Dev gets the mock provider so flows are testable without real ad traffic.
 */

const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// ---------- real AdSense ----------

class AdsenseProvider implements AdProvider {
  readonly id = "adsense";
  private loadPromise: Promise<void> | null = null;

  initialize(): Promise<void> {
    // Memoised: even if `bootstrap()` is called twice (StrictMode dev, etc.)
    // we never inject the script tag more than once.
    if (this.loadPromise) return this.loadPromise;
    if (typeof window === "undefined" || typeof document === "undefined") {
      return Promise.resolve();
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`,
    );
    if (existing) {
      this.loadPromise = Promise.resolve();
      return this.loadPromise;
    }
    this.loadPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.async = true;
      s.crossOrigin = "anonymous";
      s.src = ADSENSE_SRC;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("adsense_script_failed"));
      document.head.appendChild(s);
    });
    return this.loadPromise;
  }

  canShow(slot: AdSlotId): boolean {
    return Boolean(AD_SLOTS[slot]) && typeof window !== "undefined";
  }

  /**
   * Mount a fresh <ins> into the modal container and push it to AdSense.
   *
   * AdSense's `push({})` processes whatever <ins.adsbygoogle> tags are
   * in the DOM at call time. Re-pushing the same node yields a console
   * warning ("All ins elements ... already have ads"). We avoid that by
   * always creating a brand new <ins> here and tearing it down on cleanup —
   * combined with the React `key={triggerSeq}` on the host container, each
   * impression gets a guaranteed-clean element.
   */
  renderInto(el: HTMLElement, slot: AdSlotId): () => void {
    const slotId = AD_SLOTS[slot];
    if (!slotId) {
      // Belt-and-braces: canShow already filters this, but if a caller
      // bypasses the guard we don't want to push an unconfigured unit.
      return () => {};
    }
    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.style.width = "100%";
    ins.setAttribute("data-ad-client", AD_CLIENT);
    ins.setAttribute("data-ad-slot", slotId);
    ins.setAttribute("data-ad-format", "auto");
    ins.setAttribute("data-full-width-responsive", "true");
    el.appendChild(ins);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Provider tracks failure via the renderer's load watchdog.
    }
    return () => {
      if (ins.parentNode) ins.parentNode.removeChild(ins);
    };
  }
}

// ---------- mock (dev / preview without real slots) ----------

class MockAdProvider implements AdProvider {
  readonly id = "mock";

  initialize(): Promise<void> {
    return Promise.resolve();
  }

  canShow(): boolean {
    return true;
  }

  /**
   * Renders a styled placeholder that mimics an ad's footprint and labels
   * itself clearly. Honours the same lifecycle contract as the real provider
   * (`renderInto` returns a cleanup) so flow code is identical.
   */
  renderInto(el: HTMLElement, slot: AdSlotId): () => void {
    const box = document.createElement("div");
    box.setAttribute("data-mock-ad", "true");
    box.style.cssText = [
      "display:flex",
      "flex-direction:column",
      "align-items:center",
      "justify-content:center",
      "gap:6px",
      "min-height:250px",
      "padding:24px",
      "background:repeating-linear-gradient(45deg, var(--paper-3, #f0ece0), var(--paper-3, #f0ece0) 12px, transparent 12px, transparent 24px)",
      "border:2px dashed var(--ink, #111)",
      "color:var(--ink, #111)",
      "font-family:JetBrains Mono, ui-monospace, monospace",
      "font-size:11px",
      "text-transform:uppercase",
      "letter-spacing:0.12em",
      "text-align:center",
    ].join(";");
    box.innerHTML = `
      <span style="font-weight:700">Mock ad surface</span>
      <span style="opacity:0.65">slot: ${slot}</span>
      <span style="opacity:0.45">flip AD_SLOTS in ad-constants.ts to go live</span>
    `;
    el.appendChild(box);
    return () => {
      if (box.parentNode) box.parentNode.removeChild(box);
    };
  }
}

// ---------- factory ----------

/**
 * Picks the right provider for the build. In PROD with real slot IDs filled
 * in, returns the live AdSense provider; otherwise mock. The engine doesn't
 * care which it gets — they share the same contract.
 */
export function createAdProvider(): AdProvider {
  const isProd = import.meta.env.PROD;
  const hasAnyRealSlot = Object.values(AD_SLOTS).some((v) => v.length > 0);
  if (isProd && hasAnyRealSlot) return new AdsenseProvider();
  return new MockAdProvider();
}
