/**
 * Homepage hero: one thing to do. A picture of the board, and Start driving,
 * which opens the game on its own page. `#try-now` is where older links to the
 * home page's first step land.
 */
import { Link } from "react-router";

import { BOARD_PLAY_PATH } from "~/lib/board-guides";
import { stagger } from "~/lib/motion";

import { BoardThumb } from "~/components/board/board-thumb";
import { Icon } from "~/components/brand/icon";
import { PlayIcon } from "~/components/brand/icons";
import { Button } from "~/components/ui/button";

export function HomeHero() {
  return (
    <section
      id="try-now"
      className="mx-auto w-full max-w-4xl scroll-mt-20 px-5 pb-12 pt-5 sm:px-9"
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

      <div style={stagger(3)} className="dr-rise mt-4 grid gap-4">
        <Link
          to={BOARD_PLAY_PATH}
          aria-label="Start driving the Model Town Board"
          className="group block border-2 border-ink shadow-stamp outline-none"
        >
          {/* Shallow on a wide screen, so Start driving stays above the fold. */}
          <BoardThumb
            priority
            className="aspect-[4/3] sm:aspect-[5/2] lg:aspect-[3/1]"
          />
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <Button
            asChild
            variant="rush"
            size="lg"
            className="w-full sm:w-auto sm:min-w-64"
          >
            <Link to={BOARD_PLAY_PATH}>
              <Icon icon={PlayIcon} size={18} />
              Start driving
            </Link>
          </Button>
          <Link
            to={`${BOARD_PLAY_PATH}?learn=1`}
            className="inline-flex min-h-11 items-center font-sans text-[14.5px] font-bold text-ink underline decoration-rush decoration-2 underline-offset-4 outline-none hover:text-rush focus-visible:text-rush"
          >
            Learn the board first
          </Link>
        </div>
      </div>
    </section>
  );
}
