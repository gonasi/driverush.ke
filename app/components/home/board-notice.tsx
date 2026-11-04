import { Link } from "react-router";

import { stagger } from "~/lib/motion";

import { Badge } from "~/components/ui/badge";

/**
 * The Model Town Board isn't ready. Say so plainly so nobody has to go looking
 * for it, and leave the signs as the thing to do today.
 */
export function BoardNotice() {
  return (
    <section
      aria-label="Model Town Board"
      className="dr-reveal mx-auto w-full max-w-4xl px-5 pb-12 sm:px-9"
    >
      <Link
        to="/model-town-board"
        style={stagger(6)}
        className="dr-rise grid gap-2 border-2 border-dashed border-ink bg-paper-3 p-5 outline-none transition-colors duration-200 hover:bg-surface focus-visible:bg-surface sm:p-7"
      >
        <span>
          <Badge variant="amber">Coming soon</Badge>
        </span>
        <span className="font-display text-[clamp(20px,3.2vw,30px)] font-extrabold uppercase leading-none tracking-tight text-ink">
          Model Town Board
        </span>
        <span className="text-[14.5px] leading-snug text-ink-2">
          We're building it now. Get your signs solid first.
        </span>
      </Link>
    </section>
  );
}
