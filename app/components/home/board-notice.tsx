import { Link } from "react-router";

import { fullBoardSvg } from "~/lib/board/full-board";
import { stagger } from "~/lib/motion";

import { Badge } from "~/components/ui/badge";

/** A still of the board. The game itself only loads on the trainer's own page. */
const POSTER = fullBoardSvg({ seen: "east", cover: true });

/**
 * The Model Town Board trainer, one tap from home. `?go=1` starts a round as
 * soon as the page opens.
 */
export function BoardNotice() {
  return (
    <section
      aria-label="Model Town Board"
      className="dr-reveal mx-auto w-full max-w-4xl px-5 pb-12 sm:px-9"
    >
      <Link
        to="/model-town-board?go=1"
        style={stagger(6)}
        className="dr-rise grid border-2 border-ink bg-surface shadow-stamp outline-none transition-colors duration-200 hover:bg-paper-3 focus-visible:bg-paper-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,300px)]"
      >
        <span className="grid content-center gap-2 p-5 sm:p-7">
          <span>
            <Badge variant="green">New</Badge>
          </span>
          <span className="font-display text-[clamp(20px,3.2vw,30px)] font-extrabold uppercase leading-none tracking-tight text-ink">
            Model Town Board
          </span>
          <span className="text-[14.5px] leading-snug text-ink-2">
            Drive the roundabout. Pick your lane, take your exit, and learn the
            rule when the examiner stops you. Free, no signup.
          </span>
        </span>
        <span
          role="img"
          aria-label="The Model Town Board from above: numbered lanes meeting at a roundabout, with the parking zone and the two-way road beside it"
          className="order-first block aspect-[5/2] overflow-hidden border-b-2 border-ink sm:order-none sm:aspect-auto sm:border-b-0 sm:border-l-2 [&>svg]:block [&>svg]:size-full"
          dangerouslySetInnerHTML={{ __html: POSTER }}
        />
      </Link>
    </section>
  );
}
