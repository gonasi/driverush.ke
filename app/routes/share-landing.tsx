/**
 * `/s` — where every shared achievement link lands.
 *
 * Three jobs, in order of importance:
 *
 *  1. **Never dead-end.** Chat apps clip URLs, people retype them, and old
 *     links outlive the format that made them. Any payload we can't read
 *     renders a friendly card with real entry points instead of a 404, and
 *     that path is the default, not the exception (see `resolveShare`).
 *  2. **Say something in the preview.** The loader resolves the payload on the
 *     server so `meta()` can put the actual claim into the `og:` tags. A
 *     WhatsApp forward shows "They recalled 10 signs…", not a generic site card.
 *  3. **Convert.** One primary button, aimed at the exact thing the sharer
 *     did, with no signup in the way.
 *
 * `noindex, follow`: these are parameterised, near-duplicate pages that would
 * only dilute the real content in search, but the links out of them should
 * still pass equity.
 */
import { Link } from "react-router";
import * as React from "react";
import { Icon } from "~/components/brand/icon";
import { ArrowRightIcon } from "~/components/brand/icons";
import { SignIcon } from "~/components/brand/art/sign-glyphs";

import type { Route } from "./+types/share-landing";

import { analytics } from "~/lib/analytics";
import { OG_CARDS, OG_HEIGHT, OG_WIDTH, ogCardPath } from "~/lib/og-cards";
import { SIGN_GAMES } from "~/lib/road-signs";
import { resolveShare, SHARE_OG_CARD, shareLandingMeta } from "~/lib/share";
import { absUrl, SITE } from "~/lib/site";

import { Button } from "~/components/ui/button";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";

export function loader({ request }: Route.LoaderArgs) {
  const params = new URL(request.url).searchParams;
  return { resolved: resolveShare(params) };
}

export function meta({ data }: Route.MetaArgs) {
  const resolved = data?.resolved;
  const { title, description } = shareLandingMeta(
    resolved ?? {
      valid: false,
      kind: "unknown",
      headline: "",
      detail: SITE.description,
      ctaHref: "/",
      ctaLabel: "",
    },
  );
  // The card matches what was shared: a Pelican run previews sign artwork, a
  // 3D run previews the models. Falls back to the site card when the payload
  // couldn't be read.
  const cardId = SHARE_OG_CARD[resolved?.kind ?? "unknown"] ?? "default";
  const card = OG_CARDS.find((c) => c.id === cardId);
  const ogImage = absUrl(ogCardPath(cardId));
  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "noindex, follow" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: String(OG_WIDTH) },
    { property: "og:image:height", content: String(OG_HEIGHT) },
    ...(card ? [{ property: "og:image:alt", content: card.alt }] : []),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
  ];
}

export default function ShareLanding({ loaderData }: Route.ComponentProps) {
  const { resolved } = loaderData;

  React.useEffect(() => {
    analytics.shareLandingViewed({
      kind: resolved.kind,
      valid: resolved.valid,
    });
  }, [resolved.kind, resolved.valid]);

  return (
    <>
      <SiteNav />
      <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-9 sm:py-20">
        <div className="grid justify-items-center gap-6 border-2 border-ink bg-surface px-6 py-12 text-center shadow-stamp sm:px-10">
          {resolved.valid && (
            <SignIcon name="finish" size={64} />
          )}
          <div>
            <p className="m-0 font-mono text-[11px] uppercase tracking-widest text-ink-3">
              {resolved.valid ? "Shared with you" : "Sent to you"}
            </p>
            <h1 className="m-0 mt-2 font-display text-[clamp(26px,5vw,42px)] font-extrabold uppercase leading-[0.95] tracking-tight text-ink">
              {resolved.headline}
            </h1>
          </div>
          <p className="m-0 max-w-lg font-serif text-[17px] leading-snug text-ink-2">
            {resolved.detail}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="rush" size="lg" asChild>
              <Link to={resolved.ctaHref}>
                {resolved.ctaLabel}
                <Icon
                  icon={ArrowRightIcon}
                  size={16}
                />
              </Link>
            </Button>
            <Button variant="paper" size="lg" asChild>
              <Link to="/">See what DriveRush is</Link>
            </Button>
          </div>
        </div>

        {/* Every landing, valid or not, offers the full set of front doors.
            A broken payload should still leave someone with somewhere to go. */}
        <section className="mt-10">
          <h2 className="m-0 mb-4 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Free, no signup
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ENTRY_POINTS.map((e) => (
              <Link
                key={e.href}
                to={e.href}
                className="grid gap-1.5 border-2 border-ink bg-surface p-5 shadow-stamp-sm outline-none transition-colors hover:bg-paper-3 focus-visible:bg-paper-3"
              >
                <span className="font-display text-[15px] font-extrabold uppercase leading-tight tracking-tight text-ink">
                  {e.title}
                </span>
                <span className="text-[13px] leading-snug text-ink-2">
                  {e.blurb}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

const ENTRY_POINTS = [
  {
    href: "/model-town-board",
    title: "Model Town Board",
    blurb: "Learn the lanes and the roundabout level by level, then drive them.",
  },
  ...SIGN_GAMES.map((game) => ({
    href: game.to,
    title: game.title,
    blurb: game.blurb,
  })),
];
