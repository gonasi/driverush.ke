/**
 * The Model Town Board guides under `/model-town-board/`: the diagram, lane
 * options, questions and answers, the roundabout, the rules, and parking. One
 * file serves all their routes (see `routes.ts`); the path picks the guide. Their titles and
 * descriptions are in `lib/board-guides.ts` and their text is MDX in
 * `app/guides/`. Each one opens with a way into the trainer.
 */
import type * as React from "react";
import { Link } from "react-router";

import type { Route } from "./+types/board-guide";

import DiagramBody from "~/guides/board-diagram.mdx";
import LaneOptionsBody from "~/guides/board-lane-options.mdx";
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
  diagram: DiagramBody,
  "lane-options": LaneOptionsBody,
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
        published: guide.published,
        checked: BOARD_CHECKED,
        image: ogCardPath("board"),
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
      lead={
        <>
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3"
          >
            <Link to={BOARD_PATH} className="hover:text-ink hover:underline">
              Model Town Board
            </Link>
            <span aria-hidden>/</span>
            <span aria-current="page">{guide.name}</span>
          </nav>
          <BoardStartCard />
        </>
      }
    >
      <Body />
    </GuideLayout>
  );
}
