/**
 * Partners & source material shown in the "Straight from the source" strip on
 * the homepage — the bodies whose published work DriveRush is built on. Logo
 * art lives in /public/assets/partners and every file has a white field, so
 * the cards render the mark on a white band regardless of theme.
 *
 * It's a plain array — add an entry and the homepage grid picks it up.
 */

export type Partner = {
  /** Organisation name — shown as the caption and used in the image alt. */
  name: string;
  /** One short line on why they're here. Keep it under ~32 characters. */
  note: string;
  /** Path under /public to the logo file. */
  logo: string;
  /** Public website, if there's one to link. Opens in a new tab. Optional. */
  href?: string;
};

export const PARTNERS: Partner[] = [
  {
    name: "NTSA",
    note: "Highway code & official signs",
    logo: "/assets/partners/ntsa-logo.png",
    href: "https://www.ntsa.go.ke",
  },
  {
    name: "Pelican Signs",
    note: "Genuine Kenyan road-sign art",
    logo: "/assets/partners/pelican-logo.jpg",
  },
];
