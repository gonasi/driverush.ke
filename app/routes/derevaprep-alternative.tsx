/**
 * `/derevaprep-alternative`: an honest comparison with Dereva Prep, the one page on the site that names
 * them. Keep it factual and dated, and say where they're ahead. Re-check their
 * public pages whenever this is edited.
 */
import type { Route } from "./+types/derevaprep-alternative";

import Body from "~/guides/derevaprep-alternative.mdx";
import { breadcrumbLd, graphLd, guideLd, pageMeta } from "~/lib/site";

import { GuideLayout } from "~/components/brand/guide-layout";

const PATH = "/derevaprep-alternative";
const CHECKED = "2026-11-11";
const TITLE = "Dereva Prep alternative: how DriveRush compares";
const DESCRIPTION =
  "Looking for a Dereva Prep alternative? An honest comparison with DriveRush on road signs, the Model Town Board, theory questions, sign-up and price.";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: PATH }),
    graphLd(
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "DriveRush and Dereva Prep compared", url: PATH },
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

export default function DerevaPrepAlternative() {
  return (
    <GuideLayout
      kicker="Comparison"
      title={
        <>
          Dereva Prep alternative. <em>An honest comparison.</em>
        </>
      }
      lede="Where DriveRush is the better choice, where Dereva Prep is, and how they differ on price."
      checked={CHECKED}
    >
      <Body />
    </GuideLayout>
  );
}
