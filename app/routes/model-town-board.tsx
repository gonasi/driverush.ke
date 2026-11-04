/**
 * `/model-town-board`: how the Model Town Board works. Learners search for it by name, so this is a
 * real guide. The interactive trainer isn't built yet, and the page says so.
 */
import type { Route } from "./+types/model-town-board";

import Body from "~/guides/model-town-board.mdx";
import { breadcrumbLd, graphLd, guideLd, pageMeta } from "~/lib/site";

import { GuideLayout } from "~/components/brand/guide-layout";

const PATH = "/model-town-board";
const CHECKED = "2026-11-05";
const TITLE = "Model Town Board Kenya: how it works in the NTSA test";
const DESCRIPTION =
  "What the Model Town Board is, the three route rules, what you're tested on in the NTSA test, the signs you need and practice questions with answers.";

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
  return (
    <GuideLayout
      kicker="Guide · Model Town Board"
      title={
        <>
          Model Town Board. <em>How it works.</em>
        </>
      }
      lede="What the board is, the route rules to learn, what you're tested on and the signs you need."
      checked={CHECKED}
    >
      <Body />
    </GuideLayout>
  );
}
