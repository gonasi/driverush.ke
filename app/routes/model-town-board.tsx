/**
 * `/model-town-board`: the way into the board game, with the guide under it.
 * The game is one tap away, on its own page (`/model-town-board/play`), and
 * the guide stays in the server's HTML for the learners who arrive searching
 * for how the board works.
 */
import type { Route } from "./+types/model-town-board";

import Body from "~/guides/model-town-board.mdx";
import { BOARD_CHECKED, BOARD_PATH } from "~/lib/board-guides";
import { ogCardAlt, ogCardPath } from "~/lib/og-cards";
import {
  BOARD_KEYWORDS,
  breadcrumbLd,
  graphLd,
  guideLd,
  pageMeta,
  webAppLd,
} from "~/lib/site";

import { BoardLobby } from "~/components/board/board-lobby";
import { useBoardPage } from "~/components/board/use-board-page";
import { GuideLayout } from "~/components/brand/guide-layout";

const PATH = BOARD_PATH;
const CHECKED = BOARD_CHECKED;
const TITLE = "Model Town Board Kenya: practise it online, free";
const DESCRIPTION =
  "Practise the Model Town Board online, free. Drive it on a table like a driving school's, and learn the lanes, the roundabout rules and the route rules. No signup.";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      extraKeywords: BOARD_KEYWORDS,
      ogImage: ogCardPath("board"),
      ogImageAlt: ogCardAlt("board"),
    }),
    graphLd(
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Model Town Board", url: PATH },
      ]),
      guideLd({
        title: TITLE,
        description: DESCRIPTION,
        path: PATH,
        checked: CHECKED,
      }),
      webAppLd({
        name: "Model Town Board trainer",
        description:
          "A free trainer for the Model Town Board used in Kenyan driving schools. You drive a car on the board and are told which rule you broke.",
        path: PATH,
        image: ogCardPath("board"),
      }),
    ),
  ];
}

export default function ModelTownBoard() {
  useBoardPage();

  return (
    <GuideLayout
      kicker="Trainer · Model Town Board"
      title={
        <>
          Model Town Board. <em>Drive it.</em>
        </>
      }
      lede="Pick your lane, take the roundabout, and stop where the examiner asks. Break a lane rule and you're told which one. Free, no signup."
      checked={CHECKED}
      lead={<BoardLobby />}
    >
      <Body />
    </GuideLayout>
  );
}
