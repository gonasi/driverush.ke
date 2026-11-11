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
 * The course: every unit and level, in the order to take them. It is the
 * Board page itself; the list is the first thing on it.
 */
export const BOARD_LEVELS_PATH = BOARD_PATH;
/** The game opened on one level of the course. */
export const levelHref = (id: string) => `${BOARD_PLAY_PATH}?level=${id}`;

/** The date the board pages were last checked against their sources. */
export const BOARD_CHECKED = "2026-11-11";

export type BoardGuideId = "questions" | "roundabout" | "rules" | "parking";

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
};

export const BOARD_GUIDES: readonly BoardGuide[] = [
  {
    id: "questions",
    path: `${BOARD_PATH}/questions`,
    name: "Questions and answers",
    title: "Model Town Board questions and answers",
    description:
      "Model Town Board questions with answers: which lane to use, the roundabout rules, the three route rules and parking. Each answer comes from the NTSA learner handbook.",
    lede: "The questions learners get asked on the board, with the rule behind each answer. Try each one before you open it.",
    blurb: "Lanes, the roundabout, routes and parking, each with its rule.",
  },
  {
    id: "roundabout",
    path: `${BOARD_PATH}/roundabout`,
    name: "Roundabout lanes",
    title: "Model Town Board roundabout: which lane for which turn",
    description:
      "Which lane to use at the Model Town Board roundabout for left, straight, right and coming back, the five things you must not do on it, and who may go all the way round.",
    lede: "Pick your lane before the roundabout, stay in it all the way round, and leave at your exit. Here is which lane does what.",
    blurb: "Which lane goes left, straight, right or all the way round.",
  },
  {
    id: "rules",
    path: `${BOARD_PATH}/rules`,
    name: "The rules",
    title: "Model Town Board rules, explained",
    description:
      "The Model Town Board rules in one place: the three route rules, how lanes are numbered, continuous and broken lines, kerbs, stop and give way, and the roundabout.",
    lede: "Every rule on the board comes down to a few ideas: the right route, the right lane, and obeying what is painted and posted.",
    blurb: "The route rules, lane numbers, lines, kerbs, stop and give way.",
  },
  {
    id: "parking",
    path: `${BOARD_PATH}/parking`,
    name: "Parking",
    title: "Parking on the Model Town Board: angle and flush parking",
    description:
      "How parking works on the Model Town Board: angle parking, flush parking, the controlled parking zone, and the route rule that says to avoid the parking area.",
    lede: "The board has two kinds of parking, and a rule about when you may drive through the parking area at all.",
    blurb: "Angle and flush parking, and when to use the parking area.",
  },
];

export function boardGuideByPath(path: string): BoardGuide | undefined {
  const clean = path.replace(/\/+$/, "");
  return BOARD_GUIDES.find((guide) => guide.path === clean);
}
