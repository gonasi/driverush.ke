import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  ArrowUpRight01FreeIcons,
  Mortarboard01FreeIcons,
  TrafficLightFreeIcons,
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
  schoolsByPrice,
  type DrivingSchool,
} from "~/data/driving-schools";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Rail } from "~/components/brand/rail";
import { SiteNav } from "~/components/brand/site-nav";
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
    // Breadcrumb + directory ItemList in a single @graph. Schools embed as
    // Organization items inside the list, each with an `@id` and `areaServed`
    // so search treats them as real entities. FAQPage is intentionally
    // omitted — see app/routes/home.tsx for context.
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
    <>
      <SiteNav />
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

          {/* ── Slim hero — title + badges only so the directory sits above the fold ── */}
          <header className="border-b-2 border-ink pb-6">
            <span className="eyebrow flex items-center gap-2 text-ink">
              <HugeiconsIcon
                icon={TrafficLightFreeIcons}
                size={14}
                strokeWidth={2.5}
                className="text-rush"
              />
              Driving schools in Kenya
            </span>
            <h1 className="m-0 mt-3 font-display text-[clamp(32px,6vw,64px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
              NTSA-registered schools.{" "}
              <span className="italic text-rush">Compared.</span>
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="green">NTSA registered</Badge>
              <Badge variant="amber">
                {DRIVING_SCHOOLS.length} major schools
              </Badge>
              <Badge variant="ink">
                Updated {SITE.lang.toUpperCase()} · 2026
              </Badge>
            </div>
          </header>

          {/* ── 01 · The directory — first thing you see after the hero ── */}
          <section id="schools" className="mt-8 scroll-mt-20">
            <ol className="space-y-4">
              {ordered.map((s, i) => (
                <li key={s.slug}>
                  <SchoolCard school={s} position={i + 1} />
                </li>
              ))}
            </ol>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Prices are indicative bands as of 2026. Confirm the package and
              exclusions in writing before paying.
            </p>
          </section>

          {/* ── Why this page exists — the pitch, after the data ── */}
          <section className="mt-12 border-t-2 border-dashed border-ink pt-8">
            <p className="m-0 max-w-2xl font-serif text-[clamp(16px,2vw,20px)] leading-tight text-ink-2">
              Theory practice here is free, so you only pay a school for the
              practical. Pass theory online before booking; you'll spend less
              and waste fewer school hours.
            </p>
            <div className="mt-5">
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
            </div>
          </section>

          {/* ── 02 · Price bands by class ─────────────────────────────────── */}
          <section className="mt-14">
            <SectionHead
              num="02"
              title={
                <>
                  Driving school cost <em>in Kenya · by class</em>
                </>
              }
              stamp="Indicative · 2026"
              lede="Total spend with a typical NTSA-registered school, before NTSA test fees. The last column is what you pay when theory is free here and you only buy the practical."
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
              Bands exclude NTSA test fees (currently KES 1,500 theory, KES
              1,000 practical) and Smart DL card issuance.
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
                  Free road-sign trainers, full past papers and junction
                  scenarios. No signup to start.
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
          </section>
        </div>
      </main>
    </>
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
