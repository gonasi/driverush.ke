/**
 * Site-wide constants used in meta tags, JSON-LD and canonical URLs. Keep
 * this file the single source of truth for anything that gets serialized
 * into <head> across routes.
 */
import { OG_HEIGHT, OG_WIDTH } from "./og-cards";

export const SITE = {
  name: "DriveRush",
  legalName: "DriveRush.ke",
  /** Alternate brand spellings used in `alternateName` and on-page copy. */
  alternateNames: [
    "DriveRush Kenya",
    "Drive Rush",
    "DriveRush.ke",
    "drive rush",
  ],
  url: "https://driverush.ke",
  /** Byline on every blog post and guide. Links to /about. */
  byline: "DriveRush team",
  locale: "en_KE",
  lang: "en-KE",
  /**
   * Public contact details. Single source of truth for the footer, `tel:` /
   * `mailto:` links and the Organization JSON-LD `contactPoint`. `phone` is
   * E.164 (what links and schema want), `phoneDisplay` is how it reads on page.
   */
  contact: {
    phone: "+254707981956",
    phoneDisplay: "+254 707 981 956",
    email: "mcdalinoluoch@gmail.com",
  },
  /**
   * Social profiles for Organization JSON-LD `sameAs`. Only list profiles that
   * really exist and are ours: search engines use these to confirm who we are,
   * and a dead or someone else's profile undermines that.
   */
  sameAs: [] as string[],
  /** Square brand mark. Search engines want this, not the wide social card. */
  logo: "/android-chrome-512x512.png",
  logoSize: 512,
  // Default social card, at the 1.91:1 every platform crops to. Built from the
  // app itself: see `app/lib/og-cards.ts` and `/tools/og`. Pages with a
  // better-fitting card (road signs, the trainers) override it via
  // `pageMeta({ ogImage })`.
  ogImage: "/og/default.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt:
    "DriveRush: memorise Kenyan road signs on the Pelican chart or in 3D",
  themeColor: "#E11D2E", // rush red
  /** Tagline used in title templates and as the default description suffix. */
  tagline: "Kenya road signs practice for the NTSA test",
  description:
    "DriveRush helps you memorise Kenyan road signs for the NTSA test. Train on the Pelican chart or spin the signs in 3D. Free, no signup.",
  keywords: [
    // Brand — surface us on direct queries
    "DriveRush",
    "DriveRush Kenya",
    "DriveRush.ke",
    "Drive Rush",
    "drive rush kenya",
    // Road signs
    "road signs Kenya",
    "Kenyan road signs",
    "Kenya road signs and meanings",
    "traffic signs Kenya",
    "traffic signs practice Kenya",
    "highway code Kenya",
    "Pelican road signs",
    "Pelican signs chart",
    "3D road signs",
    // NTSA family
    "NTSA",
    "NTSA road signs",
    "NTSA test",
    "NTSA test road signs",
    "NTSA exam",
    "driving test Kenya",
    "Kenya driving app",
  ],
} as const;

/**
 * Parent company. DriveRush is one of Gonasi's products — surface that link
 * everywhere we credit upstream (footer lockup, hero stamp, mobile menu) and
 * in JSON-LD via `parentOrganization` so search engines connect the two
 * entities. Logo files live in `/public/assets/gonasi/`; both are square JPGs
 * with the wordmark — pick the right one for the surrounding band.
 */
export const GONASI = {
  name: "Gonasi",
  url: "https://www.gonasi.com",
  blurb:
    "Gonasi builds software for learning the stuff people usually give up on. Dense rule books, jargon-heavy exams, official material written like it doesn't want to be read.",
  /** Logo for placement over dark backgrounds (`bg-ink`, etc.). */
  logoOnDark: "/assets/gonasi/logo-on-dark.jpg",
  /** Logo for placement over light backgrounds (`bg-paper`, `bg-paper-3`). */
  logoOnLight: "/assets/gonasi/logo-on-light.jpg",
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

/**
 * Build a brand-consistent page title. We lead with the page-specific phrase
 * (the keyword the user typed in) and end with `· DriveRush Kenya`. Brand
 * suffix lets sitelinks and SERP titles recognise the entity even when the
 * lead phrase is generic ("Learn to drive online", "Driving schools in Kenya").
 */
export function pageTitle(lead: string): string {
  // Don't double-stamp if the caller already included the brand.
  if (/driverush/i.test(lead)) return lead;
  return `${lead} · ${SITE.name} Kenya`;
}

/**
 * Organization JSON-LD. Drop this once on the home page so search engines
 * connect the brand entity to the website, social profiles and logo. The
 * `alternateName` array catches "Drive Rush", "DriveRush Kenya" etc.
 */
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE.url}#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    alternateName: SITE.alternateNames,
    url: SITE.url,
    logo: {
      "@type": "ImageObject",
      url: absUrl(SITE.logo),
      width: SITE.logoSize,
      height: SITE.logoSize,
    },
    image: absUrl(SITE.ogImage),
    description: SITE.description,
    ...(SITE.sameAs.length > 0 ? { sameAs: SITE.sameAs } : {}),
    telephone: SITE.contact.phone,
    email: SITE.contact.email,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: SITE.contact.phone,
      email: SITE.contact.email,
      areaServed: "KE",
      availableLanguage: ["en", "sw"],
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
    areaServed: { "@type": "Country", name: "Kenya" },
    inLanguage: ["en", "sw"],
    knowsAbout: [
      "Kenyan road signs",
      "Highway code Kenya",
      "NTSA road signs test",
    ],
    // Surfaces Gonasi as the parent company so search engines connect the
    // DriveRush brand entity to its operator. Visible "powered by Gonasi"
    // mentions in the footer / hero / mobile menu give Google the on-page
    // corroboration this schema claim needs.
    parentOrganization: {
      "@type": "Organization",
      "@id": `${GONASI.url}#organization`,
      name: GONASI.name,
      url: GONASI.url,
    },
  };
}

/**
 * WebSite JSON-LD. Tells search engines the site's name and its alternate
 * spellings, which is what they use for the name shown on results.
 */
export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}#website`,
    url: SITE.url,
    name: SITE.name,
    alternateName: SITE.alternateNames,
    inLanguage: SITE.lang,
    publisher: { "@id": `${SITE.url}#organization` },
  };
}

/** Article JSON-LD for a permanent guide. `checked` is an ISO date. */
export function guideLd(opts: {
  title: string;
  description: string;
  path: string;
  checked: string;
}) {
  const organization = {
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
  };
  return {
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url: absUrl(opts.path),
    mainEntityOfPage: absUrl(opts.path),
    datePublished: opts.checked,
    dateModified: opts.checked,
    inLanguage: SITE.lang,
    image: absUrl(SITE.ogImage),
    author: organization,
    publisher: {
      ...organization,
      logo: { "@type": "ImageObject", url: absUrl(SITE.logo) },
    },
  };
}

/** Several JSON-LD nodes as one `script:ld+json` entry, sharing one `@context`. */
export function graphLd(...nodes: Array<Record<string, unknown>>) {
  return {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@graph": nodes.map(({ "@context": _context, ...node }) => node),
    },
  };
}

/**
 * Standard per-page meta block. Most marketing pages want title / description /
 * canonical / OG / Twitter to track each other — this returns the matched set
 * in one call so route `meta()`s can focus on what's page-specific (extra
 * JSON-LD, custom keywords). Caller supplies the lead phrase only; brand
 * suffix is applied automatically.
 */
export function pageMeta(opts: {
  /** Page-specific lead phrase, e.g. "Learn to drive in Kenya online". */
  title: string;
  /** Meta description (≤ 160 chars ideal). */
  description: string;
  /** Site-relative path, e.g. "/learn-to-drive-kenya". */
  path: string;
  /** Extra keywords prepended to the global keyword list. */
  extraKeywords?: readonly string[];
  /** Override OG image (defaults to the site card). */
  ogImage?: string;
  /** Dimensions of the override image. Defaults to a 1200×630 social card. */
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogImageAlt?: string;
}) {
  const title = pageTitle(opts.title);
  const url = absUrl(opts.path);
  const ogImage = absUrl(opts.ogImage ?? SITE.ogImage);
  // Root meta declares the default card's dimensions; a page that swaps in a
  // different image has to restate them or crawlers read the wrong aspect and
  // some (Facebook especially) letterbox or skip the preview.
  const isCustomImage = opts.ogImage != null;
  return [
    { title },
    { name: "description", content: opts.description },
    {
      name: "keywords",
      content: keywords(...(opts.extraKeywords ?? [])),
    },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: opts.description },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },
    ...(isCustomImage
      ? [
          {
            property: "og:image:width",
            content: String(opts.ogImageWidth ?? OG_WIDTH),
          },
          {
            property: "og:image:height",
            content: String(opts.ogImageHeight ?? OG_HEIGHT),
          },
          ...(opts.ogImageAlt
            ? [{ property: "og:image:alt", content: opts.ogImageAlt }]
            : []),
        ]
      : []),
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: opts.description },
    { name: "twitter:image", content: ogImage },
  ];
}
