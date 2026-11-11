/**
 * Below the trainers: what DriveRush is, in words, and the way into each guide,
 * the Model Town Board's first.
 * Most people never scroll this far and don't need to. It's for anyone who came
 * with a question, and for search engines reading what the site covers.
 */
import { Link } from "react-router";

import { BOARD_GUIDES, BOARD_PATH } from "~/lib/board-guides";
import { SIGN_COUNT } from "~/lib/road-signs";

const GUIDES = [
  {
    to: BOARD_PATH,
    title: "The Model Town Board",
    blurb: "Drive the board, then read the lane, roundabout and route rules.",
  },
  ...BOARD_GUIDES.map((guide) => ({
    to: guide.path,
    title: `Model Town Board: ${guide.name.toLowerCase()}`,
    blurb: guide.blurb,
  })),
  {
    to: "/road-signs",
    title: "Road signs and meanings",
    blurb: `${SIGN_COUNT} Kenyan road signs with pictures, grouped by class, and what to do at each one.`,
  },
  {
    to: "/ntsa-test",
    title: "The NTSA test",
    blurb: "The steps, what NTSA charges, and practice questions with answers.",
  },
  {
    to: "/driving-schools-kenya",
    title: "Driving schools in Kenya",
    blurb: "What schools charge, and how to check that one is licensed.",
  },
];

export function HomeGuides() {
  return (
    <section
      aria-labelledby="home-guides"
      className="mx-auto w-full max-w-4xl px-5 pb-16 sm:px-9"
    >
      <h2
        id="home-guides"
        className="m-0 border-b-2 border-ink pb-3 font-display text-xl font-extrabold uppercase tracking-tight sm:text-2xl"
      >
        Getting your licence in Kenya
      </h2>
      <p className="m-0 mt-4 max-w-2xl font-serif text-[16px] leading-snug text-ink-2">
        DriveRush is a free site for practising the Model Town Board and
        memorising Kenyan road signs for your NTSA test, with no signup.
      </p>
      {/* One line each: this is a way out for the few who scroll this far,
          and it should not look like more things to choose from. */}
      <ul className="m-0 mt-5 grid list-none gap-x-8 p-0 sm:grid-cols-2">
        {GUIDES.map((guide) => (
          <li key={guide.to} className="border-b border-ink/15">
            <Link
              to={guide.to}
              title={guide.blurb}
              className="flex min-h-11 items-center font-sans text-[14.5px] font-bold text-ink outline-none hover:text-rush focus-visible:text-rush"
            >
              {guide.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
