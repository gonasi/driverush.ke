import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02FreeIcons,
  ArrowRight02FreeIcons,
  TrafficLightFreeIcons,
} from "@hugeicons/core-free-icons";

import type { Route } from "./+types/road-signs";

import { absUrl, SITE } from "~/lib/site";
import { SIGN_GAMES } from "~/lib/road-signs";

import { Button } from "~/components/ui/button";
import { Rail } from "~/components/brand/rail";
import { SignGameCard } from "~/components/brand/sign-game-card";

export function meta(_: Route.MetaArgs) {
  const title = "Road signs · DriveRush";
  const description =
    "Memorise the Kenyan road signs the way memory works — two quick mini-games (Pelican recall, 3D recognition) plus the classic sign quiz. No signup.";
  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: SITE.keywords.join(", ") },
    { tagName: "link", rel: "canonical", href: absUrl("/road-signs") },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: absUrl("/road-signs") },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
}

export default function RoadSigns() {
  return (
    <main className="min-h-screen text-ink">
      <Rail />

      <div className="mx-auto w-full max-w-4xl px-5 pb-20 pt-6 sm:px-9 sm:pt-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-3 outline-none hover:text-ink focus-visible:text-ink"
          >
            <HugeiconsIcon
              icon={ArrowLeft02FreeIcons}
              size={14}
              strokeWidth={2.5}
            />
            Back
          </Link>
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Road signs · {SIGN_GAMES.length} trainers
          </span>
        </div>

        <header className="border-b-2 border-ink pb-7">
          <span className="eyebrow flex items-center gap-2 text-ink">
            <HugeiconsIcon
              icon={TrafficLightFreeIcons}
              size={14}
              strokeWidth={2.5}
              className="text-rush"
            />
            DriveRush road signs
          </span>
          <h1 className="m-0 mt-3 font-display text-[clamp(40px,7vw,80px)] font-extrabold uppercase leading-[0.9] tracking-tighter">
            Learn the signs. <span className="italic text-rush">For good.</span>
          </h1>
          <p className="mt-5 max-w-2xl font-serif text-[clamp(17px,2.2vw,24px)] leading-tight text-ink-2">
            Two quick mini-games built around how memory sticks — fast recall,
            then recognition from any angle. Five minutes a day and the signs
            stop being a guess.
          </p>
        </header>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {SIGN_GAMES.map((g) => (
            <SignGameCard key={g.slug} game={g} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-dashed border-ink pt-5">
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Prefer the classic?
          </span>
          <Button variant="paper" size="sm" asChild>
            <Link to="/practice?mode=signs">
              Road-sign quiz
              <HugeiconsIcon
                icon={ArrowRight02FreeIcons}
                size={14}
                strokeWidth={2.5}
              />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
