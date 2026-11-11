/**
 * The board game used to open over this page, started by `?go=1` in the
 * address. It has its own page now. Links that are already out there (in the
 * guides, and in messages people have shared) still say `?go=1`, `&task=<id>`
 * or `?learn=1`, so this sends them on to the play page.
 */
import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";

import { BOARD_PLAY_PATH } from "~/lib/board-guides";

export function useBoardPage(): void {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const go = params.get("go") === "1";
  const learn = params.get("learn") === "1";
  const task = params.get("task");

  React.useEffect(() => {
    if (!go && !learn) return;
    const next = new URLSearchParams();
    if (learn) next.set("learn", "1");
    else if (task) next.set("task", task);
    const query = next.toString();
    navigate(query ? `${BOARD_PLAY_PATH}?${query}` : BOARD_PLAY_PATH, {
      replace: true,
    });
  }, [go, learn, task, navigate]);
}
