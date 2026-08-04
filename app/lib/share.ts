/**
 * Social sharing — what gets shared, what the link says, and where it lands.
 *
 * Two shapes, on purpose:
 *
 *  - **Achievements** (a quiz score, a finished sign run, a completed lesson)
 *    link to `/s?…`, a landing page that restates the result and offers the
 *    reader the same challenge. That's the social-proof loop: the sharer looks
 *    good, the reader gets a one-tap entry point.
 *  - **Content** (a blog post, the road-sign chart) links straight to its own
 *    canonical URL. Wrapping evergreen pages in a share route would only split
 *    their ranking signals.
 *
 * Security note that shapes the whole design: `/s` renders under our branding,
 * so nothing free-text ever crosses the URL. Every parameter is a number or an
 * id we resolve against local data (quiz mode, lesson id). A stranger can
 * fabricate a link claiming a 10/10, which is harmless; they cannot make our
 * page say words they chose.
 */
import type { OgCardId } from "./og-cards";
import { MODE_LABELS, type QuizMode } from "./questions";
import { SITE } from "./site";
import { addUtm, UTM_CHANNELS, type UtmChannel } from "./utm";

export type ShareKind = "quiz" | "pelican" | "signs3d" | "lesson" | "page";

export type SharePayload =
  | { kind: "quiz"; mode: QuizMode; correct: number; total: number }
  | { kind: "pelican"; total: number; firstTry: number }
  | { kind: "signs3d"; total: number; firstTry: number }
  | { kind: "lesson"; courseSlug: string; lessonId: string; xp: number }
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

function pct(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

/** The NTSA pass mark, and the line between bragging and daring. */
const PASS_PCT = 70;

function passed(correct: number, total: number): boolean {
  return pct(correct, total) >= PASS_PCT;
}

/**
 * Build the link + copy for a share. Kept free of em dashes and hype: this
 * text lands in someone's WhatsApp, and it should read like a person wrote it.
 */
export function buildShareLink(payload: SharePayload): ShareLink {
  switch (payload.kind) {
    case "quiz": {
      const { mode, correct, total } = payload;
      const params = new URLSearchParams({
        k: "quiz",
        m: mode,
        c: String(correct),
        t: String(total),
      });
      const label = MODE_LABELS[mode].title.toLowerCase();
      // Below the pass mark, leading with the number turns a share into a
      // confession and nobody sends it. Same link, framed as a dare instead.
      const title = passed(correct, total)
        ? `I scored ${correct}/${total} on the NTSA ${label}`
        : `How many of these NTSA questions would you get right?`;
      return {
        kind: "quiz",
        url: `${BASE}/s?${params}`,
        title,
        text: `Free NTSA practice on DriveRush, no signup. ${passed(correct, total) ? "Think you can beat it?" : "Most people miss a few first time."}`,
      };
    }
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
        text: "Free NTSA sign practice on DriveRush. See how many you get cold.",
      };
    }
    case "lesson": {
      const { courseSlug, lessonId, xp } = payload;
      const params = new URLSearchParams({
        k: "lesson",
        cs: courseSlug,
        l: lessonId,
        x: String(xp),
      });
      return {
        kind: "lesson",
        url: `${BASE}/s?${params}`,
        title: `Another lesson down on my NTSA course`,
        text: `${xp} XP on DriveRush. Free lessons built for Kenyan roads.`,
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
  quiz: "quiz",
  pelican: "pelican",
  signs3d: "signs3d",
  lesson: "lesson",
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
    "We couldn't read what they shared, links get clipped by chat apps all the time. Nothing is lost: everything below is free and needs no signup.",
  ctaHref: "/practice?mode=quick",
  ctaLabel: "Start practising",
};

function int(raw: string | null, max: number): number | null {
  if (raw == null || !/^\d{1,5}$/.test(raw)) return null;
  const n = Number(raw);
  return n > max ? null : n;
}

/**
 * Turn `/s` query params into something we can render. Pure and total: any
 * malformed, missing or hostile input resolves to {@link FALLBACK} rather than
 * throwing, because the one thing a shared link must never do is 404.
 *
 * `lookupLessonTitle` is injected so this module stays free of the course
 * manifest (the route passes `getCourse`).
 */
export function resolveShare(
  params: URLSearchParams,
  lookupLessonTitle?: (courseSlug: string, lessonId: string) => string | null,
): ResolvedShare {
  switch (params.get("k")) {
    case "quiz": {
      const mode = params.get("m") as QuizMode | null;
      const correct = int(params.get("c"), 500);
      const total = int(params.get("t"), 500);
      if (!mode || !(mode in MODE_LABELS) || correct == null || total == null)
        break;
      if (total === 0 || correct > total) break;
      const label = MODE_LABELS[mode].title.toLowerCase();
      // Mirror the sharer's framing: a pass is a score to beat, anything else
      // is an open challenge. The reader gets the same CTA either way.
      return passed(correct, total)
        ? {
            valid: true,
            kind: "quiz",
            headline: `They scored ${correct}/${total} on the NTSA ${label}`,
            detail: `That's ${pct(correct, total)}%, above the ${PASS_PCT}% pass mark. Same questions, same rules, free and no signup.`,
            ctaHref: `/practice?mode=${mode}`,
            ctaLabel: "Beat that score",
          }
        : {
            valid: true,
            kind: "quiz",
            headline: `Could you pass the NTSA ${label}?`,
            detail: `Someone just took it and wants to know how you'd do. ${total} questions, ${PASS_PCT}% to pass, free and no signup.`,
            ctaHref: `/practice?mode=${mode}`,
            ctaLabel: "Take the test",
          };
    }
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
        detail: `${firstTry} of ${total} on the first try. Every sign on the NTSA chart, drilled until it sticks.`,
        ctaHref: kind === "pelican" ? "/road-signs/pelican" : "/road-signs/3d",
        ctaLabel: "Try the sign trainer",
      };
    }
    case "lesson": {
      const courseSlug = params.get("cs");
      const lessonId = params.get("l");
      const xp = int(params.get("x"), 10_000);
      if (!courseSlug || !lessonId || xp == null) break;
      // The title comes from our own manifest, never from the URL. An unknown
      // id means the link is stale (or invented) so we fall through.
      const title = lookupLessonTitle?.(courseSlug, lessonId);
      if (!title) break;
      return {
        valid: true,
        kind: "lesson",
        headline: `They finished "${title}"`,
        detail: `${xp} XP on the free NTSA course. Short lessons, built for Kenyan roads, no signup to start.`,
        ctaHref: `/courses/${courseSlug}`,
        ctaLabel: "Start the course",
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
      : "DriveRush: free NTSA practice for Kenyan roads",
    description: resolved.detail,
  };
}
