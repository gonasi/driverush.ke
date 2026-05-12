import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  HelpCircleFreeIcons,
  Mortarboard01FreeIcons,
  TrafficLightFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/road-signs";

import {
  absUrl,
  breadcrumbLd,
  faqPageLd,
  keywords,
  ROAD_SIGN_KEYWORDS,
} from "~/lib/site";
import { SIGN_GAMES } from "~/lib/road-signs";
import {
  SIGN_CATEGORIES,
  SIGN_FAQ,
  type SignShape,
  type SignTone,
} from "~/data/road-signs-reference";
import { cn } from "~/lib/utils";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Accordion, AccordionItem } from "~/components/brand/accordion";
import { Callout } from "~/components/brand/callout";
import { Rail } from "~/components/brand/rail";
import { SectionHead } from "~/components/brand/section-head";
import { SignCard } from "~/components/brand/sign-card";
import { SignGameCard } from "~/components/brand/sign-game-card";

const PATH = "/road-signs";
const TOTAL_SIGNS = SIGN_CATEGORIES.reduce((n, c) => n + c.signs.length, 0);

export function meta(_: Route.MetaArgs) {
  const title = "Road signs in Kenya: every sign, what it means · DriveRush";
  const description =
    "Two quick games that drill the Kenyan road signs until naming one is instant, plus the full reference: warning, regulatory, mandatory, information, traffic-light signals and road markings, each with what it means. Free, no signup.";
  const url = absUrl(PATH);

  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords(...ROAD_SIGN_KEYWORDS) },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    {
      "script:ld+json": breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Road signs", url: PATH },
      ]),
    },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Classes of road sign in Kenya",
        itemListElement: SIGN_CATEGORIES.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.title,
          url: absUrl(`${PATH}#${c.slug}`),
        })),
      },
    },
    { "script:ld+json": faqPageLd(SIGN_FAQ) },
  ];
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
    <main className="min-h-screen text-ink">
      <Rail />

      <div className="mx-auto w-full max-w-4xl px-5 pb-24 pt-6 sm:px-9 sm:pt-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-3 outline-none hover:text-ink focus-visible:text-ink"
          >
            <HugeiconsIcon
              icon={ArrowLeft02FreeIcons}
              size={14}
              strokeWidth={2.5}
            />
            Back
          </Link>
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Road signs · Kenya / NTSA
          </span>
        </div>

        {/* ── Hero — clear pitch, badges, then straight to the games ────── */}
        <header className="border-b-2 border-ink pb-8">
          <span className="eyebrow flex items-center gap-2 text-ink">
            <HugeiconsIcon
              icon={TrafficLightFreeIcons}
              size={14}
              strokeWidth={2.5}
              className="text-rush"
            />
            DriveRush · Kenyan road signs
          </span>
          <h1 className="m-0 mt-3 font-display text-[clamp(38px,7vw,80px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
            Kenya road signs.{" "}
            <span className="italic text-rush">Learn the lot.</span>
          </h1>
          <p className="mt-5 max-w-2xl font-serif text-[clamp(17px,2.2vw,24px)] leading-tight text-ink-2">
            Two quick games that drill the Kenyan road signs until naming one is
            instant. The full reference is below, the way the NTSA Highway Code
            lays it out.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge variant="green">NTSA Highway Code</Badge>
            <Badge variant="amber">{SIGN_CATEGORIES.length} sign classes</Badge>
            <Badge variant="ink">Free · no signup</Badge>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2.5">
            <Button variant="rush" size="lg" asChild>
              <Link to="/road-signs/pelican">
                Play the recall trainer
                <HugeiconsIcon
                  icon={ArrowRight02FreeIcons}
                  size={16}
                  strokeWidth={2.5}
                />
              </Link>
            </Button>
            <Button variant="paper" size="lg" asChild>
              <Link to="/practice?mode=signs">Classic road-sign quiz</Link>
            </Button>
            <a
              href="#reference"
              className="font-mono text-[11px] uppercase tracking-widest text-ink-3 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:text-ink"
            >
              ↓ Browse every sign
            </a>
          </div>
        </header>

        {/* ── 01 · The trainers — the thing, right here ─────────────────── */}
        <section className="mt-12" aria-label="Road-sign trainers">
          <SectionHead
            num="01"
            title={
              <>
                Drill them <em>first</em>
              </>
            }
            stamp={`${SIGN_GAMES.length} trainers · free`}
            lede="Reading the list once is not learning it. These two mini-games make you recall each sign instead; misses come back sooner, the ones you've got drift away. About five minutes a day."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {SIGN_GAMES.map((g) => (
              <SignGameCard key={g.slug} game={g} />
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-dashed border-ink pt-4">
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Prefer the classic?
            </span>
            <Button variant="paper" size="sm" asChild>
              <Link to="/practice?mode=signs">
                Road-sign quiz
                <HugeiconsIcon
                  icon={ArrowRight02FreeIcons}
                  size={14}
                  strokeWidth={2.5}
                />
              </Link>
            </Button>
          </div>
        </section>

        {/* Pinstripe break — product above, reference below. */}
        <Rail className="my-14" id="reference" />

        {/* ── 02 · How the signs work — the shape & colour legend ───────── */}
        <section className="scroll-mt-8">
          <SectionHead
            num="02"
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

        {/* ── 03 · Every sign, by class — collapsed; open the one you want ─ */}
        <section className="mt-14 scroll-mt-8" id="classes">
          <SectionHead
            num="03"
            title={
              <>
                Every sign, <em>by class</em>
              </>
            }
            stamp={`${SIGN_CATEGORIES.length} classes · ${TOTAL_SIGNS}+ signs`}
            lede="Tap a class to open it. These are the common signs that turn up on Kenyan roads and in the NTSA test, not the full legal schedule."
          />
          <Accordion>
            {SIGN_CATEGORIES.map((cat) => (
              <AccordionItem
                key={cat.slug}
                summary={
                  <span className="flex flex-1 items-center gap-2.5">
                    <SignChip shape={cat.shape} tone={cat.tone} />
                    <span>{cat.title}</span>
                    <span className="ml-auto font-mono text-[10px] font-normal normal-case tracking-wider opacity-70">
                      {cat.klass} · {cat.signs.length}
                    </span>
                  </span>
                }
              >
                <div id={cat.slug} className="font-sans scroll-mt-8">
                  <p className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                    {cat.shapeLabel}
                  </p>
                  <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">
                    {cat.summary}
                  </p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
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

          {/* The sign chart the trainers draw from — tucked away, open if wanted. */}
          <details className="mt-4 border-2 border-ink bg-surface [&[open]>summary]:border-b-2 [&[open]>summary]:border-ink [&[open]>summary]:after:content-['−']">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-mono text-[10.5px] uppercase tracking-widest text-ink-3 outline-none after:font-display after:text-lg after:font-extrabold after:leading-none after:text-rush after:content-['+'] focus-visible:text-ink [&::-webkit-details-marker]:hidden">
              The full sign chart
            </summary>
            <figure className="bg-white p-3 sm:p-5">
              <img
                src="/assets/road-signs/road-signs.svg"
                alt="Kenyan road signs chart: warning, regulatory, mandatory, information, traffic-light and road-marking signs used on Kenya's roads and in the NTSA test"
                width={1920}
                height={1080}
                loading="lazy"
                className="mx-auto block w-full"
              />
              <figcaption className="mt-3 border-t border-dashed border-ink pt-3 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                The DriveRush sign chart · the trainers zoom one sign at a time
                out of this
              </figcaption>
            </figure>
          </details>
        </section>

        {/* ── 04 · FAQ ──────────────────────────────────────────────────── */}
        <section className="mt-14 scroll-mt-8" id="faq">
          <SectionHead
            num="04"
            title={
              <>
                Road signs in Kenya <em>FAQ</em>
              </>
            }
            stamp={
              <span className="inline-flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={HelpCircleFreeIcons}
                  size={13}
                  strokeWidth={2.5}
                />
                {SIGN_FAQ.length} questions
              </span>
            }
          />
          <Accordion>
            {SIGN_FAQ.map((item, i) => (
              <AccordionItem key={item.q} summary={item.q} open={i === 0}>
                {item.a}
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ── Closing CTA — the bigger picture ──────────────────────────── */}
        <section className="mt-14">
          <div className="grid gap-5 border-2 border-ink bg-surface p-6 shadow-stamp sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div>
              <span className="eyebrow text-ink">Class A · B · C · D</span>
              <p className="mt-2.5 font-display text-[clamp(22px,3.4vw,34px)] font-extrabold uppercase leading-[0.95] tracking-tight text-ink">
                Sitting the <span className="italic text-rush">NTSA test?</span>
              </p>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">
                Road signs are one slice of it. If you are learning to drive in
                Kenya, quick practice covers signs, junctions, hazard perception
                and the rules from real past papers, and the courses teach the
                lot in order. No signup to start, pay with M-Pesa when you are
                ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="rush" size="lg" asChild>
                <Link to="/practice">
                  Start practising
                  <HugeiconsIcon
                    icon={ArrowRight02FreeIcons}
                    size={16}
                    strokeWidth={2.5}
                  />
                </Link>
              </Button>
              <Button variant="ink" size="lg" asChild>
                <Link to="/courses">
                  <HugeiconsIcon
                    icon={Mortarboard01FreeIcons}
                    size={16}
                    strokeWidth={2.25}
                  />
                  See the courses
                </Link>
              </Button>
            </div>
          </div>
          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Highway Code source · Traffic Signs Rules, LN 310 of 1974 · NTSA
          </p>
        </section>
      </div>
    </main>
  );
}
