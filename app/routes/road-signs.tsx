import type { Route } from "./+types/road-signs";

import { absUrl, breadcrumbLd, pageMeta, ROAD_SIGN_KEYWORDS } from "~/lib/site";
import { stagger } from "~/lib/motion";
import { ogCardAlt, ogCardPath } from "~/lib/og-cards";
import { SIGN_COUNT } from "~/lib/road-signs";
import {
  SIGN_CATEGORIES,
  type SignShape,
  type SignTone,
} from "~/data/road-signs-reference";
import { cn } from "~/lib/utils";

import { Badge } from "~/components/ui/badge";
import { Accordion, AccordionItem } from "~/components/brand/accordion";
import { Callout } from "~/components/brand/callout";
import { SignCredit } from "~/components/brand/sign-credit";
import { Rail } from "~/components/brand/rail";
import { SectionHead } from "~/components/brand/section-head";
import { ShareButton } from "~/components/brand/share-button";
import { SignCard } from "~/components/brand/sign-card";
import { SignClassList } from "~/components/brand/sign-class-list";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";
import { TrainerCards } from "~/components/home/trainer-cards";

const PATH = "/road-signs";
/** Classes the trainers don't drill, so the text reference is all there is. */
const REFERENCE_ONLY = SIGN_CATEGORIES.filter((c) =>
  ["information", "signals", "markings"].includes(c.slug),
);

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: `Kenya road signs and meanings: ${SIGN_COUNT} signs with pictures`,
      description: `${SIGN_COUNT} Kenyan road signs with pictures and meanings: warning, priority, mandatory and prohibitory. Free trainers to memorise them, no signup.`,
      path: PATH,
      ogImage: ogCardPath("road-signs"),
      ogImageAlt: ogCardAlt("road-signs"),
      extraKeywords: ROAD_SIGN_KEYWORDS,
    }),
    // Breadcrumb + ItemList in a single @graph.
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@graph": [
          stripContext(
            breadcrumbLd([
              { name: "Home", url: "/" },
              { name: "Road signs", url: PATH },
            ]),
          ),
          {
            "@type": "ItemList",
            name: "More Kenyan road signs and markings",
            itemListElement: REFERENCE_ONLY.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: c.title,
              url: absUrl(`${PATH}#${c.slug}`),
            })),
          },
        ],
      },
    },
  ];
}

function stripContext<T extends { "@context"?: unknown }>(
  obj: T,
): Omit<T, "@context"> {
  const { "@context": _ctx, ...rest } = obj;
  return rest;
}

/* Map the data's shape vocabulary onto the sign-card frame's. */
const SIGN_CARD_SHAPE: Record<SignShape, "square" | "circle" | "triangle"> = {
  triangle: "triangle",
  circle: "circle",
  octagon: "square",
  rectangle: "square",
};

/* Small inline shape chip — the sign-card frame, shrunk to a list marker. */
const CHIP_CLIP: Record<SignShape, string> = {
  triangle: "[clip-path:polygon(50%_0,100%_100%,0_100%)]",
  octagon:
    "[clip-path:polygon(30%_0,70%_0,100%_30%,100%_70%,70%_100%,30%_100%,0_70%,0_30%)]",
  circle: "rounded-full",
  rectangle: "",
};
const CHIP_BG: Record<SignTone, string> = {
  rush: "bg-rush",
  amber: "bg-amber",
  blue: "bg-plate-blue",
  green: "bg-kenya-green",
  ink: "bg-ink",
};

function SignChip({
  shape,
  tone,
  className,
}: {
  shape: SignShape;
  tone: SignTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-5 shrink-0 border-2 border-ink",
        CHIP_CLIP[shape],
        CHIP_BG[tone],
        className,
      )}
    />
  );
}

export default function RoadSigns() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen text-ink">
        <Rail />

        <div className="mx-auto w-full max-w-4xl px-5 pb-24 pt-6 sm:px-9 sm:pt-10">
          {/* Hero: what this page is, then straight to the trainers. */}
          <header className="grid gap-3 sm:gap-4">
            <SignCredit className="dr-rise" />
            <h1
              style={stagger(1)}
              className="dr-rise m-0 font-display text-[clamp(36px,7vw,76px)] font-extrabold uppercase leading-[0.9] tracking-tighter"
            >
              Kenya road signs.{" "}
              <span className="italic text-rush">All {SIGN_COUNT}.</span>
            </h1>
            <p
              style={stagger(2)}
              className="dr-rise m-0 max-w-2xl font-serif text-[clamp(16px,2.2vw,22px)] leading-snug text-ink-2"
            >
              The signs on the Pelican chart and what each one means. Pick a
              trainer to drill them. Free, no signup.
            </p>
          </header>

          <section className="mt-6" aria-label="Road-sign trainers">
            <TrainerCards firstStep={3} />
            {/* The chart is the most forwarded thing on the site: a learner
                sends it to the next person in the queue at NTSA. */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2.5">
              <ShareButton
                surface="road_signs_hero"
                label="Send to a friend"
                payload={{
                  kind: "page",
                  path: "/road-signs",
                  title: `${SIGN_COUNT} Kenyan road signs, with what each one means`,
                  text: "The Pelican chart, plus 3D signs you can spin. Free, no signup.",
                }}
              />
              <a
                href="#reference"
                className="font-mono text-[11px] uppercase tracking-widest text-ink-3 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:text-ink"
              >
                ↓ Browse the signs
              </a>
            </div>
          </section>

          {/* Pinstripe break — product above, reference below. */}
          <Rail className="my-14" id="reference" />

          {/* ── 02 · How the signs work — the shape & colour legend ───────── */}
          <section className="dr-reveal scroll-mt-8">
            <SectionHead
              num="01"
              title={
                <>
                  How the signs <em>work</em>
                </>
              }
              stamp="Shape + colour"
              lede="You can read most Kenyan road signs before you can read the symbol on them. Shape and colour do the first job, and the pattern holds across every class."
            />
            <div className="grid gap-3.5 sm:grid-cols-3">
              {SIGN_CATEGORIES.map((cat) => (
                <SignCard
                  key={cat.slug}
                  shape={SIGN_CARD_SHAPE[cat.shape]}
                  tone={cat.tone}
                  icon={cat.icon}
                  iconSize={44}
                  name={cat.short}
                  classification={cat.shapeShort}
                />
              ))}
            </div>
            <Callout className="mt-5">
              Read shape and colour first: a red triangle warns, a red ring or
              octagon forbids, a blue circle commands, a rectangle informs. The
              symbol on the sign is just the detail.
            </Callout>
          </section>

          {/* The trainers' signs, then the classes they don't cover yet. */}
          <section className="dr-reveal mt-14 scroll-mt-8" id="classes">
            <SectionHead
              num="02"
              title={
                <>
                  The signs, <em>by class</em>
                </>
              }
              stamp={`${SIGN_COUNT} signs`}
              lede="Tap a class to open it, or drill just that class on the chart or in 3D."
            />
            <SignClassList />

            {/* The chart itself: tucked away, open if wanted. */}
            <details className="mt-4 border-2 border-ink bg-surface [&[open]>summary]:border-b-2 [&[open]>summary]:border-ink [&[open]>summary]:after:content-['−']">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-mono text-[10.5px] uppercase tracking-widest text-ink-3 outline-none after:font-display after:text-lg after:font-extrabold after:leading-none after:text-rush after:content-['+'] focus-visible:text-ink [&::-webkit-details-marker]:hidden">
                The Pelican chart
              </summary>
              <figure className="bg-white p-3 sm:p-5">
                <img
                  src="/assets/road-signs/road-signs.v2.svg"
                  alt="Kenyan road signs chart: warning, regulatory, mandatory, information, traffic-light and road-marking signs used on Kenya's roads and in the NTSA test"
                  width={1920}
                  height={1080}
                  loading="lazy"
                  className="mx-auto block w-full"
                />
                <figcaption className="mt-3 border-t border-dashed border-ink pt-3 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                  The Pelican chart · the trainer zooms into one sign at a time
                </figcaption>
              </figure>
            </details>
          </section>

          <section className="dr-reveal mt-14 scroll-mt-8" id="more">
            <SectionHead
              num="03"
              title={
                <>
                  Also on the <em>road</em>
                </>
              }
              stamp="Not in the trainers yet"
              lede="Information signs, signals and road markings you'll meet out there. The trainers don't drill these yet."
            />
            <Accordion>
              {REFERENCE_ONLY.map((cat) => (
                <AccordionItem
                  key={cat.slug}
                  summary={
                    <span className="flex flex-1 items-center gap-2.5">
                      <SignChip shape={cat.shape} tone={cat.tone} />
                      <span>{cat.title}</span>
                      <span className="ml-auto font-mono text-[10px] font-normal normal-case tracking-wider opacity-70">
                        {cat.signs.length}
                      </span>
                    </span>
                  }
                >
                  <div id={cat.slug} className="scroll-mt-20 font-sans">
                    <p className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                      {cat.shapeLabel}
                    </p>
                    <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">
                      {cat.summary}
                    </p>
                    <ul className="m-0 mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
                      {cat.signs.map((sign) => (
                        <li
                          key={sign.name}
                          className="border-2 border-ink bg-paper-3 px-3.5 py-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-display text-[12.5px] font-extrabold uppercase leading-tight tracking-[0.02em] text-ink">
                              {sign.name}
                            </span>
                            {sign.swahili && (
                              <Badge variant="cream" className="shrink-0">
                                {sign.swahili}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
                            {sign.meaning}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
