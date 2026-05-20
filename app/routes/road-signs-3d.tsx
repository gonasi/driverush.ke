import { useEffect } from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  BirdFreeIcons,
  Configuration01FreeIcons,
  ThreeDViewFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/road-signs-3d";

import { breadcrumbLd, pageMeta, ROAD_SIGN_KEYWORDS } from "~/lib/site";
import type { Signs3DData } from "~/lib/signs-3d";
import signs3dJson from "~/data/road-signs-3d.json";
import { getPracticeSigns, useSigns3DStore } from "~/lib/signs-3d-store";
import { useLoadingFloor } from "~/lib/loading";

import { Button } from "~/components/ui/button";
import { FeedbackBanner } from "~/components/brand/feedback-banner";
import { Rail } from "~/components/brand/rail";
import { LoadingPanel } from "~/components/brand/traffic-loader";
import { Sign3DPlayer } from "~/components/brand/sign-3d-player";
import { Sign3DIntroDialog } from "~/components/brand/sign-3d-intro-dialog";
import { Sign3DSettingsSheet } from "~/components/brand/sign-3d-settings-sheet";

const board = signs3dJson as Signs3DData;

const PATH = "/road-signs/3d";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: "Kenya road signs in 3D — spin, read, recall for the NTSA test",
      description:
        "Recognise Kenyan road signs in 3D from any angle, the way you actually see them on the road — half-turned and half-lit. One sign at a time, name it before the timer drops, the ones you miss come back sooner. Free, no signup.",
      path: PATH,
      extraKeywords: [
        "3D road signs",
        "recognise road signs Kenya",
        "Kenya road signs from angles",
        "NTSA road signs practice",
        ...ROAD_SIGN_KEYWORDS,
      ],
    }),
    {
      "script:ld+json": breadcrumbLd([
        { name: "Home", url: "/" },
        { name: "Road signs", url: "/road-signs" },
        { name: "3D signs", url: PATH },
      ]),
    },
  ];
}

export default function ThreeDSigns() {
  const assetStatus = useSigns3DStore((s) => s.assetStatus);
  const assetProgress = useSigns3DStore((s) => s.assetProgress);
  const categories = useSigns3DStore((s) => s.settings.categories);
  const setSettingsOpen = useSigns3DStore((s) => s.setSettingsOpen);

  // The trainer is entirely client-side: stash the board, then preload the GLB
  // models, the gameplay SFX, and every per-sign voice clip so playback is
  // smooth from the first sign. The page below gates Start on `assetStatus`.
  useEffect(() => {
    const store = useSigns3DStore.getState();
    store.configure(board);
    store.preload();
  }, []);

  const hasBoard = board.signs.length > 0;
  const showLoader = useLoadingFloor(hasBoard && assetStatus !== "ready");
  const loadPct =
    assetProgress > 0 && assetProgress < 1
      ? Math.round(assetProgress * 100)
      : null;
  const practiceCount = getPracticeSigns(board, categories).length;

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
            Trainer № 02 · Recognition
          </span>
        </div>

        <header className="border-b-2 border-ink pb-7">
          <span className="eyebrow text-ink">Road-sign recognition</span>
          <h1 className="m-0 mt-3 font-display text-[clamp(40px,7vw,72px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
            3D <span className="italic text-rush">signs</span>
          </h1>
          <p className="mt-5 max-w-2xl font-serif text-[clamp(17px,2.2vw,22px)] leading-tight text-ink-2">
            One Kenyan road sign at a time, modelled in 3D on its post. Spin it
            and read it from any angle, the way you actually see them on Nairobi
            roads, then name it before the timer drops.
          </p>
        </header>

        {!hasBoard ? (
          <div className="mt-7">
            <FeedbackBanner
              tone="info"
              icon={ThreeDViewFreeIcons}
              title="In the workshop"
              description="No 3D signs have been mapped yet. Map them in /tools/sign-3d to light this up."
            />
          </div>
        ) : showLoader ? (
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
            <Sign3DPlayer />
            <p className="mt-3 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              {practiceCount} sign{practiceCount === 1 ? "" : "s"}
              {categories.length > 0 ? ` of ${board.signs.length}` : ""} · drag
              to spin · same audio as the recall trainer
            </p>
          </div>
        )}

        {hasBoard && (
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-dashed border-ink pt-5">
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Prefer the flat recall game?
            </span>
            <Button variant="paper" size="sm" asChild>
              <Link to="/road-signs/pelican">
                <HugeiconsIcon
                  icon={BirdFreeIcons}
                  size={14}
                  strokeWidth={2.5}
                />
                Play the Pelican trainer
              </Link>
            </Button>
          </div>
        )}
      </div>

      {hasBoard && (
        <>
          <Sign3DIntroDialog />
          <Sign3DSettingsSheet />
        </>
      )}
    </main>
  );
}
