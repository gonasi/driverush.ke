/**
 * Homepage hero: one thing to do. A picture of the board, and one button that
 * starts the board course or carries on with it, in the game on its own page.
 * `#try-now` is where older links to the home page's first step land.
 */
import { Link } from "react-router";

import { COURSE_LEVELS } from "~/lib/board/curriculum";
import { stagger } from "~/lib/motion";

import { CourseLabel } from "~/components/board/course-label";
import { useCourseStart } from "~/components/board/use-course-start";
import { BoardThumb } from "~/components/board/board-thumb";
import { Icon } from "~/components/brand/icon";
import { PlayIcon } from "~/components/brand/icons";
import { Button } from "~/components/ui/button";

export function HomeHero() {
  const { href, label, detail, done, ready } = useCourseStart();
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
          Learn the board and the lanes, then take the roundabout and stop where
          the examiner asks. Break a rule and you're told which one.{" "}
          <Link
            to="/model-town-board"
            className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
          >
            What the Model Town Board is, and every level
          </Link>
          .
        </p>
      </header>

      <div style={stagger(3)} className="dr-rise mt-4 grid gap-4">
        <Link
          to={href}
          aria-label={`${label}: ${detail}`}
          className="group block overflow-hidden rounded-soft border border-ink/25 outline-none"
        >
          {/* Shallow on a wide screen, so the button stays above the fold. */}
          <BoardThumb
            priority
            className="aspect-[4/3] sm:aspect-[5/2] lg:aspect-[3/1]"
          />
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Button
            asChild
            variant="rush"
            size="lg"
            className="w-full sm:w-auto sm:min-w-64"
          >
            <Link to={href}>
              <Icon icon={PlayIcon} size={18} />
              <CourseLabel label={label} ready={ready} started={done > 0} />
            </Link>
          </Button>
          <p className="m-0 min-w-0 flex-1 text-[14px] leading-snug text-ink-2">
            <strong className="block text-ink">{detail}</strong>
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
              {done} of {COURSE_LEVELS.length} levels done
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
