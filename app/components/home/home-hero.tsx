/**
 * Homepage hero. The Pelican credit, what the site does in one line, and both
 * trainers, all above the fold on a phone. `#try-now` is what the nav's Start
 * button scrolls to.
 */
import { stagger } from "~/lib/motion";
import { SIGN_COUNT } from "~/lib/road-signs";

import { SignCredit } from "~/components/brand/sign-credit";

import { TrainerCards } from "./trainer-cards";

export function HomeHero() {
  return (
    <section
      id="try-now"
      className="mx-auto w-full max-w-4xl scroll-mt-20 px-5 pb-10 pt-5 sm:px-9"
    >
      <header className="grid gap-3">
        <SignCredit className="dr-rise" />
        <h1
          style={stagger(1)}
          className="dr-rise m-0 font-display text-[clamp(26px,7.6vw,60px)] font-extrabold uppercase leading-[0.92] tracking-tighter text-ink"
        >
          {SIGN_COUNT} road signs.{" "}
          <span className="block italic text-rush">Memorise them all.</span>
        </h1>
        <p
          style={stagger(2)}
          className="dr-rise m-0 max-w-2xl font-serif text-[clamp(16px,2.2vw,20px)] leading-snug text-ink-2"
        >
          Train on the Pelican chart or spin the signs in 3D. Free, no
          signup.
        </p>
      </header>

      <div className="mt-4">
        <TrainerCards firstStep={3} />
      </div>
    </section>
  );
}
