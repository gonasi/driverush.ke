import { useEffect } from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  BirdFreeIcons,
  Configuration01FreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/road-signs-pelican";

import { absUrl, breadcrumbLd, keywords, ROAD_SIGN_KEYWORDS } from "~/lib/site";
import type { ImageFocusData } from "~/lib/image-focus";
import pelicanJson from "~/data/road-signs-pelican.json";
import { getPracticeRegions, usePelicanStore } from "~/lib/pelican-store";
import { useLoadingFloor } from "~/lib/loading";

import { Button } from "~/components/ui/button";
import { FeedbackBanner } from "~/components/brand/feedback-banner";
import { Rail } from "~/components/brand/rail";
import { LoadingPanel } from "~/components/brand/traffic-loader";
import { ImageFocusPlayer } from "~/components/brand/image-focus-player";
import { PelicanSettingsSheet } from "~/components/brand/pelican-settings-sheet";

const board = pelicanJson as ImageFocusData;

const PATH = "/road-signs/pelican";

export function meta(_: Route.MetaArgs) {
  const title = "Pelican signs: Kenya road-sign recall game · DriveRush";
  const description =
    "A fast Kenyan road-sign recall game. One sign zooms in at a time, name it before the timer drops, and the ones you miss come back sooner. Free, no signup, solid prep for the NTSA road-sign test.";
  const url = absUrl(PATH);
  return [
    { title },
    { name: "description", content: description },
    {
      name: "keywords",
      content: keywords(
        "Kenya road signs game",
        "road signs quiz Kenya",
        ...ROAD_SIGN_KEYWORDS,
      ),
    },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    {
      "script:ld+json": breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Road signs", url: "/road-signs" },
        { name: "Pelican signs", url: PATH },
      ]),
    },
  ];
}

export default function PelicanSigns() {
  const assetStatus = usePelicanStore((s) => s.assetStatus);
  const categories = usePelicanStore((s) => s.settings.categories);
  const setSettingsOpen = usePelicanStore((s) => s.setSettingsOpen);

  // The trainer is entirely client-side: stash the board, then preload the
  // chart image + gameplay SFX (the page below gates on `assetStatus`).
  useEffect(() => {
    const store = usePelicanStore.getState();
    store.configure(board);
    store.preload(board.imageSrc);
  }, []);

  const hasBoard = board.regions.length > 0;
  // Hold the loader for a beat even when the chart is already cached — a
  // sub-second flash on/off reads as a glitch, not a load.
  const showLoader = useLoadingFloor(hasBoard && assetStatus !== "ready");
  const practiceCount = getPracticeRegions(board, categories).length;

  return (
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
            Road signs
          </Link>
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Trainer № 01 · Recall
          </span>
        </div>

        <header className="border-b-2 border-ink pb-7">
          <span className="eyebrow text-ink">Road-sign recall</span>
          <h1 className="m-0 mt-3 font-display text-[clamp(40px,7vw,72px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
            Pelican <span className="italic text-rush">signs</span>
          </h1>
          <p className="mt-5 max-w-2xl font-serif text-[clamp(17px,2.2vw,22px)] leading-tight text-ink-2">
            One Kenyan road sign at a time. The board zooms in, the rest blurs
            out. Name it before the timer drops, then mark whether you knew it.
            Misses come back sooner; the ones you've got drift away.
          </p>
        </header>

        {!hasBoard ? (
          <>
            <div className="mt-7">
              <FeedbackBanner
                tone="info"
                icon={BirdFreeIcons}
                title="In the workshop"
                description="The Pelican trainer isn't loaded yet; no signs have been mapped. Until then, the classic road-sign quiz is live."
                action={
                  <Button variant="ink" size="lg" asChild>
                    <Link to="/practice?mode=signs">
                      Road-sign quiz
                      <HugeiconsIcon
                        icon={ArrowRight02FreeIcons}
                        size={16}
                        strokeWidth={2.5}
                      />
                    </Link>
                  </Button>
                }
              />
            </div>
            <div className="mt-10 grid gap-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                [ Game board · placeholder ]
              </div>
              <div className="flex aspect-video flex-col items-center justify-center gap-3 border-2 border-dashed border-ink bg-paper-3 text-center">
                <span className="flex size-16 items-center justify-center border-2 border-ink bg-surface font-display text-3xl font-extrabold text-ink-3">
                  ?
                </span>
                <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                  Map signs in /tools/image-coords to light this up
                </span>
              </div>
            </div>
          </>
        ) : showLoader ? (
          <div className="mt-10 grid gap-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
              [ Game board · loading ]
            </div>
            <div className="flex aspect-video items-center justify-center border-2 border-ink bg-paper-3">
              <LoadingPanel label="Loading the chart" size="lg" />
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
              {categories.length > 0 ? ` of ${board.regions.length}` : ""} ·
              authored with the image-coordinates tool
            </p>
          </div>
        )}
      </div>

      {hasBoard && <PelicanSettingsSheet />}
    </main>
  );
}
