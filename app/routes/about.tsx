/**
 * `/about`: who runs DriveRush, what it isn't, and how its facts get checked.
 */
import type { Route } from "./+types/about";

import Body from "~/guides/about.mdx";
import { breadcrumbLd, graphLd, guideLd, pageMeta } from "~/lib/site";

import { GuideLayout } from "~/components/brand/guide-layout";
import { OpenRoadScene } from "~/components/brand/art/scenes";

const PATH = "/about";
const CHECKED = "2026-11-05";
const TITLE = "About DriveRush: who we are and how we check facts";
const DESCRIPTION =
  "DriveRush is a free Kenyan site for practising the Model Town Board and memorising road signs for the NTSA test, built in Nairobi by Gonasi. It isn't affiliated with the NTSA.";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: PATH }),
    graphLd(
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "About DriveRush", url: PATH },
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

export default function About() {
  return (
    <GuideLayout
      art={<OpenRoadScene />}
      kicker="About"
      title={
        <>
          About <em>DriveRush.</em>
        </>
      }
      lede="Who runs this site, what it isn't, and how we check what we publish."
      checked={CHECKED}
      showAd={false}
    >
      <Body />
    </GuideLayout>
  );
}
