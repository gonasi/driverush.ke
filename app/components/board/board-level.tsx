/**
 * A level of the course that is read or watched, not driven: cards that point
 * the camera at a part of the board and say its rule, the lanes of one road
 * and where each may go, or a car driving a route a step at a time. It ends
 * with the way on to the next level.
 */
import * as React from "react";
import { Link } from "react-router";

import { analytics } from "~/lib/analytics";
import { BOARD_LEVELS_PATH, levelHref } from "~/lib/board-guides";
import { RULES_SOURCE, laneRule } from "~/lib/board/board-rules";
import {
  COURSE_LEVELS,
  KIND_LABEL,
  learnedKey,
  levelAfter,
  unitOf,
  type Level,
} from "~/lib/board/curriculum";
import { levelSlides } from "~/lib/board/curriculum-content";
import { RING_R } from "~/lib/board/full-board";
import { ARMS, OPTION_CODES, type ArmId } from "~/lib/board/geometry";
import type { Seat } from "~/lib/board/joystick";
import {
  APPROACHES,
  LESSONS,
  ROUTE_COLOR,
  ROUTE_RULES,
  laneOptions,
  lessonPlan,
  lessonRoute,
} from "~/lib/board/lessons";
import type { Route } from "~/lib/board/network";
import { shuffleParkingLayout } from "~/lib/board/parking-layouts";
import { cam, fitTable, flyTo, useStage } from "~/lib/board/stage";
import { useBoardStore } from "~/lib/board-store";
import { cn } from "~/lib/utils";

import { Icon } from "~/components/brand/icon";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  CloseIcon,
  PlayIcon,
  SettingsIcon,
} from "~/components/brand/icons";
import {
  BoardPlayback,
  StepTags,
  UNSURE_NOTE,
  routeLines,
} from "~/components/board/board-playback";
import { useParkingLayout } from "~/components/board/use-parking-layout";

const chip =
  "min-h-11 rounded-md border-2 px-3 py-2 text-left text-[13.5px] font-semibold leading-snug outline-none transition-colors focus-visible:border-white";
const chipOff = "border-white/15 bg-white/5 text-white hover:bg-white/10";
const chipOn = "border-[#f6c416] bg-[#f6c416] text-[#17181b]";
const eyebrow =
  "m-0 font-mono text-[10px] font-bold uppercase tracking-widest text-white/55";
const primary =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-[#f6c416] bg-[#f6c416] px-4 py-2.5 text-center text-[14.5px] font-bold leading-snug text-[#17181b] outline-none transition-colors hover:bg-[#ffd84d] focus-visible:border-white disabled:opacity-40";
const secondary =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-white/25 px-4 py-2.5 text-center font-mono text-[11px] font-bold uppercase tracking-widest text-white outline-none transition-colors hover:bg-white/10 focus-visible:border-white disabled:opacity-40";
const iconButton =
  "inline-flex size-11 items-center justify-center rounded-md border-2 border-white/15 outline-none transition-colors hover:bg-white/15 focus-visible:border-white";

/** The roundabout and the road into it, for looking at one road's lanes. */
function approachBox(arm: ArmId) {
  const out = ARMS[arm].out;
  const reach = RING_R + 26;
  return {
    x0: Math.min(-RING_R - 4, out.x * reach),
    x1: Math.max(RING_R + 4, out.x * reach),
    z0: Math.min(-RING_R - 4, out.z * reach),
    z1: Math.max(RING_R + 4, out.z * reach),
  };
}

/** The way on from a finished level, said under whatever finished it. */
export function LevelNext({
  level,
  className,
}: {
  level: Level;
  className?: string;
}) {
  const next = levelAfter(level);
  return (
    <div className={cn("grid gap-2", className)}>
      {next && (
        <Link to={levelHref(next.id)} replace className={primary}>
          <span className="min-w-0">
            Next: level {next.n}, {next.title}
          </span>
          <Icon icon={ArrowRightIcon} size={16} className="shrink-0" />
        </Link>
      )}
      <Link to={BOARD_LEVELS_PATH} replace className={secondary}>
        All levels
      </Link>
    </div>
  );
}

function DoneNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="m-0 flex items-center gap-2 text-[14px] font-bold leading-snug text-white"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-kenya-green text-kenya-green-foreground">
        <Icon icon={CheckIcon} size={14} />
      </span>
      {children}
    </p>
  );
}

/** The steps of the route being played, to tap through. */
function RouteSteps({ route, step }: { route: Route; step: number }) {
  const toStep = useStage((s) => s.toStep);
  return (
    <ol className="m-0 grid list-none gap-1 p-0">
      {route.steps.map((s, i) => (
        <li key={`${s.from}-${s.title}`}>
          <button
            type="button"
            onClick={() => toStep(i)}
            aria-current={i === step ? "step" : undefined}
            className={cn(
              "flex min-h-11 w-full items-start gap-2.5 rounded-md border-2 px-2.5 py-2.5 text-left outline-none transition-colors focus-visible:border-white",
              i === step
                ? "border-white/40 bg-white/10"
                : "border-transparent hover:bg-white/5",
            )}
          >
            <span className="mt-px font-mono text-[11px] font-bold text-white/55">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 text-[13.5px] font-semibold leading-snug">
              {s.title}
              <span className="ml-1.5 inline-flex gap-1 align-middle font-mono text-[9.5px] font-bold uppercase tracking-widest">
                <StepTags step={s} />
              </span>
              {!s.confirmed && (
                <span className="mt-0.5 block text-[12px] font-semibold text-kenya-gold">
                  {UNSURE_NOTE}
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

// ---- cards -----------------------------------------------------------------------------

function SlidesLevel({
  level,
  sideways,
  done,
  onDone,
}: {
  level: Level & { kind: "slides" };
  sideways: boolean;
  done: boolean;
  onDone: () => void;
}) {
  const show = useStage((s) => s.show);
  const cards = React.useMemo(() => levelSlides(level), [level]);
  const [at, setAt] = React.useState(0);
  const [finished, setFinished] = React.useState(false);
  const card = cards[Math.min(at, cards.length - 1)];
  const last = at >= cards.length - 1;

  React.useEffect(() => {
    if (!card?.box) {
      show([]);
      fitTable();
      return;
    }
    show([], card.box);
    flyTo(card.box, sideways);
  }, [card, sideways, show]);

  if (!card) return null;
  return (
    <div className="grid gap-3">
      <div
        aria-live="polite"
        className="rounded-md border-2 border-[#f6c416] bg-white/5 p-3"
      >
        <p className={eyebrow}>
          {at + 1} of {cards.length}
        </p>
        <h3 className="m-0 mt-1 text-[17px] font-bold leading-snug">
          {card.title}
        </h3>
        <p className="m-0 mt-1.5 text-[14px] leading-snug text-white/85">
          {card.note}
        </p>
        {card.sign && (
          <Link
            to={card.sign.to}
            className="mt-2 inline-flex min-h-11 items-center gap-1 text-[13px] font-bold text-kenya-gold underline-offset-4 hover:underline"
          >
            The {card.sign.label} sign
            <Icon icon={ArrowRightIcon} size={13} />
          </Link>
        )}
        <p className="m-0 mt-2 font-mono text-[10px] uppercase tracking-widest text-white/50">
          {RULES_SOURCE}, Unit 3
        </p>
      </div>

      {finished || (done && last) ? (
        <>
          <DoneNote>Level {level.n} done.</DoneNote>
          <LevelNext level={level} />
          <button
            type="button"
            className="min-h-11 text-center text-[13px] font-semibold text-white/75 underline underline-offset-4 outline-none hover:text-white focus-visible:text-white"
            onClick={() => {
              setFinished(false);
              setAt(0);
            }}
          >
            Read it again
          </button>
        </>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous card"
            disabled={at === 0}
            onClick={() => setAt((n) => Math.max(0, n - 1))}
            className={cn(secondary, "w-14 shrink-0 px-0")}
          >
            <Icon icon={ChevronLeftIcon} size={18} />
          </button>
          <button
            type="button"
            className={primary}
            onClick={() => {
              if (!last) {
                setAt((n) => n + 1);
                return;
              }
              setFinished(true);
              onDone();
            }}
          >
            {last ? "Got it" : "Next"}
            <Icon icon={last ? CheckIcon : ArrowRightIcon} size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ---- the lanes of one road --------------------------------------------------------------

function LanesLevel({
  level,
  sideways,
  done,
  onDone,
}: {
  level: Level & { kind: "lanes" };
  sideways: boolean;
  done: boolean;
  onDone: () => void;
}) {
  const arm = level.arm;
  const lanes = ARMS[arm].lanes;
  const route = useStage((s) => s.route);
  const step = useStage((s) => s.step);
  const show = useStage((s) => s.show);
  const watch = useStage((s) => s.watch);
  const clear = useStage((s) => s.clear);
  const [lane, setLane] = React.useState(1);
  const [seen, setSeen] = React.useState<readonly number[]>([1]);
  const [color, setColor] = React.useState(ROUTE_COLOR);
  const [finished, setFinished] = React.useState(false);
  const options = React.useMemo(() => laneOptions(arm, lane), [arm, lane]);
  const road = APPROACHES.find((a) => a.arm === arm);
  const allSeen = seen.length >= lanes;

  React.useEffect(() => {
    if (route) {
      show(routeLines(route, step, color));
      return;
    }
    show(
      options.map((option) => ({
        id: option.id,
        points: option.route.points,
        color: option.color,
        width: 2.2,
      })),
    );
    flyTo(approachBox(arm), sideways);
  }, [route, step, options, color, arm, sideways, show]);

  if (route) {
    return (
      <div className="grid gap-3">
        <button
          type="button"
          onClick={clear}
          className="inline-flex min-h-11 items-center gap-1 self-start pr-4 font-mono text-[12px] font-bold uppercase tracking-widest text-white/80 outline-none hover:text-white focus-visible:underline"
        >
          <Icon icon={ChevronLeftIcon} size={14} />
          Back to the lanes
        </button>
        <BoardPlayback className="rounded-md border-2 border-white/15 bg-white/5 p-3" />
        <RouteSteps route={route} step={step} />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="m-0 text-[13.5px] leading-snug text-white/80">
        {road?.road}, {lanes} lanes each way. Its option code is{" "}
        <strong className="font-mono text-white">{OPTION_CODES[lanes]}</strong>:
        the number of options in each lane, counted from the kerb. Tap each lane
        to see where it may go.
      </p>
      <div>
        <p className={eyebrow}>In lane</p>
        <div className="mt-1.5 flex gap-1">
          {Array.from({ length: lanes }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={lane === n}
              onClick={() => {
                setLane(n);
                setSeen((had) => (had.includes(n) ? had : [...had, n]));
              }}
              className={cn(
                chip,
                "relative flex-1 text-center",
                lane === n ? chipOn : chipOff,
              )}
            >
              {n}
              {seen.includes(n) && lane !== n && (
                <span
                  aria-hidden
                  className="absolute right-1 top-1 size-1.5 rounded-full bg-kenya-green"
                />
              )}
            </button>
          ))}
        </div>
        <p
          aria-live="polite"
          className="m-0 mt-2 text-[14px] font-semibold leading-snug"
        >
          {laneRule(lanes, lane)}
        </p>
      </div>
      <ul className="m-0 grid list-none gap-1.5 p-0">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              className={cn(chip, chipOff, "flex w-full items-center gap-3")}
              onClick={() => {
                setColor(option.color);
                watch(option.route);
                analytics.boardLessonViewed({
                  kind: "lane",
                  lesson_id: `${arm}${lane}-${option.id}`,
                });
              }}
            >
              <span
                aria-hidden
                className="h-2.5 w-7 shrink-0 rounded-full"
                style={{ background: option.color }}
              />
              <span className="flex-1">
                {option.label}{" "}
                <span className="font-mono text-[11px] text-white/55">
                  {option.degrees}
                </span>
                {!option.confirmed && (
                  <span className="mt-0.5 block text-[12px] font-semibold text-kenya-gold">
                    {UNSURE_NOTE}
                  </span>
                )}
              </span>
              <Icon icon={PlayIcon} size={14} />
            </button>
          </li>
        ))}
      </ul>

      {finished || done ? (
        <>
          <DoneNote>Level {level.n} done.</DoneNote>
          <LevelNext level={level} />
        </>
      ) : (
        <button
          type="button"
          className={primary}
          disabled={!allSeen}
          onClick={() => {
            setFinished(true);
            onDone();
          }}
        >
          {allSeen
            ? "Got it"
            : `Look at every lane first (${seen.length} of ${lanes})`}
          {allSeen && <Icon icon={CheckIcon} size={16} />}
        </button>
      )}
    </div>
  );
}

// ---- a route, driven for the learner ----------------------------------------------------

function WatchLevel({
  level,
  done,
  onDone,
}: {
  level: Level & { kind: "watch" };
  done: boolean;
  onDone: () => void;
}) {
  const route = useStage((s) => s.route);
  const step = useStage((s) => s.step);
  const ended = useStage((s) => s.ended);
  const show = useStage((s) => s.show);
  const watch = useStage((s) => s.watch);
  // The farthest free bay moves with the parked cars.
  const layout = useParkingLayout();
  const lesson = LESSONS.find((l) => l.id === level.lesson);
  const parking = lesson?.group === "parking";

  React.useEffect(() => {
    if (parking) shuffleParkingLayout();
  }, [parking]);

  const line = React.useMemo(
    () => (lesson ? lessonRoute(lesson) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see `layout`
    [lesson, layout],
  );
  const picked = lesson && !parking ? lessonPlan(lesson)?.rule : null;
  const rule = picked ? ROUTE_RULES[picked] : null;

  // Before Play, the whole route lies on the table to be looked at.
  React.useEffect(() => {
    if (route) show(routeLines(route, step, ROUTE_COLOR));
    else if (line) {
      show([
        { id: "whole", points: line.points, color: ROUTE_COLOR, width: 2 },
      ]);
      fitTable();
    }
  }, [route, step, line, show]);

  React.useEffect(() => {
    if (ended && route) onDone();
  }, [ended, route, onDone]);

  if (!lesson || !line) {
    return (
      <p className="m-0 text-[14px] leading-snug text-white/80">
        This route could not be worked out. Try another level.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      <div>
        <p className={eyebrow}>The examiner might say</p>
        <p className="m-0 mt-1 text-[14.5px] font-semibold leading-snug">
          {lesson.ask}
        </p>
        {rule && (
          <p className="m-0 mt-1.5 text-[13px] font-semibold leading-snug text-kenya-gold">
            {rule.name}. {rule.says}
          </p>
        )}
      </div>

      {route ? (
        <>
          <BoardPlayback className="rounded-md border-2 border-white/15 bg-white/5 p-3" />
          {(ended || done) && (
            <>
              {ended && <DoneNote>Level {level.n} done.</DoneNote>}
              <LevelNext level={level} />
            </>
          )}
          <RouteSteps route={route} step={step} />
        </>
      ) : (
        <>
          <button
            type="button"
            className={primary}
            onClick={() => {
              watch(line);
              analytics.boardLessonViewed({
                kind: parking ? "parking" : "route",
                lesson_id: lesson.id,
              });
            }}
          >
            <Icon icon={PlayIcon} size={16} />
            Watch the car drive it
          </button>
          <p className="m-0 text-[12.5px] leading-snug text-white/65">
            {line.steps.length} steps
            {line.steps.some((s) => s.gear === "reverse") && ", with reversing"}
            . You can pause, step back and slow it down.
          </p>
          {done && <LevelNext level={level} />}
        </>
      )}
    </div>
  );
}

// ---- the panel ---------------------------------------------------------------------------

export function BoardLevel({
  level,
  seat,
  onSettings,
}: {
  level: Level;
  seat: Seat;
  onSettings: () => void;
}) {
  const exit = useBoardStore((s) => s.exit);
  const completeLevel = useBoardStore((s) => s.completeLevel);
  const learned = useBoardStore((s) => s.learned);
  const sideways = seat === "east" || seat === "west";
  // Done before this visit. A level can always be opened again.
  const [wasDone] = React.useState(() =>
    Boolean(
      learned?.includes(
        level.kind === "watch" ? level.lesson : learnedKey(level),
      ),
    ),
  );

  // On a phone the panel covers the bottom of the screen, so the camera holds
  // what it is looking at above it. On a wide screen the panel is at the side.
  React.useEffect(() => {
    const tall = window.matchMedia("(max-width: 639px)");
    const update = () => {
      cam.lift = tall.matches ? 0.24 : 0;
      cam.side = tall.matches ? 0 : Math.min(0.3, 188 / window.innerWidth);
    };
    update();
    tall.addEventListener("change", update);
    return () => {
      tall.removeEventListener("change", update);
      cam.lift = 0;
      cam.side = 0;
    };
  }, []);

  const unit = unitOf(level);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end sm:flex-row sm:justify-start">
      <section
        aria-label={`Level ${level.n}: ${level.title}`}
        className="dr-rise pointer-events-auto flex max-h-[54dvh] w-full flex-col border-t-2 border-white/15 bg-[#101114]/95 pb-[env(safe-area-inset-bottom)] text-white sm:h-full sm:max-h-none sm:w-[23.5rem] sm:border-r-2 sm:border-t-0"
      >
        <header className="flex items-start justify-between gap-2 px-3.5 pt-3">
          <div className="min-w-0">
            <p className={eyebrow}>
              Level {level.n} of {COURSE_LEVELS.length} · {unit.title} ·{" "}
              {KIND_LABEL[level.kind]}
            </p>
            <h2 className="m-0 mt-1 font-display text-[19px] font-extrabold uppercase leading-[1.05] tracking-tight">
              {level.title}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="Settings"
              onClick={onSettings}
              className={iconButton}
            >
              <Icon icon={SettingsIcon} size={20} />
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={exit}
              className={iconButton}
            >
              <Icon icon={CloseIcon} size={20} />
            </button>
          </div>
        </header>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 pb-4">
          {level.kind === "slides" ? (
            <SlidesLevel
              level={level}
              sideways={sideways}
              done={wasDone}
              onDone={completeLevel}
            />
          ) : level.kind === "lanes" ? (
            <LanesLevel
              level={level}
              sideways={sideways}
              done={wasDone}
              onDone={completeLevel}
            />
          ) : level.kind === "watch" ? (
            <WatchLevel level={level} done={wasDone} onDone={completeLevel} />
          ) : null}
        </div>
      </section>
    </div>
  );
}
