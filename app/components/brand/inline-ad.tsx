import * as React from "react";

import {
  AD_CLIENT,
  ADSENSE_LIVE,
  INLINE_AD_SLOT,
} from "~/lib/ads/ad-constants";

import "./inline-ad.css";

/**
 * In-content AdSense display unit for reading pages (guides, blog posts, sign
 * pages). Never inside the trainers: the product comes first.
 *
 * Labelled "Advertisement" and set apart from links and buttons so a stray tap
 * can't land on it. If Google has nothing to show, the whole block collapses
 * (see inline-ad.css) instead of leaving an empty box. Renders nothing in dev.
 */
export function InlineAd({ className }: { className?: string }) {
  const insRef = React.useRef<HTMLModElement | null>(null);
  const live = ADSENSE_LIVE && import.meta.env.PROD;

  React.useEffect(() => {
    const ins = insRef.current;
    if (!live || !ins || ins.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Blocked by an ad blocker or the script failed: the slot stays empty.
    }
  }, [live]);

  if (!live) return null;

  return (
    <aside
      className={["dr-inline-ad", className].filter(Boolean).join(" ")}
      aria-label="Advertisement"
    >
      <p className="dr-inline-ad__label">Advertisement</p>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={INLINE_AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
