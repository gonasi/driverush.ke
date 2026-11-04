/**
 * Social sharing: what gets shared, what the link says, and where it lands.
 *
 * Two shapes, on purpose:
 *
 *  - **Achievements** (a finished sign run) link to `/s?…`, a landing page that
 *    restates the result and offers the reader the same challenge. That's the
 *    social-proof loop: the sharer looks good, the reader gets a one-tap entry
 *    point.
 *  - **Content** (a blog post, the road-sign chart) links straight to its own
 *    canonical URL. Wrapping evergreen pages in a share route would only split
 *    their ranking signals.
 *
 * Security note that shapes the whole design: `/s` renders under our branding,
 * so nothing free-text ever crosses the URL. Every parameter is a number. A
 * stranger can fabricate a link claiming a perfect run, which is harmless; they
 * cannot make our page say words they chose.
 */
import type { OgCardId } from "./og-cards";
import { SITE } from "./site";
import { addUtm, UTM_CHANNELS, type UtmChannel } from "./utm";

export type ShareKind = "pelican" | "signs3d" | "page";

export type SharePayload =
  | { kind: "pelican"; total: number; firstTry: number }
  | { kind: "signs3d"; total: number; firstTry: number }
  /** Evergreen page: shared as its own URL, no `/s` hop. */
  | { kind: "page"; path: string; title: string; text: string };

/** What a share button needs: the link to send and the words to send with it. */
export type ShareLink = {
  kind: ShareKind;
  /** Untagged canonical URL. Channel UTMs are added per target at click time. */
  url: string;
  /** Short headline, used as the tweet/WhatsApp lead. */
  title: string;
  /** Longer sentence for channels that take a separate body. */
  text: string;
};

const BASE = SITE.url.replace(/\/$/, "");

/**
 * Build the link + copy for a share. Kept free of em dashes and hype: this
 * text lands in someone's WhatsApp, and it should read like a person wrote it.
 */
export function buildShareLink(payload: SharePayload): ShareLink {
  switch (payload.kind) {
    case "pelican":
    case "signs3d": {
      const { kind, total, firstTry } = payload;
      const params = new URLSearchParams({
        k: kind,
        t: String(total),
        f: String(firstTry),
      });
      const what =
        kind === "pelican" ? "road signs from memory" : "road signs in 3D";
      return {
        kind,
        url: `${BASE}/s?${params}`,
        title: `I recalled ${total} Kenyan ${what}, ${firstTry} on the first try`,
        text: "Free road-sign practice on DriveRush. See how many you get cold.",
      };
    }
    case "page":
      return {
        kind: "page",
        url: `${BASE}${payload.path}`,
        title: payload.title,
        text: payload.text,
      };
  }
}

// ---- channels -------------------------------------------------------------

export type ShareTarget = {
  id: UtmChannel | "copy" | "native";
  label: string;
  /** Absolute href for the channel's composer. `copy`/`native` have none. */
  href?: (link: { url: string; title: string; text: string }) => string;
};

/**
 * Hand-rolled composer URLs rather than a share-button dependency: it's four
 * templates we control, and it lets the buttons wear the site's own square,
 * stamped styling instead of a library's round brand chips. WhatsApp leads
 * because that's how links actually travel in Kenya.
 */
export const SHARE_TARGETS: ShareTarget[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: ({ url, title }) =>
      `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
  },
  {
    id: "twitter",
    label: "X",
    href: ({ url, title }) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    href: ({ url }) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    href: ({ url, title }) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
];

/**
 * Tag the outgoing link so the sitewide UTM capture can attribute the traffic
 * a share actually brings back. `telegram` isn't in the channel presets, so it
 * falls back to a social-medium pair of the same shape.
 */
export function taggedShareUrl(url: string, channel: string): string {
  const preset = UTM_CHANNELS[channel as UtmChannel] ?? {
    source: channel,
    medium: "social",
  };
  return addUtm(url, { ...preset, campaign: "social_share" });
}

// ---- the `/s` landing -----------------------------------------------------

/** Which social card fronts each kind of share. */
export const SHARE_OG_CARD: Record<ShareKind | "unknown", OgCardId> = {
  pelican: "pelican",
  signs3d: "signs3d",
  page: "default",
  unknown: "default",
};

export type ResolvedShare = {
  /** False when the link is broken, truncated or from an older version. */
  valid: boolean;
  kind: ShareKind | "unknown";
  /** Big line on the card. */
  headline: string;
  /** Supporting sentence. */
  detail: string;
  /** Where the "do it yourself" button goes. */
  ctaHref: string;
  ctaLabel: string;
};

/** Every share landing needs somewhere useful to go when the payload is junk. */
const FALLBACK: ResolvedShare = {
  valid: false,
  kind: "unknown",
  headline: "Someone sent you DriveRush",
  detail:
    "Memorise Kenyan road signs for the NTSA test, on the Pelican chart or in 3D. Free, no signup.",
  ctaHref: "/#try-now",
  ctaLabel: "Start training",
};

function int(raw: string | null, max: number): number | null {
  if (raw == null || !/^\d{1,5}$/.test(raw)) return null;
  const n = Number(raw);
  return n > max ? null : n;
}

/**
 * Turn `/s` query params into something we can render. Pure and total: any
 * malformed, missing or hostile input resolves to {@link FALLBACK} rather than
 * throwing, because the one thing a shared link must never do is 404. Links from
 * features that no longer exist (quiz scores, lessons) land here too.
 */
export function resolveShare(params: URLSearchParams): ResolvedShare {
  switch (params.get("k")) {
    case "pelican":
    case "signs3d": {
      const kind = params.get("k") === "pelican" ? "pelican" : "signs3d";
      const total = int(params.get("t"), 500);
      const firstTry = int(params.get("f"), 500);
      if (total == null || total === 0 || firstTry == null || firstTry > total)
        break;
      const how = kind === "pelican" ? "from memory" : "in 3D";
      return {
        valid: true,
        kind,
        headline: `They recalled ${total} Kenyan road signs ${how}`,
        detail: `${firstTry} of ${total} on the first try. Train on the Pelican chart or in 3D, free and no signup.`,
        ctaHref: kind === "pelican" ? "/road-signs/pelican" : "/road-signs/3d",
        ctaLabel: "Try the sign trainer",
      };
    }
  }
  return FALLBACK;
}

/** Head copy for the landing page, so link previews say something real. */
export function shareLandingMeta(resolved: ResolvedShare) {
  return {
    title: resolved.valid
      ? `${resolved.headline} · DriveRush`
      : "DriveRush: memorise Kenyan road signs for free",
    description: resolved.detail,
  };
}
