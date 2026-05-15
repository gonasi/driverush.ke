/**
 * Site-wide constants used in meta tags, JSON-LD and canonical URLs. Keep
 * this file the single source of truth for anything that gets serialized
 * into <head> across routes.
 */
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
  locale: "en_KE",
  lang: "en-KE",
  /** Social/brand profiles for Organization JSON-LD `sameAs`. Add real handles when live. */
  sameAs: [
    "https://twitter.com/driverushke",
    "https://www.instagram.com/driverushke",
    "https://www.facebook.com/driverushke",
    "https://www.tiktok.com/@driverushke",
    "https://www.youtube.com/@driverushke",
    "https://www.linkedin.com/company/driverush",
  ],
  // Default open graph image. The full lockup is 1536×1024 (3:2). Social
  // platforms prefer 1.91:1 / 1200×630 — replace with a properly cropped
  // social card when it lands.
  ogImage: "/images/driverush-logo-main.png",
  ogImageWidth: 1536,
  ogImageHeight: 1024,
  ogImageAlt: "DriveRush: NTSA prep and road-sign practice for Kenyan roads",
  themeColor: "#E11D2E", // rush red
  /** Tagline used in title templates and as the default description suffix. */
  tagline: "Learn to drive in Kenya — NTSA prep & road signs",
  description:
    "DriveRush is the online driving school for Kenya. Learn to drive with NTSA-aligned road signs, past papers, junction scenarios and full Class A, B, C, D courses. Free to start, M-Pesa when ready.",
  keywords: [
    // Brand — surface us on direct queries
    "DriveRush",
    "DriveRush Kenya",
    "DriveRush.ke",
    "Drive Rush",
    "drive rush kenya",
    // NTSA family
    "NTSA",
    "NTSA Kenya",
    "NTSA exam",
    "NTSA prep",
    "NTSA test",
    "NTSA road signs",
    "NTSA test questions and answers",
    "NTSA past papers",
    "NTSA TIMS",
    "NTSA driving licence",
    // Road signs
    "road signs Kenya",
    "Kenyan road signs",
    "Kenya road signs and meanings",
    "traffic signs Kenya",
    "highway code Kenya",
    // Learning to drive
    "learn to drive Kenya",
    "learning to drive in Kenya",
    "how to drive in Kenya",
    "online driving school Kenya",
    "online driving lessons Kenya",
    "driving lessons Kenya",
    "driving classes Kenya",
    "driving school Kenya",
    "driving schools in Kenya",
    "best driving school Kenya",
    "Nairobi driving school",
    "Nairobi driving lessons",
    // Licensing
    "driving test Kenya",
    "driving licence Kenya",
    "driving license Kenya",
    "Kenya driving licence",
    "Smart DL Kenya",
    "provisional driving licence Kenya",
    "Class A driving Kenya",
    "Class B driving Kenya",
    "Class C driving Kenya",
    "Class D driving Kenya",
    // Payment / locale
    "M-Pesa driving school",
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

/**
 * Driving-schools section keywords — appended to {@link SITE.keywords} on the
 * `/driving-schools-kenya` landing page so the school-specific terms lead.
 */
export const DRIVING_SCHOOL_KEYWORDS = [
  "driving schools in Kenya",
  "best driving schools in Kenya",
  "driving school Kenya",
  "driving school Nairobi",
  "NTSA registered driving schools",
  "AA Kenya driving school",
  "Petanns driving school",
  "Glory driving school",
  "Sunset driving school",
  "Eagle driving school",
  "Better Brakes driving school",
  "driving school fees Kenya",
  "driving school cost Kenya",
  "driving school near me Kenya",
  "Class B driving school Kenya",
  "Class D PSV driving school",
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
 * (the keyword the user typed in) and end with `· DriveRush — Kenya`. Brand
 * suffix lets sitelinks and SERP titles recognise the entity even when the
 * lead phrase is generic ("Learn to drive online", "Driving schools in Kenya").
 */
export function pageTitle(lead: string): string {
  // Don't double-stamp if the caller already included the brand.
  if (/driverush/i.test(lead)) return lead;
  return `${lead} · ${SITE.name} — Kenya`;
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
      url: absUrl(SITE.ogImage),
      width: SITE.ogImageWidth,
      height: SITE.ogImageHeight,
    },
    image: absUrl(SITE.ogImage),
    description: SITE.description,
    sameAs: SITE.sameAs,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Nairobi",
      addressCountry: "KE",
    },
    areaServed: { "@type": "Country", name: "Kenya" },
    inLanguage: ["en", "sw"],
    knowsAbout: [
      "NTSA driving licence Kenya",
      "Kenyan road signs",
      "Highway code Kenya",
      "Driving lessons online",
      "Driving school in Kenya",
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
 * WebSite JSON-LD with a `SearchAction` so Google can surface a sitelinks
 * search box for brand queries ("DriveRush", "drive rush kenya"). The action
 * target points at `/blogs?q=...` — adjust the path if a dedicated search
 * route gets built.
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
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/blogs?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
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
  /** Override OG image (defaults to the site logo). */
  ogImage?: string;
}) {
  const title = pageTitle(opts.title);
  const url = absUrl(opts.path);
  const ogImage = absUrl(opts.ogImage ?? SITE.ogImage);
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
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: opts.description },
    { name: "twitter:image", content: ogImage },
  ];
}
