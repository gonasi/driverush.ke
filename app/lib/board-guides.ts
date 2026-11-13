/**
 * The Model Town Board's pages: the trainer at `/model-town-board`, and the
 * guides under it that each answer one thing learners search for. The text of
 * each guide is MDX in `app/guides/board-*.mdx`; this file is their titles and
 * descriptions, read by the routes, the nav, the footer and the sitemap.
 *
 * Everything in them comes from the NTSA learner handbook's Unit 3. Where the
 * handbook is silent or a driving school has yet to confirm a rule, the page
 * says so.
 */

export const BOARD_PATH = "/model-town-board";
/** The game on its own: nothing but the table. Every way in links here. */
export const BOARD_PLAY_PATH = `${BOARD_PATH}/play`;

/**
 * Every level of the course, as pictures to pick from. The Board page starts
 * or carries on the course; this is where a learner jumps to any level.
 */
export const BOARD_LEVELS_PATH = `${BOARD_PATH}/levels`;
export const BOARD_LEVELS_TITLE = "All 52 Model Town Board levels";
export const BOARD_LEVELS_DESCRIPTION =
  "Every level of the Model Town Board course, with a picture of each: lanes, the roundabout, routes, blocked roads and parking. Free, every level open.";
/** The game opened on one level of the course. */
export const levelHref = (id: string) => `${BOARD_PLAY_PATH}?level=${id}`;

/** Bump when the board's paint or a level's route changes, so pictures reload. */
const LEVEL_PICTURES = "1";
/** A level's picture: the flat board, zoomed to what the level uses. */
export const levelPictureHref = (id: string) =>
  `${BOARD_LEVELS_PATH}/${id}.svg?v=${LEVEL_PICTURES}`;

/**
 * Every board question with its answer, as a PDF to print. Made by
 * `npm run build:board-pdf` from `/tools/og?print=board-questions`.
 */
export const BOARD_QUESTIONS_PDF = "/downloads/model-town-board-questions.pdf";

/** The date the board pages were last checked against their sources. */
export const BOARD_CHECKED = "2026-11-11";

export type BoardGuideId =
  | "diagram"
  | "lane-options"
  | "questions"
  | "roundabout"
  | "rules"
  | "parking";

export type BoardGuide = {
  id: BoardGuideId;
  path: string;
  /** Short name, for links, the footer and the breadcrumb. */
  name: string;
  /** The page's title in search results. */
  title: string;
  description: string;
  /** The line under the heading on the page. */
  lede: string;
  /** One line for a card that links here. */
  blurb: string;
  /** The date the page first went live. It never moves. */
  published: string;
};

export const BOARD_GUIDES: readonly BoardGuide[] = [
  {
    id: "diagram",
    path: `${BOARD_PATH}/diagram`,
    name: "Labelled diagram",
    title: "Model Town Board diagram, labelled",
    description:
      "A labelled diagram of the Model Town Board: every road, lane number, line and parking bay, and how the lanes are numbered from the kerb.",
    lede: "The whole board from above, with every part named, then the roundabout and the parking zone up close.",
    blurb: "Every road, lane, line and bay on the board, named.",
    published: "2026-11-11",
  },
  {
    id: "lane-options",
    path: `${BOARD_PATH}/lane-options`,
    name: "Lane options",
    title: "Model Town Board lane options: 2124 and 215",
    description:
      "Model Town Board lane options for both roads: what 2124 and 215 mean, which lane turns left, goes straight, turns right or comes back, with diagrams.",
    lede: "Each lane into the roundabout has its own options. Here is every one, on both roads, with the line each car takes.",
    blurb: "2124 and 215: which lane may take which turn.",
    published: "2026-11-11",
  },
  {
    id: "questions",
    path: `${BOARD_PATH}/questions`,
    name: "Questions and answers",
    title: "Model Town Board questions and answers (60+)",
    description:
      "60+ Model Town Board questions with answers: lanes, the roundabout, routes, signs and parking, each from the NTSA handbook. Free PDF to print.",
    lede: "The questions learners get asked on the board, with the rule behind each answer. Try each one before you open it.",
    blurb: "Lanes, the roundabout, routes and parking, each with its rule.",
    published: "2026-11-11",
  },
  {
    id: "roundabout",
    path: `${BOARD_PATH}/roundabout`,
    name: "Roundabout rules",
    title: "Model Town Board roundabout rules",
    description:
      "The Model Town Board roundabout rules: go round clockwise, the five things you must not do on it, who may go all the way round, and how to leave.",
    lede: "Pick your lane before the roundabout, stay in it all the way round, and leave in it at your exit. These are the rules once you are on it.",
    blurb: "Clockwise, no stopping or changing lanes, and leaving right.",
    published: "2026-11-11",
  },
  {
    id: "rules",
    path: `${BOARD_PATH}/rules`,
    name: "The rules",
    title: "Model Town Board rules",
    description:
      "The Model Town Board rules in one place: the three route rules, lane numbers, continuous and broken lines, kerbs, stop and give way.",
    lede: "Every rule on the board comes down to a few ideas: the right route, the right lane, and obeying what is painted and posted.",
    blurb: "The route rules, lane numbers, lines, kerbs, stop and give way.",
    published: "2026-11-11",
  },
  {
    id: "parking",
    path: `${BOARD_PATH}/parking`,
    name: "Parking",
    title: "Model Town Board parking: angle and flush",
    description:
      "How to park on the Model Town Board: angle bays nose in and reverse out, flush boxes reverse in, and when you may use the parking zone.",
    lede: "The board has two kinds of parking, and a rule about when you may drive through the parking area at all.",
    blurb: "Angle and flush parking, and when to use the parking area.",
    published: "2026-11-11",
  },
];

export function boardGuideByPath(path: string): BoardGuide | undefined {
  const clean = path.replace(/\/+$/, "");
  return BOARD_GUIDES.find((guide) => guide.path === clean);
}
