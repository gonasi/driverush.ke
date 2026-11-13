/**
 * `/model-town-board/levels`: every level of the board course as a picture to
 * pick from. The Board page starts the course or carries on with it. This is
 * where a learner looks over all of it and jumps to any level.
 */
import { Link } from "react-router";

import type { Route } from "./+types/board-levels";

import {
  BOARD_LEVELS_DESCRIPTION,
  BOARD_LEVELS_PATH,
  BOARD_LEVELS_TITLE,
  BOARD_PATH,
  BOARD_PLAY_PATH,
} from "~/lib/board-guides";
import { COURSE_LEVELS, UNITS, doneCount } from "~/lib/board/curriculum";
import { ogCardAlt, ogCardPath } from "~/lib/og-cards";
import { BOARD_KEYWORDS, breadcrumbLd, graphLd, pageMeta } from "~/lib/site";
import { useCourseProgress } from "~/lib/use-course-progress";

import { LevelPicker } from "~/components/board/level-picker";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";

const TOTAL = COURSE_LEVELS.length;
const UNIT_COUNT = UNITS.filter((unit) => unit.id !== "mock").length;

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: BOARD_LEVELS_TITLE,
      description: BOARD_LEVELS_DESCRIPTION,
      path: BOARD_LEVELS_PATH,
      extraKeywords: BOARD_KEYWORDS,
      ogImage: ogCardPath("board"),
      ogImageAlt: ogCardAlt("board"),
    }),
    graphLd(
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Model Town Board", url: BOARD_PATH },
        { name: "All levels", url: BOARD_LEVELS_PATH },
      ]),
    ),
  ];
}

export default function BoardLevelsPage() {
  const saved = useCourseProgress();
  const done = saved ? doneCount(saved) : 0;

  return (
    <>
      <SiteNav />
      <main className="min-h-screen text-ink">
        <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-9 sm:pt-10">
          <header className="mb-2">
            <p className="m-0 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              <Link
                to={BOARD_PATH}
                className="text-ink-3 no-underline hover:text-ink hover:underline"
              >
                Model Town Board
              </Link>
            </p>
            <h1 className="m-0 mt-2 font-display text-[clamp(30px,6vw,52px)] font-extrabold uppercase leading-[0.96] tracking-tighter">
              All levels
            </h1>
            <p className="m-0 mt-2 text-[15px] leading-snug text-ink-2">
              {TOTAL} levels in {UNIT_COUNT} units, every one open. Tap a
              picture to play that level.
              {saved && done > 0 && (
                <>
                  {" "}
                  <strong className="text-ink">
                    {done} of {TOTAL} done.
                  </strong>
                </>
              )}
            </p>
          </header>

          <LevelPicker reveal stripClassName="top-16" />

          <p className="m-0 mt-8">
            <Link
              to={`${BOARD_PLAY_PATH}?learn=1`}
              className="inline-flex min-h-11 items-center font-sans text-[14.5px] font-bold text-ink underline decoration-rush decoration-2 underline-offset-4 outline-none hover:text-rush focus-visible:text-rush"
            >
              Explore the board
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
