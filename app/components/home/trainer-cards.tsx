/**
 * The two trainers, side by side at every width. These are the moat, so a phone
 * shows both without scrolling. Each card previews the real thing: the Pelican
 * chart zooms itself, and a tap on the 3D poster loads a sign you can spin (the
 * three.js chunk only loads on that tap, so a cold visit doesn't pay for it).
 */
import * as React from "react";
import { Link } from "react-router";
import { Icon } from "~/components/brand/icon";
import {
  ArrowRightIcon,
  Sign3DIcon,
} from "~/components/brand/icons";

import pelican from "~/data/road-signs-pelican.json";
import type { FocusRegion } from "~/lib/image-focus";
import { stagger } from "~/lib/motion";
import { signCounts } from "~/lib/pelican-progress";
import { SIGN_GAMES, type SignGame } from "~/lib/road-signs";
import { ROUND_SIZE, trainerHref } from "~/lib/trainer-rounds";
import { useSignProgress } from "~/lib/use-sign-progress";

import { Button } from "~/components/ui/button";
import { ImageFocusStage } from "~/components/brand/image-focus-stage";
import { Sign3DViewer } from "~/components/brand/sign-3d-viewer";

const CHART_SRC = pelican.imageSrc as string;
const REGIONS = pelican.regions as FocusRegion[];

/** Signs that read well at this size, across the shapes and colours. */
const PREVIEW_SIGNS = ["R.1", "W.30", "P.1", "M.1"]
  .map((code) => REGIONS.find((r) => r.code === code))
  .filter((r): r is FocusRegion => Boolean(r));

const PREVIEW_START_MS = 1200;
const PREVIEW_HOLD_MS = 3200;
const POSTER_SRC = "/assets/road-signs/3d-poster.jpg";
const POSTER_MODEL = "/assets/road-signs/models/R_1.glb";

function ChartPreview() {
  // -1 is the whole chart: what the server renders, and the first paint.
  const [index, setIndex] = React.useState(-1);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIndex(0);
      return;
    }
    const first = window.setTimeout(() => {
      setIndex((i) => (i < 0 ? 0 : i));
    }, PREVIEW_START_MS);
    // Only pans while it's on screen and the tab is open.
    let cycle: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearInterval(cycle);
        cycle = undefined;
        if (!entry.isIntersecting) return;
        cycle = window.setInterval(() => {
          if (document.hidden) return;
          setIndex((i) => (i + 1) % PREVIEW_SIGNS.length);
        }, PREVIEW_HOLD_MS);
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(cycle);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      role="img"
      aria-label="The Pelican road-sign chart, zooming in on one sign at a time"
    >
      <ImageFocusStage
        imageSrc={CHART_SRC}
        region={index >= 0 ? PREVIEW_SIGNS[index] : null}
        focused={index >= 0}
        blurIntensity={0}
        dimIntensity={0}
        animationDuration={1100}
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
        className="dr-sway block size-full object-cover"
      />
      <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 border-2 border-ink bg-surface px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-widest text-ink shadow-stamp-xs transition-colors group-hover:bg-amber group-hover:text-amber-foreground sm:text-[10.5px]">
        <Icon icon={Sign3DIcon} size={12} />
        Tap to spin
      </span>
    </button>
  );
}

const PREVIEWS: Record<SignGame["slug"], () => React.JSX.Element> = {
  pelican: ChartPreview,
  "3d": SpinPreview,
};

export function TrainerCards({ firstStep = 0 }: { firstStep?: number }) {
  const progress = useSignProgress();
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5">
      {SIGN_GAMES.map((game, index) => {
        const Preview = PREVIEWS[game.slug];
        const saved = progress?.[game.slug] ?? {};
        const counts = signCounts(saved, Object.keys(saved));
        const started = counts.known + counts.learning > 0;
        return (
          <article
            key={game.slug}
            style={stagger(firstStep + index)}
            className="dr-rise dr-lift flex min-w-0 flex-col border-2 border-ink bg-surface shadow-stamp"
          >
            <div className="border-b-2 border-ink">
              <Preview />
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
              <h2 className="m-0 font-display text-[clamp(16px,3.4vw,30px)] font-extrabold uppercase leading-none tracking-tight text-ink">
                {game.title}
              </h2>
              {started ? (
                <p className="m-0 flex-1 text-[12.5px] font-semibold leading-snug text-ink sm:text-[15px]">
                  {counts.known} known · {counts.learning} learning
                  {counts.due > 0 && (
                    <span className="block font-normal text-ink-2">
                      {counts.due} sign{counts.due === 1 ? "" : "s"} due
                    </span>
                  )}
                </p>
              ) : (
                <p className="m-0 flex-1 text-[12.5px] leading-snug text-ink-2 sm:text-[15px]">
                  {game.blurb}
                </p>
              )}
              <Button variant="rush" asChild className="mt-1.5 w-full px-2">
                <Link to={trainerHref(game.to, { go: true })}>
                  {started ? "Continue" : `Start ${ROUND_SIZE} signs`}
                  <Icon
                    icon={ArrowRightIcon}
                    size={14}
                    className="dr-arrow hidden sm:inline"
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
