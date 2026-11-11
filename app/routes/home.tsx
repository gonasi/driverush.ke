/**
 * DriveRush home. One thing to do: the Model Town Board, which is what most
 * learners are after, as a picture and one button that starts the course or
 * carries on with it. One other choice under it: the road signs, as two short
 * rows. Nothing else. The guides are a tab away, and in the footer.
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

import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";
import { HomeHero } from "~/components/home/home-hero";
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
        <HomeHero />
        <HomeSigns />
      </main>
      <SiteFooter />
    </>
  );
}
