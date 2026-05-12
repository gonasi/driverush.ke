import {
  AlertCircleFreeIcons,
  ArrowRight02FreeIcons,
  Fire02FreeIcons,
  OctagonFreeIcons,
  PlayCircleFreeIcons,
  RefreshFreeIcons,
  StarFreeIcons,
  Tick02FreeIcons,
  TrafficLightFreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import type { Route } from "./+types/design";

import {
  Alert,
  AlertBody,
  AlertDescription,
  AlertTitle,
  AlertAction,
} from "~/components/ui/alert";
import {
  Avatar,
  AvatarFallback,
  AvatarStack,
  AvatarStatus,
} from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Progress, ProgressIndeterminate } from "~/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Skeleton } from "~/components/ui/skeleton";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

import { AppBar, AppBarLink } from "~/components/brand/app-bar";
import { BoardingCard } from "~/components/brand/boarding-card";
import { Callout } from "~/components/brand/callout";
import { ChoiceCard } from "~/components/brand/choice-card";
import { CodeInput } from "~/components/brand/code-input";
import { DrPlate, DrRacing, DrStamp } from "~/components/brand/dr-mark";
import { Logo } from "~/components/brand/logo";
import { EmptyState } from "~/components/brand/empty-state";
import { FeedbackBanner } from "~/components/brand/feedback-banner";
import { Gauge, StatTile } from "~/components/brand/gauge";
import { Masthead } from "~/components/brand/masthead";
import { Rail } from "~/components/brand/rail";
import { SearchBar } from "~/components/brand/search-bar";
import { SectionHead } from "~/components/brand/section-head";
import { SignCard } from "~/components/brand/sign-card";
import { StampInput } from "~/components/brand/stamp-input";
import { TachCircle, TachSegments, TachSteps } from "~/components/brand/tach";
import { TicketCard } from "~/components/brand/ticket-card";
import { VoiceCard } from "~/components/brand/voice-card";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "DriveRush · Brand & System v2" },
    {
      name: "description",
      content:
        "DriveRush.ke design system. Newspaper masthead × racing program. Colors, type, components, voice.",
    },
    // Internal brand programme. Don't compete with the landing page in search,
    // and skip social previews — the surface isn't conversion copy.
    { name: "robots", content: "noindex, nofollow" },
    { name: "googlebot", content: "noindex, nofollow" },
  ];
}

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-6xl px-5 sm:px-9">{children}</div>
);

const Section = ({ children }: { children: React.ReactNode }) => (
  <section className="border-b-2 border-ink py-14">{children}</section>
);

export default function Design() {
  return (
    <main className="min-h-screen text-ink">
      <Rail />

      {/* ============= MASTHEAD ============= */}
      <Container>
        <Masthead
          kicker="Volume 01 · Edition 02"
          stamp="★ DriveRush · Brand Programme ★"
          dateline="Nairobi · 26.04.2026"
          title={
            <>
              Drive<em>Rush</em> <span data-out>Manual</span>
            </>
          }
          leftCol={
            <>
              <div>Field manual № 01</div>
              <div className="mt-1.5 font-display text-[34px] font-extrabold leading-none tracking-tight text-ink">
                v 2.0
              </div>
            </>
          }
          centerLede={
            <>
              Pages of color, type and craft for an NTSA prep app made{" "}
              <em>here</em>. Print discipline, road-system urgency, and a
              refusal to look like everyone else's dashboard.
            </>
          }
          rightCol={
            <>
              <div>Bureau</div>
              <div className="mt-1.5 font-display text-lg font-extrabold text-ink">
                DriveRush.ke
              </div>
              <div className="mt-3.5">Pages</div>
              <div className="mt-1.5 font-display text-lg font-extrabold text-ink">
                07 / 07
              </div>
            </>
          }
        />
      </Container>

      {/* ============= 01 PRINCIPLES ============= */}
      <Section>
        <Container>
          <SectionHead
            num="01"
            title={
              <>
                House <em>rules</em>
              </>
            }
            stamp={
              <>
                <div className="font-bold text-ink">PRINCIPLES</div>
                <div>3 stated · 0 negotiable</div>
              </>
            }
            lede="Three rules. Every screen, color, word ships through them or doesn't ship."
          />

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
              className="border-r-0 border-t-0 md:border-r-2 md:border-dashed"
            />
            <TicketCard
              passLabel="Pass № 02"
              seat="B·02"
              title={
                <>
                  Earned, not <em>given</em>
                </>
              }
              description="Streaks, XP and badges only land if work was done. We never inflate. Confidence has to come from a real win or it's not confidence."
              className="border-l-0 border-t-2 md:border-l-0 md:border-r-2 md:border-t-0 md:border-dashed"
            />
            <TicketCard
              passLabel="Pass № 03"
              seat="C·03"
              title={
                <>
                  Kenya, not <em>generic</em>
                </>
              }
              description="NTSA categories. Real Nairobi junctions. KES, M-Pesa, Kiswahili. Woven in, never bolted on. Made here, not localised here."
              className="border-t-2 md:border-t-0"
            />
          </div>

          <div className="mt-7">
            <Callout>
              If a feature can't be defended under one of these three, it
              doesn't ship. Pretty isn't a defence. Familiar isn't a defence.
            </Callout>
          </div>
        </Container>
      </Section>

      {/* ============= 02 THE MARK ============= */}
      <Section>
        <Container>
          <SectionHead
            num="02"
            title={
              <>
                The <em>mark</em>
              </>
            }
            stamp={
              <>
                <div className="font-bold text-ink">IDENTITY</div>
                <div>1 lockup · 1 monogram</div>
              </>
            }
            lede="The italic D. The road glyph curving through. The italic R in red. Protect every part. They don't work alone."
          />

          {/* Primary lockup + monogram, on light and dark surfaces */}
          <div className="grid border-2 border-ink md:grid-cols-2">
            <div className="flex min-h-[260px] items-center justify-center border-r-2 border-ink bg-white p-8">
              <Logo variant="main" height={180} priority />
            </div>
            <div className="flex min-h-[260px] items-center justify-center bg-ink p-8">
              <Logo variant="plain" height={140} knockout />
            </div>
          </div>

          {/* Sanctioned variants — monogram across the brand surface set */}
          <div className="mt-7 grid gap-3.5 md:grid-cols-4">
            <LogoCell label="Plain · light" surface="bg-paper-3">
              <Logo variant="plain" height={84} />
            </LogoCell>
            <LogoCell label="Plain · cream" surface="bg-cream">
              <Logo variant="plain" height={84} />
            </LogoCell>
            <LogoCell label="Plain · on rush" surface="bg-rush">
              <Logo variant="plain" height={84} knockout />
            </LogoCell>
            <LogoCell label="Plain · on green" surface="bg-kenya-green">
              <Logo variant="plain" height={84} knockout />
            </LogoCell>
          </div>

          {/* Brand decorations — not logos, but allied marks for special placements */}
          <div className="mt-7 grid gap-3.5 md:grid-cols-3">
            <div className="border-2 border-ink bg-paper-3 p-5">
              <div className="flex items-center justify-center py-4">
                <DrStamp className="text-ink" />
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                Stamp · circular
              </p>
            </div>
            <div className="border-2 border-ink bg-paper-2 p-5">
              <div className="flex items-center justify-center py-4">
                <DrPlate />
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                Plate variant
              </p>
            </div>
            <div className="border-2 border-ink bg-surface p-5">
              <div className="flex items-center justify-center py-4">
                <DrRacing size="md" />
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                Racing trim
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ============= 03 COLOR ============= */}
      <Section>
        <Container>
          <SectionHead
            num="03"
            title={
              <>
                A <em>broader</em> palette
              </>
            }
            stamp={
              <>
                <div className="font-bold text-ink">COLOR</div>
                <div>4 cores · 12 voices</div>
              </>
            }
            lede="Red, ink, paper and daylight do the heavy lifting. Plate-blue, mustard amber, signal green, hazard orange, route cyan and night magenta carry the supporting voices."
          />

          {/* core strip */}
          <div className="mb-9 grid border-2 border-ink md:grid-cols-5">
            {[
              {
                name: "Rush Red",
                role: "Primary · action · stop",
                hex: "#E11D2E",
                bg: "bg-rush",
                fg: "text-white",
                num: "01",
              },
              {
                name: "Track Ink",
                role: "Body · authority",
                hex: "#0E1014",
                bg: "bg-ink",
                fg: "text-paper",
                num: "02",
              },
              {
                name: "Newsprint",
                role: "Surface · light",
                hex: "#F2EDE3",
                bg: "bg-paper",
                fg: "text-ink",
                num: "03",
              },
              {
                name: "Daylight",
                role: "Highlight · hover",
                hex: "#FBF7EE",
                bg: "bg-paper-3",
                fg: "text-ink",
                num: "04",
              },
              {
                name: "Card Stock",
                role: "Cards · stubs",
                hex: "#E8E1D2",
                bg: "bg-paper-2",
                fg: "text-ink",
                num: "05",
              },
            ].map((c, i, arr) => (
              <div
                key={c.name}
                className={`relative flex min-h-[200px] flex-col justify-between p-5 ${c.bg} ${c.fg} ${i < arr.length - 1 ? "border-b-2 md:border-b-0 md:border-r-2 border-ink" : ""}`}
              >
                <span className="absolute right-3 top-3 font-display text-3xl font-extrabold italic leading-none opacity-40">
                  {c.num}
                </span>
                <div>
                  <div className="font-display text-xl font-extrabold uppercase leading-none tracking-tight">
                    {c.name}
                  </div>
                  <div className="mt-1.5 font-mono text-[10.5px] uppercase tracking-widest">
                    {c.role}
                  </div>
                </div>
                <div className="font-mono text-sm font-bold">{c.hex}</div>
              </div>
            ))}
          </div>

          {/* voices grid */}
          <div className="grid gap-3.5 md:grid-cols-4">
            {[
              {
                name: "Kenya Green",
                role: "Pass · go · valid",
                hex: "#1E8449",
                bg: "bg-kenya-green",
                fg: "text-white",
              },
              {
                name: "Mustard Amber",
                role: "Caution · streak fire",
                hex: "#E6A100",
                bg: "bg-amber",
                fg: "text-ink",
              },
              {
                name: "Hazard Orange",
                role: "Warning · construction",
                hex: "#FF7A1A",
                bg: "bg-hazard",
                fg: "text-ink",
              },
              {
                name: "Plate Blue",
                role: "Info · documents",
                hex: "#1640B6",
                bg: "bg-plate-blue",
                fg: "text-white",
              },
              {
                name: "Route Cyan",
                role: "Map · navigation",
                hex: "#1FB6C1",
                bg: "bg-route-cyan",
                fg: "text-ink",
              },
              {
                name: "Night Magenta",
                role: "Premium · accents",
                hex: "#B6177F",
                bg: "bg-magenta",
                fg: "text-white",
              },
              {
                name: "Rust",
                role: "Editorial · history",
                hex: "#7A2A12",
                bg: "bg-rust",
                fg: "text-cream",
              },
              {
                name: "Olive",
                role: "Editorial · neutrals",
                hex: "#4F5B26",
                bg: "bg-olive",
                fg: "text-cream",
              },
            ].map((c) => (
              <div key={c.name} className="border-2 border-ink bg-surface">
                <div className={`h-32 border-b-2 border-ink ${c.bg} ${c.fg}`} />
                <div className="p-3.5">
                  <div className="font-display text-sm font-extrabold uppercase tracking-wide">
                    {c.name}
                  </div>
                  <div className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                    {c.role}
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-xs font-bold">
                    <span>HEX</span>
                    <span className="text-ink-3">{c.hex}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* rush ramp */}
          <p className="mt-7 mb-2 font-display text-xs font-extrabold uppercase tracking-widest">
            Rush · 50 → 700 ramp
          </p>
          <div className="flex h-22 border-2 border-ink">
            {[
              { v: "50", hex: "#FEF2F4", fg: "text-ink" },
              { v: "100", hex: "#FEE6E9", fg: "text-ink" },
              { v: "200", hex: "#FCBFC8", fg: "text-ink" },
              { v: "300", hex: "#F77B8A", fg: "text-white" },
              { v: "400", hex: "#EE3D52", fg: "text-white" },
              { v: "★ 500", hex: "#E11D2E", fg: "text-white" },
              { v: "600", hex: "#960F1B", fg: "text-white" },
              { v: "700", hex: "#5A0810", fg: "text-white" },
            ].map((s) => (
              <div
                key={s.v}
                className={`flex flex-1 flex-col justify-between p-2 font-mono text-[10px] font-bold ${s.fg}`}
                style={{ background: s.hex }}
              >
                <div className="tracking-wider">{s.v}</div>
                <div>{s.hex}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============= 04 TYPOGRAPHY ============= */}
      <Section>
        <Container>
          <SectionHead
            num="04"
            title={
              <>
                Three <em>typefaces</em>
              </>
            }
            stamp={
              <>
                <div className="font-bold text-ink">TYPE</div>
                <div>Sora · DM Serif · JetBrains</div>
              </>
            }
            lede="Sora drives sharp, all-caps display work. DM Serif Display whispers in italics. JetBrains Mono runs the data: scores, plate numbers, codes."
          />

          <div className="grid border-2 border-ink md:grid-cols-3">
            <div className="border-r-2 border-ink p-7 last:border-r-0">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                Display · Sora 800
              </div>
              <div className="my-3 font-display text-[144px] font-extrabold leading-none tracking-[-0.05em]">
                A<em className="not-italic italic text-rush">a</em>
              </div>
              <div className="font-display text-xl font-extrabold uppercase">
                Sora{" "}
                <em className="font-serif font-normal italic text-rush">
                  · workhorse
                </em>
              </div>
              <div className="mt-1 text-[13px] leading-relaxed text-ink-3">
                Geometric, fast, slightly compressed in italic. Headlines,
                eyebrows, buttons. Never below 11px.
              </div>
            </div>
            <div className="border-t-2 border-r-2 border-ink p-7 md:border-t-0">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                Editorial · DM Serif
              </div>
              <div className="my-3 font-serif text-[144px] leading-none tracking-[-0.05em]">
                A<em className="italic text-rush">a</em>
              </div>
              <div className="font-display text-xl font-extrabold uppercase">
                DM Serif{" "}
                <em className="font-serif font-normal italic text-rush">
                  · soul
                </em>
              </div>
              <div className="mt-1 text-[13px] leading-relaxed text-ink-3">
                Italicised pull-quotes, asides, the rare moment we slow down.
                Never for UI labels.
              </div>
            </div>
            <div className="border-t-2 border-ink p-7 md:border-t-0">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                Numerals · JetBrains
              </div>
              <div className="my-3 font-mono text-[144px] font-bold leading-none tracking-[-0.05em]">
                A<em className="not-italic text-rush">a</em>
              </div>
              <div className="font-display text-xl font-extrabold uppercase">
                JetBrains{" "}
                <em className="font-serif font-normal italic text-rush">
                  · data
                </em>
              </div>
              <div className="mt-1 text-[13px] leading-relaxed text-ink-3">
                Scores, percentages, IDs, plate codes, datetimes. Never for
                prose. Too cold.
              </div>
            </div>
          </div>

          <div className="mt-9 border-2 border-ink bg-surface">
            {[
              {
                tag: "D1",
                name: "Display 1",
                spec: "Sora 800 · 64 / 90% / -3.5%",
                sample: (
                  <span className="font-display text-[64px] font-extrabold uppercase leading-[0.9] tracking-[-0.035em]">
                    Ace the <span className="italic text-rush">NTSA</span> exam.
                  </span>
                ),
              },
              {
                tag: "D2",
                name: "Display 2",
                spec: "Sora 800 · 44 / 95% / -2.5%",
                sample: (
                  <span className="font-display text-[44px] font-extrabold uppercase leading-[0.95] tracking-[-0.025em]">
                    Class B · Highway Code
                  </span>
                ),
              },
              {
                tag: "SR",
                name: "Serif quote",
                spec: "DM Serif italic · 28 / 120%",
                sample: (
                  <span className="font-serif text-[28px] italic leading-tight">
                    "You don't pass the test by guessing."
                  </span>
                ),
              },
              {
                tag: "H1",
                name: "Heading 1",
                spec: "Sora 700 · 30 / 105%",
                sample: (
                  <span className="font-display text-3xl font-bold leading-tight">
                    Reading the three-light signal
                  </span>
                ),
              },
              {
                tag: "H2",
                name: "Heading 2",
                spec: "Sora 700 · 22 / 115%",
                sample: (
                  <span className="font-display text-[22px] font-bold leading-snug">
                    What does this sign mean?
                  </span>
                ),
              },
              {
                tag: "EB",
                name: "Eyebrow",
                spec: "Sora 700 · 11px caps · 16% tracking",
                sample: (
                  <span className="font-display text-[11px] font-bold uppercase tracking-widest">
                    Chapter 03 · Lesson 04 · 4 min
                  </span>
                ),
              },
              {
                tag: "BL",
                name: "Body L",
                spec: "Inter 400 · 17 / 155%",
                sample: (
                  <span className="text-[17px] leading-relaxed">
                    Real road signs, real junctions, real questions from past
                    papers. Bite-sized and timed like the real thing.
                  </span>
                ),
              },
              {
                tag: "BM",
                name: "Body M",
                spec: "Inter 400 · 14 / 155%",
                sample: (
                  <span className="text-sm leading-relaxed">
                    At an uncontrolled junction, the vehicle on your right has
                    right of way. NTSA Rule 12 of the Highway Code.
                  </span>
                ),
              },
              {
                tag: "MN",
                name: "Numerical",
                spec: "JetBrains 600 · 13px",
                sample: (
                  <span className="font-mono text-[13px] font-semibold">
                    2,410 XP · 84% · KCB·241·B · 12/30d
                  </span>
                ),
              },
            ].map((row, i, arr) => (
              <div
                key={row.tag}
                className={`grid items-baseline gap-4 px-6 py-5 md:grid-cols-[60px_180px_1fr] ${i < arr.length - 1 ? "border-b border-ink" : ""}`}
              >
                <span className="self-start bg-rush px-1.5 py-0.5 text-center font-mono text-xs font-bold text-white">
                  {row.tag}
                </span>
                <div>
                  <div className="font-display text-[13px] font-bold uppercase tracking-wide">
                    {row.name}
                  </div>
                  <div className="mt-1 font-mono text-[10.5px] leading-relaxed text-ink-3">
                    {row.spec}
                  </div>
                </div>
                <div className="leading-none">{row.sample}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ============= 05 GRID & SHAPE ============= */}
      <Section>
        <Container>
          <SectionHead
            num="05"
            title={
              <>
                Grid &amp; <em>shape</em>
              </>
            }
            stamp={
              <>
                <div className="font-bold text-ink">SYSTEM</div>
                <div>Rhythm of 4</div>
              </>
            }
            lede="Spacing on a 4-pixel rhythm. Borders at 2px. Always visible, always ink. Radii are minimal: this system is built from straight lines, not soft pills."
          />

          <div className="grid gap-9 md:grid-cols-[1.2fr_1fr]">
            <div className="border-2 border-ink bg-surface">
              {[
                { nm: "s · 1", v: "4 px", w: 4 },
                { nm: "s · 2", v: "8 px", w: 8 },
                { nm: "s · 3", v: "12 px", w: 12 },
                { nm: "s · 4", v: "16 px", w: 16 },
                { nm: "s · 5", v: "20 px", w: 20 },
                { nm: "s · 6", v: "24 px", w: 24 },
                { nm: "s · 8", v: "32 px", w: 32 },
                { nm: "s · 10", v: "40 px", w: 40 },
                { nm: "s · 14", v: "56 px", w: 56 },
                { nm: "s · 20", v: "80 px", w: 80 },
              ].map((row, i, arr) => (
                <div
                  key={row.nm}
                  className={`grid grid-cols-[80px_80px_1fr] items-center gap-4 px-5 py-3 font-mono text-xs font-semibold ${i < arr.length - 1 ? "border-b border-dashed border-ink" : ""}`}
                >
                  <div className="font-display text-[13px] font-extrabold uppercase">
                    {row.nm}
                  </div>
                  <div>{row.v}</div>
                  <div
                    className="h-3.5 rounded-sm bg-rush"
                    style={{ width: row.w }}
                  />
                </div>
              ))}
            </div>

            <div>
              <div className="border-2 border-ink bg-surface p-5 font-mono text-xs leading-relaxed">
                border-width · <strong>2 px</strong> default
                <br />
                border-color · <strong>--ink</strong> always
                <br />
                shadow · <strong>4 4 0 ink</strong> stamp · never blurred
                <br />
                radius default · <strong>0</strong> (use --radius-edge for
                inputs)
                <br />
                inner padding · multiples of <strong>4</strong>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ============= 06 COMPONENTS ============= */}
      <Section>
        <Container>
          <SectionHead
            num="06"
            title={
              <>
                Working <em>parts</em>
              </>
            }
            stamp={
              <>
                <div className="font-bold text-ink">COMPONENTS</div>
                <div>Buttons · Tags · Cards · Banners</div>
              </>
            }
            lede="Stamped, bordered, ticketed. Components in this system look pressed onto the page, not floated above it."
          />

          <div className="grid border-2 border-ink md:grid-cols-2">
            {/* Buttons */}
            <Pane title="Buttons" code=".button / variants">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="rush" size="lg">
                  Continue lesson
                  <HugeiconsIcon
                    icon={ArrowRight02FreeIcons}
                    size={16}
                    strokeWidth={2.5}
                  />
                </Button>
                <Button variant="ink">See results</Button>
                <Button variant="amber">Save for later</Button>
                <Button variant="green" size="sm">
                  <HugeiconsIcon
                    icon={Tick02FreeIcons}
                    size={14}
                    strokeWidth={3}
                  />
                  Pass · sawa
                </Button>
                <Button variant="paper">Skip</Button>
              </div>
            </Pane>

            {/* Stamps */}
            <Pane title="Stamps" code=".button stamp">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="rush" size="stamp" aria-label="Play">
                  <HugeiconsIcon
                    icon={PlayCircleFreeIcons}
                    size={22}
                    strokeWidth={2}
                  />
                </Button>
                <Button variant="ink" size="stamp" aria-label="Restart">
                  <HugeiconsIcon
                    icon={RefreshFreeIcons}
                    size={22}
                    strokeWidth={2}
                  />
                </Button>
                <Button variant="amber" size="stamp" aria-label="Hint">
                  <HugeiconsIcon
                    icon={AlertCircleFreeIcons}
                    size={22}
                    strokeWidth={2}
                  />
                </Button>
                <Button variant="green" size="stamp" aria-label="Confirm">
                  <HugeiconsIcon
                    icon={Tick02FreeIcons}
                    size={22}
                    strokeWidth={2.5}
                  />
                </Button>
              </div>
            </Pane>

            {/* Tags */}
            <Pane title="Tags / categories" code=".badge variants">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="rush">
                  <HugeiconsIcon
                    icon={StarFreeIcons}
                    size={12}
                    strokeWidth={2.5}
                  />
                  Stop
                </Badge>
                <Badge variant="ink">Class B</Badge>
                <Badge variant="amber">
                  <HugeiconsIcon
                    icon={Fire02FreeIcons}
                    size={12}
                    strokeWidth={2.5}
                  />
                  Caution
                </Badge>
                <Badge variant="green">Pass</Badge>
                <Badge variant="cyan">Route</Badge>
                <Badge variant="magenta">Premium</Badge>
                <Badge variant="blue">Plate-B</Badge>
                <Badge>+80 XP</Badge>
              </div>
            </Pane>

            {/* Gauges */}
            <Pane title="Gauges (stat)" code=".gauge / .stat-tile">
              <div className="flex flex-wrap items-end gap-3">
                <Gauge label="Streak" meta="·12d" value="12" unit="DAYS" />
                <Gauge
                  label="XP Total"
                  meta="·24h"
                  value="2,410"
                  unit="PTS"
                  tone="ink"
                />
                <Gauge
                  label="Hearts"
                  meta="·LIVE"
                  value="5"
                  unit="/5"
                  tone="green"
                />
              </div>
            </Pane>

            {/* Boarding card */}
            <PaneFull title="Boarding-pass chapter card" code=".boarding-card">
              <div className="grid gap-3.5">
                <BoardingCard
                  num={3}
                  eyebrow="Chapter № 3 · Now boarding"
                  title="Traffic Lights & Signals"
                  meta={[
                    "6 lessons",
                    "24 questions",
                    <span key="pct" className="text-rush">
                      40% complete
                    </span>,
                  ]}
                  stub={{ label: "XP", value: "+240", code: "B/03/L04" }}
                />
                <BoardingCard
                  num={4}
                  eyebrow="Chapter № 4 · Locked"
                  title="Hazard Perception"
                  meta={["10 lessons", "30 clips", "Finish 03 to board"]}
                  stub={{ label: "XP", value: "·", code: "B/04/·" }}
                  locked
                />
              </div>
            </PaneFull>

            {/* Choice cards */}
            <Pane title="Quiz choices" code=".choice-card / state">
              <div className="grid gap-2.5">
                <ChoiceCard keyLabel="A" meta="42% picked">
                  Yield to oncoming traffic
                </ChoiceCard>
                <ChoiceCard keyLabel="B" state="correct" meta="✓ correct">
                  Stop completely, then proceed when safe
                </ChoiceCard>
                <ChoiceCard keyLabel="C" state="wrong" meta="✕ wrong">
                  No entry for all vehicles
                </ChoiceCard>
              </div>
            </Pane>

            {/* Tach progress */}
            <Pane title="Tach progress" code=".progress (tach)">
              <div className="grid gap-3.5">
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                      Quiz · 03 of 05
                    </span>
                    <span className="font-display text-[22px] font-extrabold text-rush">
                      60%
                    </span>
                  </div>
                  <Progress value={60} />
                </div>
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                      Course · Class B
                    </span>
                    <span className="font-display text-[22px] font-extrabold text-rush">
                      34%
                    </span>
                  </div>
                  <Progress value={34} />
                </div>
              </div>
            </Pane>

            {/* Banners */}
            <PaneFull title="Banners · feedback states" code=".feedback-banner">
              <div className="grid gap-3">
                <FeedbackBanner
                  tone="win"
                  title="Sawa sawa · Correct"
                  description="Vehicle on your right has right of way at uncontrolled junctions."
                  action={
                    <Button variant="ink" size="sm">
                      Continue
                    </Button>
                  }
                />
                <FeedbackBanner
                  tone="fail"
                  title="Not quite · Wrong"
                  description="Roll-stops are an instant fail on the practical. Always come to a full stop."
                  action={
                    <Button variant="ink" size="sm">
                      Review
                    </Button>
                  }
                />
              </div>
            </PaneFull>

            {/* Sign cards */}
            <PaneFull title="Sign cards" code=".sign-card · Hugeicons">
              <div className="grid gap-3.5 sm:grid-cols-3">
                <SignCard
                  shape="octagon"
                  tone="rush"
                  icon={OctagonFreeIcons}
                  name="Mandatory · Stop"
                  classification="Octagon · 200 mm"
                />
                <SignCard
                  shape="triangle"
                  tone="amber"
                  icon={AlertCircleFreeIcons}
                  name="Warning · Pedestrian"
                  classification="Triangle · 180 mm"
                  iconSize={42}
                />
                <SignCard
                  shape="circle"
                  tone="blue"
                  icon={TrafficLightFreeIcons}
                  name="Information · Lights"
                  classification="Circle · 160 mm"
                />
              </div>
            </PaneFull>
          </div>
        </Container>
      </Section>

      {/* ============= 06b MORE COMPONENTS ============= */}
      <Section>
        <Container>
          <SectionHead
            num="06·b"
            title={
              <>
                More <em>working parts</em>
              </>
            }
            stamp={
              <>
                <div className="font-bold text-ink">COMPONENTS · II</div>
                <div>Forms · feedback · navigation</div>
              </>
            }
            lede="Inputs, toggles, sliders, progress in five flavours, alerts, tabs, modals. Every control in the stamped, bordered idiom."
          />

          <div className="grid border-2 border-ink md:grid-cols-2">
            {/* Inputs */}
            <Pane title="Text inputs" code=".input / states">
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    defaultValue="Wanjiku Mwangi"
                    placeholder="e.g. Wanjiku Mwangi"
                  />
                  <p className="font-mono text-[10.5px] tracking-wide text-ink-3">
                    As it appears on your national ID.
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="cat">NTSA category</Label>
                  <StampInput
                    id="cat"
                    prefix="B"
                    prefixTone="amber"
                    defaultValue="Class B · light vehicle"
                    suffix="CHANGE"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="not-an-email" aria-invalid />
                  <p className="font-mono text-[10.5px] tracking-wide text-rush">
                    ✕ That doesn't look like a valid email.
                  </p>
                </div>
              </div>
            </Pane>

            {/* Phone + OTP */}
            <Pane title="Phone & OTP" code=".stamp-input / .code-input">
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="mpesa">M-Pesa number</Label>
                  <StampInput
                    id="mpesa"
                    prefix="+254"
                    prefixTone="rush"
                    defaultValue="722 410 880"
                    suffix="VERIFY"
                  />
                  <p className="font-mono text-[10.5px] tracking-wide text-ink-3">
                    We'll send a 4-digit code via SMS.
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <Label>Verification code</Label>
                  <CodeInput length={4} defaultValue="48" />
                  <p className="font-mono text-[10.5px] tracking-wide text-ink-3">
                    Code expires in 02:48
                  </p>
                </div>
              </div>
            </Pane>

            {/* Search + textarea */}
            <Pane title="Search & textarea" code=".search-bar / .textarea">
              <div className="grid gap-3.5">
                <SearchBar placeholder="Search signs, lessons, NTSA rules…" />
                <div className="grid gap-1.5">
                  <Label htmlFor="notes">Notes for this sign</Label>
                  <Textarea
                    id="notes"
                    defaultValue="Watch out. This one always confuses me. Two arrows = give way to BOTH directions."
                  />
                </div>
              </div>
            </Pane>

            {/* Checkbox / radio */}
            <Pane title="Checkbox · radio" code=".checkbox / .radio-group">
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2.5 text-sm font-medium text-ink">
                    <Checkbox defaultChecked />
                    Daily streak reminders
                  </label>
                  <label className="inline-flex items-center gap-2.5 text-sm font-medium text-ink">
                    <Checkbox />
                    Weekly summary email
                  </label>
                </div>
                <RadioGroup defaultValue="b" className="flex flex-wrap gap-4">
                  {[
                    { value: "a", label: "Class A · Bike" },
                    { value: "b", label: "Class B" },
                    { value: "c", label: "Class C" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className="inline-flex items-center gap-2.5 text-sm font-medium text-ink"
                    >
                      <RadioGroupItem
                        value={opt.value}
                        id={`lic-${opt.value}`}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </Pane>

            {/* Toggle / slider */}
            <Pane title="Toggle & slider" code=".switch / .slider">
              <div className="grid gap-5">
                <div className="flex flex-wrap gap-6">
                  <label className="inline-flex items-center gap-3 text-sm font-medium text-ink">
                    <Switch defaultChecked />
                    <span>Sound effects</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                      ON
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-3 text-sm font-medium text-ink">
                    <Switch />
                    <span>Hard mode</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                      OFF
                    </span>
                  </label>
                </div>
                <div>
                  <Slider defaultValue={[64]} max={100} step={1} />
                  <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-ink-3">
                    <span>Quiz difficulty</span>
                    <span className="text-rush">Rush · 64</span>
                  </div>
                </div>
              </div>
            </Pane>

            {/* Progress 4 ways */}
            <Pane
              title="Progress · 4 ways"
              code="circle · segments · stripe · steps"
            >
              <div className="grid gap-5">
                <div className="flex items-center gap-6">
                  <TachCircle value={72} />
                  <TachCircle value={34} />
                  <TachCircle value={100}>
                    <span>✓</span>
                  </TachCircle>
                </div>
                <TachSegments total={7} done={4} />
                <div>
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                    Determinate · 78%
                  </p>
                  <Progress
                    value={78}
                    tone="green"
                    showTicks={false}
                    className="h-4"
                  />
                </div>
                <div>
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                    Indeterminate · loading
                  </p>
                  <ProgressIndeterminate />
                </div>
                <TachSteps total={5} current={3} />
              </div>
            </Pane>

            {/* Avatars */}
            <Pane title="Avatars" code=".avatar / .avatar-stack">
              <div className="grid gap-4">
                <div className="flex flex-wrap items-end gap-3">
                  <Avatar size="lg" tone="rush">
                    <AvatarFallback>WM</AvatarFallback>
                  </Avatar>
                  <Avatar tone="green">
                    <AvatarFallback>JK</AvatarFallback>
                  </Avatar>
                  <Avatar tone="blue">
                    <AvatarFallback>PO</AvatarFallback>
                  </Avatar>
                  <Avatar tone="amber">
                    <AvatarFallback>AN</AvatarFallback>
                  </Avatar>
                  <Avatar tone="cyan">
                    <AvatarFallback>FS</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>DR</AvatarFallback>
                    <AvatarStatus />
                  </Avatar>
                  <Avatar size="sm" tone="rush">
                    <AvatarFallback>+9</AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                    Leaderboard · top 5
                  </p>
                  <AvatarStack>
                    <Avatar tone="rush">
                      <AvatarFallback>1</AvatarFallback>
                    </Avatar>
                    <Avatar tone="amber">
                      <AvatarFallback>2</AvatarFallback>
                    </Avatar>
                    <Avatar tone="green">
                      <AvatarFallback>3</AvatarFallback>
                    </Avatar>
                    <Avatar tone="blue">
                      <AvatarFallback>4</AvatarFallback>
                    </Avatar>
                    <Avatar tone="cyan">
                      <AvatarFallback>5</AvatarFallback>
                    </Avatar>
                  </AvatarStack>
                </div>
              </div>
            </Pane>

            {/* Stat tiles */}
            <Pane title="Stat tiles" code=".stat-tile vs .gauge">
              <div className="flex flex-wrap gap-3">
                <StatTile
                  label="Daily XP"
                  value="240"
                  delta={{ dir: "up", copy: "12% vs yesterday" }}
                />
                <StatTile
                  label="Avg. score"
                  value="84%"
                  tone="rush"
                  delta={{ dir: "up", copy: "4 pts" }}
                />
                <StatTile
                  label="Hearts lost"
                  value="2"
                  delta={{ dir: "down", copy: "this session" }}
                />
              </div>
            </Pane>

            {/* Alerts */}
            <PaneFull title="Alerts · all states" code=".alert / variants">
              <div className="grid gap-3">
                <Alert variant="info">
                  <AlertBody>
                    <AlertTitle>Mock exam scheduled</AlertTitle>
                    <AlertDescription>
                      Your timed Class B paper unlocks tomorrow at 09:00. 50
                      questions, 40 minutes.
                    </AlertDescription>
                  </AlertBody>
                  <AlertAction>Dismiss</AlertAction>
                </Alert>
                <Alert variant="warn">
                  <AlertBody>
                    <AlertTitle>Streak at risk</AlertTitle>
                    <AlertDescription>
                      You haven't done a lesson today. 14-day streak ends at
                      midnight.
                    </AlertDescription>
                  </AlertBody>
                  <AlertAction>Dismiss</AlertAction>
                </Alert>
                <Alert variant="ok">
                  <AlertBody>
                    <AlertTitle>Chapter complete · sawa sawa</AlertTitle>
                    <AlertDescription>
                      Traffic Lights & Signals · 100%. +240 XP banked.
                    </AlertDescription>
                  </AlertBody>
                  <AlertAction>Close</AlertAction>
                </Alert>
                <Alert variant="error">
                  <AlertBody>
                    <AlertTitle>Couldn't load lesson</AlertTitle>
                    <AlertDescription>
                      Your connection dropped. Reconnect and we'll resume from
                      where you left off.
                    </AlertDescription>
                  </AlertBody>
                  <AlertAction>Retry</AlertAction>
                </Alert>
              </div>
            </PaneFull>

            {/* Tabs / segmented / breadcrumb */}
            <Pane title="Tabs & segmented" code=".tabs / .toggle-group">
              <div className="grid gap-4">
                <Tabs defaultValue="lessons">
                  <TabsList>
                    <TabsTrigger value="lessons">Lessons</TabsTrigger>
                    <TabsTrigger value="mock">Mock</TabsTrigger>
                    <TabsTrigger value="signs">Signs</TabsTrigger>
                    <TabsTrigger value="stats">Stats</TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="lessons"
                    className="border-2 border-ink bg-surface p-3 text-sm"
                  >
                    24 lessons across 7 chapters.
                  </TabsContent>
                </Tabs>
                <ToggleGroup type="single" defaultValue="week">
                  <ToggleGroupItem value="day">Day</ToggleGroupItem>
                  <ToggleGroupItem value="week">Week</ToggleGroupItem>
                  <ToggleGroupItem value="month">Month</ToggleGroupItem>
                  <ToggleGroupItem value="all">All</ToggleGroupItem>
                </ToggleGroup>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#">Class B</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#">Chapter 03</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Traffic lights</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </Pane>

            {/* Tooltip + toast */}
            <Pane title="Tooltip & toast" code=".tooltip / sonner">
              <div className="grid gap-5">
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="rush" size="sm">
                        12-day streak
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Press · 12-day streak</TooltipContent>
                  </Tooltip>
                </div>
                <div>
                  <Button
                    variant="ink"
                    size="sm"
                    onClick={() =>
                      toast("+40 XP · question banked", {
                        action: { label: "Undo", onClick: () => undefined },
                      })
                    }
                  >
                    Fire toast
                  </Button>
                </div>
              </div>
            </Pane>

            {/* Modal + empty / skeleton */}
            <PaneFull
              title="Modal · empty · loading"
              code=".dialog / .empty / .skeleton"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="rush">Open quit confirm</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Quit this lesson?</DialogTitle>
                      </DialogHeader>
                      <DialogBody>
                        You're 60% through Chapter 03 · Lesson 04. Your progress
                        saves automatically, but you'll lose your in-session
                        streak bonus of <strong>+30 XP</strong>.
                      </DialogBody>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="paper" size="sm">
                            Keep going
                          </Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button variant="rush" size="sm">
                            Quit anyway
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid gap-3.5">
                  <EmptyState
                    title="No mock exams yet"
                    description="Take your first one when you've completed three chapters."
                  />
                  <div className="grid gap-2.5 border-2 border-line-soft bg-surface p-3.5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-12 border-2 border-line-soft" />
                      <div className="grid flex-1 gap-2">
                        <Skeleton className="w-3/5" />
                        <Skeleton className="w-2/5" />
                      </div>
                    </div>
                    <Skeleton className="h-16" />
                  </div>
                </div>
              </div>
            </PaneFull>

            {/* App bar */}
            <PaneFull title="App bar · navigation shell" code=".app-bar">
              <AppBar
                className="static"
                nav={
                  <>
                    <AppBarLink href="#" active>
                      Learn
                    </AppBarLink>
                    <AppBarLink href="#">Mock</AppBarLink>
                    <AppBarLink href="#">Signs</AppBarLink>
                    <AppBarLink href="#">Profile</AppBarLink>
                  </>
                }
                trailing={
                  <>
                    <Badge variant="amber">★ 12d streak</Badge>
                    <Badge variant="rush">+ 2,410 XP</Badge>
                    <Avatar size="sm" tone="rush">
                      <AvatarFallback>WM</AvatarFallback>
                    </Avatar>
                  </>
                }
              />
            </PaneFull>
          </div>
        </Container>
      </Section>

      {/* ============= 07 VOICE ============= */}
      <Section>
        <Container>
          <SectionHead
            num="07"
            title={
              <>
                House <em>voice</em>
              </>
            }
            stamp={
              <>
                <div className="font-bold text-ink">TONE</div>
                <div>Direct · local · zero hype</div>
              </>
            }
            lede="Talk like a sharp instructor who's been to the test centre 200 times. No corporate, no babying, no confetti emoji."
          />

          <div className="grid gap-5 md:grid-cols-2">
            <VoiceCard
              title="Write like this"
              mode="do"
              examples={[
                "Sawa sawa. You're moving fast.",
                "Don't sweat it. Review and try again.",
                "Stop completely, then proceed when safe.",
                "12-day streak. Don't break it tomorrow.",
                "Built for Kenya. Real signs. Real junctions.",
              ]}
            />
            <VoiceCard
              title="Not like this"
              mode="dont"
              examples={[
                "Congratulations on your achievement! 🎉🎉🎉",
                "Oops! Looks like you got that one wrong.",
                "Please ensure that you come to a complete stop.",
                "You're on a roll, champ! Keep up the great work!",
                "Welcome to our comprehensive learning platform.",
              ]}
            />
          </div>
        </Container>
      </Section>

      {/* ============= FOOTER ============= */}
      <footer className="border-t-4 border-double border-ink bg-ink py-14 text-paper">
        <Container>
          <div className="grid gap-6 border-b border-paper/20 pb-9 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <div className="mb-3 font-display text-[56px] font-extrabold italic uppercase leading-none tracking-tight">
                D<span className="text-rush">R</span>
              </div>
              <p className="font-serif text-lg leading-snug opacity-80">
                DriveRush · the learning platform that takes your NTSA exam as
                seriously as you do.
              </p>
            </div>
            {[
              {
                h: "Manual",
                items: [
                  "01 · Principles",
                  "02 · Logo",
                  "03 · Color",
                  "04 · Type",
                ],
              },
              {
                h: "System",
                items: ["05 · Shape", "06 · Components", "07 · Voice"],
              },
              { h: "Edition", items: ["v 2.0", "26·04·2026", "Nairobi · KE"] },
            ].map((col) => (
              <div key={col.h}>
                <h4 className="mb-3 font-display text-xs font-extrabold uppercase tracking-widest">
                  {col.h}
                </h4>
                <ul className="m-0 list-none p-0">
                  {col.items.map((it) => (
                    <li
                      key={it}
                      className="py-1 font-mono text-xs tracking-wide opacity-85"
                    >
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-between gap-3 pt-6 font-mono text-[11px] uppercase tracking-widest opacity-60">
            <span>★ DriveRush brand programme ★</span>
            <span>Learn · Drive · Succeed</span>
            <span>End of document · № 01</span>
          </div>
        </Container>
      </footer>
    </main>
  );
}

/* =============================================================
   Internal helpers — keep the long render readable
   ============================================================= */

function Pane({
  title,
  code,
  children,
}: {
  title: string;
  code: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b-2 border-ink bg-surface p-7 last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0 md:odd:border-r-2">
      <PaneHead title={title} code={code} />
      {children}
    </div>
  );
}

function PaneFull({
  title,
  code,
  children,
}: {
  title: string;
  code: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b-2 border-ink bg-surface p-7 last:border-b-0 md:col-span-2">
      <PaneHead title={title} code={code} />
      {children}
    </div>
  );
}

function PaneHead({ title, code }: { title: string; code: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-dashed border-ink pb-2.5">
      <span className="font-display text-sm font-extrabold uppercase tracking-wider">
        {title}
      </span>
      <code className="font-mono text-[10.5px] tracking-wider text-ink-3">
        {code}
      </code>
    </div>
  );
}

function LogoCell({
  label,
  surface,
  children,
}: {
  label: string;
  surface: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-2 border-ink bg-surface">
      <div className={`flex h-32 items-center justify-center ${surface}`}>
        {children}
      </div>
      <p className="border-t-2 border-ink p-3 font-mono text-[10px] uppercase tracking-widest text-ink-3">
        {label}
      </p>
    </div>
  );
}
