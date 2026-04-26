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
  themeColor: "#E11D2E", // rush red
  description:
    "DriveRush is the NTSA prep app built for Kenyan roads. Real signs, real junctions, real past papers. Class A, B, C, D. Pay with M-Pesa.",
  keywords: [
    "NTSA",
    "NTSA exam",
    "NTSA prep",
    "driving school Kenya",
    "driving test Kenya",
    "Kenya driving licence",
    "Class B driving",
    "highway code Kenya",
    "M-Pesa driving school",
    "Nairobi driving lessons",
  ],
} as const;

/** Build an absolute URL for a route or asset. */
export function absUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${p}`;
}
