/**
 * What any page that hosts the board trainer needs: `?go=1` in the address
 * starts a round straight away (links from elsewhere on the site use it), and
 * leaving the page mid-drive closes the board.
 */
import * as React from "react";
import { useSearchParams } from "react-router";

import { useBoardStore } from "~/lib/board-store";

export function useBoardPage(): void {
  const [params, setParams] = useSearchParams();
  const go = params.get("go") === "1";

  // The param is cleared so a reload or a shared link doesn't start a round
  // again.
  React.useEffect(() => {
    if (!go) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("go");
        return next;
      },
      { replace: true },
    );
    useBoardStore.getState().start();
  }, [go, setParams]);

  React.useEffect(() => () => useBoardStore.getState().exit(), []);
}
