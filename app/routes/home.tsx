import {
  ArrowRight02FreeIcons,
  Tick02FreeIcons,
  Menu01FreeIcons,
  Fire02FreeIcons,
  CarFreeIcons,
  Motorbike01FreeIcons,
  DeliveryTruck01FreeIcons,
  BusFreeIcons,
  TrafficLightFreeIcons,
  OctagonFreeIcons,
  AlertCircleFreeIcons,
  SmartPhone01FreeIcons,
  ChartIncreaseFreeIcons,
  TimeQuarterFreeIcons,
  AwardFreeIcons,
  GlobalEducationFreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";

import type { Route } from "./+types/home";

import { absUrl, SITE } from "~/lib/site";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetTrigger,
} from "~/components/ui/sheet";

import { AppBar, AppBarLink } from "~/components/brand/app-bar";
import { BoardingCard } from "~/components/brand/boarding-card";
import { DrPlate } from "~/components/brand/dr-mark";
import { Logo } from "~/components/brand/logo";
import { FeedbackBanner } from "~/components/brand/feedback-banner";
import { StatTile } from "~/components/brand/gauge";
import { Rail } from "~/components/brand/rail";
import { TicketCard } from "~/components/brand/ticket-card";

export function meta(_: Route.MetaArgs) {
  const title = "DriveRush · Pass your NTSA exam, made in Kenya";
  const description = SITE.description;
  const url = absUrl("/");
  const ogImage = absUrl(SITE.ogImage);

  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: SITE.keywords.join(", ") },

    // Canonical
    { tagName: "link", rel: "canonical", href: url },

    // Open Graph
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: String(SITE.ogImageWidth) },
    { property: "og:image:height", content: String(SITE.ogImageHeight) },
    { property: "og:image:alt", content: `${SITE.name} logo` },

    // Twitter Card
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    { name: "twitter:image:alt", content: `${SITE.name} logo` },

    // JSON-LD: EducationalOrganization. Surfaces the brand to Google's
    // Knowledge Graph and enables logo + sameAs cards in SERP.
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: SITE.name,
        legalName: SITE.legalName,
        url: SITE.url,
        logo: ogImage,
        description,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Nairobi",
          addressCountry: "KE",
        },
        areaServed: { "@type": "Country", name: "Kenya" },
        inLanguage: ["en", "sw"],
      },
    },

    // JSON-LD: WebSite. Lets Google show a sitelinks search box if/when we
    // expose a real /search route.
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE.name,
        url: SITE.url,
        inLanguage: "en-KE",
      },
    },
  ];
}

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-6xl px-5 sm:px-9">{children}</div>
);

export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Rail />

      <Container>
        <div className="pt-6">
          <SiteNav />
        </div>
      </Container>

      <Hero />
      <ProofBar />
      <Principles />
      <Curriculum />
      <Features />
      <Pricing />
      <FinalCta />
      <SiteFooter />
    </main>
  );
}

/* =============================================================
   Top navigation — desktop AppBar + mobile Sheet
   ============================================================= */

function SiteNav() {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <AppBar
          nav={
            <>
              <AppBarLink href="#curriculum">Curriculum</AppBarLink>
              <AppBarLink href="#features">Features</AppBarLink>
              <AppBarLink href="#pricing">Pricing</AppBarLink>
              <AppBarLink href="/design">System</AppBarLink>
            </>
          }
          trailing={
            <>
              <Button variant="paper" size="sm" asChild>
                <a href="#">Sign in</a>
              </Button>
              <Button variant="rush" size="sm" asChild>
                <a href="#">
                  Start free
                  <HugeiconsIcon
                    icon={ArrowRight02FreeIcons}
                    size={14}
                    strokeWidth={2.5}
                  />
                </a>
              </Button>
            </>
          }
        />
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <AppBar
          nav={null}
          trailing={
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="paper" size="sm" aria-label="Open menu">
                  <HugeiconsIcon
                    icon={Menu01FreeIcons}
                    size={16}
                    strokeWidth={2.5}
                  />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>DR · Menu</SheetTitle>
                </SheetHeader>
                <SheetBody>
                  <nav className="grid gap-3">
                    {[
                      { label: "Curriculum", href: "#curriculum" },
                      { label: "Features", href: "#features" },
                      { label: "Pricing", href: "#pricing" },
                      { label: "Design system", href: "/design" },
                    ].map((it) => (
                      <SheetClose asChild key={it.label}>
                        <a
                          href={it.href}
                          className="border-2 border-ink bg-surface px-4 py-3 font-display text-[13px] font-bold uppercase tracking-wider text-ink shadow-stamp-sm hover:bg-paper-3"
                        >
                          {it.label}
                        </a>
                      </SheetClose>
                    ))}
                  </nav>
                  <div className="mt-6 grid gap-2.5">
                    <Button variant="paper" size="lg" asChild>
                      <a href="#">Sign in</a>
                    </Button>
                    <Button variant="rush" size="lg" asChild>
                      <a href="#">
                        Start free
                        <HugeiconsIcon
                          icon={ArrowRight02FreeIcons}
                          size={16}
                          strokeWidth={2.5}
                        />
                      </a>
                    </Button>
                  </div>
                </SheetBody>
              </SheetContent>
            </Sheet>
          }
        />
      </div>
    </>
  );
}

/* =============================================================
   Hero — masthead-style headline with two CTAs
   ============================================================= */

function Hero() {
  return (
    <section className="border-b-2 border-ink py-16 sm:py-24">
      <Container>
        <div className="grid items-end gap-8 md:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <Badge variant="rush">★ Made in Kenya</Badge>
              <Badge variant="ink">Class A · B · C · D</Badge>
            </div>
            <h1 className="m-0 font-display font-extrabold uppercase leading-[0.86] tracking-[-0.045em] text-ink text-[clamp(56px,9vw,128px)]">
              Ace the <span className="italic text-rush">NTSA</span>{" "}
              <span
                className="italic"
                style={{
                  color: "transparent",
                  WebkitTextStroke: "2px var(--ink)",
                }}
              >
                exam
              </span>
              .
            </h1>
            <p className="mt-7 max-w-xl font-serif text-[clamp(18px,2.4vw,26px)] leading-tight text-ink-2">
              Real Nairobi junctions. Real past papers. Bite-sized, timed, and
              scored like the day at the test centre.
              <span className="text-rush"> No filler.</span>
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="rush" size="lg" asChild>
                <a href="#">
                  Start free · 14-day streak
                  <HugeiconsIcon
                    icon={ArrowRight02FreeIcons}
                    size={16}
                    strokeWidth={2.5}
                  />
                </a>
              </Button>
              <Button variant="paper" size="lg" asChild>
                <a href="#curriculum">See curriculum</a>
              </Button>
            </div>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Pay later · M-Pesa · KES 499/mo
            </p>
          </div>

          <aside className="flex flex-col items-start gap-5 border-2 border-ink bg-surface p-6 shadow-stamp md:items-center md:text-center">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              Today's plate
            </div>
            <DrPlate region="KE" code="DR" year="2026" />
            <div className="grid w-full grid-cols-3 border-t-2 border-dashed border-ink pt-5">
              <div className="text-center">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                  Lessons
                </div>
                <div className="mt-1 font-display text-[26px] font-extrabold tabular-nums text-ink">
                  47
                </div>
              </div>
              <div className="border-x border-ink text-center">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                  Signs
                </div>
                <div className="mt-1 font-display text-[26px] font-extrabold tabular-nums text-ink">
                  120
                </div>
              </div>
              <div className="text-center">
                <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                  Mocks
                </div>
                <div className="mt-1 font-display text-[26px] font-extrabold tabular-nums text-rush">
                  8
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}

/* =============================================================
   Proof bar — quick stats
   ============================================================= */

function ProofBar() {
  return (
    <section className="border-b-2 border-ink bg-paper-3 py-10">
      <Container>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Pass rate"
            value="92%"
            tone="rush"
            delta={{ dir: "up", copy: "vs national avg" }}
          />
          <StatTile
            label="Avg. study time"
            value="14d"
            tone="ink"
            delta={{ dir: "up", copy: "to first mock" }}
          />
          <StatTile label="Past papers" value="240+" tone="green" />
          <StatTile label="On M-Pesa" value="KES 499" tone="ink" />
        </div>
      </Container>
    </section>
  );
}

/* =============================================================
   Principles — same three rules as the design system
   ============================================================= */

function Principles() {
  return (
    <section className="border-b-2 border-ink py-16">
      <Container>
        <div className="mb-9 flex flex-wrap items-baseline justify-between gap-3 border-b border-ink pb-4">
          <h2 className="m-0 font-display text-[clamp(28px,4vw,44px)] font-extrabold uppercase leading-tight tracking-tight">
            How we{" "}
            <em className="font-serif font-normal italic text-ink-3 text-[0.7em]">
              build
            </em>
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Three rules · zero negotiable
          </span>
        </div>

        <div className="grid border-2 border-ink md:grid-cols-3">
          <TicketCard
            passLabel="Pass № 01"
            seat="A·01"
            title={
              <>
                Fast over <em>fancy</em>
              </>
            }
            description="Two taps to learning. Cut transitions. Kill loaders. Default to the action. Students don't have time, and neither do we."
            className="border-t-0 md:border-r-2 md:border-dashed"
          />
          <TicketCard
            passLabel="Pass № 02"
            seat="B·02"
            title={
              <>
                Earned, not <em>given</em>
              </>
            }
            description="Streaks, XP and badges only land if work was done. We never inflate. Confidence has to come from a real win."
            className="border-t-2 md:border-l-0 md:border-r-2 md:border-t-0 md:border-dashed"
          />
          <TicketCard
            passLabel="Pass № 03"
            seat="C·03"
            title={
              <>
                Kenya, not <em>generic</em>
              </>
            }
            description="NTSA categories. Real Nairobi junctions. KES, M-Pesa, Kiswahili. Woven in, never bolted on."
            className="border-t-2 md:border-t-0"
          />
        </div>
      </Container>
    </section>
  );
}

/* =============================================================
   Curriculum preview — boarding cards
   ============================================================= */

const chapters: Array<{
  num: number;
  title: string;
  lessons: number;
  questions: number;
  pct: number;
  locked?: boolean;
}> = [
  { num: 1, title: "Highway code basics", lessons: 5, questions: 18, pct: 100 },
  {
    num: 2,
    title: "Road signs & markings",
    lessons: 8,
    questions: 36,
    pct: 75,
  },
  {
    num: 3,
    title: "Traffic lights & signals",
    lessons: 6,
    questions: 24,
    pct: 40,
  },
  {
    num: 4,
    title: "Hazard perception",
    lessons: 10,
    questions: 30,
    pct: 0,
    locked: true,
  },
  {
    num: 5,
    title: "Mechanical knowledge",
    lessons: 7,
    questions: 22,
    pct: 0,
    locked: true,
  },
];

function Curriculum() {
  return (
    <section id="curriculum" className="border-b-2 border-ink py-16">
      <Container>
        <div className="mb-9 flex flex-wrap items-baseline justify-between gap-3 border-b border-ink pb-4">
          <h2 className="m-0 font-display text-[clamp(28px,4vw,44px)] font-extrabold uppercase leading-tight tracking-tight">
            Five{" "}
            <em className="font-serif font-normal italic text-ink-3 text-[0.7em]">
              chapters
            </em>
            , every one tested
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Class B · light vehicle
          </span>
        </div>

        <div className="grid gap-3.5">
          {chapters.map((c) => (
            <BoardingCard
              key={c.num}
              num={c.num}
              eyebrow={
                c.locked
                  ? `Chapter № ${c.num} · Locked`
                  : `Chapter № ${c.num} · ${c.pct === 100 ? "Complete" : "Now boarding"}`
              }
              title={c.title}
              meta={[
                `${c.lessons} lessons`,
                `${c.questions} questions`,
                c.locked ? (
                  <span key="locked">Finish prior chapter to board</span>
                ) : (
                  <span
                    key="pct"
                    className={c.pct === 100 ? "text-kenya-green" : "text-rush"}
                  >
                    {c.pct}% complete
                  </span>
                ),
              ]}
              stub={{
                label: "XP",
                value: c.locked ? "·" : `+${c.lessons * 40}`,
                code: `B/${String(c.num).padStart(2, "0")}`,
              }}
              locked={c.locked}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* =============================================================
   Features grid
   ============================================================= */

const features: Array<{
  icon: typeof Tick02FreeIcons;
  title: string;
  copy: string;
  tone: "rush" | "ink" | "amber" | "green" | "blue" | "cyan";
}> = [
  {
    icon: TrafficLightFreeIcons,
    title: "Real Kenyan signs",
    copy: "120 signs from the NTSA highway code, with colour, shape, and class. Not stock images from a textbook.",
    tone: "rush",
  },
  {
    icon: TimeQuarterFreeIcons,
    title: "Timed mock exams",
    copy: "Eight full-length papers. Same question count, same minutes, same fail thresholds as the test centre.",
    tone: "ink",
  },
  {
    icon: SmartPhone01FreeIcons,
    title: "M-Pesa from day one",
    copy: "STK push. KES 499/month or KES 4,999/year. Cancel from inside the app. No support tickets.",
    tone: "green",
  },
  {
    icon: ChartIncreaseFreeIcons,
    title: "Honest stats",
    copy: "Per-chapter score, per-sign accuracy, weakest topics. No vanity dashboards. We tell you what's broken.",
    tone: "blue",
  },
  {
    icon: Fire02FreeIcons,
    title: "Streaks that matter",
    copy: "A streak only banks if you actually worked. Five lazy minutes won't save it. The fire is earned.",
    tone: "amber",
  },
  {
    icon: AwardFreeIcons,
    title: "Built for the practical",
    copy: "Hazard perception clips, junction reading, defensive driving. The same gut work the examiner watches for.",
    tone: "cyan",
  },
];

const toneText = {
  rush: "text-rush",
  ink: "text-ink",
  amber: "text-amber",
  green: "text-kenya-green",
  blue: "text-plate-blue",
  cyan: "text-route-cyan",
} as const;

const toneBg = {
  rush: "bg-rush",
  ink: "bg-ink",
  amber: "bg-amber",
  green: "bg-kenya-green",
  blue: "bg-plate-blue",
  cyan: "bg-route-cyan",
} as const;

const toneFg = {
  rush: "text-white",
  ink: "text-paper",
  amber: "text-ink",
  green: "text-white",
  blue: "text-white",
  cyan: "text-ink",
} as const;

function Features() {
  return (
    <section id="features" className="border-b-2 border-ink bg-paper-3 py-16">
      <Container>
        <div className="mb-9 flex flex-wrap items-baseline justify-between gap-3 border-b border-ink pb-4">
          <h2 className="m-0 font-display text-[clamp(28px,4vw,44px)] font-extrabold uppercase leading-tight tracking-tight">
            What's in{" "}
            <em className="font-serif font-normal italic text-ink-3 text-[0.7em]">
              the box
            </em>
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Six things, all working
          </span>
        </div>

        <div className="grid gap-0 border-2 border-ink md:grid-cols-3">
          {features.map((f, i) => (
            <article
              key={f.title}
              className={`relative bg-surface p-6 ${
                i % 3 !== 2 ? "md:border-r-2 md:border-ink" : ""
              } ${i < features.length - 3 ? "border-b-2 border-ink" : "border-b-2 border-ink md:border-b-0"}`}
            >
              <div
                className={`mb-4 flex size-14 items-center justify-center border-2 border-ink ${toneBg[f.tone]} ${toneFg[f.tone]}`}
              >
                <HugeiconsIcon icon={f.icon} size={26} strokeWidth={2.25} />
              </div>
              <h3
                className={`m-0 mb-2 font-display text-lg font-extrabold uppercase tracking-wide ${toneText[f.tone]}`}
              >
                {f.title}
              </h3>
              <p className="m-0 text-sm leading-relaxed text-ink-2">{f.copy}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-4">
          {[
            { icon: Motorbike01FreeIcons, code: "A", label: "Motorbike" },
            { icon: CarFreeIcons, code: "B", label: "Light vehicle" },
            { icon: DeliveryTruck01FreeIcons, code: "C", label: "Light goods" },
            { icon: BusFreeIcons, code: "D", label: "PSV" },
          ].map((cls) => (
            <div
              key={cls.code}
              className="flex items-center gap-3 border-2 border-ink bg-surface p-4"
            >
              <div className="flex size-12 items-center justify-center border-2 border-ink bg-amber text-ink">
                <HugeiconsIcon icon={cls.icon} size={22} strokeWidth={2.25} />
              </div>
              <div>
                <div className="font-display text-base font-extrabold uppercase">
                  Class {cls.code}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
                  {cls.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* =============================================================
   Pricing
   ============================================================= */

function Pricing() {
  return (
    <section id="pricing" className="border-b-2 border-ink py-16">
      <Container>
        <div className="mb-9 flex flex-wrap items-baseline justify-between gap-3 border-b border-ink pb-4">
          <h2 className="m-0 font-display text-[clamp(28px,4vw,44px)] font-extrabold uppercase leading-tight tracking-tight">
            Pricing,{" "}
            <em className="font-serif font-normal italic text-ink-3 text-[0.7em]">
              no asterisk
            </em>
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Pay with M-Pesa
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <PriceCard
            name="Free"
            price="KES 0"
            period="forever"
            blurb="The first chapter, full access. See the system before you pay."
            features={[
              "Chapter 1 · Highway code basics",
              "5 lessons · 18 questions",
              "1 mock exam · 20 questions",
              "Streak tracking",
            ]}
            cta="Start free"
          />
          <PriceCard
            name="Monthly"
            price="KES 499"
            period="/month"
            blurb="The full course, one month at a time. Cancel anytime in the app."
            features={[
              "All 5 chapters · 36 lessons",
              "8 timed mock exams",
              "120 NTSA road signs",
              "Per-topic stats",
              "Hazard perception clips",
            ]}
            cta="Subscribe"
            highlight
          />
          <PriceCard
            name="Yearly"
            price="KES 4,999"
            period="/year"
            blurb="Two months free. Best value if you're sitting the test in 2026."
            features={[
              "Everything in Monthly",
              "2 months free",
              "Priority on new chapters",
              "Refund if you fail twice",
            ]}
            cta="Save 17%"
          />
        </div>

        <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
          Prices in Kenyan Shillings · VAT inclusive · STK push from the app
        </p>
      </Container>
    </section>
  );
}

function PriceCard({
  name,
  price,
  period,
  blurb,
  features,
  cta,
  highlight = false,
}: {
  name: string;
  price: string;
  period: string;
  blurb: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={`relative flex flex-col border-2 border-ink bg-surface ${highlight ? "shadow-stamp-lg" : ""}`}
    >
      {highlight && (
        <div className="absolute -top-3 left-5">
          <Badge variant="rush">★ Most popular</Badge>
        </div>
      )}
      <header className="border-b-2 border-dashed border-ink px-6 py-5">
        <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          {name}
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-display text-[44px] font-extrabold leading-none tracking-tight tabular-nums text-ink">
            {price}
          </span>
          <span className="font-mono text-xs uppercase tracking-wide text-ink-3">
            {period}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">{blurb}</p>
      </header>
      <ul className="m-0 grid list-none gap-2.5 px-6 py-5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-ink">
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center border-2 border-ink ${highlight ? "bg-rush text-white" : "bg-paper-3 text-ink"}`}
            >
              <HugeiconsIcon icon={Tick02FreeIcons} size={11} strokeWidth={3} />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <footer className="mt-auto border-t-2 border-dashed border-ink p-5">
        <Button
          variant={highlight ? "rush" : "paper"}
          size="lg"
          className="w-full"
          asChild
        >
          <a href="#">
            {cta}
            <HugeiconsIcon
              icon={ArrowRight02FreeIcons}
              size={16}
              strokeWidth={2.5}
            />
          </a>
        </Button>
      </footer>
    </article>
  );
}

/* =============================================================
   Final CTA
   ============================================================= */

function FinalCta() {
  return (
    <section className="border-b-2 border-ink py-14">
      <Container>
        <FeedbackBanner
          tone="win"
          icon={GlobalEducationFreeIcons}
          title="Sawa sawa. Ready to start?"
          description="14 days, free. No card. Just M-Pesa when you're sure."
          action={
            <Button variant="ink" size="lg" asChild>
              <a href="#">
                Start free
                <HugeiconsIcon
                  icon={ArrowRight02FreeIcons}
                  size={16}
                  strokeWidth={2.5}
                />
              </a>
            </Button>
          }
        />
      </Container>
    </section>
  );
}

/* =============================================================
   Footer
   ============================================================= */

function SiteFooter() {
  return (
    <footer className="border-t-4 border-double border-ink bg-ink py-14 text-paper">
      <Container>
        <div className="grid gap-6 border-b border-paper/20 pb-9 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Logo variant="plain" height={72} knockout />
            <p className="mt-4 max-w-sm font-serif text-lg leading-snug opacity-80">
              DriveRush · the learning platform that takes your NTSA exam as
              seriously as you do.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <Badge variant="ink" className="border-paper text-paper">
                <HugeiconsIcon
                  icon={OctagonFreeIcons}
                  size={11}
                  strokeWidth={2.5}
                />
                NTSA aligned
              </Badge>
              <Badge variant="ink" className="border-paper text-paper">
                <HugeiconsIcon
                  icon={AlertCircleFreeIcons}
                  size={11}
                  strokeWidth={2.5}
                />
                Made in Nairobi
              </Badge>
            </div>
          </div>

          <FooterCol
            heading="Product"
            items={[
              { label: "Curriculum", href: "#curriculum" },
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "Mock exams", href: "#" },
            ]}
          />
          <FooterCol
            heading="Company"
            items={[
              { label: "About", href: "#" },
              { label: "Blog", href: "#" },
              { label: "Careers", href: "#" },
              { label: "Contact", href: "#" },
            ]}
          />
          <FooterCol
            heading="System"
            items={[
              { label: "Design system", href: "/design" },
              { label: "Brand", href: "/design" },
              { label: "Voice", href: "/design" },
            ]}
          />
        </div>
        <div className="flex flex-wrap justify-between gap-3 pt-6 font-mono text-[11px] uppercase tracking-widest opacity-60">
          <span>© 2026 DriveRush.ke</span>
          <span>Learn · Drive · Succeed</span>
          <span>Nairobi · KE</span>
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({
  heading,
  items,
}: {
  heading: string;
  items: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h4 className="m-0 mb-3 font-display text-xs font-extrabold uppercase tracking-widest">
        {heading}
      </h4>
      <ul className="m-0 list-none p-0">
        {items.map((it) => {
          // Real internal routes (/design) get React Router's Link for client
          // navigation; everything else (placeholder #, future /signup) renders
          // as a plain anchor so the URL is honest about not yet existing.
          const isInternal = it.href.startsWith("/");
          return (
            <li key={it.label} className="py-1">
              {isInternal ? (
                <Link
                  to={it.href}
                  className="font-mono text-xs tracking-wide opacity-85 hover:underline"
                >
                  {it.label}
                </Link>
              ) : (
                <a
                  href={it.href}
                  className="font-mono text-xs tracking-wide opacity-85 hover:underline"
                >
                  {it.label}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
