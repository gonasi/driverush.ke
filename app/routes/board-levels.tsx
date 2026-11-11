/**
 * `/model-town-board/levels`: the board course, unit by unit. The parts of the
 * board and the lane rules come first, then the roundabout, routes and
 * parking, each taught before it is driven. Every level links to the game.
 */
import { Link } from "react-router";
import type { Route } from "./+types/board-levels";

import {
  BOARD_CHECKED,
  BOARD_LEVELS_PATH,
  BOARD_PATH,
  BOARD_PLAY_PATH,
} from "~/lib/board-guides";
import { COURSE_LEVELS, UNITS } from "~/lib/board/curriculum";
import { ogCardAlt, ogCardPath } from "~/lib/og-cards";
import {
  BOARD_KEYWORDS,
  breadcrumbLd,
  graphLd,
  guideLd,
  pageMeta,
} from "~/lib/site";

import { BoardGuideLinks } from "~/components/board/board-guide-links";
import { BoardLevels } from "~/components/board/board-levels";
import { GuideLayout } from "~/components/brand/guide-layout";

const TITLE = "Model Town Board levels: learn it step by step";
const DESCRIPTION = `${COURSE_LEVELS.length} free Model Town Board levels in ${UNITS.length - 1} units: the parts of the board, lanes, the roundabout rules, routes and parking. Learn each rule, watch it driven, then drive it yourself.`;

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: BOARD_LEVELS_PATH,
      extraKeywords: BOARD_KEYWORDS,
      ogImage: ogCardPath("board"),
      ogImageAlt: ogCardAlt("board"),
    }),
    graphLd(
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Model Town Board", url: BOARD_PATH },
        { name: "Levels", url: BOARD_LEVELS_PATH },
      ]),
      guideLd({
        title: TITLE,
        description: DESCRIPTION,
        path: BOARD_LEVELS_PATH,
        checked: BOARD_CHECKED,
      }),
    ),
  ];
}

export default function BoardLevelsPage() {
  return (
    <GuideLayout
      kicker="Model Town Board · Levels"
      title={
        <>
          Model Town Board levels. <em>Learn it, then drive it.</em>
        </>
      }
      lede="Start with the parts of the board and the lanes. Then the roundabout, routes and parking: each one explained, shown, and then yours to drive."
      checked={BOARD_CHECKED}
      showTrainers={false}
      lead={<BoardLevels />}
    >
      <h2>How the levels work</h2>
      <ul>
        <li>
          <strong>Learn</strong> levels point at a part of the board and say
          what it is and what it asks of you.
        </li>
        <li>
          <strong>Watch</strong> levels drive a route for you, one step at a
          time, with the rule for each step.
        </li>
        <li>
          <strong>Drive</strong> levels hand you the car. Break a rule and you
          are told which one. You get up to three stars.
        </li>
      </ul>
      <p>
        Nothing is locked. If you only need parking, go straight to the parking
        unit. If you would sooner look around, you can{" "}
        <Link to={`${BOARD_PLAY_PATH}?learn=1`}>explore the board</Link> with
        no level on.
      </p>
      <p>
        The rules come from the NTSA learner handbook, Unit 3. The trainer is
        not the test: at a test centre you move a toy car by hand on a real
        board. The levels are a way to get the rules into your head first.
      </p>
      <h2>More on the board</h2>
      <BoardGuideLinks current="levels" />
    </GuideLayout>
  );
}
