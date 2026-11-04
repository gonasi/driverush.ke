import { useEffect } from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  Configuration01FreeIcons,
  ThreeDViewFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/road-signs-pelican";

import { breadcrumbLd, pageMeta, ROAD_SIGN_KEYWORDS } from "~/lib/site";
import { ogCardAlt, ogCardPath } from "~/lib/og-cards";
import type { ImageFocusData } from "~/lib/image-focus";
import pelicanJson from "~/data/road-signs-pelican.json";
import { getPracticeRegions, usePelicanStore } from "~/lib/pelican-store";
import { useLoadingFloor } from "~/lib/loading";

import { Button } from "~/components/ui/button";
import { PelicanPartner } from "~/components/brand/pelican-partner";
import { Rail } from "~/components/brand/rail";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";
import { LoadingPanel } from "~/components/brand/traffic-loader";
import { ImageFocusPlayer } from "~/components/brand/image-focus-player";
import { PelicanIntroDialog } from "~/components/brand/pelican-intro-dialog";
import { PelicanSettingsSheet } from "~/components/brand/pelican-settings-sheet";

const board = pelicanJson as ImageFocusData;

const PATH = "/road-signs/pelican";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: "Pelican chart: Kenya road signs trainer for the NTSA test",
      description:
        "Memorise Kenyan road signs on the real Pelican chart. One sign zooms in at a time, name it before the answer shows, and the ones you miss come back sooner. Free, no signup.",
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
  const assetProgress = usePelicanStore((s) => s.assetProgress);
  const categories = usePelicanStore((s) => s.settings.categories);
  const setSettingsOpen = usePelicanStore((s) => s.setSettingsOpen);

  // The trainer is entirely client-side: stash the board, then preload
  // everything it needs — the chart image, the gameplay SFX, and every
  // per-sign voice clip — so playback is smooth from the first sign. The page
  // below gates Start on `assetStatus` (and shows progress meanwhile).
  useEffect(() => {
    const store = usePelicanStore.getState();
    store.configure(board);
    store.preload();
  }, []);

  const hasBoard = board.regions.length > 0;
  // Hold the loader for a beat even when assets are already cached — a
  // sub-second flash on/off reads as a glitch, not a load.
  const showLoader = useLoadingFloor(hasBoard && assetStatus !== "ready");
  const loadPct =
    assetProgress > 0 && assetProgress < 1
      ? Math.round(assetProgress * 100)
      : null;
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

          <header className="border-b-2 border-ink pb-7">
            <PelicanPartner size="sm" />
            <h1 className="m-0 mt-3 font-display text-[clamp(40px,7vw,72px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
              Pelican <span className="italic text-rush">chart</span>
            </h1>
            <p className="mt-4 max-w-2xl font-serif text-[clamp(16px,2.2vw,22px)] leading-tight text-ink-2">
              We zoom into one sign on the chart. Name it before the answer
              shows, then mark whether you knew it. Misses come back sooner.
            </p>
          </header>

          {!hasBoard ? null : showLoader ? (
            <div className="mt-10 grid gap-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                [ Game board · loading ]
              </div>
              <div className="flex min-h-72 w-full items-center justify-center border-2 border-ink bg-paper-3 sm:aspect-video sm:min-h-0">
                <LoadingPanel
                  label={`Loading the trainer${loadPct != null ? ` · ${loadPct}%` : ""}`}
                  size="lg"
                />
              </div>
            </div>
          ) : practiceCount === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-4 border-2 border-dashed border-ink bg-paper-3 px-6 py-12 text-center">
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
            <div className="mt-8">
              <ImageFocusPlayer />
              <p className="mt-3 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                {practiceCount} sign{practiceCount === 1 ? "" : "s"}
                {categories.length > 0 ? ` of ${board.regions.length}` : ""}
              </p>
            </div>
          )}

          {hasBoard && (
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
          )}
        </div>

        {hasBoard && (
          <>
            <PelicanIntroDialog />
            <PelicanSettingsSheet />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
