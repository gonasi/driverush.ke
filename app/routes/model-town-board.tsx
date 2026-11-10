/**
 * `/model-town-board`: the board trainer, with the guide under it. The product
 * comes first (one tap into driving), and the guide stays in the server's HTML
 * for the learners who arrive searching for how the board works.
 */
import * as React from "react";
import { useSearchParams } from "react-router";

import type { Route } from "./+types/model-town-board";

import Body from "~/guides/model-town-board.mdx";
import { useBoardStore } from "~/lib/board-store";
import { breadcrumbLd, graphLd, guideLd, pageMeta } from "~/lib/site";

import { BoardPlayer } from "~/components/board/board-player";
import { GuideLayout } from "~/components/brand/guide-layout";

const PATH = "/model-town-board";
const CHECKED = "2026-11-10";
const TITLE = "Model Town Board Kenya: free practice trainer and guide";
const DESCRIPTION =
  "Drive the Model Town Board's roundabout and learn which lane to use for each turn, the roundabout rules and the three route rules. Free, no signup.";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: PATH }),
    graphLd(
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Model Town Board", url: PATH },
      ]),
      guideLd({
        title: TITLE,
        description: DESCRIPTION,
        path: PATH,
        checked: CHECKED,
      }),
    ),
  ];
}

export default function ModelTownBoard() {
  const [params, setParams] = useSearchParams();
  const go = params.get("go") === "1";

  // `?go=1` drops the learner straight into a round. The param is cleared so a
  // reload or a shared link doesn't start one again.
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

  // Leaving the page mid-drive closes the board.
  React.useEffect(() => () => useBoardStore.getState().exit(), []);

  return (
    <GuideLayout
      kicker="Trainer · Model Town Board"
      title={
        <>
          Model Town Board. <em>Drive it.</em>
        </>
      }
      lede="Pick your lane, take the roundabout, and stop where the examiner asks. Break a lane rule and you're told which one. Free, no signup."
      checked={CHECKED}
      lead={<BoardPlayer />}
    >
      <Body />
    </GuideLayout>
  );
}
