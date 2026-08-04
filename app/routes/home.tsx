/**
 * DriveRush home — value-first, no marketing chrome. A learner sees a live
 * road-sign challenge or a "Continue Lesson X" card within one screen, three
 * paths under it (Train · Test · Master), and nothing else above the footer.
 *
 * Everything that used to be marketing pitch (Features tiles, Principles,
 * Final CTA, the big Pricing block) was stripped after the IA review. The
 * tagline "Free forever, no signup" lives in the hero badge row — no
 * dedicated section needed.
 */
import * as React from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02FreeIcons,
  PlayCircleFreeIcons,
  RoadLocation01FreeIcons,
  ThreeDViewFreeIcons,
  TrafficLightFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/home";

import { absUrl, organizationLd, pageTitle, SITE, websiteLd } from "~/lib/site";
import { cn } from "~/lib/utils";

import { Rail } from "~/components/brand/rail";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";
import { HomeHero } from "~/components/home/home-hero";

export function meta(_: Route.MetaArgs) {
  const title = pageTitle(
    "Learn to drive in Kenya: free road signs & NTSA prep",
  );
  const description =
    "Free road-sign trainers, NTSA practice tests and a full Class B course, built for Kenyan roads. No signup to start.";
  const url = absUrl("/");
  const ogImage = absUrl(SITE.ogImage);

  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: String(SITE.ogImageWidth) },
    { property: "og:image:height", content: String(SITE.ogImageHeight) },
    { property: "og:image:alt", content: `${SITE.name} logo` },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@graph": [stripContext(organizationLd()), stripContext(websiteLd())],
      },
    },
  ];
}

function stripContext<T extends { "@context"?: unknown }>(
  obj: T,
): Omit<T, "@context"> {
  const { "@context": _ctx, ...rest } = obj;
  return rest;
}

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen text-ink">
        <Rail />
        <HomeHero />
        <MoreDrills />
      </main>
      <SiteFooter />
    </>
  );
}

/* =============================================================
   "More drills" — secondary entry points kept available but
   demoted into a single collapsed strip so the hero stays clean.
   The four cards here are the previous QUICK_LANE collapsed into
   a tighter row.
   ============================================================= */

const MORE_DRILLS = [
  {
    to: "/road-signs/3d",
    icon: ThreeDViewFreeIcons,
    title: "Spin signs in 3D",
    copy: "Read a sign from any angle.",
  },
  {
    to: "/practice?mode=quick",
    icon: PlayCircleFreeIcons,
    title: "Quick 5",
    copy: "Five questions, no timer.",
  },
  {
    to: "/practice?mode=challenge",
    icon: TrafficLightFreeIcons,
    title: "Scenarios",
    copy: "Right-of-way from real junctions.",
  },
  {
    to: "/road-signs",
    icon: RoadLocation01FreeIcons,
    title: "Every sign",
    copy: "Browse the full chart by class.",
  },
];

function MoreDrills() {
  return (
    <section className="border-t-2 border-dashed border-ink py-8 sm:py-10">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-9">
        <details className="group">
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center justify-between gap-3",
              "font-mono text-[11px] uppercase tracking-widest text-ink-3 outline-none",
              "hover:text-ink focus-visible:text-ink",
            )}
          >
            <span>More drills · five-minute lanes</span>
            <HugeiconsIcon
              icon={ArrowRight02FreeIcons}
              size={14}
              strokeWidth={2.5}
              className="transition-transform duration-150 group-open:rotate-90"
            />
          </summary>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MORE_DRILLS.map((d) => (
              <Link
                key={d.to}
                to={d.to}
                className="group flex items-start gap-3 border-2 border-ink bg-surface p-4 shadow-stamp-sm outline-none transition-[transform,box-shadow] duration-100 ease-snap hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush"
              >
                <span
                  className="inline-flex size-9 shrink-0 items-center justify-center border-2 border-ink bg-paper-3 text-ink"
                  aria-hidden="true"
                >
                  <HugeiconsIcon icon={d.icon} size={16} strokeWidth={2.25} />
                </span>
                <span className="grid gap-1">
                  <span className="font-display text-[14px] font-extrabold uppercase leading-tight tracking-tight text-ink">
                    {d.title}
                  </span>
                  <span className="text-[12.5px] leading-snug text-ink-2">
                    {d.copy}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
