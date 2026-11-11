/**
 * Second on the home page, and the only other choice on it: the road signs.
 * The Pelican credit, how many signs there are, and both trainers side by
 * side, each one tap from a first sign.
 */
import { SIGN_COUNT } from "~/lib/road-signs";

import { SignCredit } from "~/components/brand/sign-credit";

import { TrainerCards } from "./trainer-cards";

export function HomeSigns() {
  return (
    <section
      id="road-signs"
      aria-labelledby="home-signs"
      className="dr-reveal mx-auto w-full max-w-4xl scroll-mt-20 px-5 pb-12 sm:px-9"
    >
      <header className="grid gap-3 border-t-2 border-ink pt-6">
        <SignCredit />
        <h2
          id="home-signs"
          className="m-0 font-display text-[clamp(24px,6vw,44px)] font-extrabold uppercase leading-[0.94] tracking-tighter text-ink"
        >
          Learning the signs{" "}
          <span className="block italic text-rush">instead?</span>
        </h2>
        <p className="m-0 max-w-2xl font-serif text-[clamp(16px,2.2vw,19px)] leading-snug text-ink-2">
          {SIGN_COUNT} Kenyan road signs to memorise. Train on the Pelican chart
          or spin the signs in 3D. Free, no signup.
        </p>
      </header>

      <div className="mt-4">
        <TrainerCards firstStep={1} />
      </div>
    </section>
  );
}
