import { useEffect } from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  Configuration01FreeIcons,
  ThreeDViewFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/road-signs-pelican";

import { stagger } from "~/lib/motion";
import { breadcrumbLd, pageMeta, ROAD_SIGN_KEYWORDS } from "~/lib/site";
import { ogCardAlt, ogCardPath } from "~/lib/og-cards";
import type { ImageFocusData } from "~/lib/image-focus";
import pelicanJson from "~/data/road-signs-pelican.json";
import { getPracticeRegions, usePelicanStore } from "~/lib/pelican-store";
import { useTrainerLink } from "~/lib/use-trainer-link";

import { Button } from "~/components/ui/button";
import { SignCredit } from "~/components/brand/sign-credit";
import { Rail } from "~/components/brand/rail";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";
import { LoadingPanel } from "~/components/brand/traffic-loader";
import { ImageFocusPlayer } from "~/components/brand/image-focus-player";
import { PelicanSettingsSheet } from "~/components/brand/pelican-settings-sheet";

const board = pelicanJson as ImageFocusData;

const PATH = "/road-signs/pelican";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: "Pelican chart: Kenya road signs trainer for the NTSA test",
      description:
        "Memorise Kenyan road signs on the Pelican chart. Name each sign before the answer shows, and the ones you miss come back sooner. Free, no signup.",
      path: PATH,
      ogImage: ogCardPath("pelican"),
      ogImageAlt: ogCardAlt("pelican"),
      extraKeywords: [
        "Kenya road signs game",
        "road signs quiz Kenya",
        "NTSA road signs practice",
        ...ROAD_SIGN_KEYWORDS,
      ],
    }),
    {
      "script:ld+json": breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Road signs", url: "/road-signs" },
        { name: "Pelican chart", url: PATH },
      ]),
    },
  ];
}

export default function PelicanSigns() {
  const assetStatus = usePelicanStore((s) => s.assetStatus);
  const start = usePelicanStore((s) => s.start);
  const exit = usePelicanStore((s) => s.exit);
  const categories = usePelicanStore((s) => s.settings.categories);
  const setSettingsOpen = usePelicanStore((s) => s.setSettingsOpen);

  // The trainer is client-side: stash the board and load the chart. Start waits
  // for the chart alone; the page below shows it as it arrives, and saved
  // progress stays off the first paint because `assetStatus` starts "idle".
  useEffect(() => {
    const store = usePelicanStore.getState();
    store.configure(board);
    store.preload();
  }, []);

  const ready = assetStatus === "ready";
  const { link, startRun } = useTrainerLink(board.regions, {
    ready,
    start,
    exit,
  });
  const practiceCount = getPracticeRegions(board, categories).length;

  return (
    <>
      <SiteNav />
      <main className="min-h-screen text-ink">
        <Rail />

        <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-6 sm:px-9 sm:pt-10">
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link
              to="/road-signs"
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-3 outline-none hover:text-ink focus-visible:text-ink"
            >
              <HugeiconsIcon
                icon={ArrowLeft02FreeIcons}
                size={14}
                strokeWidth={2.5}
              />
              All signs
            </Link>
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              Trainer № 01
            </span>
          </div>

          <header className="dr-rise border-b-2 border-ink pb-7">
            <SignCredit size="sm" />
            <h1 className="m-0 mt-3 font-display text-[clamp(40px,7vw,72px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
              Pelican <span className="italic text-rush">chart</span>
            </h1>
            <p className="mt-4 max-w-2xl font-serif text-[clamp(16px,2.2vw,22px)] leading-tight text-ink-2">
              We zoom into one sign on the chart. Name it before the answer
              shows, then mark whether you knew it. Misses come back sooner.
            </p>
          </header>

          {!ready ? (
            <div className="relative mt-6 aspect-video w-full overflow-hidden border-2 border-ink bg-white">
              {/* In the server's HTML, so the download starts straight away. */}
              <img
                src={board.imageSrc}
                alt=""
                width={1920}
                height={1080}
                className="block size-full object-contain opacity-30"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingPanel label="Loading the chart" size="lg" />
              </div>
            </div>
          ) : practiceCount === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-4 border-2 border-dashed border-ink bg-paper-3 px-6 py-12 text-center">
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                No signs match your category filter
              </span>
              <Button
                variant="ink"
                size="lg"
                onClick={() => setSettingsOpen(true)}
              >
                <HugeiconsIcon
                  icon={Configuration01FreeIcons}
                  size={16}
                  strokeWidth={2.5}
                />
                Open settings
              </Button>
            </div>
          ) : (
            <div className="dr-rise mt-6" style={stagger(1)}>
              <ImageFocusPlayer link={link} onStart={startRun} />
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-dashed border-ink pt-5">
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Same signs, in 3D
            </span>
            <Button variant="paper" size="sm" asChild>
              <Link to="/road-signs/3d">
                <HugeiconsIcon
                  icon={ThreeDViewFreeIcons}
                  size={14}
                  strokeWidth={2.5}
                />
                Spin signs in 3D
              </Link>
            </Button>
          </div>
        </div>

        <PelicanSettingsSheet />
      </main>
      <SiteFooter />
    </>
  );
}
