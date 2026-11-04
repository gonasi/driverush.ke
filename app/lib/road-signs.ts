/**
 * The two road-sign trainers, the whole product: the Pelican chart (one sign at
 * a time zoomed out of the chart) and 3D signs (spinnable GLB models).
 */
import type { IconSvgElement } from "@hugeicons/react";
import { BirdFreeIcons, ThreeDViewFreeIcons } from "@hugeicons/core-free-icons";

import pelican from "~/data/road-signs-pelican.json";

/** How many signs the trainers cover. Copy states this number, never "every". */
export const SIGN_COUNT = pelican.regions.length;

export type SignGame = {
  /** URL slug: the route is `/road-signs/${slug}`. */
  slug: "pelican" | "3d";
  title: string;
  /** One or two sentences, short enough for a phone-width card. */
  blurb: string;
  icon: IconSvgElement;
  to: string;
};

export const SIGN_GAMES: SignGame[] = [
  {
    slug: "pelican",
    title: "Pelican chart",
    blurb: "We zoom into one sign at a time. Name it before the answer shows.",
    icon: BirdFreeIcons,
    to: "/road-signs/pelican",
  },
  {
    slug: "3d",
    title: "3D signs",
    blurb: "Spin each sign and read it from any angle, like on the road.",
    icon: ThreeDViewFreeIcons,
    to: "/road-signs/3d",
  },
];
