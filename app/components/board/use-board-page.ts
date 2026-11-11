/**
 * What any page that hosts the board trainer needs: `?go=1` in the address
 * starts a round straight away (links from elsewhere on the site use it),
 * `?learn=1` opens the board to learn it, and
 * leaving the page mid-drive closes the board.
 */
import * as React from "react";
import { useSearchParams } from "react-router";

import { useBoardStore } from "~/lib/board-store";

export function useBoardPage(): void {
  const [params, setParams] = useSearchParams();
  const go = params.get("go") === "1";
  const task = params.get("task");

  // The param is cleared so a reload or a shared link doesn't start a round
  // again.
  React.useEffect(() => {
    if (!go) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("go");
        next.delete("task");
        return next;
      },
      { replace: true },
    );
    // `&task=<id>` starts on one task, for a link to it.
    useBoardStore.getState().start(task ? [task] : undefined);
  }, [go, task, setParams]);

  // `?learn=1` opens the board to learn it, the same way.
  const learn = params.get("learn") === "1";
  React.useEffect(() => {
    if (!learn) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("learn");
        return next;
      },
      { replace: true },
    );
    useBoardStore.getState().learn();
  }, [learn, setParams]);

  React.useEffect(() => () => useBoardStore.getState().exit(), []);
}
