/**
 * The Model Town Board's pages, as a block of links: the trainer first, then
 * the guides. Each board page ends with it, so a learner (and a search engine)
 * can get from any one of them to all the others.
 */
import { Link } from "react-router";

import {
  BOARD_GUIDES,
  BOARD_LEVELS_PATH,
  BOARD_PATH,
  type BoardGuideId,
} from "~/lib/board-guides";

export function BoardGuideLinks({
  current,
}: {
  /** The page this block is on, left out of the list. */
  current?: BoardGuideId | "trainer" | "levels";
}) {
  const links = [
    ...(current === "trainer"
      ? []
      : [
          {
            to: BOARD_PATH,
            title: "Drive the Model Town Board",
            blurb: "The free trainer: a board on a table, and a car you drive.",
          },
        ]),
    ...(current === "levels"
      ? []
      : [
          {
            to: BOARD_LEVELS_PATH,
            title: "Model Town Board levels",
            blurb: "The board, the lanes and the rules first. Then you drive.",
          },
        ]),
    ...BOARD_GUIDES.filter((guide) => guide.id !== current).map((guide) => ({
      to: guide.path,
      title: guide.title,
      blurb: guide.blurb,
    })),
  ];
  return (
    <ul className="m-0 my-6 grid list-none gap-3 p-0 sm:grid-cols-2">
      {links.map((link) => (
        <li key={link.to}>
          <Link
            to={link.to}
            className="grid h-full gap-1 border-2 border-ink bg-paper-3 p-4 no-underline outline-none transition-colors hover:bg-surface focus-visible:bg-surface"
          >
            <span className="font-display text-[14px] font-extrabold uppercase leading-tight tracking-[0.02em] text-ink">
              {link.title}
            </span>
            <span className="text-[14px] leading-snug text-ink-2">
              {link.blurb}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
