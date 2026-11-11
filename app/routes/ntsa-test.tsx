/**
 * `/ntsa-test`: the NTSA driving test, step by step, with fees and practice questions.
 */
import type { Route } from "./+types/ntsa-test";

import Body from "~/guides/ntsa-test.mdx";
import { breadcrumbLd, graphLd, guideLd, pageMeta } from "~/lib/site";

import { GuideLayout } from "~/components/brand/guide-layout";
import { RoundDoneScene } from "~/components/brand/art/scenes";

const PATH = "/ntsa-test";
const CHECKED = "2026-11-05";
const TITLE = "NTSA test in Kenya: steps, fees and practice questions";
const DESCRIPTION =
  "How the NTSA driving test works in 2026: the steps, what NTSA charges, what the test covers, and practice questions with answers and sources.";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: PATH }),
    graphLd(
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "NTSA test", url: PATH },
      ]),
      guideLd({
        title: TITLE,
        description: DESCRIPTION,
        path: PATH,
        checked: CHECKED,
        published: "2026-11-05",
      }),
    ),
  ];
}

export default function NtsaTest() {
  return (
    <GuideLayout
      art={<RoundDoneScene />}
      kicker="Guide · NTSA test"
      title={
        <>
          NTSA test. <em>Step by step.</em>
        </>
      }
      lede="What you need, what each step costs, what the test covers, and practice questions with the answers."
      checked={CHECKED}
    >
      <Body />
    </GuideLayout>
  );
}
