/**
 * Below the trainers: what DriveRush is, in words, and the way into each guide.
 * Most people never scroll this far and don't need to. It's for anyone who came
 * with a question, and for search engines reading what the site covers.
 */
import { Link } from "react-router";

import { SIGN_COUNT } from "~/lib/road-signs";

const GUIDES = [
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
    to: "/model-town-board",
    title: "The Model Town Board",
    blurb: "What the board is, the route rules, and what you're tested on.",
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
      <p className="m-0 mt-4 max-w-2xl font-serif text-[17px] leading-snug text-ink-2">
        DriveRush is a free site for memorising Kenyan road signs for your NTSA
        test, with no signup. We also explain the rest of the road to your
        licence, with sources and dates so you can check what you read.
      </p>
      <ul className="m-0 mt-5 grid list-none gap-3 p-0 sm:grid-cols-2">
        {GUIDES.map((guide) => (
          <li key={guide.to}>
            <Link
              to={guide.to}
              className="grid h-full gap-1 border-2 border-ink bg-paper-3 p-4 outline-none transition-colors hover:bg-surface focus-visible:bg-surface"
            >
              <span className="font-display text-[14px] font-extrabold uppercase leading-tight tracking-[0.02em] text-ink">
                {guide.title}
              </span>
              <span className="text-[14px] leading-snug text-ink-2">
                {guide.blurb}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
