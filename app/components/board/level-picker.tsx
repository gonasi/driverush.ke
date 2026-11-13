/**
 * Every level as a picture to pick from, unit by unit, with a strip on top to
 * jump to a unit. It is the levels page, and the same thing opens over the
 * game so a learner can move to any level without leaving it. Each picture is
 * the flat board zoomed to what the level uses (`routes/board-level-picture.ts`),
 * fetched only as it scrolls into view.
 *
 * All of it is in the server's HTML. What is done, and which level is next, is
 * filled in from this browser's saved progress once the page is running.
 */
import * as React from "react";
import { Link } from "react-router";

import {
  BOARD_PLAY_PATH,
  levelHref,
  levelPictureHref,
} from "~/lib/board-guides";
import {
  KIND_LABEL,
  MOCK_LEVEL_ID,
  UNITS,
  levelDone,
  nextLevel,
  type CourseProgress,
  type Level,
  type LevelKind,
} from "~/lib/board/curriculum";
import { useCourseProgress } from "~/lib/use-course-progress";
import { cn } from "~/lib/utils";

import { Icon } from "~/components/brand/icon";
import { CheckIcon, StarIcon } from "~/components/brand/icons";
import { Badge, type BadgeProps } from "~/components/ui/badge";

const KIND_BADGE: Record<LevelKind, BadgeProps["variant"]> = {
  warmup: "rush",
  slides: "cream",
  lanes: "cream",
  watch: "cyan",
  drive: "rush",
  mock: "rush",
};

/** The board's grass: what shows round the board, and before a picture arrives. */
const GRASS = "#177a2e";

/** What a picture shows, for a screen reader, by the kind of level. */
const PICTURE: Record<LevelKind, string> = {
  warmup: "The road you drive along",
  slides: "The part of the board this level teaches",
  lanes: "The cars waiting in each lane",
  watch: "The route this level shows",
  drive: "The route to drive, from the car to the green box",
  mock: "The whole board",
};

const EMPTY: CourseProgress = { learned: [], bestStars: {} };

function LevelCard({
  level,
  done,
  next,
  now,
  stars,
  replace,
  onPick,
}: {
  level: Level;
  done: boolean;
  next: boolean;
  /** The level the game is on, when the picker is open over it. */
  now: boolean;
  stars: number;
  replace?: boolean;
  onPick?: (level: Level) => void;
}) {
  const mock = level.kind === "mock";
  return (
    <li className={cn(mock && "col-span-full")}>
      <Link
        to={mock ? BOARD_PLAY_PATH : levelHref(level.id)}
        replace={replace}
        data-level={level.id}
        aria-current={now ? "true" : next ? "step" : undefined}
        onClick={() => onPick?.(level)}
        className={cn(
          "group flex h-full overflow-hidden rounded-soft border text-ink no-underline outline-none transition-colors",
          mock ? "flex-row items-stretch" : "flex-col",
          next
            ? "border-ink bg-amber text-amber-foreground"
            : "border-ink/25 bg-surface hover:bg-paper-2 focus-visible:bg-paper-2",
          now && "ring-2 ring-rush ring-offset-2 ring-offset-surface",
          "focus-visible:ring-2 focus-visible:ring-ink",
        )}
      >
        <span
          className={cn(
            "relative block shrink-0 overflow-hidden",
            mock ? "w-24 sm:w-32" : "aspect-square w-full",
          )}
          style={{ backgroundColor: GRASS }}
        >
          <img
            src={levelPictureHref(level.id)}
            alt={PICTURE[level.kind]}
            width={320}
            height={320}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.04] group-focus-visible:scale-[1.04] motion-reduce:transition-none"
          />
          {!mock && (
            <span
              className={cn(
                "absolute left-1.5 top-1.5 flex h-7 min-w-7 items-center justify-center rounded-soft px-1.5 font-mono text-[12.5px] font-bold tabular-nums",
                done
                  ? "bg-kenya-green text-kenya-green-foreground"
                  : "bg-[#101114]/85 text-white",
              )}
            >
              {done ? (
                <>
                  <Icon icon={CheckIcon} size={14} />
                  <span className="ml-1">{level.n}</span>
                  <span className="sr-only">, done</span>
                </>
              ) : (
                level.n
              )}
            </span>
          )}
          {(next || now) && (
            <span className="absolute right-1.5 top-1.5 rounded-soft bg-kenya-gold px-1.5 py-1 font-mono text-[10px] font-bold uppercase leading-none tracking-widest text-kenya-gold-foreground">
              {now ? "Now" : "Next"}
            </span>
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5">
          <span
            className={cn(
              "block font-bold leading-snug",
              mock
                ? "font-display text-[16px] font-extrabold uppercase tracking-tight"
                : "text-[13.5px]",
            )}
          >
            {mock ? "Mock test" : level.title}
          </span>
          {mock && (
            <span className="block text-[13px] leading-snug opacity-80">
              Five tasks picked for you, mixed from every unit. Take it any
              time.
            </span>
          )}
          <span className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <Badge variant={KIND_BADGE[level.kind]} className="border px-1.5">
              {KIND_LABEL[level.kind]}
            </Badge>
            {!mock && (
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-70">
                {level.difficulty}
              </span>
            )}
            {level.kind === "drive" && stars > 0 && (
              <span
                role="img"
                aria-label={`Best: ${stars} of 3 stars`}
                className="inline-flex gap-0.5"
              >
                {[1, 2, 3].map((n) => (
                  <Icon
                    key={n}
                    icon={StarIcon}
                    size={12}
                    className={n <= stars ? "text-kenya-gold" : "opacity-25"}
                  />
                ))}
              </span>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}

export function LevelPicker({
  current,
  replace,
  onPick,
  reveal = false,
  stripClassName,
  className,
}: {
  /** The level the game is on, when the picker is open over it. */
  current?: string;
  /** Picking a level takes the place of this page in the history. */
  replace?: boolean;
  onPick?: (level: Level) => void;
  /** Bring the level the learner is on into view when it opens. */
  reveal?: boolean;
  /** Where the unit strip sticks: under the site's bar, or at the top of a sheet. */
  stripClassName?: string;
  className?: string;
}) {
  const saved = useCourseProgress();
  const next = nextLevel(saved ?? EMPTY);
  const root = React.useRef<HTMLDivElement>(null);

  // Open on the level the learner is at, not on level 1 every time. Once, and
  // never over an address that already points at a unit.
  const target = current ?? (saved && next.n > 1 ? next.id : null);
  const revealed = React.useRef(false);
  React.useEffect(() => {
    if (!reveal || revealed.current || !target) return;
    if (!current && window.location.hash) return;
    revealed.current = true;
    root.current
      ?.querySelector(`[data-level="${CSS.escape(target)}"]`)
      ?.scrollIntoView({ block: "center" });
  }, [reveal, target, current]);

  const jump = (event: React.MouseEvent, id: string) => {
    // Moved by hand, so the game's own address is left alone.
    event.preventDefault();
    root.current
      ?.querySelector(`#unit-${CSS.escape(id)}`)
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <div ref={root} className={cn("grid gap-6", className)}>
      <nav
        aria-label="Units"
        className={cn(
          "sticky z-10 -mx-1 flex gap-1.5 overflow-x-auto bg-background/95 px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          stripClassName ?? "top-0",
        )}
      >
        {UNITS.map((unit, i) => {
          const count = saved
            ? unit.levels.filter((l) => levelDone(l, saved)).length
            : 0;
          const mock = unit.id === "mock";
          return (
            <a
              key={unit.id}
              href={`#unit-${unit.id}`}
              onClick={(event) => jump(event, unit.id)}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-soft border px-3 text-[13px] font-bold text-ink no-underline outline-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2",
                !mock && unit.id === next.unit
                  ? "border-ink bg-surface"
                  : "border-ink/25 bg-surface",
              )}
            >
              {!mock && (
                <span className="font-mono text-[11px] tabular-nums text-ink-3">
                  {i + 1}
                </span>
              )}
              <span className="whitespace-nowrap">{unit.title}</span>
              {!mock && saved && (
                <span
                  className={cn(
                    "font-mono text-[10.5px] tabular-nums",
                    count === unit.levels.length
                      ? "text-kenya-green"
                      : "text-ink-3",
                  )}
                >
                  {count}/{unit.levels.length}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {UNITS.map((unit, i) => {
        const mock = unit.id === "mock";
        return (
          <section
            key={unit.id}
            id={`unit-${unit.id}`}
            aria-labelledby={`unit-${unit.id}-title`}
            className="scroll-mt-32"
          >
            {!mock && (
              <header className="mb-3">
                <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-3">
                  Unit {i + 1} · {unit.levels.length} levels
                </p>
                <h2
                  id={`unit-${unit.id}-title`}
                  className="m-0 mt-0.5 font-display text-[20px] font-extrabold uppercase leading-tight tracking-tight text-ink"
                >
                  {unit.title}
                </h2>
                <p className="m-0 mt-1 text-[14px] leading-snug text-ink-2">
                  {unit.blurb}
                </p>
              </header>
            )}
            {mock && (
              <h2 id={`unit-${unit.id}-title`} className="sr-only">
                Mock test
              </h2>
            )}
            <ol className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 sm:grid-cols-3 lg:grid-cols-4">
              {unit.levels.map((level) => (
                <LevelCard
                  key={level.id}
                  level={level}
                  done={saved ? levelDone(level, saved) : false}
                  next={
                    saved != null &&
                    !current &&
                    level.id === next.id &&
                    level.id !== MOCK_LEVEL_ID
                  }
                  now={level.id === current}
                  stars={
                    saved && level.kind === "drive"
                      ? (saved.bestStars[level.challenge] ?? 0)
                      : 0
                  }
                  replace={replace}
                  onPick={onPick}
                />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
