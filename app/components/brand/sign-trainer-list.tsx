/**
 * The two sign trainers as a short list: name, where the learner has got to,
 * and one way in each. Home shows them as plain rows under the board. The
 * Signs page gives each a Start button, the first of them the main one.
 */
import { Link } from "react-router";

import { signCounts } from "~/lib/pelican-progress";
import { usePracticeStreak } from "~/lib/practice-streak";
import { SIGN_GAMES } from "~/lib/road-signs";
import { SIGN_BRAND } from "~/lib/sign-credits";
import { ROUND_SIZE, trainerHref } from "~/lib/trainer-rounds";
import { useSignProgress } from "~/lib/use-sign-progress";
import { cn } from "~/lib/utils";

import { Icon } from "~/components/brand/icon";
import { ChevronRightIcon } from "~/components/brand/icons";
import { Button } from "~/components/ui/button";

export function SignTrainerList({
  buttons = false,
  className,
}: {
  /** Give each trainer its own Start button. Without it the row is the link. */
  buttons?: boolean;
  className?: string;
}) {
  const progress = useSignProgress();
  const streak = usePracticeStreak();
  return (
    <div className={className}>
      <ul className="m-0 grid list-none border border-ink/25 bg-surface p-0">
        {SIGN_GAMES.map((game, index) => {
          const saved = progress?.[game.slug] ?? {};
          const counts = signCounts(saved, Object.keys(saved));
          const started = counts.known + counts.learning > 0;
          const href = trainerHref(game.to, { go: true });
          const start = started ? "Continue" : `Start ${ROUND_SIZE} signs`;
          const body = (
            <>
              {/* Both marks sit in the same slot, so the titles line up. */}
              {game.slug === "pelican" ? (
                <span className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-soft border border-ink/25 bg-white">
                  <img
                    src={SIGN_BRAND.logo}
                    alt={SIGN_BRAND.name}
                    width={SIGN_BRAND.logoWidth}
                    height={SIGN_BRAND.logoHeight}
                    className="block h-full w-auto"
                  />
                </span>
              ) : (
                <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-soft border border-ink/25 bg-paper-2 text-ink">
                  <Icon icon={game.icon} size={22} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[15px] font-extrabold uppercase leading-tight tracking-tight">
                  {game.title}
                </span>
                <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-2">
                  {started
                    ? `${counts.known} known · ${counts.learning} learning${counts.due > 0 ? ` · ${counts.due} due` : ""}`
                    : game.blurb}
                </span>
              </span>
            </>
          );
          return (
            <li
              key={game.slug}
              className="border-t border-ink/15 first:border-t-0"
            >
              {buttons ? (
                <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 text-ink">
                  {body}
                  <Button
                    asChild
                    variant={index === 0 ? "rush" : "paper"}
                    className="w-full sm:w-auto sm:min-w-40"
                  >
                    <Link to={href} aria-label={`${game.title}: ${start}`}>
                      {start}
                    </Link>
                  </Button>
                </div>
              ) : (
                <Link
                  to={href}
                  aria-label={`${game.title}: ${start}`}
                  className={cn(
                    "flex min-h-16 items-center gap-3 px-4 py-3 text-ink no-underline outline-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2",
                  )}
                >
                  {body}
                  <Icon
                    icon={ChevronRightIcon}
                    size={18}
                    className="shrink-0 text-ink-3"
                  />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {/* Only for returning learners, so a first visit stays all action. */}
      {streak && streak.days > 0 && (
        <p className="m-0 mt-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-ink-2">
          {streak.days} day{streak.days === 1 ? "" : "s"} in a row
          {!streak.practisedToday && (
            <span className="font-normal text-ink-3">
              {" "}
              · practise today to keep it
            </span>
          )}
        </p>
      )}
    </div>
  );
}
