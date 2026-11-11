/**
 * The Model Town Board guides under `/model-town-board/`: questions and
 * answers, the roundabout's lanes, the rules, and parking. One file serves all
 * four routes (see `routes.ts`); the path picks the guide. Their titles and
 * descriptions are in `lib/board-guides.ts` and their text is MDX in
 * `app/guides/`. Each one opens with a way into the trainer.
 */
import type * as React from "react";

import type { Route } from "./+types/board-guide";

import ParkingBody from "~/guides/board-parking.mdx";
import QuestionsBody from "~/guides/board-questions.mdx";
import RoundaboutBody from "~/guides/board-roundabout.mdx";
import RulesBody from "~/guides/board-rules.mdx";

import {
  BOARD_CHECKED,
  BOARD_PATH,
  boardGuideByPath,
  type BoardGuideId,
} from "~/lib/board-guides";
import { ogCardAlt, ogCardPath } from "~/lib/og-cards";
import {
  BOARD_KEYWORDS,
  breadcrumbLd,
  graphLd,
  guideLd,
  pageMeta,
} from "~/lib/site";

import { BoardStartCard } from "~/components/board/board-start-card";
import { GuideLayout } from "~/components/brand/guide-layout";

const BODIES: Record<BoardGuideId, React.ComponentType> = {
  questions: QuestionsBody,
  roundabout: RoundaboutBody,
  rules: RulesBody,
  parking: ParkingBody,
};

export function loader({ request }: Route.LoaderArgs) {
  const guide = boardGuideByPath(new URL(request.url).pathname);
  if (!guide) throw new Response("Not found", { status: 404 });
  return { path: guide.path };
}

export function meta({ data }: Route.MetaArgs) {
  const guide = data && boardGuideByPath(data.path);
  if (!guide) return [{ title: "Not found · DriveRush Kenya" }];
  return [
    ...pageMeta({
      title: guide.title,
      description: guide.description,
      path: guide.path,
      extraKeywords: BOARD_KEYWORDS,
      ogImage: ogCardPath("board"),
      ogImageAlt: ogCardAlt("board"),
    }),
    graphLd(
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Model Town Board", url: BOARD_PATH },
        { name: guide.name, url: guide.path },
      ]),
      guideLd({
        title: guide.title,
        description: guide.description,
        path: guide.path,
        checked: BOARD_CHECKED,
      }),
    ),
  ];
}

export default function BoardGuide({ loaderData }: Route.ComponentProps) {
  const guide = boardGuideByPath(loaderData.path)!;
  const Body = BODIES[guide.id];
  return (
    <GuideLayout
      kicker={`Model Town Board · ${guide.name}`}
      title={guide.title}
      lede={guide.lede}
      checked={BOARD_CHECKED}
      lead={<BoardStartCard />}
    >
      <Body />
    </GuideLayout>
  );
}
