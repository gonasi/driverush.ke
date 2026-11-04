/**
 * `/tools/og` — the OG card studio.
 *
 * Renders every social card at exactly 1200×630 using the app's own fonts,
 * colours and artwork, so the previews look like the product instead of like a
 * template. `scripts/build-og-images.mjs` drives headless Chrome over
 * `?card=<id>` (which renders that one card alone, no chrome) and writes the
 * PNGs into `public/og/`.
 *
 * Why capture instead of generating at runtime: a served image needs a
 * renderer in production (satori/resvg or a browser), which is a dependency, a
 * cold start and a CPU bill on every crawler hit. These cards change when we
 * redesign them, not per request, so a committed PNG is the honest shape. The
 * trade-off is that a card can't print a per-share score; the headline does.
 *
 * Internal: noindex, excluded from the sitemap, and `/tools/*` events are
 * dropped before they reach PostHog.
 */
import * as React from "react";
import { useSearchParams } from "react-router";

import type { Route } from "./+types/og";

import pelican from "~/data/road-signs-pelican.json";
import { regionSpriteStyle } from "~/lib/image-focus";
import { OG_CARDS, OG_HEIGHT, OG_WIDTH, type OgCardId } from "~/lib/og-cards";
import { cn } from "~/lib/utils";

import { Sign3DViewer } from "~/components/brand/sign-3d-viewer";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "OG cards · DriveRush Tools" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

type Region = {
  id: string;
  name: string;
  code: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const REGIONS = pelican.regions as Region[];
const SHEET = pelican.imageSrc as string;

function region(code: string): Region | undefined {
  return REGIONS.find((r) => r.code === code);
}

/**
 * The same sprite maths the trainers use, pulled in a little so the printed sign
 * code and neighbouring sign stay out of frame at poster size.
 */
function crop(r: Region, pad = 0.11): React.CSSProperties {
  return regionSpriteStyle(r, SHEET, pad);
}

/**
 * Fixed-size stage. Screenshots are taken at exactly these dimensions.
 *
 * `header` pins to the top, `children` take the rest and centre in it. The
 * flag rule is absolute, so it can't be caught by the column's spacing.
 */
function Card({
  id,
  header,
  children,
  className,
}: {
  id: OgCardId;
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-og-card={id}
      style={{ width: OG_WIDTH, height: OG_HEIGHT }}
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden bg-paper px-14 pb-14 pt-11 text-ink",
        className,
      )}
    >
      <div className="flex items-start justify-between">{header}</div>
      <div className="flex flex-1 items-center">{children}</div>
      <FlagRule />
    </div>
  );
}

/** Kenyan flag rule, the same motif the site's Rail uses. */
function FlagRule() {
  return (
    <div className="absolute inset-x-0 bottom-0 flex h-3">
      <span className="flex-1 bg-ink" />
      <span className="flex-1 bg-rush" />
      <span className="flex-1 bg-kenya-green" />
      <span className="flex-1 bg-kenya-gold" />
    </div>
  );
}

function Wordmark({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  return (
    <span
      className={cn(
        "font-display text-[26px] font-extrabold uppercase tracking-tight",
        tone === "paper" ? "text-paper" : "text-ink",
      )}
    >
      DriveRush<span className="text-rush">.ke</span>
    </span>
  );
}

function Stamp({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border-2 border-ink bg-amber px-3 py-1.5 font-mono text-[15px] font-bold uppercase tracking-widest text-amber-foreground">
      {children}
    </span>
  );
}

// ---- the cards ------------------------------------------------------------

function DefaultCard() {
  const showcase = ["W.1", "P.1", "R.1", "M.1"]
    .map(region)
    .filter(Boolean) as Region[];
  return (
    <Card
      id="default"
      header={
        <>
          <Wordmark />
          <Stamp>Free · No signup</Stamp>
        </>
      }
    >
      <div className="flex w-full items-center justify-between gap-10">
        <div className="max-w-[620px]">
          <h1 className="m-0 font-display text-[64px] font-extrabold uppercase leading-[0.9] tracking-tight">
            Memorise Kenya's{" "}
            <em className="font-serif font-normal normal-case italic text-rush">
              road signs
            </em>
          </h1>
          <p className="mt-5 font-serif text-[24px] leading-snug text-ink-2">
            On the Pelican chart, or spun in 3D.
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3">
          {showcase.map((r) => (
            <span
              key={r.id}
              style={crop(r)}
              className="size-[150px] border-2 border-ink bg-paper"
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function PelicanCard() {
  // Two signs that frame cleanly on the sheet. The trainer's region boxes are
  // hand-placed, so some signs sit high in their box and crop badly at poster
  // size; these two don't.
  const signs = ["R.1", "P.1", "M.1"]
    .map(region)
    .filter(Boolean) as Region[];
  return (
    <Card
      id="pelican"
      className="bg-ink"
      header={
        <>
          <Wordmark tone="paper" />
          <Stamp>Pelican chart · {REGIONS.length} signs</Stamp>
        </>
      }
    >
      <div className="flex w-full items-center gap-10">
        <div className="flex shrink-0 gap-4">
          {signs.map((r) => (
            <span
              key={r.id}
              // Negative pad widens the box: at this size the sign needs air
              // around it, and the sheet's own gutter provides it.
              style={crop(r, 0.03)}
              className="size-[196px] border-2 border-paper bg-paper"
            />
          ))}
        </div>
        <div>
          <h1 className="m-0 font-display text-[58px] font-extrabold uppercase leading-[0.9] tracking-tight text-paper">
            Name it before the{" "}
            <em className="font-serif font-normal normal-case italic text-rush">
              answer shows
            </em>
          </h1>
          <p className="mt-4 font-serif text-[23px] leading-snug text-paper/75">
            The Pelican chart, one sign at a time.
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * The one card that needs a live renderer: it mounts the real GLB viewer, so
 * the preview shows the actual models the trainer uses. Headless Chrome runs
 * this through SwiftShader, which is why the capture script allows a generous
 * settle time before shooting.
 */
function Signs3DCard() {
  const models = ["W_1", "P_1", "R_1"];
  return (
    <Card
      id="signs3d"
      header={
        <>
          <Wordmark />
          <Stamp>3D signs</Stamp>
        </>
      }
    >
      <div className="flex w-full items-center gap-10">
        <div className="max-w-[372px] shrink-0">
          <h1 className="m-0 font-display text-[42px] font-extrabold uppercase leading-[0.92] tracking-tight">
            Spin Kenyan{" "}
            <em className="font-serif font-normal normal-case italic text-rush">
              road signs
            </em>
          </h1>
          <p className="mt-4 font-serif text-[22px] leading-snug text-ink-2">
            Modelled on its post, read from any angle, the way you meet them on
            the road.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          {models.map((m, i) => (
            <div
              key={m}
              // Portrait tiles: a sign on a post is a tall subject, and this
              // fills the card's height instead of floating in the middle.
              className="h-[352px] w-[208px] overflow-hidden border-2 border-ink bg-surface"
            >
              <Sign3DViewer
                modelSrc={`/assets/road-signs/models/${m}.glb`}
                // Degrees. Turning the outer two shows these are real models
                // on posts rather than flat art.
                yaw={i === 1 ? 0 : i === 0 ? -26 : 26}
                pitch={-3}
                // `zoom` scales camera distance, so below 1 moves closer. The
                // default framing leaves too much air for a 210px tile.
                zoom={0.78}
                autoRotate={false}
                interactive={false}
                className="size-full"
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function RoadSignsCard() {
  // Hand-picked across all four classes. Taking the first N regions gives
  // fourteen red triangles, which reads as one sign repeated.
  const grid = [
    "R.1",
    "P.1",
    "M.1",
    "W.1",
    "W.7",
    "P.3",
    "M.5",
    "W.5",
    "R.2",
    "P.11",
    "M.2",
    "W.13(a)",
    "P.4",
    "W.20",
    "M.10",
  ]
    .map(region)
    .filter(Boolean) as Region[];
  return (
    <Card
      id="road-signs"
      header={
        <>
          <Wordmark />
          <Stamp>Pelican chart</Stamp>
        </>
      }
    >
      <div className="flex w-full items-center gap-10">
        <div className="max-w-[430px]">
          <h1 className="m-0 font-display text-[52px] font-extrabold uppercase leading-[0.9] tracking-tight">
            {REGIONS.length} Kenyan road signs, and what they{" "}
            <em className="font-serif font-normal normal-case italic text-rush">
              actually mean
            </em>
          </h1>
          <p className="mt-4 font-serif text-[21px] leading-snug text-ink-2">
            The Pelican chart, plus two trainers that drill it in.
          </p>
        </div>
        <div className="grid grid-cols-5 gap-2.5">
          {grid.map((r) => (
            <span
              key={r.id}
              style={crop(r)}
              className="size-[104px] border-2 border-ink bg-paper"
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * Not a social card: the still shown on the homepage's 3D trainer card, so a cold
 * visit gets a real render without downloading three.js. Captured by the same
 * script, then compressed into `public/assets/road-signs/3d-poster.jpg`.
 */
function Poster3D() {
  return (
    <div style={{ width: OG_WIDTH, height: OG_HEIGHT }} className="bg-paper-3">
      <Sign3DViewer
        modelSrc="/assets/road-signs/models/R_1.glb"
        yaw={-32}
        pitch={-4}
        zoom={0.92}
        autoRotate={false}
        interactive={false}
        className="size-full"
      />
    </div>
  );
}

const RENDERERS: Record<OgCardId | "poster-3d", () => React.JSX.Element> = {
  "poster-3d": Poster3D,
  default: DefaultCard,
  pelican: PelicanCard,
  signs3d: Signs3DCard,
  "road-signs": RoadSignsCard,
};

export default function OgStudio() {
  const [params] = useSearchParams();
  const requested = params.get("card") as keyof typeof RENDERERS | null;

  // Single-card mode: nothing but the card at its exact pixel size, pinned to
  // the top-left so a 1200×630 viewport screenshot is the card and only the
  // card.
  if (requested && RENDERERS[requested]) {
    const Only = RENDERERS[requested];
    return (
      <div className="fixed left-0 top-0 m-0 overflow-hidden bg-paper p-0">
        <Only />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1300px] px-6 py-10">
      <header className="mb-8">
        <h1 className="m-0 font-display text-4xl font-extrabold uppercase tracking-tight">
          OG cards
        </h1>
        <p className="mt-3 max-w-2xl font-serif text-[17px] leading-snug text-ink-2">
          What a shared DriveRush link looks like in WhatsApp, X and Facebook.
          Edit these in <code>app/routes/tools/og.tsx</code>, then capture them
          with <code>npm run build:og</code> (needs <code>npm run dev</code>{" "}
          running). Cards are shown at half size here; capture is 1200×630.
        </p>
      </header>

      <div className="grid gap-10">
        {OG_CARDS.map((card) => {
          const Render = RENDERERS[card.id];
          return (
            <section key={card.id}>
              <div className="mb-3 flex flex-wrap items-baseline gap-3">
                <h2 className="m-0 font-display text-lg font-extrabold uppercase tracking-wide">
                  {card.id}
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                  /og/{card.id}.png
                </span>
                <span className="text-[13px] text-ink-2">{card.blurb}</span>
              </div>
              {/* Half-scale preview: the card renders at full pixel size and
                  is scaled down, so what you see is what gets captured. */}
              <div
                className="overflow-hidden border-2 border-ink"
                style={{ width: OG_WIDTH / 2, height: OG_HEIGHT / 2 }}
              >
                <div
                  style={{
                    transform: "scale(0.5)",
                    transformOrigin: "top left",
                  }}
                >
                  <Render />
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
