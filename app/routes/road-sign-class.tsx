/**
 * `/road-signs/warning-signs`, `/mandatory-signs` and `/prohibitory-signs`: a
 * guide to one class of sign, then every sign in it. One file serves all three
 * routes (see `routes.ts`); the path picks the class. The text is MDX in
 * `app/guides/`, the list comes from the chart's data.
 */
import type * as React from "react";

import type { Route } from "./+types/road-sign-class";

import WarningBody from "~/guides/warning-signs.mdx";
import MandatoryBody from "~/guides/mandatory-signs.mdx";
import ProhibitoryBody from "~/guides/prohibitory-signs.mdx";

import type { SignCategoryId } from "~/lib/image-focus";
import { signClassPageByPath } from "~/lib/sign-class-pages";
import { breadcrumbLd, graphLd, guideLd, pageMeta } from "~/lib/site";

import { GuideLayout } from "~/components/brand/guide-layout";
import {
  LearnerScene,
  OpenRoadScene,
  RoadClosedScene,
} from "~/components/brand/art/scenes";

const BODIES: Partial<Record<SignCategoryId, React.ComponentType>> = {
  warning: WarningBody,
  mandatory: MandatoryBody,
  prohibitory: ProhibitoryBody,
};

const ART: Partial<Record<SignCategoryId, React.ReactNode>> = {
  warning: <OpenRoadScene />,
  mandatory: <LearnerScene />,
  prohibitory: <RoadClosedScene />,
};

export function loader({ request }: Route.LoaderArgs) {
  const page = signClassPageByPath(new URL(request.url).pathname);
  if (!page) throw new Response("Not found", { status: 404 });
  return { path: page.path };
}

export function meta({ data }: Route.MetaArgs) {
  const page = data && signClassPageByPath(data.path);
  if (!page) return [{ title: "Not found · DriveRush Kenya" }];
  return [
    ...pageMeta({
      title: page.title,
      description: page.description,
      path: page.path,
    }),
    graphLd(
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Road signs", url: "/road-signs" },
        { name: page.name, url: page.path },
      ]),
      guideLd({
        title: page.title,
        description: page.description,
        path: page.path,
        checked: page.checked,
      }),
    ),
  ];
}

export default function RoadSignClass({ loaderData }: Route.ComponentProps) {
  const page = signClassPageByPath(loaderData.path)!;
  const Body = BODIES[page.category]!;
  return (
    <GuideLayout
      art={ART[page.category]}
      kicker={`Road signs · ${page.name}`}
      title={page.heading}
      lede={page.lede}
      checked={page.checked}
    >
      <Body />
    </GuideLayout>
  );
}
