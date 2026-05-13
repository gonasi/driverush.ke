import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  ThreeDViewFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/road-signs-3d";

import { breadcrumbLd, pageMeta, ROAD_SIGN_KEYWORDS } from "~/lib/site";

import { Button } from "~/components/ui/button";
import { FeedbackBanner } from "~/components/brand/feedback-banner";
import { Rail } from "~/components/brand/rail";

const PATH = "/road-signs/3d";

export function meta(_: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: "Recognise Kenyan road signs in 3D from any angle",
      description:
        "Spin a Kenyan road sign in 3D and read it from any angle, the way you actually see them on the road, half-turned and half-lit. In the workshop; the classic road-sign quiz is live in the meantime.",
      path: PATH,
      extraKeywords: [
        "3D road signs",
        "recognise road signs Kenya",
        "Kenya road signs from angles",
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
            Trainer № 02 · placeholder
          </span>
        </div>

        <header className="border-b-2 border-ink pb-7">
          <span className="eyebrow text-ink">Road-sign recognition</span>
          <h1 className="m-0 mt-3 font-display text-[clamp(40px,7vw,72px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
            3D <span className="italic text-rush">signs</span>
          </h1>
          <p className="mt-5 max-w-2xl font-serif text-[clamp(17px,2.2vw,22px)] leading-tight text-ink-2">
            Spin a Kenyan road sign in 3D and read it from any angle, the way
            you actually see them on Nairobi roads, half-turned and half-lit.
          </p>
        </header>

        <div className="mt-7">
          <FeedbackBanner
            tone="info"
            icon={ThreeDViewFreeIcons}
            title="In the workshop"
            description="The 3D trainer isn't playable yet; we're building it. Until then, the classic road-sign quiz is live."
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

        {/* Minimalist mock of the game board — placeholder until the real thing. */}
        <div className="mt-10 grid gap-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
            [ Game board · placeholder ]
          </div>
          <div className="flex aspect-video flex-col items-center justify-center gap-3 border-2 border-dashed border-ink bg-paper-3 text-center">
            <span className="flex size-16 rotate-[-12deg] items-center justify-center border-2 border-ink bg-surface font-display text-3xl font-extrabold text-ink-3">
              ?
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
              3D trainer · coming soon
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
