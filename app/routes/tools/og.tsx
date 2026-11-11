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
import {
  dirOf,
  laneBearing,
  lanePoint,
  ringRadius,
} from "~/lib/board/geometry";
import type { Seat } from "~/lib/board/joystick";
import { car as boardCar } from "~/lib/board/runtime";
import { cam, panBy } from "~/lib/board/stage";
import { regionSpriteStyle } from "~/lib/image-focus";
import { signCrop } from "~/lib/sign-crops";
import { OG_CARDS, OG_HEIGHT, OG_WIDTH, type OgCardId } from "~/lib/og-cards";
import { SIGN_COUNT } from "~/lib/road-signs";
import { SIGN_BRAND } from "~/lib/sign-credits";
import { cn } from "~/lib/utils";

import { Sign3DViewer } from "~/components/brand/sign-3d-viewer";
import { SignImage } from "~/components/brand/sign-image";
import { SIGN_IMAGE_SIZE, signPageBySlug } from "~/lib/road-sign-pages";

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
 * The same sprite maths the trainers use, on the sign's tight crop so the code
 * key and neighbouring signs stay out of frame.
 */
function crop(r: Region, pad = 0): React.CSSProperties {
  return regionSpriteStyle(signCrop(r), SHEET, pad);
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
          <h1 className="m-0 font-display text-[60px] font-extrabold uppercase leading-[0.9] tracking-tight">
            Drive the board.{" "}
            <em className="font-serif font-normal normal-case italic text-rush">
              Memorise the signs.
            </em>
          </h1>
          <p className="mt-5 font-serif text-[24px] leading-snug text-ink-2">
            The Model Town Board and Kenya's road signs, for your NTSA test.
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

/** The 3D still of the table, captured from `?card=board-3d` below. */
const BOARD_STILL = "/assets/board/poster.jpg";

function BoardCard() {
  return (
    <Card
      id="board"
      className="bg-ink"
      header={
        <>
          <Wordmark tone="paper" />
          <Stamp>Free · No signup</Stamp>
        </>
      }
    >
      <div className="flex w-full items-center gap-10">
        <div className="max-w-[440px] shrink-0">
          <h1 className="m-0 font-display text-[62px] font-extrabold uppercase leading-[0.9] tracking-tight text-paper">
            Model Town Board.{" "}
            <em className="font-serif font-normal normal-case italic text-rush">
              Drive it.
            </em>
          </h1>
          <p className="mt-4 font-serif text-[23px] leading-snug text-paper/75">
            Pick your lane, take the roundabout, stop where the examiner asks.
          </p>
        </div>
        <img
          src={BOARD_STILL}
          alt=""
          className="h-[390px] min-w-0 flex-1 border-2 border-paper object-cover"
        />
      </div>
    </Card>
  );
}

function PelicanCard() {
  const signs = ["R.1", "P.1", "M.1"].map(region).filter(Boolean) as Region[];
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
              style={crop(r)}
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

const BoardTable = React.lazy(() => import("~/components/board/board-table"));

/**
 * Where the still looks, and where the car is in it. `?x=&z=&span=&at=` move
 * them, for trying a framing before settling on these.
 */
/**
 * The other two cars of the pack, beside the yellow saloon, so the picture
 * shows every car a learner can pick. Lane and distance from the roundabout.
 */
const STILL_CARS = [
  { car: "pickup", paint: "#2456b4", plate: "KDA 101B", lane: 1, along: 41 },
  { car: "suv", paint: "#dfe3e8", plate: "KCB 442T", lane: 4, along: 39.5 },
] as const;

const STILL = {
  // The moment the game is about: four numbered lanes and the roundabout
  // ahead, and a lane to choose. Seen from behind the car, as on a phone.
  seat: "south",
  x: -5,
  z: 31,
  span: 40,
  car: { x: -8.4, z: 38, heading: 8 },
  steer: 0.25,
  // on the roundabout instead, with `?at=<degrees>`
  bearing: 205,
  lane: 2,
};

/**
 * Not a social card either: the picture of the board game, shown wherever
 * there is a way into it (`board-thumb.tsx`), and inside the board's social
 * card above. It is the game's own table, at its best quality, with the
 * yellow car coming up to the roundabout. Captured by the same script, then
 * compressed into `public/assets/board/poster.jpg`.
 */
function Board3D() {
  const [params] = useSearchParams();
  const num = (key: string, fallback: number) => {
    const raw = Number(params.get(key));
    return params.get(key) !== null && Number.isFinite(raw) ? raw : fallback;
  };
  const x = num("x", STILL.x);
  const z = num("z", STILL.z);
  const span = num("span", STILL.span);
  const bearing = (num("at", STILL.bearing) * Math.PI) / 180;
  const seat = (params.get("seat") ?? STILL.seat) as Seat;
  // `carx`, `carz` and `carh` (degrees) stand the car somewhere else, and
  // `at` puts it on the roundabout.
  const onRing = params.get("at") !== null;
  const carX = onRing ? null : num("carx", STILL.car.x);
  const carZ = num("carz", STILL.car.z);
  const carH = (num("carh", STILL.car.heading) * Math.PI) / 180;
  const steer = num("steer", STILL.steer);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  /** Stand the car in its place and hold the camera on the framing. */
  const pose = React.useCallback(() => {
    const r = ringRadius(STILL.lane);
    const out = dirOf(bearing);
    boardCar.x = carX ?? out.x * r;
    boardCar.z = carX === null ? out.z * r : carZ;
    // clockwise: a quarter turn on from where it is on the ring
    boardCar.heading = carX === null ? bearing + Math.PI / 2 : carH;
    boardCar.speed = 0;
    boardCar.steer = steer;
    cam.free = true;
    cam.follow = false;
    cam.lift = 0;
    cam.side = 0;
    cam.x = x;
    cam.z = z;
    cam.span = span;
    // asks the scene for a frame, and leaves the view where it is
    panBy(0, 0);
  }, [x, z, span, bearing, carX, carZ, carH, steer]);
  React.useEffect(() => {
    if (mounted) pose();
  }, [mounted, pose]);

  return (
    <div
      style={{ width: OG_WIDTH, height: OG_HEIGHT }}
      className="bg-[#4f4c47]"
    >
      {mounted && (
        <React.Suspense fallback={null}>
          <BoardTable
            challenge={null}
            extraCars={STILL_CARS.map((spot) => ({
              car: spot.car,
              paint: spot.paint,
              plate: spot.plate,
              ...lanePoint("S", "approach", spot.lane, spot.along),
              heading: laneBearing("S", "approach"),
            }))}
            driving={false}
            attempt={0}
            tier="high"
            // the capture runs at a higher device scale for a sharp still
            pixelRatio={window.devicePixelRatio}
            seat={seat}
            car="saloon"
            onReady={pose}
          />
        </React.Suspense>
      )}
    </div>
  );
}

/**
 * The road signs chart as a page to print. The chart is our own artwork; the
 * Pelican Signs logo is used with their permission, credited the agreed way
 * (`lib/sign-credits.ts`), never as a partner and never as the chart's author.
 */
function PrintableChart() {
  return (
    <div className="bg-white p-0 font-sans text-[#0e1014]">
      <style>{`@page { size: A4 landscape; margin: 8mm; } html, body { background: #fff; }`}</style>
      <div className="flex items-end justify-between gap-6 border-b-2 border-[#0e1014] pb-2">
        <div>
          <h1 className="m-0 font-display text-[22px] font-extrabold uppercase leading-none tracking-tight">
            Kenya road signs chart
          </h1>
          <p className="m-0 mt-1 text-[11px]">
            {SIGN_COUNT} signs with their meanings at driverush.ke/road-signs
          </p>
        </div>
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest">
          Featuring
          <img
            src={SIGN_BRAND.logo}
            alt={SIGN_BRAND.name}
            className="h-7 w-auto border border-[#0e1014]"
          />
        </div>
      </div>
      <img
        src="/assets/road-signs/road-signs.v2.svg"
        alt="Kenya road signs chart"
        className="mt-2 block h-auto w-full"
      />
      <p className="m-0 mt-1 text-[8px] text-[#5b6068]">
        Free from DriveRush (driverush.ke). {SIGN_BRAND.name} name and logo used
        with permission. Not affiliated with the NTSA. Practise the signs free at
        driverush.ke/road-signs.
      </p>
    </div>
  );
}

const RENDERERS: Record<
  OgCardId | "poster-3d" | "board-3d",
  () => React.JSX.Element
> = {
  "poster-3d": Poster3D,
  "board-3d": Board3D,
  default: DefaultCard,
  board: BoardCard,
  pelican: PelicanCard,
  signs3d: Signs3DCard,
  "road-signs": RoadSignsCard,
};

export default function OgStudio() {
  const [params] = useSearchParams();
  const requested = params.get("card") as keyof typeof RENDERERS | null;

  // The printable chart: one A4 page, landscape, for
  // `scripts/build-sign-images.mjs` to print to `public/downloads/`.
  if (params.get("print") === "chart") return <PrintableChart />;

  // One sign on its own, at `SIGN_IMAGE_SIZE` square, for
  // `scripts/build-sign-images.mjs` to capture into a file per sign page.
  const signSlug = params.get("sign");
  const signPage = signSlug ? signPageBySlug(signSlug) : undefined;
  if (signPage) {
    return (
      <div
        className="fixed left-0 top-0 m-0 bg-white p-0"
        style={{ width: SIGN_IMAGE_SIZE, height: SIGN_IMAGE_SIZE }}
      >
        <SignImage sign={signPage} className="size-full" />
      </div>
    );
  }

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
