/**
 * Road-sign trainers. The first thing DriveRush actually ships — two
 * memorisation mini-games. Both pages are minimalist placeholders for now;
 * the homepage "Road signs" section and the /road-signs hub list these.
 */
import type { IconSvgElement } from "@hugeicons/react";
import { BirdFreeIcons, ThreeDViewFreeIcons } from "@hugeicons/core-free-icons";

/** Brand accent a sign-game card renders in. */
export type SignGameAccent = "amber" | "blue";

export type SignGame = {
  /** URL slug — the route is `/road-signs/${slug}`. */
  slug: string;
  /** Mono kicker, e.g. "Trainer № 01 · Recall". */
  kicker: string;
  title: string;
  /** One-paragraph pitch. */
  blurb: string;
  /** Hugeicons mark. */
  icon: IconSvgElement;
  accent: SignGameAccent;
  /** Short mono line by the CTA, e.g. "Free · play now". */
  tag: string;
  /** Where the card CTA points. */
  to: string;
};

export const SIGN_GAMES: SignGame[] = [
  {
    slug: "pelican",
    kicker: "Trainer № 01 · Recall",
    title: "Pelican signs",
    blurb:
      "Signs glide past on cards — name each one before it lands. Misses come back sooner; the ones you know drift further apart. Built on how memory actually sticks.",
    icon: BirdFreeIcons,
    accent: "amber",
    tag: "Free · play now",
    to: "/road-signs/pelican",
  },
  {
    slug: "3d",
    kicker: "Trainer № 02 · Recognition",
    title: "3D signs",
    blurb:
      "Spin a sign in 3D and read it from any angle — the way you actually see them on Nairobi roads, half-turned and half-lit. Time pressure optional.",
    icon: ThreeDViewFreeIcons,
    accent: "blue",
    tag: "Free · play now",
    to: "/road-signs/3d",
  },
];
