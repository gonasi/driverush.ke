import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  ArrowUpRight01FreeIcons,
  Mortarboard01FreeIcons,
  TrafficLightFreeIcons,
  Tick02FreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/driving-schools-kenya";

import {
  absUrl,
  breadcrumbLd,
  DRIVING_SCHOOL_KEYWORDS,
  pageMeta,
  SITE,
} from "~/lib/site";
import {
  DRIVING_SCHOOLS,
  SCHOOLS_FAQ,
  schoolsByPrice,
  type DrivingSchool,
} from "~/data/driving-schools";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Accordion, AccordionItem } from "~/components/brand/accordion";
import { Rail } from "~/components/brand/rail";
import { SectionHead } from "~/components/brand/section-head";

const PATH = "/driving-schools-kenya";

export function meta(_: Route.MetaArgs) {
  const url = absUrl(PATH);
  return [
    ...pageMeta({
      title:
        "Driving schools in Kenya — compare price, branches, NTSA-registered options",
      description:
        "Compare the major NTSA-registered driving schools in Kenya: AA Kenya, Petanns, Glory, Better Brakes, Sunset and Eagle. Price bands, branches by county, licence classes, and how to split theory online so you only pay a school for the practical.",
      path: PATH,
      extraKeywords: DRIVING_SCHOOL_KEYWORDS,
    }),
    // Single @graph: one FAQPage on the page, plus breadcrumb and a directory
    // ItemList. Schools embed as Organization items inside the list, each with
    // an `@id` and `areaServed` so search treats them as real entities.
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@graph": [
          stripContext(
            breadcrumbLd([
              { name: "Home", url: "/" },
              { name: "Driving schools in Kenya", url: PATH },
            ]),
          ),
          {
            "@type": "ItemList",
            "@id": `${url}#schools`,
            name: "NTSA-registered driving schools in Kenya",
            numberOfItems: DRIVING_SCHOOLS.length,
            itemListElement: DRIVING_SCHOOLS.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Organization",
                "@id": `${url}#${s.slug}`,
                name: s.name,
                ...(s.url ? { url: s.url } : {}),
                description: s.blurb,
                areaServed: s.coverage.map((c) => ({
                  "@type": "AdministrativeArea",
                  name: c,
                })),
                ...(s.founded ? { foundingDate: String(s.founded) } : {}),
              },
            })),
          },
          {
            "@type": "FAQPage",
            "@id": `${url}#faq`,
            mainEntity: SCHOOLS_FAQ.map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
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

const PRICE_BAND_LABEL = {
  budget: "Budget",
  mid: "Mid-range",
  premium: "Premium",
} as const;

const PRICE_BAND_BADGE = {
  budget: "green",
  mid: "amber",
  premium: "rush",
} as const;

export default function DrivingSchoolsKenya() {
  const ordered = schoolsByPrice();
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
            Driving schools · Kenya / NTSA
          </span>
        </div>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <header className="border-b-2 border-ink pb-8">
          <span className="eyebrow flex items-center gap-2 text-ink">
            <HugeiconsIcon
              icon={TrafficLightFreeIcons}
              size={14}
              strokeWidth={2.5}
              className="text-rush"
            />
            DriveRush · Driving schools in Kenya
          </span>
          <h1 className="m-0 mt-3 font-display text-[clamp(38px,7vw,80px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
            Driving schools in Kenya.{" "}
            <span className="italic text-rush">The honest comparison.</span>
          </h1>
          <p className="mt-5 max-w-2xl font-serif text-[clamp(17px,2.2vw,24px)] leading-tight text-ink-2">
            The major NTSA-registered driving schools, what they cost, where
            they teach, and the one decision that quietly saves most learners
            KES 4,000–7,000: do not pay a school for theory.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge variant="green">NTSA registered</Badge>
            <Badge variant="amber">
              {DRIVING_SCHOOLS.length} major schools
            </Badge>
            <Badge variant="ink">
              Updated {SITE.lang.toUpperCase()} · 2026
            </Badge>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2.5">
            <Button variant="rush" size="lg" asChild>
              <Link to="/practice">
                Start free theory practice
                <HugeiconsIcon
                  icon={ArrowRight02FreeIcons}
                  size={16}
                  strokeWidth={2.5}
                />
              </Link>
            </Button>
            <Button variant="paper" size="lg" asChild>
              <Link to="/courses">
                <HugeiconsIcon
                  icon={Mortarboard01FreeIcons}
                  size={16}
                  strokeWidth={2.25}
                />
                See the courses
              </Link>
            </Button>
            <a
              href="#schools"
              className="font-mono text-[11px] uppercase tracking-widest text-ink-3 underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:text-ink"
            >
              ↓ Jump to the directory
            </a>
          </div>
        </header>

        {/* ── 01 · The split: theory online, practical at a school ──────── */}
        <section className="mt-14">
          <SectionHead
            num="01"
            title={
              <>
                Theory online, <em>practical at a school</em>
              </>
            }
            stamp="The KES 4–7k save"
            lede="A driving school in Kenya is mandatory for one reason: the NTSA needs a registered school to certify your practical hours. Everything else is optional."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <article className="border-2 border-ink bg-surface p-6">
              <span className="eyebrow text-rush">
                Online theory · DriveRush
              </span>
              <h3 className="mt-2 font-display text-[22px] font-extrabold uppercase tracking-tight text-ink">
                Free, on your phone
              </h3>
              <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink-2">
                {[
                  "All Kenyan road signs with meanings, drilled by spaced recall",
                  "NTSA past papers under timed conditions",
                  "Junction scenarios and hazard perception",
                  "Pay M-Pesa only when you want the deep bank",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <HugeiconsIcon
                      icon={Tick02FreeIcons}
                      size={14}
                      strokeWidth={3}
                      className="mt-1.5 shrink-0 text-rush"
                    />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="border-2 border-ink bg-surface p-6">
              <span className="eyebrow text-ink-3">
                In-person driving school
              </span>
              <h3 className="mt-2 font-display text-[22px] font-extrabold uppercase tracking-tight text-ink">
                Required for the practical
              </h3>
              <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink-2">
                {[
                  "NTSA certificate on the wall — verify it before paying",
                  "Yard hours, then road hours, then mock test",
                  "Books the NTSA test in your name (TIMS receipt)",
                  "Theory is sold separately at most schools — skip that line",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <HugeiconsIcon
                      icon={Tick02FreeIcons}
                      size={14}
                      strokeWidth={3}
                      className="mt-1.5 shrink-0 text-ink"
                    />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <p className="mt-6 text-[15px] leading-relaxed text-ink-2">
            Most NTSA failures are theory failures. If you only have budget for
            one thing, it should not be the theory class at a driving school. It
            should be 25 hours behind the wheel.
          </p>
        </section>

        {/* ── 02 · The directory ────────────────────────────────────────── */}
        <section id="schools" className="mt-14 scroll-mt-20">
          <SectionHead
            num="02"
            title={
              <>
                The major <em>NTSA-registered schools</em>
              </>
            }
            stamp="Curated · 2026"
            lede="The largest networks with branches across multiple counties. Ordered by typical Class B price band. Every school below is NTSA-registered — ask for the certificate on the wall before paying anyway."
          />
          <ol className="space-y-4">
            {ordered.map((s, i) => (
              <li key={s.slug}>
                <SchoolCard school={s} position={i + 1} />
              </li>
            ))}
          </ol>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Coverage notes from each school's published branch list. Prices are
            indicative bands as of 2026 — confirm the package and exclusions in
            writing before paying.
          </p>
        </section>

        {/* ── 03 · How to pick one ──────────────────────────────────────── */}
        <section className="mt-14">
          <SectionHead
            num="03"
            title={
              <>
                Six questions <em>before you pay</em>
              </>
            }
            stamp="The vetting list"
            lede="Good schools answer all six clearly. Walk away from the ones that don't — the cost of a bad school is far more than the deposit you'll lose."
          />
          <ol className="space-y-4">
            {VETTING_QUESTIONS.map((q, i) => (
              <li
                key={q.q}
                className="border-2 border-ink bg-surface p-5 sm:p-6"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-2xl font-extrabold italic leading-none text-rush">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="m-0 font-display text-[18px] font-extrabold uppercase tracking-tight text-ink">
                    {q.q}
                  </h3>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  {q.a}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── 04 · Price bands by class ─────────────────────────────────── */}
        <section className="mt-14">
          <SectionHead
            num="04"
            title={
              <>
                Driving school cost <em>in Kenya · by class</em>
              </>
            }
            stamp="Indicative · 2026"
            lede="Total spend with a typical NTSA-registered school, before NTSA test fees. Ranges reflect city-vs-county variation and bundle differences."
          />
          <div className="overflow-x-auto border-2 border-ink bg-surface">
            <table className="w-full text-left text-[14.5px]">
              <thead className="border-b-2 border-ink bg-ink text-paper">
                <tr>
                  <th className="px-4 py-3 font-display text-[12px] font-extrabold uppercase tracking-widest">
                    Class
                  </th>
                  <th className="px-4 py-3 font-display text-[12px] font-extrabold uppercase tracking-widest">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 font-display text-[12px] font-extrabold uppercase tracking-widest">
                    Theory + practical
                  </th>
                  <th className="px-4 py-3 font-display text-[12px] font-extrabold uppercase tracking-widest">
                    With DriveRush
                  </th>
                </tr>
              </thead>
              <tbody>
                {CLASS_PRICE_BANDS.map((r) => (
                  <tr
                    key={r.cls}
                    className="border-t border-dashed border-ink text-ink-2"
                  >
                    <td className="px-4 py-3 font-display text-[15px] font-extrabold text-ink">
                      Class {r.cls}
                    </td>
                    <td className="px-4 py-3">{r.vehicle}</td>
                    <td className="px-4 py-3">{r.bundled}</td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {r.split}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-ink-3">
            Bands above exclude NTSA test fees (currently KES 1,500 for the
            theory test, KES 1,000 for the practical). Smart DL card issuance is
            a separate fee. See the{" "}
            <Link
              to="/blogs/ntsa-driving-licence-kenya-2026"
              className="text-rush hover:underline"
            >
              full NTSA fee breakdown
            </Link>
            .
          </p>
        </section>

        {/* ── 05 · Frequently asked ────────────────────────────────────── */}
        <section id="faq" className="mt-14 scroll-mt-20">
          <SectionHead
            num="05"
            title={
              <>
                Common <em>questions</em>
              </>
            }
            stamp="Driving schools · Kenya · NTSA"
          />
          <Accordion>
            {SCHOOLS_FAQ.map((item, i) => (
              <AccordionItem key={item.q} summary={item.q} open={i === 0}>
                {item.a}
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            More →{" "}
            <Link
              to="/blogs/learning-to-drive-in-kenya"
              className="text-rush hover:underline"
            >
              Full guide to learning to drive in Kenya
            </Link>{" "}
            ·{" "}
            <Link
              to="/blogs/ntsa-test-prep-kenya"
              className="text-rush hover:underline"
            >
              NTSA test prep
            </Link>{" "}
            ·{" "}
            <Link
              to="/blogs/cost-of-learning-to-drive-nairobi"
              className="text-rush hover:underline"
            >
              The real Nairobi cost
            </Link>
          </p>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section className="mt-14">
          <div className="grid gap-5 border-2 border-ink bg-surface p-6 shadow-stamp sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div>
              <span className="eyebrow text-ink">Class A · B · C · D</span>
              <p className="mt-2.5 font-display text-[clamp(22px,3.4vw,34px)] font-extrabold uppercase leading-[0.95] tracking-tight text-ink">
                Skip the theory bill.{" "}
                <span className="italic text-rush">Start practising.</span>
              </p>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">
                The NTSA test pulls from the same bank, whether you drilled it
                at a desk or on your phone in a matatu. Free road-sign trainer,
                full past papers, junction scenarios. No signup to start.
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
            Source · NTSA Driving School Regulations · Traffic Act Cap. 403
          </p>
        </section>
      </div>
    </main>
  );
}

function SchoolCard({
  school,
  position,
}: {
  school: DrivingSchool;
  position: number;
}) {
  return (
    <article
      id={school.slug}
      className="scroll-mt-20 border-2 border-ink bg-surface p-5 sm:p-6"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="font-display text-[28px] font-extrabold italic leading-none tracking-[-0.03em] text-rush sm:text-[36px]"
        >
          {String(position).padStart(2, "0")}
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="m-0 font-display text-[20px] font-extrabold uppercase tracking-tight text-ink sm:text-[24px]">
              {school.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={PRICE_BAND_BADGE[school.priceBand]}>
                {PRICE_BAND_LABEL[school.priceBand]}
              </Badge>
              <Badge variant="outline">
                Class {school.classes.join(" · ")}
              </Badge>
            </div>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
            {school.blurb}
          </p>
          <dl className="mt-4 grid gap-3 text-[14px] sm:grid-cols-[max-content_1fr] sm:gap-x-5 sm:gap-y-2">
            <dt className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 sm:pt-0.5">
              Class B band
            </dt>
            <dd className="text-ink-2">{school.priceRange}</dd>
            <dt className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 sm:pt-0.5">
              Coverage
            </dt>
            <dd className="text-ink-2">{school.coverage.join(" · ")}</dd>
            {school.founded && (
              <>
                <dt className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 sm:pt-0.5">
                  Founded
                </dt>
                <dd className="text-ink-2">{school.founded}</dd>
              </>
            )}
            {school.highlight && (
              <>
                <dt className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 sm:pt-0.5">
                  Known for
                </dt>
                <dd className="text-ink-2">{school.highlight}</dd>
              </>
            )}
          </dl>
          {school.url && (
            <a
              href={school.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-rush underline-offset-4 outline-none hover:underline focus-visible:underline"
            >
              {school.name} website
              <HugeiconsIcon
                icon={ArrowUpRight01FreeIcons}
                size={12}
                strokeWidth={2.5}
              />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

const VETTING_QUESTIONS = [
  {
    q: "Are you NTSA-registered?",
    a: "Every legitimate driving school in Kenya has an NTSA certificate on the wall. If they hesitate or wave it off, walk out. Hours from an unregistered school cannot certify you for the test.",
  },
  {
    q: "What does the package include?",
    a: "Get a written breakdown: theory hours, practical hours, dual-control car use, mock test, NTSA test booking fee. Ask which items are extra. The cheapest sticker price often has the most exclusions.",
  },
  {
    q: "How many practical hours do I actually get behind the wheel?",
    a: "An hour booked is not an hour driving. Ask whether you'll share the car with other students per session, and how much pure wheel-time you get. Below 15 driving hours total, fail rates climb sharply.",
  },
  {
    q: "Who are the instructors and are they classified?",
    a: "NTSA classifies driving instructors. Senior instructors charge more — they're also the ones who notice the bad habits. A school that won't name its instructor team is one to skip.",
  },
  {
    q: "Do you book the NTSA test for me?",
    a: "Most do. Get the TIMS receipt or booking confirmation in your name, not the school's, before the test date. Schools that hold receipts on your behalf are a common source of delays.",
  },
  {
    q: "What happens if I fail the practical?",
    a: "Reasonable schools include one retake or charge a known retake fee. The shady ones quietly upsell another full package. Get the retake policy in writing before you pay the first time.",
  },
] as const;

const CLASS_PRICE_BANDS = [
  {
    cls: "A",
    vehicle: "Motorbike",
    bundled: "KES 6,000 – 12,000",
    split: "KES 4,000 – 8,000 + free",
  },
  {
    cls: "B",
    vehicle: "Light vehicle (car)",
    bundled: "KES 8,000 – 20,000",
    split: "KES 5,000 – 13,000 + free",
  },
  {
    cls: "C",
    vehicle: "Light goods vehicle",
    bundled: "KES 12,000 – 22,000",
    split: "KES 8,000 – 15,000 + free",
  },
  {
    cls: "D",
    vehicle: "PSV (matatu / bus)",
    bundled: "KES 18,000 – 35,000",
    split: "KES 13,000 – 25,000 + free",
  },
] as const;
