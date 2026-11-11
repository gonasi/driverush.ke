/**
 * DriveRush home. One thing to do first: the Model Town Board, which is what
 * most learners are after, as a picture and a Start driving button that opens
 * the game on its own page. One other choice under it: the road signs, with
 * both trainers side by side. Then why the method works, and the guides, kept
 * short. The ten-sign check lives on the road signs page.
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

import { Rail } from "~/components/brand/rail";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";
import { HomeGuides } from "~/components/home/home-guides";
import { HomeHero } from "~/components/home/home-hero";
import { HomeMethod } from "~/components/home/home-method";
import { HomeSigns } from "~/components/home/home-signs";

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
  return (
    <>
      <SiteNav />
      <main className="min-h-screen text-ink">
        <Rail />
        <HomeHero />
        <HomeSigns />
        <HomeMethod />
        <HomeGuides />
      </main>
      <SiteFooter />
    </>
  );
}
