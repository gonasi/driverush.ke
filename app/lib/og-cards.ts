/**
 * Open Graph cards — the picture that shows up when a DriveRush link lands in
 * WhatsApp, X or Facebook.
 *
 * These are real PNGs in `public/og/`, not runtime-generated images. They're
 * captured from `/tools/og`, a route that renders each card with the app's own
 * fonts, colours and artwork (actual sprite crops off the NTSA sign sheet,
 * actual GLB models in the 3D card), then screenshotted by
 * `scripts/build-og-images.mjs`. So the previews look like the product without
 * any image service to run, pay for, or wake up on a cold start.
 *
 * The cost of that choice: a card can't carry a per-share number ("9/10"). The
 * headline text does that, and it's the part a reader scans first anyway.
 *
 * Regenerate after editing a card:
 *   npm run dev            # in one terminal
 *   npm run build:og       # in another
 */

/** Facebook/X/WhatsApp all render 1.91:1 well; 1200×630 is the safe size. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export type OgCardId =
  | "default"
  | "quiz"
  | "pelican"
  | "signs3d"
  | "lesson"
  | "road-signs";

export type OgCard = {
  id: OgCardId;
  /** What the card is for — shown in the authoring route's list. */
  blurb: string;
  /** Alt text, mirrored into `og:image:alt`. */
  alt: string;
};

export const OG_CARDS: OgCard[] = [
  {
    id: "default",
    blurb: "Site-wide fallback for any page without its own card.",
    alt: "DriveRush: free NTSA practice and Kenyan road signs",
  },
  {
    id: "quiz",
    blurb: "Shared practice scores and mock-test challenges.",
    alt: "An NTSA practice question with four answer options",
  },
  {
    id: "pelican",
    blurb: "Shared Pelican recall runs.",
    alt: "Kenyan warning road signs shown close up",
  },
  {
    id: "signs3d",
    blurb: "Shared 3D recognition runs.",
    alt: "Kenyan road signs modelled in 3D on their posts",
  },
  {
    id: "lesson",
    blurb: "Shared lesson completions and the course overview.",
    alt: "The DriveRush Class B course path",
  },
  {
    id: "road-signs",
    blurb: "The road-sign chart page and anything sign-reference shaped.",
    alt: "A grid of Kenyan road signs from the NTSA chart",
  },
];

/** Site-relative path to a card's PNG. */
export function ogCardPath(id: OgCardId): string {
  return `/og/${id}.png`;
}

/** Alt text for a card, for `og:image:alt`. */
export function ogCardAlt(id: OgCardId): string {
  return OG_CARDS.find((c) => c.id === id)?.alt ?? SITE_CARD_ALT;
}

const SITE_CARD_ALT = "DriveRush: free NTSA practice for Kenyan roads";
