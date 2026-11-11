/**
 * `/model-town-board`: the board course. One button starts it or carries on,
 * and every unit and level is listed under it. The game is one tap away, on
 * its own page (`/model-town-board/play`). The guide is folded under the
 * levels: still on this page and in the server's HTML, for the learners who
 * arrive searching for how the board works.
 */
import { Link } from "react-router";
import type { Route } from "./+types/model-town-board";

import Body from "~/guides/model-town-board.mdx";
import { BOARD_CHECKED, BOARD_PATH } from "~/lib/board-guides";
import { COURSE_LEVELS, UNITS } from "~/lib/board/curriculum";
import { ogCardAlt, ogCardPath } from "~/lib/og-cards";
import {
  BOARD_KEYWORDS,
  breadcrumbLd,
  graphLd,
  guideLd,
  learningResourceLd,
  pageMeta,
  webAppLd,
} from "~/lib/site";

import { BoardLevels } from "~/components/board/board-levels";
import { useBoardPage } from "~/components/board/use-board-page";
import { BoardPicture } from "~/components/board/board-picture";
import { GuideFold } from "~/components/brand/guide-fold";
import { GuideLayout } from "~/components/brand/guide-layout";

const PATH = BOARD_PATH;
const CHECKED = BOARD_CHECKED;
const TITLE = "Model Town Board Kenya: free online simulator";
const DESCRIPTION = `A free Model Town Board simulator: ${COURSE_LEVELS.length} levels on a 3D board you drive yourself, from the lanes to the roundabout and parking. No signup.`;
/** What the course teaches, unit by unit, for search engines. */
const TEACHES = UNITS.filter((unit) => unit.id !== "mock").map(
  (unit) => unit.title,
);

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
        image: ogCardPath("board"),
        type: "WebPage",
      }),
      webAppLd({
        name: "Model Town Board simulator",
        description:
          "A free 3D Model Town Board simulator for Kenyan learner drivers. You drive a car on the board and are told which rule you broke.",
        path: PATH,
        image: ogCardPath("board"),
      }),
      learningResourceLd({
        name: "Model Town Board course",
        description: `${COURSE_LEVELS.length} levels that teach the Model Town Board, from the parts of the board to parking.`,
        path: PATH,
        teaches: TEACHES,
        lessons: COURSE_LEVELS.length,
        image: ogCardPath("board"),
      }),
    ),
  ];
}

export default function ModelTownBoard() {
  useBoardPage();

  return (
    <GuideLayout
      kicker="Model Town Board Kenya"
      title={
        <>
          Model Town Board <em>simulator.</em>
        </>
      }
      lede={`${COURSE_LEVELS.length} levels on a 3D board you drive yourself, from the lanes to parking. Every rule from the NTSA handbook. Free, no signup, every level open.`}
      checked={CHECKED}
      byline={false}
      lead={<BoardLevels />}
    >
      <section aria-labelledby="on-the-board" className="mt-2">
        <h2 id="on-the-board">What's on the Model Town Board</h2>
        <p>
          The board is a small town on a table: a dual carriageway with four
          lanes each way, a roundabout, a three-lane road, a two-way road, a
          street, and a parking zone. Lane 1 is always the lane by the kerb.{" "}
          <Link to={`${BOARD_PATH}/diagram`}>See the labelled diagram</Link>.
        </p>
        <BoardPicture
          part="whole"
          alt="Diagram of the Model Town Board: the dual carriageway, roundabout, three-lane road, two-way road, street and parking zone, numbered to the list below."
        />
      </section>
      <GuideFold
        id="guide"
        title="Read the guide"
        hint="How the board works, the lane and route rules, and what you are tested on."
      >
        <Body />
      </GuideFold>
    </GuideLayout>
  );
}
