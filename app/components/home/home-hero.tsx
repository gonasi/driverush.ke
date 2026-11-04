/**
 * Homepage hero. The partnership, what the site does in one line, and both
 * trainers, all above the fold on a phone. `#try-now` is what the nav's Start
 * button scrolls to.
 */
import { SIGN_COUNT } from "~/lib/road-signs";

import { PelicanPartner } from "~/components/brand/pelican-partner";

import { TrainerCards } from "./trainer-cards";

export function HomeHero() {
  return (
    <section
      id="try-now"
      className="mx-auto w-full max-w-5xl scroll-mt-20 px-5 pb-10 pt-5 sm:px-9 sm:pt-10"
    >
      <header className="grid gap-3 sm:gap-4">
        <PelicanPartner />
        <h1 className="m-0 font-display text-[clamp(26px,7.6vw,72px)] font-extrabold uppercase leading-[0.92] tracking-tighter text-ink">
          {SIGN_COUNT} road signs.{" "}
          <span className="italic text-rush">Memorise them all.</span>
        </h1>
        <p className="m-0 max-w-2xl font-serif text-[clamp(16px,2.2vw,22px)] leading-snug text-ink-2">
          Train on the real Pelican chart or spin the signs in 3D. Free, no
          signup.
        </p>
      </header>

      <div className="mt-5 sm:mt-7">
        <TrainerCards />
      </div>
    </section>
  );
}
