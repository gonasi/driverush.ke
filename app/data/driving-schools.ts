/**
 * Curated list of major NTSA-registered driving schools in Kenya. Used by the
 * `/driving-schools-kenya` landing page (directory + comparison) and by the
 * ItemList JSON-LD that ships with it.
 *
 * Editorial rules:
 * - Only schools that are unambiguously NTSA-registered and operate at scale.
 * - Price bands are ranges, not specific prices — schools change pricing often
 *   and we don't want stale absolutes ranking in search.
 * - `note` is a neutral, observable fact (coverage, longevity, focus), not a
 *   subjective ranking — we don't have reviewer data behind a score.
 */

export type LicenceClass = "A" | "B" | "C" | "D";

export type PriceBand =
  | "budget" // < KES 10k Class B package
  | "mid" // KES 10k – 18k
  | "premium"; // > KES 18k

export type DrivingSchool = {
  /** Short slug — kebab-case, unique. */
  slug: string;
  /** Display name as it appears in marketing materials. */
  name: string;
  /** Public website. Optional — some schools only run social profiles. */
  url?: string;
  /** One-sentence positioning. ~120 chars. Neutral, fact-based. */
  blurb: string;
  /** Counties / regions they have branches in. */
  coverage: string[];
  /** Licence classes they actively teach. */
  classes: LicenceClass[];
  /** Price band for a standard Class B (light vehicle) package. */
  priceBand: PriceBand;
  /** Indicative range string we show in the table. */
  priceRange: string;
  /** Year founded — anchors longevity claims when relevant. Optional. */
  founded?: number;
  /** Standout fact we link to from the editorial body. Optional. */
  highlight?: string;
};

/**
 * Curated, alphabetised by name. To add a school: keep the editorial bar — has
 * to be NTSA-registered, multi-county presence (or strong single-county
 * heritage), and verifiable from public sources.
 */
export const DRIVING_SCHOOLS: DrivingSchool[] = [
  {
    slug: "aa-kenya",
    name: "AA Kenya",
    url: "https://www.aakenya.co.ke",
    blurb:
      "The Automobile Association of Kenya's driving school arm — the oldest national driving-school network in the country.",
    coverage: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Nyeri"],
    classes: ["A", "B", "C", "D"],
    priceBand: "premium",
    priceRange: "KES 15,000 – 25,000",
    founded: 1954,
    highlight: "Oldest national network, full Class A–D coverage",
  },
  {
    slug: "petanns",
    name: "Petanns Driving School",
    url: "https://petanns.co.ke",
    blurb:
      "Nairobi-headquartered national chain with strong public-service-vehicle (Class D) training pipelines.",
    coverage: ["Nairobi", "Mombasa", "Nakuru", "Kisumu", "Thika"],
    classes: ["A", "B", "C", "D"],
    priceBand: "mid",
    priceRange: "KES 10,000 – 18,000",
    highlight: "Heavy commercial / PSV focus",
  },
  {
    slug: "glory-driving-school",
    name: "Glory Driving School",
    blurb:
      "National chain with a wide Nairobi footprint and a popular weekend / evening track for working learners.",
    coverage: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"],
    classes: ["A", "B", "C", "D"],
    priceBand: "mid",
    priceRange: "KES 10,000 – 16,000",
    highlight: "Strong weekend and evening cohorts",
  },
  {
    slug: "better-brakes",
    name: "Better Brakes Driving School",
    blurb:
      "Long-running Nairobi school focused on Class B private-vehicle learners, with branches across the city.",
    coverage: ["Nairobi", "Kiambu"],
    classes: ["A", "B"],
    priceBand: "mid",
    priceRange: "KES 9,000 – 15,000",
    highlight: "Class B specialist",
  },
  {
    slug: "sunset-driving-school",
    name: "Sunset Driving School",
    blurb:
      "Coast-region heritage school with a strong Mombasa presence and growing inland branches.",
    coverage: ["Mombasa", "Kilifi", "Nairobi"],
    classes: ["A", "B", "C", "D"],
    priceBand: "mid",
    priceRange: "KES 10,000 – 17,000",
    highlight: "Coast-region heritage",
  },
  {
    slug: "eagle-driving-school",
    name: "Eagle Driving School",
    blurb:
      "Multi-county chain with a budget-friendly Class B package; common pick for first-time private learners.",
    coverage: ["Nairobi", "Nakuru", "Eldoret", "Kisumu"],
    classes: ["A", "B", "C"],
    priceBand: "budget",
    priceRange: "KES 8,000 – 12,000",
    highlight: "Budget Class B package",
  },
];

/** Sort schools by price band (budget → premium) for the comparison table. */
const PRICE_RANK: Record<PriceBand, number> = {
  budget: 0,
  mid: 1,
  premium: 2,
};

export function schoolsByPrice(): DrivingSchool[] {
  return [...DRIVING_SCHOOLS].sort(
    (a, b) => PRICE_RANK[a.priceBand] - PRICE_RANK[b.priceBand],
  );
}

/** Common questions surfaced as FAQPage JSON-LD + visible accordion. */
export const SCHOOLS_FAQ = [
  {
    q: "What are the best driving schools in Kenya?",
    a: "The largest NTSA-registered networks are AA Kenya, Petanns, Glory, Better Brakes, Sunset and Eagle. They're accredited and present in most counties. Quality varies branch-to-branch, so always ask to see the NTSA certificate before paying.",
  },
  {
    q: "How much does a driving school in Kenya cost?",
    a: "Class B (light-vehicle) packages typically run KES 8,000–20,000 depending on the school, county and whether theory is bundled. Theory-only is usually KES 3,000–5,000. NTSA test fees are extra. DriveRush's online theory practice is free, so you only pay a school for practical hours.",
  },
  {
    q: "How long does driving school take in Kenya?",
    a: "Class B courses typically run 4–8 weeks at 2–3 sessions a week, plus the NTSA test wait. Theory is 2–3 weeks of self-study; practical needs roughly 15–25 instructor hours. Working learners usually take 6–10 weeks total.",
  },
  {
    q: "Do I have to attend a physical driving school to get a Kenyan licence?",
    a: "For the practical test, yes — an NTSA-registered school must certify your driving hours. For theory, no. You can self-study online (free, with DriveRush), then pay a school only for the practical component. This typically saves KES 4,000–7,000.",
  },
  {
    q: "Are online driving schools legal in Kenya?",
    a: "Online theory study is legal and effective for the NTSA test. The practical test, however, must be signed off by an NTSA-registered physical school. DriveRush handles theory online for free; book practical hours wherever you like once you're test-ready.",
  },
  {
    q: "How do I know a driving school is NTSA-registered?",
    a: "Every legitimate driving school in Kenya has an NTSA certificate displayed on the wall. If the school can't produce it on request, walk out. Hours from an unregistered school cannot certify you for the practical test.",
  },
  {
    q: "Which driving school is cheapest in Kenya?",
    a: "Budget Class B packages start around KES 8,000 (e.g. Eagle Driving School). The cheapest sticker price often has the most exclusions, so always ask for the written breakdown of theory hours, practical hours and the NTSA test booking fee before paying.",
  },
  {
    q: "Can I learn theory online and practical at a driving school?",
    a: "Yes — and it's the cheapest path. Use DriveRush's free road-sign trainer, past papers and junction scenarios for theory at your own pace, then book only the practical hours with an NTSA-registered driving school once you're ready.",
  },
];
