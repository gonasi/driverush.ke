/**
 * The two trainers, side by side at every width. These are the moat, so a phone
 * shows both without scrolling. Each card previews the real thing: the Pelican
 * chart zooms itself, and a tap on the 3D poster loads a sign you can spin (the
 * three.js chunk only loads on that tap, so a cold visit doesn't pay for it).
 */
import * as React from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02FreeIcons,
  ThreeDViewFreeIcons,
} from "@hugeicons/core-free-icons";

import pelican from "~/data/road-signs-pelican.json";
import type { FocusRegion } from "~/lib/image-focus";
import { SIGN_GAMES, type SignGame } from "~/lib/road-signs";

import { Button } from "~/components/ui/button";
import { ImageFocusStage } from "~/components/brand/image-focus-stage";
import { Sign3DViewer } from "~/components/brand/sign-3d-viewer";

const CHART_SRC = pelican.imageSrc as string;
const REGIONS = pelican.regions as FocusRegion[];

/** Signs that read well at this size, across the shapes and colours. */
const PREVIEW_SIGNS = ["R.1", "W.30", "P.1", "M.1"]
  .map((code) => REGIONS.find((r) => r.code === code))
  .filter((r): r is FocusRegion => Boolean(r));

const PREVIEW_HOLD_MS = 2600;
const POSTER_SRC = "/assets/road-signs/3d-poster.jpg";
const POSTER_MODEL = "/assets/road-signs/models/R_1.glb";

function ChartPreview() {
  // -1 is the whole chart: what the server renders, and the first paint.
  const [index, setIndex] = React.useState(-1);

  React.useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setIndex(0);
      return;
    }
    const first = window.setTimeout(() => setIndex(0), 700);
    const cycle = window.setInterval(() => {
      if (!document.hidden) {
        setIndex((i) => (i + 1) % PREVIEW_SIGNS.length);
      }
    }, PREVIEW_HOLD_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(cycle);
    };
  }, []);

  return (
    <div
      role="img"
      aria-label="The Pelican road-sign chart, zooming in on one sign at a time"
    >
      <ImageFocusStage
        imageSrc={CHART_SRC}
        region={index >= 0 ? PREVIEW_SIGNS[index] : null}
        focused={index >= 0}
        blurIntensity={0}
        dimIntensity={0}
        animationDuration={900}
        className="border-0 bg-white"
      />
    </div>
  );
}

function SpinPreview() {
  const [spinning, setSpinning] = React.useState(false);

  if (spinning) {
    return (
      <div className="aspect-video w-full bg-paper-3">
        <Sign3DViewer
          modelSrc={POSTER_MODEL}
          autoRotate
          zoom={0.9}
          loaderLabel="Loading"
          className="size-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setSpinning(true)}
      aria-label="Load a 3D sign you can spin"
      className="group relative block aspect-video w-full cursor-pointer overflow-hidden bg-paper-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rush"
    >
      <img
        src={POSTER_SRC}
        alt=""
        width={640}
        height={336}
        className="block size-full object-cover"
      />
      <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 border-2 border-ink bg-surface px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-widest text-ink shadow-stamp-xs transition-colors group-hover:bg-amber group-hover:text-amber-foreground sm:text-[10.5px]">
        <HugeiconsIcon icon={ThreeDViewFreeIcons} size={12} strokeWidth={2.5} />
        Tap to spin
      </span>
    </button>
  );
}

const PREVIEWS: Record<SignGame["slug"], () => React.JSX.Element> = {
  pelican: ChartPreview,
  "3d": SpinPreview,
};

export function TrainerCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5">
      {SIGN_GAMES.map((game) => {
        const Preview = PREVIEWS[game.slug];
        return (
          <article
            key={game.slug}
            className="flex min-w-0 flex-col border-2 border-ink bg-surface shadow-stamp"
          >
            <div className="border-b-2 border-ink">
              <Preview />
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2.5 sm:p-5">
              <h2 className="m-0 font-display text-[clamp(16px,3.4vw,30px)] font-extrabold uppercase leading-none tracking-tight text-ink">
                {game.title}
              </h2>
              <p className="m-0 flex-1 text-[12.5px] leading-snug text-ink-2 sm:text-[15px]">
                {game.blurb}
              </p>
              <Button variant="rush" asChild className="mt-1.5 w-full px-2">
                <Link to={game.to}>
                  Start 10 signs
                  <HugeiconsIcon
                    icon={ArrowRight02FreeIcons}
                    size={14}
                    strokeWidth={2.5}
                    className="hidden sm:inline"
                  />
                </Link>
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
