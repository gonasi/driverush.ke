/**
 * One guide page per big sign class, at `/road-signs/<class>-signs`. Only the
 * three classes with enough signs to fill a page get one: priority (2 signs) and
 * additional panels (4) stay as sections of the `/road-signs` hub. The long text
 * is MDX in `app/guides/`; the route adds the class's signs below it.
 */
import type { SignCategoryId } from "~/lib/image-focus";

export type SignClassPage = {
  category: SignCategoryId;
  path: string;
  /** SERP and og title. */
  title: string;
  description: string;
  /** Short name for breadcrumbs and links. */
  name: string;
  lede: string;
  checked: string;
};

export const SIGN_CLASS_PAGES: SignClassPage[] = [
  {
    category: "warning",
    path: "/road-signs/warning-signs",
    name: "Warning signs",
    title: "Kenyan warning signs: what the red triangles mean",
    description:
      "All 34 Kenyan warning signs in five groups, with the mirror-image pairs people mix up and how far ahead of a hazard each sign stands.",
    lede: "The red triangles, in five groups, with the pairs people read backwards and what to do when you see one.",
    checked: "2026-11-10",
  },
  {
    category: "mandatory",
    path: "/road-signs/mandatory-signs",
    name: "Mandatory signs",
    title: "Kenyan mandatory signs: what the blue circles mean",
    description:
      "The 10 Kenyan mandatory signs: blue circles that tell you what you must do. How to read the arrows, minimum speed, and the blue and red signs that share a picture.",
    lede: "The blue circles that tell you what you must do, and how to tell them from the red signs with the same picture.",
    checked: "2026-11-10",
  },
  {
    category: "prohibitory",
    path: "/road-signs/prohibitory-signs",
    name: "Prohibitory signs",
    title: "Kenyan prohibitory signs: what the red rings mean",
    description:
      "The 33 Kenyan prohibitory signs in six groups: entry, size and weight, turns, speed, stopping and parking. How to read the numbers and the bars.",
    lede: "The red rings that tell you what you may not do, in six groups, with how to read the numbers and the bars.",
    checked: "2026-11-10",
  },
];

const BY_PATH = new Map(SIGN_CLASS_PAGES.map((p) => [p.path, p]));
const BY_CATEGORY = new Map(SIGN_CLASS_PAGES.map((p) => [p.category, p]));

export function signClassPageByPath(path: string): SignClassPage | undefined {
  return BY_PATH.get(path.replace(/\/+$/, ""));
}

export function signClassPage(
  category: SignCategoryId | undefined,
): SignClassPage | undefined {
  return category ? BY_CATEGORY.get(category) : undefined;
}
