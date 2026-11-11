/**
 * DriveRush home. The Model Town Board comes first, because it is what most
 * learners are after: the hero is the board itself, one tap from driving. The
 * road signs are second: both sign trainers side by side, a ten-sign check for
 * anyone who wants to test themselves first, and a short section on why the
 * method works.
 */
import type { Route } from "./+types/home";

import { ogCardAlt, ogCardPath } from "~/lib/og-cards";
import { SIGN_COUNT } from "~/lib/road-signs";
import {
  BOARD_KEYWORDS,
  organizationLd,
  pageMeta,
  ROAD_SIGN_KEYWORDS,
  websiteLd,
} from "~/lib/site";

import { useBoardPage } from "~/components/board/use-board-page";
import { Rail } from "~/components/brand/rail";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";
import { HomeGuides } from "~/components/home/home-guides";
import { HomeHero } from "~/components/home/home-hero";
import { HomeMethod } from "~/components/home/home-method";
import { HomeSigns } from "~/components/home/home-signs";
import { SignCheck } from "~/components/home/sign-check";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: "Model Town Board practice and Kenya road signs",
      description: `Practise the Model Town Board online and memorise ${SIGN_COUNT} Kenyan road signs for your NTSA test. Free, no signup.`,
      path: "/",
      extraKeywords: [...BOARD_KEYWORDS, ...ROAD_SIGN_KEYWORDS],
      ogImage: ogCardPath("board"),
      ogImageAlt: ogCardAlt("board"),
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
  useBoardPage();
  return (
    <>
      <SiteNav />
      <main className="min-h-screen text-ink">
        <Rail />
        <HomeHero />
        <HomeSigns />
        <SignCheck />
        <HomeMethod />
        <HomeGuides />
      </main>
      <SiteFooter />
    </>
  );
}
