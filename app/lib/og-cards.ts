/**
 * Open Graph cards — the picture that shows up when a DriveRush link lands in
 * WhatsApp, X or Facebook.
 *
 * These are real PNGs in `public/og/`, not runtime-generated images. They're
 * captured from `/tools/og`, a route that renders each card with the app's own
 * fonts, colours and artwork (actual sprite crops off the Pelican chart,
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
  | "board"
  | "pelican"
  | "signs3d"
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
    alt: "DriveRush: practise the Model Town Board and memorise Kenyan road signs",
  },
  {
    id: "board",
    blurb: "The home page and the Model Town Board pages.",
    alt: "The Model Town Board game: a yellow car coming up to four numbered lanes and the roundabout",
  },
  {
    id: "pelican",
    blurb: "Shared Pelican chart runs.",
    alt: "Kenyan road signs from the Pelican chart, shown close up",
  },
  {
    id: "signs3d",
    blurb: "Shared 3D recognition runs.",
    alt: "Kenyan road signs modelled in 3D on their posts",
  },
  {
    id: "road-signs",
    blurb: "The road-sign chart page and anything sign-reference shaped.",
    alt: "A grid of Kenyan road signs from the Pelican chart",
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

const SITE_CARD_ALT =
  "DriveRush: practise the Model Town Board and memorise Kenyan road signs";
