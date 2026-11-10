/**
 * One indexable page per sign, at `/road-signs/:slug`. Everything comes from the
 * chart's data, so a sign added to `road-signs-pelican.json` gets a page and a
 * sitemap entry by itself, as long as it has a line in `SIGN_DETAILS`.
 */
import { SIGN_DETAILS } from "~/data/road-sign-details";
import { SIGN_GUIDES, type SignGuide } from "~/data/road-sign-guides";
import pelican from "~/data/road-signs-pelican.json";
import signs3d from "~/data/road-signs-3d.json";
import type { FocusRegion, RegionBox, SignCategoryId } from "~/lib/image-focus";
import { signCrop } from "~/lib/sign-crops";

export type SignPage = FocusRegion & {
  slug: string;
  detail: string;
  /**
   * The sign's artwork alone, without its code key. The region itself covers the
   * whole sign card, key included, for the trainer's camera. See `signCrop`.
   */
  crop: RegionBox;
};

export const CHART_SRC = pelican.imageSrc as string;

function signSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const SIGN_PAGES: SignPage[] = (pelican.regions as FocusRegion[]).map(
  (region) => ({
    ...region,
    slug: signSlug(region.name ?? ""),
    detail: SIGN_DETAILS[region.code ?? ""] ?? "",
    crop: signCrop(region),
  }),
);

const BY_SLUG = new Map(SIGN_PAGES.map((sign) => [sign.slug, sign]));
const BY_CODE = new Map(SIGN_PAGES.map((sign) => [sign.code, sign]));
const CODES_IN_3D = new Set(signs3d.signs.map((sign) => sign.code));

export function signPageBySlug(slug: string | undefined): SignPage | undefined {
  return slug ? BY_SLUG.get(slug) : undefined;
}

/**
 * Signs whose name and meaning were confirmed against an official source, on
 * 2026-11-05: the Ministry of Roads road signs manual (Design Manual for Roads and
 * Bridges, Part 5a). No copy of the NTSA Highway Code itself could be obtained.
 * The rest still have pages for anyone browsing, but stay out of search until
 * someone checks them against the Highway Code: add the code here when they do.
 *
 * Added 2026-11-10, matched by artwork against the same manual's figures, since
 * it doesn't use the chart's codes: M.7 (cycle track, fig. 5.28), M.10 and M.11
 * (minimum speed, fig. 5.21), P.2 (no vehicles, fig. 5.33), P.33 (no stopping,
 * fig. 5.25). Still open: P.39's artwork (one bar, ZONE) is a no-parking sign but
 * it's named "No stopping zone", and P.3 shows a car but is named for all
 * vehicles. Both need new audio before their names can change.
 */
const CONFIRMED_CODES = new Set([
  "W.1",
  "W.2",
  "W.3",
  "W.4",
  "W.5",
  "W.6",
  "W.7",
  "W.8",
  "W.9",
  "W.10",
  "W.11",
  "W.12",
  "W.13(a)",
  "W.14",
  "W.16",
  "W.17",
  "W.18",
  "W.20",
  "W.21",
  "W.22",
  "W.23",
  "W.24",
  "W.25",
  "W.27",
  "W.30",
  "W.31",
  "W.32",
  "R.1",
  "R.2",
  "M.2",
  "M.3",
  "M.5",
  "M.7",
  "M.10",
  "M.11",
  "P.1",
  "P.2",
  "P.15",
  "P.16",
  "P.17",
  "P.20",
  "P.21",
  "P.22",
  "P.23",
  "P.25",
  "P.27b",
  "P.30",
  "P.32",
  "P.33",
]);

export function isSignConfirmed(sign: { code?: string }): boolean {
  return !!sign.code && CONFIRMED_CODES.has(sign.code);
}

export function signPageByCode(code: string): SignPage | undefined {
  return BY_CODE.get(code);
}

/** The long-form write-up, for signs that are in search. */
export function signGuide(sign: { code?: string }): SignGuide | undefined {
  return sign.code && isSignConfirmed(sign)
    ? SIGN_GUIDES[sign.code]
    : undefined;
}

export function signPagePath(sign: { slug: string }): string {
  return `/road-signs/${sign.slug}`;
}

export function hasSign3D(sign: { code?: string }): boolean {
  return !!sign.code && CODES_IN_3D.has(sign.code);
}

/** The next few signs in the same class, in chart order, wrapping at the end. */
export function relatedSigns(sign: SignPage, count = 6): SignPage[] {
  const sameClass = SIGN_PAGES.filter((s) => s.category === sign.category);
  const at = sameClass.findIndex((s) => s.slug === sign.slug);
  return Array.from(
    { length: Math.min(count, sameClass.length - 1) },
    (_, i) => sameClass[(at + i + 1) % sameClass.length],
  );
}

/** How to read a whole class of signs, and what to call one in a sentence. */
export const SIGN_CLASS_GUIDE: Record<
  SignCategoryId,
  { label: string; singular: string; rule: string }
> = {
  warning: {
    label: "Warning signs",
    singular: "warning sign",
    rule: "Warning signs are red-bordered triangles pointing up. They don't order you to do anything: they tell you what's coming so you can slow down and get ready.",
  },
  priority: {
    label: "Priority signs",
    singular: "priority sign",
    rule: "Priority signs tell you who goes first at a junction. Their shapes are unique, a red octagon for STOP and a triangle standing on its point for GIVE WAY, so you can recognise them at a glance.",
  },
  mandatory: {
    label: "Mandatory signs",
    singular: "mandatory sign",
    rule: "Mandatory signs are blue circles, and they tell you what you must do. If you see a blue disc, it's an order rather than a suggestion.",
  },
  prohibitory: {
    label: "Prohibitory signs",
    singular: "prohibitory sign",
    rule: "Prohibitory signs are mostly circles with a red ring, and they tell you what you must not do or set a limit you must keep. They're the opposite of the blue circles, which tell you what you must do.",
  },
  other: {
    label: "Other road signs",
    singular: "road sign",
    rule: "Read a sign's shape and colour first: a red triangle warns, a red ring forbids, a blue circle commands and a rectangle informs.",
  },
  "additional-panels": {
    label: "Additional panels",
    singular: "additional panel",
    rule: "Additional panels are small rectangles fixed under a main sign. They add detail such as a distance, a direction or a time, and they never apply on their own.",
  },
};
