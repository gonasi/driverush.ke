/**
 * The way into the board game: a picture of the board, one button that starts
 * or continues the course, and where the learner has got to in each unit. It
 * is in the server's HTML and carries none of the game: every button is a link
 * to the play page, so three.js and the physics only download once somebody
 * asks to drive.
 */
import { Link } from "react-router";

import {
  BOARD_LEVELS_PATH,
  BOARD_PATH,
  BOARD_PLAY_PATH,
  levelHref,
} from "~/lib/board-guides";
import {
  COURSE_LEVELS,
  UNITS,
  doneCount,
  levelDone,
  nextLevel,
} from "~/lib/board/curriculum";
import { useCourseProgress } from "~/lib/use-course-progress";
import { cn } from "~/lib/utils";

import { BoardThumb } from "~/components/board/board-thumb";
import { Icon } from "~/components/brand/icon";
import { ShareButton } from "~/components/brand/share-button";
import { CheckIcon, GridIcon, PlayIcon } from "~/components/brand/icons";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";

const TOTAL = COURSE_LEVELS.length;
const EMPTY = { learned: [], bestStars: {} };
const smallLink =
  "inline-flex min-h-11 items-center font-sans text-[14px] font-bold text-ink underline decoration-rush decoration-2 underline-offset-4 outline-none hover:text-rush focus-visible:text-rush";

/**
 * Where Start goes and what it says. Before the saved progress is read (on
 * the server, and for a first visit) that is level 1.
 */
export function useCourseStart() {
  const saved = useCourseProgress();
  const done = saved ? doneCount(saved) : 0;
  const next = nextLevel(saved ?? EMPTY);
  const mock = next.kind === "mock";
  return {
    saved,
    done,
    next,
    href: mock ? BOARD_PLAY_PATH : levelHref(next.id),
    label: mock
      ? "Take the mock test"
      : done > 0
        ? `Continue: level ${next.n}`
        : "Start level 1",
    /** What the level is, said under or beside the button. */
    detail: mock ? "Five tasks, mixed. Every level is done." : next.title,
  };
}

export function BoardLobby({
  className,
  posterClassName = "aspect-[4/3] sm:aspect-video",
}: {
  className?: string;
  /** The still board's shape. */
  posterClassName?: string;
}) {
  const { saved, done, href, label, detail } = useCourseStart();

  return (
    <div className={cn("border-2 border-ink", className)}>
      <Link
        to={href}
        aria-label={`${label}: ${detail}`}
        className="group block w-full outline-none"
      >
        <BoardThumb className={posterClassName} />
      </Link>
      <div className="grid gap-3 border-t-2 border-ink bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild variant="rush" size="lg" className="w-full">
            <Link to={href}>
              <Icon icon={PlayIcon} size={18} />
              {label}
            </Link>
          </Button>
          <Button asChild variant="ink" size="lg" className="w-full">
            <Link to={BOARD_LEVELS_PATH}>
              <Icon icon={GridIcon} size={18} />
              All {TOTAL} levels
            </Link>
          </Button>
        </div>
        <p className="m-0 text-[13.5px] leading-snug text-ink-2">
          <strong className="text-ink">Next: {detail}.</strong> You learn the
          board and the lanes first, then drive.
        </p>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-3">
            <span>Levels done</span>
            <span className="tabular-nums">
              {done} of {TOTAL}
            </span>
          </div>
          <Progress
            value={(done / TOTAL) * 100}
            tone="green"
            showTicks={false}
            aria-label="Levels done"
            className="h-3"
          />
        </div>
        <ol className="m-0 grid list-none gap-1.5 p-0 sm:grid-cols-2">
          {UNITS.filter((unit) => unit.id !== "mock").map((unit, i) => {
            const unitDone = saved
              ? unit.levels.filter((l) => levelDone(l, saved)).length
              : 0;
            const complete = unitDone === unit.levels.length;
            return (
              <li key={unit.id}>
                <Link
                  to={`${BOARD_LEVELS_PATH}#unit-${unit.id}`}
                  className="flex min-h-11 items-center justify-between gap-3 border-2 border-ink bg-paper-2 px-3 py-2 text-[13.5px] font-semibold leading-snug text-ink no-underline outline-none transition-colors hover:bg-paper-3 focus-visible:bg-paper-3"
                >
                  <span>
                    <span className="mr-1.5 font-mono text-[11px] text-ink-3">
                      {i + 1}
                    </span>
                    {unit.title}
                  </span>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 font-mono text-[11px] font-bold tabular-nums",
                      complete ? "text-kenya-green" : "text-ink-3",
                    )}
                  >
                    {complete && <Icon icon={CheckIcon} size={12} />}
                    {unitDone}/{unit.levels.length}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-wrap items-center gap-x-5">
          <Link to={`${BOARD_PLAY_PATH}?learn=1`} className={smallLink}>
            Explore the board
          </Link>
          <Link to={BOARD_PLAY_PATH} className={smallLink}>
            Mock test: 5 mixed tasks
          </Link>
        </div>
        {/* The board is the thing learners pass on to each other. */}
        <ShareButton
          surface="board_lobby"
          label="Send to a friend"
          size="default"
          payload={{
            kind: "page",
            path: BOARD_PATH,
            title: "Practise the Model Town Board online, free",
            text: "Learn the lanes, the roundabout and the parking for your driving test, then drive them. Free, no signup.",
          }}
        />
      </div>
    </div>
  );
}
