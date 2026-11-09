/**
 * `/driving-schools-kenya`: what driving schools charge and how to check one is licensed. Only lists a
 * school when its own published page confirms the price.
 */
import type { Route } from "./+types/driving-schools-kenya";

import Body from "~/guides/driving-schools.mdx";
import { breadcrumbLd, graphLd, guideLd, pageMeta } from "~/lib/site";

import { GuideLayout } from "~/components/brand/guide-layout";
import { LearnerScene } from "~/components/brand/art/scenes";

const PATH = "/driving-schools-kenya";
const CHECKED = "2026-11-05";
const TITLE = "Driving schools in Kenya: prices and how to choose";
const DESCRIPTION =
  "What driving schools in Kenya charge, with published prices, how to check a school is licensed by NTSA, and what to ask before you pay.";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({ title: TITLE, description: DESCRIPTION, path: PATH }),
    graphLd(
      breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Driving schools in Kenya", url: PATH },
      ]),
      guideLd({
        title: TITLE,
        description: DESCRIPTION,
        path: PATH,
        checked: CHECKED,
      }),
      {
        "@type": "ItemList",
        name: "Driving schools in Kenya with published prices",
        itemListElement: [
          {
            name: "AA Kenya",
            url: "https://www.aakenya.co.ke/Driving-School.html",
          },
          {
            name: "The Kisumu National Polytechnic",
            url: "https://kisumupoly.ac.ke/wp-content/uploads/2025/07/Driving-TKNP-Brochure-Final.pdf",
          },
          {
            name: "Meru University of Science and Technology",
            url: "https://www.must.ac.ke/driving-school/",
          },
        ].map((school, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: school.name,
          url: school.url,
        })),
      },
    ),
  ];
}

export default function DrivingSchoolsKenya() {
  return (
    <GuideLayout
      art={<LearnerScene />}
      kicker="Guide · Driving schools"
      title={
        <>
          Driving schools in Kenya. <em>What to pay and check.</em>
        </>
      }
      lede="Published prices, how to check a school is licensed, and what to ask before you pay."
      checked={CHECKED}
    >
      <Body />
    </GuideLayout>
  );
}
