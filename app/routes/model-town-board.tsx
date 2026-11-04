/**
 * `/model-town-board`: an honest "coming soon". Learners search for this by
 * name, so it gets a real URL that says it isn't ready and gives them something
 * useful to do today. Page views measure the demand.
 */
import type { Route } from "./+types/model-town-board";

import { pageMeta } from "~/lib/site";

import { Badge } from "~/components/ui/badge";
import { Rail } from "~/components/brand/rail";
import { SiteFooter } from "~/components/brand/site-footer";
import { SiteNav } from "~/components/brand/site-nav";
import { TrainerCards } from "~/components/home/trainer-cards";

export function meta(_: Route.MetaArgs) {
  return pageMeta({
    title: "Model Town Board practice: coming soon",
    description:
      "DriveRush is building a Model Town Board trainer. It isn't ready yet. Until then, memorise your road signs on the Pelican chart or in 3D. Free, no signup.",
    path: "/model-town-board",
    extraKeywords: ["Model Town Board Kenya", "model town board practice"],
  });
}

export default function ModelTownBoard() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen text-ink">
        <Rail />
        <div className="mx-auto w-full max-w-5xl px-5 pb-16 pt-6 sm:px-9 sm:pt-12">
          <header className="grid justify-items-start gap-3 sm:gap-4">
            <Badge variant="amber">Coming soon</Badge>
            <h1 className="m-0 font-display text-[clamp(36px,7vw,76px)] font-extrabold uppercase leading-[0.92] tracking-tighter">
              Model Town Board.{" "}
              <span className="italic text-rush">Not ready yet.</span>
            </h1>
            <p className="m-0 max-w-2xl font-serif text-[clamp(17px,2.2vw,22px)] leading-snug text-ink-2">
              We're building it now. Get your signs solid first: that's what you
              can practise here today.
            </p>
          </header>
          <div className="mt-7">
            <TrainerCards />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
