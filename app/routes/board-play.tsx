/**
 * `/model-town-board/play`: the board game and nothing else. `?level=<id>`
 * opens one level of the course, `?task=<id>` starts one task, `?learn=1`
 * opens the board to explore, and with none of them it is a round of mixed
 * tasks. Closing the game goes back to the page it was opened from, or to the
 * Model Town Board page when it was opened cold.
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
    // No canonical: a page kept out of search should not also point
    // somewhere else. Shared links still preview as the Board page.
    ...pageMeta({
      title: "Drive the Model Town Board",
      description:
        "Drive the Model Town Board online, free. Pick your lane, take the roundabout, and get told which rule you broke. No signup.",
      // The page to index is the guide, which says what the board is.
      path: BOARD_PATH,
      extraKeywords: BOARD_KEYWORDS,
      ogImage: ogCardPath("board"),
      ogImageAlt: ogCardAlt("board"),
    }).filter((tag) => !("rel" in tag && tag.rel === "canonical")),
    { name: "robots", content: "noindex, follow" },
  ];
}

export default function BoardPlay() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const learn = params.get("learn") === "1";
  const task = params.get("task");
  const level = params.get("level");
  /** The game is being shut by this page itself: to change level, or to go. */
  const swapping = React.useRef(false);

  React.useEffect(() => {
    const store = useBoardStore.getState();
    if (!store.overlayOpen) {
      if (level) store.startLevel(level);
      else if (learn) store.learn();
      // A task that doesn't exist (an old or mistyped link) is a round.
      else store.start(task && challengeById(task) ? [task] : undefined);
    }
    return () => {
      swapping.current = true;
      useBoardStore.getState().exit();
      swapping.current = false;
    };
  }, [learn, task, level]);

  // Close takes the learner back to the page they opened the game from. The
  // store is listened to directly, not read from a render: moving from one
  // level to another shuts the game and opens it again before the page draws,
  // which a render never sees.
  React.useEffect(
    () =>
      useBoardStore.subscribe((state, before) => {
        if (!before.overlayOpen || state.overlayOpen || swapping.current) return;
        // The router numbers the pages visited on the site. Above 0 there is
        // one to go back to. At 0 the game was opened cold (a typed address,
        // a shared link), and back would leave the site. Moving from level to
        // level replaces this entry, so one step back always leaves the game.
        const visited = (window.history.state as { idx?: number } | null)?.idx;
        if (visited && visited > 0) navigate(-1);
        else navigate(BOARD_PATH, { replace: true });
      }),
    [navigate],
  );

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
