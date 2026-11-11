/**
 * Homepage hero: the Model Town Board, ready to drive. Most learners come for
 * the board, so it is the first screen, and one tap on it starts a round right
 * here on the home page. `#try-now` is what the nav's Start button scrolls to.
 */
import { stagger } from "~/lib/motion";

import { BoardPlayer } from "~/components/board/board-player";

export function HomeHero() {
  return (
    <section
      id="try-now"
      className="mx-auto w-full max-w-4xl scroll-mt-20 px-5 pb-10 pt-5 sm:px-9"
    >
      <header className="grid gap-3">
        <p className="dr-rise m-0 font-mono text-[10.5px] font-bold uppercase tracking-widest text-ink-3">
          For your NTSA test · Free, no signup
        </p>
        <h1
          style={stagger(1)}
          className="dr-rise m-0 font-display text-[clamp(26px,7.6vw,60px)] font-extrabold uppercase leading-[0.92] tracking-tighter text-ink"
        >
          Model Town Board.{" "}
          <span className="block italic text-rush">Drive it.</span>
        </h1>
        <p
          style={stagger(2)}
          className="dr-rise m-0 max-w-2xl font-serif text-[clamp(16px,2.2vw,20px)] leading-snug text-ink-2"
        >
          Pick your lane, take the roundabout, and stop where the examiner asks.
          Break a rule and you're told which one.
        </p>
      </header>

      <div style={stagger(3)} className="dr-rise mt-4">
        {/* Shallow on a wide screen, so Start driving stays above the fold. */}
        <BoardPlayer posterClassName="aspect-[4/3] sm:aspect-[5/2] lg:aspect-[3/1]" />
      </div>
    </section>
  );
}
