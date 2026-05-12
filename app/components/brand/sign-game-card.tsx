import * as React from "react";
import { Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02FreeIcons } from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils";
import type { SignGame, SignGameAccent } from "~/lib/road-signs";
import { Button } from "~/components/ui/button";

const ACCENT: Record<
  SignGameAccent,
  { block: string; title: string; button: "amber" | "ink" }
> = {
  amber: { block: "bg-amber text-ink", title: "text-ink", button: "amber" },
  blue: {
    block: "bg-plate-blue text-white",
    title: "text-plate-blue",
    button: "ink",
  },
};

type SignGameCardProps = React.ComponentProps<"article"> & {
  game: SignGame;
  /** CTA label. Default "Play". */
  cta?: React.ReactNode;
};

/**
 * Card for a road-sign memorisation mini-game — stamped icon block, blurb, and
 * a "Play" CTA. Reused by the homepage "Road signs" section and the /road-signs
 * hub; pass an entry from {@link SIGN_GAMES}.
 */
function SignGameCard({
  className,
  game,
  cta = "Play",
  ...props
}: SignGameCardProps) {
  const a = ACCENT[game.accent];
  return (
    <article
      data-slot="sign-game-card"
      className={cn(
        "flex h-full flex-col gap-4 border-2 border-ink bg-surface p-6 shadow-stamp sm:p-7",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center border-2 border-ink",
            a.block,
          )}
        >
          <HugeiconsIcon icon={game.icon} size={24} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            {game.kicker}
          </span>
          <h3
            className={cn(
              "m-0 mt-1.5 font-display text-[clamp(22px,2.6vw,28px)] font-extrabold uppercase leading-[0.95] tracking-tight",
              a.title,
            )}
          >
            {game.title}
          </h3>
        </div>
      </div>
      <p className="m-0 text-[14.5px] leading-relaxed text-ink-2">
        {game.blurb}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-dashed border-ink pt-4">
        <Button variant={a.button} size="lg" asChild>
          <Link to={game.to}>
            {cta}
            <HugeiconsIcon
              icon={ArrowRight02FreeIcons}
              size={16}
              strokeWidth={2.5}
            />
          </Link>
        </Button>
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-3">
          {game.tag}
        </span>
      </div>
    </article>
  );
}

export { SignGameCard };
