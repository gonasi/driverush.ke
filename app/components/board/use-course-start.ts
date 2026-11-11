import { BOARD_PLAY_PATH, levelHref } from "~/lib/board-guides";
import { doneCount, nextLevel } from "~/lib/board/curriculum";
import { useCourseProgress } from "~/lib/use-course-progress";

const EMPTY = { learned: [], bestStars: {} };

/**
 * Where the board's one Start button goes and what it says, wherever it is
 * shown: home, the Board page, the top bar. Before the saved progress is read
 * (on the server, and for a first visit) that is level 1.
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
