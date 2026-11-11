import { useEffect } from "react";
import { Link } from "react-router";
import { Icon } from "~/components/brand/icon";
import {
  ArrowLeftIcon,
  PelicanIcon,
  SettingsIcon,
} from "~/components/brand/icons";

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
import { TrainerGuide } from "~/components/brand/trainer-guide";

const board = signs3dJson as Signs3DData;

const PATH = "/road-signs/3d";
const CODES_3D = new Set(board.signs.map((s) => s.code ?? ""));

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: "3D road signs: spin Kenyan signs in 3D",
      description:
        "Recognise Kenyan road signs in 3D from any angle. Name each one before the answer shows, and the ones you miss come back sooner. Free, no signup.",
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
  const { link, startRun } = useTrainerLink(board.signs, {
    ready,
    start,
    exit,
  });
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
              <Icon icon={ArrowLeftIcon} size={14} />
              All signs
            </Link>
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              Trainer № 02
            </span>
          </div>

          <header className="dr-rise border-b-2 border-ink pb-7">
            <SignCredit size="sm" />
            <h1 className="m-0 mt-3 font-display text-[clamp(40px,7vw,72px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
              3D road <span className="italic text-rush">signs</span>
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
                <Icon icon={SettingsIcon} size={16} />
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
                <Icon icon={PelicanIcon} size={14} />
                Pelican chart
              </Link>
            </Button>
          </div>

          <TrainerGuide
            name="3D signs"
            codes={CODES_3D}
            steps={[
              {
                title: "Choose your signs",
                body: `Drill all ${board.signs.length} signs, or open the settings and pick one class at a time. Keep them in order or shuffle them for each run.`,
              },
              {
                title: "One sign, on its post",
                body: "Each sign is modelled in 3D on its own post. The camera rests off to one side and looks up at it, the way you see a sign from the driver's seat.",
              },
              {
                title: "Spin it and name it",
                body: "Drag to turn the sign and read it from any angle. Name it before the answer shows, either after a short timer or when you tap.",
              },
              {
                title: "Mark whether you knew it",
                body: "Tap Knew it or Missed it. Missed signs come back later in the run, so you finish only when you've recalled each one.",
              },
              {
                title: "Build a separate known meter",
                body: "Spotting a sign on a post is a different skill from naming it on a chart, so the 3D trainer keeps its own progress. It's saved on this device, with no account needed.",
              },
            ]}
            why={{
              title: "Why practise the signs in 3D",
              body: [
                "On the road you rarely see a sign square on and close up. You see it at an angle, from a distance, against the sky or trees, sometimes half hidden behind a matatu. A flat picture in a book doesn't prepare you for that.",
                "Turning a sign trains you to read it in the order that works when you're driving: the shape first, then the colour, then the symbol. By the time you can make out the symbol, you should already know what kind of sign it is and be easing off if you need to.",
              ],
            }}
            tips={[
              "Spin each sign until it's nearly edge on. If you can still tell what it is from the outline and colour, you've learned it properly.",
              "Turn on auto-spin in the settings if you'd rather watch than drag.",
              "Use the chart to learn the names, then come here to check you can spot them in a more real setting.",
              "Mark yourself strictly. A sign you only got after a long look counts as missed.",
              "Open the page for any sign you keep missing. Each one explains the look-alikes that trip people up.",
            ]}
          />
        </div>

        <Sign3DSettingsSheet />
      </main>
      <SiteFooter />
    </>
  );
}
