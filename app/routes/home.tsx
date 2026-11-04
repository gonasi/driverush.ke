/**
 * DriveRush home. One job: get someone memorising road signs. The hero shows
 * both trainers without scrolling, a ten-sign check sits under them for anyone
 * who wants to test themselves first, and a notice says the Model Town Board is
 * on its way.
 */
import type { Route } from "./+types/home";

import { SIGN_COUNT } from "~/lib/road-signs";
import {
  absUrl,
  organizationLd,
  pageMeta,
  ROAD_SIGN_KEYWORDS,
  websiteLd,
} from "~/lib/site";

import { Rail } from "~/components/brand/rail";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";
import { BoardNotice } from "~/components/home/board-notice";
import { HomeHero } from "~/components/home/home-hero";
import { SignCheck } from "~/components/home/sign-check";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: "Kenya road signs practice: Pelican chart and 3D signs",
      description: `Memorise ${SIGN_COUNT} Kenyan road signs for your NTSA test. Train on the Pelican chart or spin the signs in 3D. Free, no signup.`,
      path: "/",
      extraKeywords: ROAD_SIGN_KEYWORDS,
    }),
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
        <SignCheck />
        <BoardNotice />
      </main>
      <SiteFooter />
    </>
  );
}
