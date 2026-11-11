/**
 * The board course as a list: every unit, and every level in it, in the order
 * to take them. Each row opens the game on that level. All of it is in the
 * server's HTML. What is done, and which level is next, is filled in from this
 * browser's saved progress once the page is running.
 */
import { Link } from "react-router";

import { BOARD_PLAY_PATH, levelHref } from "~/lib/board-guides";
import {
  COURSE_LEVELS,
  KIND_LABEL,
  UNITS,
  doneCount,
  levelDone,
  nextLevel,
  type Level,
  type LevelKind,
} from "~/lib/board/curriculum";
import { useCourseProgress } from "~/lib/use-course-progress";
import { cn } from "~/lib/utils";

import { Icon } from "~/components/brand/icon";
import {
  CheckIcon,
  ChevronRightIcon,
  PlayIcon,
  StarIcon,
} from "~/components/brand/icons";
import { Badge, type BadgeProps } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";

const TOTAL = COURSE_LEVELS.length;

const KIND_BADGE: Record<LevelKind, BadgeProps["variant"]> = {
  slides: "cream",
  lanes: "cream",
  watch: "cyan",
  drive: "rush",
  mock: "rush",
};

function LevelRow({
  level,
  done,
  next,
  stars,
}: {
  level: Level;
  done: boolean;
  next: boolean;
  stars: number;
}) {
  return (
    <li>
      <Link
        to={level.kind === "mock" ? BOARD_PLAY_PATH : levelHref(level.id)}
        aria-current={next ? "step" : undefined}
        className={cn(
          "flex min-h-14 items-center gap-3 border-2 border-ink px-3 py-2.5 text-ink no-underline outline-none transition-colors",
          next
            ? "bg-amber text-amber-foreground shadow-stamp hover:brightness-105 focus-visible:brightness-105"
            : "bg-surface hover:bg-paper-2 focus-visible:bg-paper-2",
        )}
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center border-2 border-ink font-mono text-[13px] font-bold tabular-nums",
            done
              ? "bg-kenya-green text-kenya-green-foreground"
              : "bg-paper-2 text-ink",
          )}
        >
          {done ? (
            <>
              <Icon icon={CheckIcon} size={16} />
              <span className="sr-only">Level {level.n}, done</span>
            </>
          ) : (
            level.n
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-bold leading-snug">
            {level.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant={KIND_BADGE[level.kind]} className="border px-1.5">
              {KIND_LABEL[level.kind]}
            </Badge>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-70">
              {level.difficulty}
              {next && " · Next"}
            </span>
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
        <Icon icon={ChevronRightIcon} size={18} className="shrink-0" />
      </Link>
    </li>
  );
}

export function BoardLevels({ className }: { className?: string }) {
  const saved = useCourseProgress();
  const empty = { learned: [], bestStars: {} };
  const done = saved ? doneCount(saved) : 0;
  const next = nextLevel(saved ?? empty);

  return (
    <div className={cn("grid gap-8", className)}>
      <div className="grid gap-3 border-2 border-ink bg-surface p-4 shadow-stamp">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[10.5px] font-bold uppercase tracking-widest text-ink-3">
            <span>Levels done</span>
            <span className="tabular-nums">
              {done} of {TOTAL}
            </span>
          </div>
          <Progress
            value={(done / TOTAL) * 100}
            tone="green"
            showTicks={false}
            aria-label="Levels done"
            className="h-3"
          />
        </div>
        <Button asChild variant="rush" size="lg" className="h-auto min-h-12 w-full whitespace-normal py-2 text-center leading-snug">
          <Link
            to={next.kind === "mock" ? BOARD_PLAY_PATH : levelHref(next.id)}
          >
            <Icon icon={PlayIcon} size={18} />
            {next.kind === "mock"
              ? "All done. Take the mock test"
              : done > 0
                ? `Continue: level ${next.n}, ${next.title}`
                : `Start level 1: ${next.title}`}
          </Link>
        </Button>
        <p className="m-0 text-center text-[13px] leading-snug text-ink-2">
          Every level is open. Take them in order, or jump to the one you need.
        </p>
      </div>

      {UNITS.map((unit, i) => {
        const course = unit.levels.filter((l) => l.kind !== "mock");
        const unitDone = saved
          ? course.filter((l) => levelDone(l, saved)).length
          : 0;
        return (
          <section key={unit.id} aria-labelledby={`unit-${unit.id}`}>
            <div className="mb-3 flex items-end justify-between gap-3 border-b-2 border-ink pb-2">
              <div>
                <p className="m-0 font-mono text-[10.5px] font-bold uppercase tracking-widest text-ink-3">
                  Unit {i + 1}
                </p>
                <h2
                  id={`unit-${unit.id}`}
                  className="m-0 mt-0.5 font-display text-[clamp(20px,4.5vw,26px)] font-extrabold uppercase leading-none tracking-tight text-ink"
                >
                  {unit.title}
                </h2>
              </div>
              {course.length > 0 && (
                <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-ink-3">
                  {unitDone} / {course.length}
                </span>
              )}
            </div>
            <p className="m-0 mb-3 text-[14.5px] leading-snug text-ink-2">
              {unit.blurb}
            </p>
            <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
              {unit.levels.map((level) => (
                <LevelRow
                  key={level.id}
                  level={level}
                  done={saved ? levelDone(level, saved) : false}
                  next={saved != null && level.id === next.id}
                  stars={
                    saved && level.kind === "drive"
                      ? (saved.bestStars[level.challenge] ?? 0)
                      : 0
                  }
                />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
