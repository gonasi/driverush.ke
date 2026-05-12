import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  BirdFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/road-signs-pelican";

import { absUrl } from "~/lib/site";

import { Button } from "~/components/ui/button";
import { FeedbackBanner } from "~/components/brand/feedback-banner";
import { Rail } from "~/components/brand/rail";

export function meta(_: Route.MetaArgs) {
  const title = "Pelican signs · DriveRush";
  const description =
    "Pelican signs — a fast road-sign recall mini-game. In the workshop; the classic sign quiz is live in the meantime.";
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: absUrl("/road-signs/pelican") },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
}

export default function PelicanSigns() {
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
            Trainer № 01 · placeholder
          </span>
        </div>

        <header className="border-b-2 border-ink pb-7">
          <span className="eyebrow text-ink">Road-sign recall</span>
          <h1 className="m-0 mt-3 font-display text-[clamp(40px,7vw,72px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
            Pelican <span className="italic text-rush">signs</span>
          </h1>
          <p className="mt-5 max-w-2xl font-serif text-[clamp(17px,2.2vw,22px)] leading-tight text-ink-2">
            Signs glide past on cards — name each one before it lands. Misses
            come back sooner; the ones you know drift further apart.
          </p>
        </header>

        <div className="mt-7">
          <FeedbackBanner
            tone="info"
            icon={BirdFreeIcons}
            title="In the workshop"
            description="The Pelican trainer isn't playable yet — we're building it. Until then, the classic road-sign quiz is live."
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
            <span className="flex size-16 items-center justify-center border-2 border-ink bg-surface font-display text-3xl font-extrabold text-ink-3">
              ?
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
              Pelican trainer · coming soon
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
