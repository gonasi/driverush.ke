/**
 * The way into the board game: a picture of the board, Start driving, Learn
 * the board, and the list of tasks to choose one from. It is in the server's
 * HTML and carries none of the game: every button is a link to the play page,
 * so three.js and the physics only download once somebody asks to drive.
 */
import * as React from "react";
import { Link } from "react-router";
import { useShallow } from "zustand/react/shallow";

import { BOARD_PATH, BOARD_PLAY_PATH } from "~/lib/board-guides";
import { BOARD_CHALLENGES, isRouteTask } from "~/lib/board/challenges";
import { BOARD_CHALLENGE_IDS, useBoardStore } from "~/lib/board-store";
import { signCounts } from "~/lib/pelican-progress";
import { cn } from "~/lib/utils";

import { BoardThumb } from "~/components/board/board-thumb";
import { Icon } from "~/components/brand/icon";
import { ShareButton } from "~/components/brand/share-button";
import { LearnerIcon, PlayIcon, StarIcon } from "~/components/brand/icons";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";

const POOL = BOARD_CHALLENGES.length;

/** The tasks by what they practise, for choosing one to drive. */
const TASK_GROUPS = [
  {
    title: "At the roundabout",
    tasks: BOARD_CHALLENGES.filter((c) => !isRouteTask(c)),
  },
  {
    title: "Routes",
    tasks: BOARD_CHALLENGES.filter(
      (c) => isRouteTask(c) && !/^(park|leave)-/.test(c.id),
    ),
  },
  {
    title: "Parking",
    tasks: BOARD_CHALLENGES.filter(
      (c) => isRouteTask(c) && /^(park|leave)-/.test(c.id),
    ),
  },
].filter((group) => group.tasks.length > 0);

export function BoardLobby({
  className,
  posterClassName = "aspect-[4/3] sm:aspect-video",
}: {
  className?: string;
  /** The still board's shape. */
  posterClassName?: string;
}) {
  const { progress, bestStars } = useBoardStore(
    useShallow((st) => ({ progress: st.progress, bestStars: st.bestStars })),
  );
  // Progress is in this browser's storage, so the server's HTML has none.
  const [mounted, setMounted] = React.useState(false);
  const [picking, setPicking] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const counts = signCounts(mounted ? progress : {}, BOARD_CHALLENGE_IDS);
  const started = counts.known + counts.learning > 0;

  return (
    <div className={cn("border-2 border-ink", className)}>
      <Link
        to={BOARD_PLAY_PATH}
        aria-label="Start driving the Model Town Board"
        className="group block w-full outline-none"
      >
        <BoardThumb className={posterClassName} />
      </Link>
      <div className="grid gap-3 border-t-2 border-ink bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild variant="rush" size="lg" className="w-full">
            <Link to={BOARD_PLAY_PATH}>
              <Icon icon={PlayIcon} size={18} />
              {started ? "Keep driving" : "Start driving"}
            </Link>
          </Button>
          <Button asChild variant="ink" size="lg" className="w-full">
            <Link to={`${BOARD_PLAY_PATH}?learn=1`}>
              <Icon icon={LearnerIcon} size={18} />
              Learn the board
            </Link>
          </Button>
        </div>
        <div>
          <button
            type="button"
            aria-expanded={picking}
            aria-controls="board-task-list"
            onClick={() => setPicking((v) => !v)}
            className="flex min-h-11 w-full items-center justify-between gap-3 border-2 border-ink bg-paper-2 px-3.5 py-2 text-left font-mono text-[11px] font-bold uppercase tracking-widest text-ink outline-none transition-colors hover:bg-paper-3 focus-visible:bg-paper-3"
          >
            Choose a task
            <span aria-hidden className="text-[15px] leading-none">
              {picking ? "−" : "+"}
            </span>
          </button>
          {picking && (
            <div id="board-task-list" className="dr-rise mt-3 grid gap-4">
              {TASK_GROUPS.map((group) => (
                <section key={group.title} aria-label={group.title}>
                  <h3 className="m-0 mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-3">
                    {group.title}
                  </h3>
                  <ul className="m-0 grid list-none gap-1.5 p-0 sm:grid-cols-2">
                    {group.tasks.map((task) => {
                      const best = mounted ? (bestStars[task.id] ?? 0) : 0;
                      return (
                        <li key={task.id}>
                          <Link
                            to={`${BOARD_PLAY_PATH}?task=${task.id}`}
                            className="flex min-h-11 w-full items-center justify-between gap-3 border-2 border-ink bg-surface px-3 py-2 text-left text-[13.5px] font-semibold leading-snug text-ink outline-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2"
                          >
                            {task.title}
                            <span
                              role="img"
                              aria-label={
                                best > 0
                                  ? `Best: ${best} of 3 stars`
                                  : "Not driven yet"
                              }
                              className="inline-flex shrink-0 gap-0.5"
                            >
                              {[1, 2, 3].map((n) => (
                                <Icon
                                  key={n}
                                  icon={StarIcon}
                                  size={14}
                                  className={
                                    n <= best
                                      ? "text-kenya-gold"
                                      : "text-ink/20"
                                  }
                                />
                              ))}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
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
            text: "Drive the lanes, the roundabout and the parking for your driving test. Free, no signup.",
          }}
        />
        {started ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-3">
              <span>
                {counts.known} known · {counts.learning} learning
              </span>
              <span className="tabular-nums">of {POOL} tasks</span>
            </div>
            <Progress
              value={(counts.known / POOL) * 100}
              tone="green"
              showTicks={false}
              aria-label="Board tasks known"
              className="h-3"
            />
          </div>
        ) : (
          <p className="m-0 text-center font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            {POOL} tasks to drive · every lane, route and parking move to watch
          </p>
        )}
      </div>
    </div>
  );
}
