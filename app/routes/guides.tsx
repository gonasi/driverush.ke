/**
 * `/guides`: everything there is to read, in one list. It is where the Guides
 * tab goes. The pages it links to are unchanged; this only gathers the links
 * that used to be spread over the home page, the footer and the ends of other
 * guides.
 */
import { Link } from "react-router";
import type { Route } from "./+types/guides";

import { BOARD_CHECKED, BOARD_GUIDES } from "~/lib/board-guides";
import { SIGN_CLASS_PAGES } from "~/lib/sign-class-pages";
import { breadcrumbLd, graphLd, pageMeta } from "~/lib/site";

import { Icon } from "~/components/brand/icon";
import { ChevronRightIcon } from "~/components/brand/icons";
import { GuideLayout } from "~/components/brand/guide-layout";

const PATH = "/guides";
const TITLE = "Driving test guides for Kenya";
const DESCRIPTION =
  "Every DriveRush guide in one place: the NTSA test and fees, driving schools, the Model Town Board's lanes, rules and parking, and road signs by class.";

type Entry = { to: string; title: string; blurb: string };

const GROUPS: readonly { title: string; items: readonly Entry[] }[] = [
  {
    title: "The test",
    items: [
      {
        to: "/ntsa-test",
        title: "The NTSA test",
        blurb:
          "The steps, what NTSA charges, and practice questions with answers.",
      },
      {
        to: "/driving-schools-kenya",
        title: "Driving schools in Kenya",
        blurb: "What schools charge, and how to check that one is licensed.",
      },
    ],
  },
  {
    title: "The Model Town Board",
    items: BOARD_GUIDES.map((guide) => ({
      to: guide.path,
      title: guide.name,
      blurb: guide.blurb,
    })),
  },
  {
    title: "Road signs",
    items: SIGN_CLASS_PAGES.map((page) => ({
      to: page.path,
      title: page.name,
      blurb: page.lede,
    })),
  },
  {
    title: "More",
    items: [
      {
        to: "/blogs",
        title: "Blog",
        blurb: "How to memorise the signs, and how to prepare for the test.",
      },
      {
        to: "/about",
        title: "About DriveRush",
        blurb: "Who makes this, and where the rules and signs come from.",
      },
    ],
  },
];

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: PATH }),
    graphLd(
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Guides", url: PATH },
      ]),
    ),
  ];
}

export default function Guides() {
  return (
    <GuideLayout
      kicker="Guides"
      title="Guides"
      lede="Everything there is to read: the test, the board and the signs."
      checked={BOARD_CHECKED}
      byline={false}
      lead={
        <div className="grid gap-8">
          {GROUPS.map((group) => (
            <section key={group.title} aria-label={group.title}>
              <h2 className="m-0 mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-ink-3">
                {group.title}
              </h2>
              <ul className="m-0 grid list-none border border-ink/25 bg-surface p-0">
                {group.items.map((item) => (
                  <li
                    key={item.to}
                    className="border-t border-ink/15 first:border-t-0"
                  >
                    <Link
                      to={item.to}
                      className="flex min-h-14 items-center gap-3 px-4 py-3 text-ink no-underline outline-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-bold leading-snug">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-2">
                          {item.blurb}
                        </span>
                      </span>
                      <Icon
                        icon={ChevronRightIcon}
                        size={18}
                        className="shrink-0 text-ink-3"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      }
    >
      {null}
    </GuideLayout>
  );
}
