import * as React from "react";

/**
 * UTM plumbing — one place for the campaign vocabulary, link tagging, and the
 * inbound capture that feeds session attribution into our GA events.
 *
 * Two flows:
 *  - **Outbound** — `addUtm(url, params)` appends `utm_*` query keys to a link
 *    we ship out (partner cards, share buttons, the /tools/share builder).
 *  - **Inbound** — `useUtmCapture()` reads `utm_*` off the landing URL once
 *    on mount and persists them to sessionStorage. The analytics emitter
 *    then merges those onto every event as `session_utm_*` params so custom
 *    GA reports can break down conversions by source/campaign even when
 *    GA4's session source rolls up differently.
 */

/** Canonical channel presets. Pairs of source+medium that match GA4 defaults. */
export const UTM_CHANNELS = {
  twitter: { source: "twitter", medium: "social" },
  instagram: { source: "instagram", medium: "social" },
  facebook: { source: "facebook", medium: "social" },
  tiktok: { source: "tiktok", medium: "social" },
  whatsapp: { source: "whatsapp", medium: "social" },
  linkedin: { source: "linkedin", medium: "social" },
  youtube: { source: "youtube", medium: "social" },
  email: { source: "email", medium: "email" },
  partner: { source: "partner", medium: "referral" },
  press: { source: "press", medium: "referral" },
  qr: { source: "qr", medium: "offline" },
  paid_search: { source: "google", medium: "cpc" },
  paid_social: { source: "meta", medium: "paidsocial" },
} as const;

export type UtmChannel = keyof typeof UTM_CHANNELS;

/** Campaign names we use across links. Free-form strings work too, but lean on
 *  these so reports don't fragment from typos (`launch` vs `Launch`). */
export const UTM_CAMPAIGNS = [
  "launch",
  "road_signs_trainer",
  "free_practice",
  "ntsa_prep",
  "partner_share",
  "premium_upsell",
  "social_organic",
] as const;

export type UtmCampaign = (typeof UTM_CAMPAIGNS)[number];

export type UtmParams = {
  source: string;
  medium: string;
  campaign?: string;
  term?: string;
  content?: string;
};

const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

/** Build a tagged URL. Returns the original string if `url` won't parse. */
export function addUtm(url: string, params: UtmParams): string {
  try {
    // Second arg lets us parse relative paths (e.g. `/practice`) the same way.
    const u = new URL(url, "https://driverush.ke");
    for (const k of UTM_KEYS) {
      const v = params[k];
      if (v) u.searchParams.set(`utm_${k}`, v);
    }
    return u.toString();
  } catch {
    return url;
  }
}

/** Slugify a free-text label into something safe for utm_campaign. */
export function utmSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Parse `utm_*` keys out of a `?...` search string. */
export function readIncomingUtms(search: string): Partial<UtmParams> {
  const sp = new URLSearchParams(search);
  const out: Partial<UtmParams> = {};
  for (const k of UTM_KEYS) {
    const v = sp.get(`utm_${k}`);
    if (v) out[k] = v;
  }
  return out;
}

const SESSION_KEY = "dr-utm-session";

/** Persist the captured UTMs for the current tab/session. No-op on server. */
export function persistUtms(utms: Partial<UtmParams>) {
  if (typeof window === "undefined") return;
  if (Object.keys(utms).length === 0) return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(utms));
  } catch {
    // sessionStorage can throw in private mode / quota-exceeded — fine to drop.
  }
}

/** Read whatever UTMs were captured this session. Empty object on server. */
export function getPersistedUtms(): Partial<UtmParams> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Partial<UtmParams>) : {};
  } catch {
    return {};
  }
}

/**
 * On first mount, capture `utm_*` off the landing URL and stash them for the
 * session. Subsequent SPA navigations don't re-trigger — we want the *entry*
 * attribution, not later drift.
 */
export function useUtmCapture() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip if we already captured this tab — preserves the original landing
    // source even if the user navigates internally to another utm'd URL.
    if (window.sessionStorage.getItem(SESSION_KEY)) return;
    const utms = readIncomingUtms(window.location.search);
    if (Object.keys(utms).length > 0) persistUtms(utms);
  }, []);
}
