/**
 * Chrome for the permanent guides (NTSA test, Model Town Board, driving schools).
 * The trainers stay one tap away near the top, because the guides are how people
 * arrive and the signs are what we want them doing. The body is MDX, so plain
 * markdown picks up the same styling as the blog.
 */
import * as React from "react";
import { Link } from "react-router";

import { SITE } from "~/lib/site";
import { Button } from "~/components/ui/button";
import { Rail } from "~/components/brand/rail";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";
import { InlineAd } from "~/components/brand/inline-ad";
import { ScenePlate } from "~/components/brand/art/scenes";

/** "2026-11-05" reads as "5 November 2026", without a timezone shifting the day. */
function formatChecked(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function GuideLayout({
  kicker,
  title,
  lede,
  checked,
  dateLabel = "Checked",
  showTrainers = true,
  showAd = true,
  art,
  lead,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  lede: string;
  /** ISO date the facts on the page were last checked. */
  checked: string;
  dateLabel?: string;
  showTrainers?: boolean;
  /** In-content ad after the body. Off for pages like privacy and about. */
  showAd?: boolean;
  /** A scene from `art/scenes`, beside the lede on tablet and up. */
  art?: React.ReactNode;
  /** The thing to do on this page, shown above the reading. */
  lead?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen text-ink">
        <Rail />
        <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-6 sm:px-9 sm:pt-10">
          <header className="border-b-2 border-ink pb-7">
            <p className="m-0 flex flex-wrap justify-between gap-x-4 gap-y-1 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              <span>{kicker}</span>
              <span>
                By{" "}
                <Link to="/about" className="hover:text-ink hover:underline">
                  {SITE.byline}
                </Link>{" "}
                · {dateLabel} {formatChecked(checked)}
              </span>
            </p>
            <h1 className="m-0 mt-4 font-display text-[clamp(34px,6.4vw,64px)] font-extrabold uppercase leading-[0.94] tracking-tighter [&_em]:font-serif [&_em]:font-normal [&_em]:normal-case [&_em]:italic [&_em]:text-rush">
              {title}
            </h1>
            <div className="mt-4 sm:grid sm:grid-cols-[1fr_minmax(0,240px)] sm:items-end sm:gap-6">
              <p className="m-0 font-serif text-[clamp(17px,2.2vw,21px)] leading-snug text-ink-2">
                {lede}
              </p>
              {/* Phones skip the art so the trainers stay near the top. */}
              {art && (
                <ScenePlate className="hidden sm:block">{art}</ScenePlate>
              )}
            </div>
          </header>

          {lead && <div className="mt-5">{lead}</div>}

          {showTrainers && (
            <aside className="mt-5 flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-paper-2 px-4 py-3 sm:px-5">
              <p className="m-0 text-[14px] leading-snug text-ink">
                Learning the signs? Free, no signup.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="rush" size="sm" asChild>
                  <Link to="/road-signs/pelican">Pelican chart</Link>
                </Button>
                <Button variant="paper" size="sm" asChild>
                  <Link to="/road-signs/3d">3D signs</Link>
                </Button>
              </div>
            </aside>
          )}

          <article className="pt-4">{children}</article>
          {showAd && <InlineAd />}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
