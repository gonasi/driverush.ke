/**
 * `/model-town-board/play`: the board game and nothing else. `?level=<id>`
 * opens one level of the course, `?task=<id>` starts one task, `?learn=1`
 * opens the board to explore, and with none of them it is a round of mixed
 * tasks. Leaving the game goes back to the Model Town Board page.
 *
 * Search engines are pointed at that page, not this one: there is nothing here
 * to read.
 */
import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/board-play";

import { BOARD_PATH } from "~/lib/board-guides";
import { challengeById } from "~/lib/board/challenges";
import { useBoardStore } from "~/lib/board-store";
import { ogCardAlt, ogCardPath } from "~/lib/og-cards";
import { BOARD_KEYWORDS, pageMeta } from "~/lib/site";

import { BoardGame } from "~/components/board/board-player";
import { LoadingPanel } from "~/components/brand/traffic-loader";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: "Drive the Model Town Board",
      description:
        "Drive the Model Town Board online, free. Pick your lane, take the roundabout, and get told which rule you broke. No signup.",
      // The page to index is the guide, which says what the board is.
      path: BOARD_PATH,
      extraKeywords: BOARD_KEYWORDS,
      ogImage: ogCardPath("board"),
      ogImageAlt: ogCardAlt("board"),
    }),
    { name: "robots", content: "noindex, follow" },
  ];
}

export default function BoardPlay() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const open = useBoardStore((s) => s.overlayOpen);
  const learn = params.get("learn") === "1";
  const task = params.get("task");
  const level = params.get("level");
  /** The game has been open on this visit, so closing it means leaving. */
  const wasOpen = React.useRef(false);

  React.useEffect(() => {
    const store = useBoardStore.getState();
    if (!store.overlayOpen) {
      if (level) store.startLevel(level);
      else if (learn) store.learn();
      // A task that doesn't exist (an old or mistyped link) is a round.
      else store.start(task && challengeById(task) ? [task] : undefined);
    }
    return () => {
      wasOpen.current = false;
      useBoardStore.getState().exit();
    };
  }, [learn, task, level]);

  React.useEffect(() => {
    if (open) wasOpen.current = true;
    else if (wasOpen.current) navigate(BOARD_PATH, { replace: true });
  }, [open, navigate]);

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-[#101114] text-white">
      <LoadingPanel label="Loading the board" size="lg" onDark />
      <Link
        to={BOARD_PATH}
        className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/70 underline underline-offset-4 outline-none hover:text-white focus-visible:text-white"
      >
        Back to the Model Town Board
      </Link>
      <BoardGame />
    </main>
  );
}
