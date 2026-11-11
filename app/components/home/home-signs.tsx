/**
 * Second on the home page, and the only other choice on it: the road signs,
 * as two short rows, each one tap from a first sign.
 */
import { SIGN_COUNT } from "~/lib/road-signs";

import { SignTrainerList } from "~/components/brand/sign-trainer-list";

export function HomeSigns() {
  return (
    <section
      id="road-signs"
      aria-labelledby="home-signs"
      className="mx-auto w-full max-w-4xl scroll-mt-20 px-5 pb-16 sm:px-9"
    >
      <h2
        id="home-signs"
        className="m-0 mb-1 font-display text-[clamp(18px,4.4vw,24px)] font-extrabold uppercase leading-none tracking-tight text-ink"
      >
        Learning the signs?
      </h2>
      <p className="m-0 mb-3 text-[14.5px] leading-snug text-ink-2">
        {SIGN_COUNT} Kenyan road signs, two ways to memorise them.
      </p>
      <SignTrainerList />
    </section>
  );
}
