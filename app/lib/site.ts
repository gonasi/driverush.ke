/**
 * Site-wide constants used in meta tags, JSON-LD and canonical URLs. Keep
 * this file the single source of truth for anything that gets serialized
 * into <head> across routes.
 */
export const SITE = {
  name: "DriveRush",
  legalName: "DriveRush.ke",
  url: "https://driverush.ke",
  locale: "en_KE",
  lang: "en-KE",
  // Default open graph image. The full lockup is 1536×1024 (3:2). Social
  // platforms prefer 1.91:1 / 1200×630 — replace with a properly cropped
  // social card when it lands.
  ogImage: "/images/driverush-logo-main.png",
  ogImageWidth: 1536,
  ogImageHeight: 1024,
  ogImageAlt: "DriveRush: NTSA prep and road-sign practice for Kenyan roads",
  themeColor: "#E11D2E", // rush red
  description:
    "DriveRush is the NTSA prep app built for Kenyan roads. Real signs, real junctions, real past papers. Class A, B, C, D. Pay with M-Pesa.",
  keywords: [
    "NTSA",
    "NTSA exam",
    "NTSA prep",
    "NTSA test",
    "road signs Kenya",
    "Kenyan road signs",
    "Kenya road signs and meanings",
    "traffic signs Kenya",
    "highway code Kenya",
    "learn to drive Kenya",
    "driving school Kenya",
    "driving test Kenya",
    "Kenya driving licence",
    "Class B driving",
    "M-Pesa driving school",
    "Nairobi driving lessons",
  ],
} as const;

/**
 * Road-signs section keywords — appended to {@link SITE.keywords} on the
 * `/road-signs` pages so the sign-specific terms lead.
 */
export const ROAD_SIGN_KEYWORDS = [
  "road signs in Kenya",
  "Kenya road signs and meanings",
  "warning signs Kenya",
  "regulatory signs Kenya",
  "mandatory road signs Kenya",
  "prohibition signs Kenya",
  "information signs Kenya",
  "traffic light signals Kenya",
  "road markings Kenya",
  "NTSA road signs",
  "road signs test Kenya",
  "highway code road signs",
  "memorise road signs",
] as const;

/** Build an absolute URL for a route or asset. */
export function absUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${p}`;
}

/** Join a keyword list (plus any extras) into a meta `keywords` string. */
export function keywords(...extra: readonly string[]): string {
  return [...extra, ...SITE.keywords].join(", ");
}

/** One crumb in a {@link breadcrumbLd} trail. `url` is a site-relative path. */
export type Crumb = { name: string; url: string };

/**
 * BreadcrumbList JSON-LD for a `<meta>` `"script:ld+json"` entry. Pass the
 * trail from the home page down to the current page, e.g.
 * `breadcrumbLd([{ name: "Home", url: "/" }, { name: "Road signs", url: "/road-signs" }])`.
 */
export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absUrl(c.url),
    })),
  };
}

/** FAQPage JSON-LD built from plain question/answer pairs. */
export function faqPageLd(qa: ReadonlyArray<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
