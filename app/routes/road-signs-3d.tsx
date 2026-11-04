import { useEffect } from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  BirdFreeIcons,
  Configuration01FreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/road-signs-3d";

import { stagger } from "~/lib/motion";
import { breadcrumbLd, pageMeta, ROAD_SIGN_KEYWORDS } from "~/lib/site";
import { ogCardAlt, ogCardPath } from "~/lib/og-cards";
import type { Signs3DData } from "~/lib/signs-3d";
import signs3dJson from "~/data/road-signs-3d.json";
import { getPracticeSigns, useSigns3DStore } from "~/lib/signs-3d-store";
import { useTrainerLink } from "~/lib/use-trainer-link";

import { Button } from "~/components/ui/button";
import { SignCredit } from "~/components/brand/sign-credit";
import { Rail } from "~/components/brand/rail";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";
import { LoadingPanel } from "~/components/brand/traffic-loader";
import { Sign3DPlayer } from "~/components/brand/sign-3d-player";
import { Sign3DSettingsSheet } from "~/components/brand/sign-3d-settings-sheet";

const board = signs3dJson as Signs3DData;

const PATH = "/road-signs/3d";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: "3D road signs: spin Kenyan signs and memorise them for the NTSA test",
      description:
        "Recognise Kenyan road signs in 3D from any angle, like on the road. One sign at a time, name it before the answer shows, and the ones you miss come back sooner. Free, no signup.",
      path: PATH,
      ogImage: ogCardPath("signs3d"),
      ogImageAlt: ogCardAlt("signs3d"),
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
  const start = useSigns3DStore((s) => s.start);
  const exit = useSigns3DStore((s) => s.exit);
  const categories = useSigns3DStore((s) => s.settings.categories);
  const setSettingsOpen = useSigns3DStore((s) => s.setSettingsOpen);

  // The trainer is client-side. Nothing blocks Start, but saved progress stays
  // off the first paint because `assetStatus` starts "idle".
  useEffect(() => {
    const store = useSigns3DStore.getState();
    store.configure(board);
    store.preload();
  }, []);

  const ready = assetStatus === "ready";
  const { link, startRun } = useTrainerLink(board.signs, { ready, start, exit });
  const practiceCount = getPracticeSigns(board, categories).length;

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
              Trainer № 02
            </span>
          </div>

          <header className="dr-rise border-b-2 border-ink pb-7">
            <SignCredit size="sm" />
            <h1 className="m-0 mt-3 font-display text-[clamp(40px,7vw,72px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
              3D <span className="italic text-rush">signs</span>
            </h1>
            <p className="mt-4 max-w-2xl font-serif text-[clamp(16px,2.2vw,22px)] leading-tight text-ink-2">
              One sign at a time, modelled on its post. Spin it and read it from
              any angle, like on the road, then name it before the answer shows.
            </p>
          </header>

          {!ready ? (
            <div className="mt-6 flex aspect-video w-full items-center justify-center border-2 border-ink bg-ink">
              <LoadingPanel label="Loading" size="lg" onDark />
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
              <Sign3DPlayer link={link} onStart={startRun} />
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-dashed border-ink pt-5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                Same signs, on the chart
              </span>
              <Button variant="paper" size="sm" asChild>
                <Link to="/road-signs/pelican">
                  <HugeiconsIcon
                    icon={BirdFreeIcons}
                    size={14}
                    strokeWidth={2.5}
                  />
                  Pelican chart
                </Link>
              </Button>
          </div>
        </div>

        <Sign3DSettingsSheet />
      </main>
      <SiteFooter />
    </>
  );
}
