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
import { findSpots, levelSlides } from "~/lib/board/curriculum-content";
import { RING_R } from "~/lib/board/full-board";
import { ARMS, OPTION_CODES, type ArmId } from "~/lib/board/geometry";
import type { Seat } from "~/lib/board/joystick";
import { pickable, queueCars } from "~/lib/board/lane-queue";
import {
  APPROACHES,
  LESSONS,
  ROUTE_COLOR,
  ROUTE_RULES,
  lessonPlan,
  lessonRoute,
} from "~/lib/board/lessons";
import type { Route } from "~/lib/board/network";
import { shuffleParkingLayout } from "~/lib/board/parking-layouts";
import {
  cam,
  fitTable,
  flyTo,
  redraw,
  setMarks,
  useStage,
} from "~/lib/board/stage";
import { useBoardStore } from "~/lib/board-store";
import { cn } from "~/lib/utils";

import { LevelCheer } from "~/components/board/board-cheer";
import { BoardSpotPicks } from "~/components/board/board-spot-picks";
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
  // Closed part-way through, a deck opens again on the card it was left at.
  const keepPlace = useBoardStore((s) => s.keepPlace);
  const [at, setAt] = React.useState(() => {
    const kept = useBoardStore.getState().places?.[level.id] ?? 0;
    return kept < cards.length - 1 ? kept : 0;
  });
  React.useEffect(() => keepPlace(level.id, at), [keepPlace, level.id, at]);
  const [finished, setFinished] = React.useState(false);
  const card = cards[Math.min(at, cards.length - 1)];
  const last = at >= cards.length - 1;

  // After the cards, one thing to do: find one of them on the table. Nothing
  // is scored, and a wrong pin only says what it is.
  const spots = React.useMemo(() => findSpots(level), [level]);
  const [target] = React.useState(() =>
    spots.length > 0 ? spots[Math.floor(Math.random() * spots.length)] : null,
  );
  const [finding, setFinding] = React.useState(false);
  const [wrong, setWrong] = React.useState<string[]>([]);
  React.useEffect(() => {
    if (!finding) return;
    show([]);
    const pad = 14;
    flyTo(
      {
        x0: Math.min(...spots.map((spot) => spot.x)) - pad,
        x1: Math.max(...spots.map((spot) => spot.x)) + pad,
        z0: Math.min(...spots.map((spot) => spot.z)) - pad,
        z1: Math.max(...spots.map((spot) => spot.z)) + pad,
      },
      sideways,
    );
    setMarks(spots);
    return () => setMarks([]);
  }, [finding, spots, sideways, show]);
  const lastWrong = spots.find((spot) => spot.id === wrong[wrong.length - 1]);
  const letter = (id: string) =>
    "ABCDEFGH"[spots.findIndex((spot) => spot.id === id)];

  React.useEffect(() => {
    if (finding) return;
    if (!card?.box) {
      show([]);
      fitTable();
      return;
    }
    show([], card.box);
    flyTo(card.box, sideways);
  }, [card, sideways, show, finding]);

  if (!card) return null;
  if (finding && target) {
    return (
      <div className="grid gap-3">
        <BoardSpotPicks
          spots={spots}
          wrong={wrong}
          onPick={(id) => {
            if (id !== target.id) {
              setWrong((was) => [...was, id]);
              return;
            }
            setFinding(false);
            setFinished(true);
            onDone();
          }}
        />
        <div
          aria-live="polite"
          className="rounded-md border-2 border-[#f6c416] bg-white/5 p-3"
        >
          <p className={eyebrow}>Find it on the board</p>
          <h3 className="m-0 mt-1 text-[17px] font-bold leading-snug">
            Which pin is on: {target.name}?
          </h3>
          <p className="m-0 mt-1.5 text-[14px] leading-snug text-white/85">
            {lastWrong
              ? `Pin ${letter(lastWrong.id)} is: ${lastWrong.name}. Try another.`
              : "Tap a pin on the table."}
          </p>
        </div>
        <button
          type="button"
          className={secondary}
          onClick={() => {
            setFinding(false);
            setWrong([]);
          }}
        >
          <Icon icon={ChevronLeftIcon} size={16} />
          Back to the cards
        </button>
      </div>
    );
  }
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
          <LevelCheer level={level} />
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
              if (target) {
                setWrong([]);
                setFinding(true);
                return;
              }
              setFinished(true);
              onDone();
            }}
          >
            {last && !target ? "Got it" : "Next"}
            <Icon
              icon={last && !target ? CheckIcon : ArrowRightIcon}
              size={16}
            />
          </button>
        </div>
      )}
    </div>
  );
}

// ---- the lanes of one road --------------------------------------------------------------

/**
 * What the camera holds while the cars wait. On a wide screen it is the
 * line-up and the roundabout. On a phone that would make the cars too small to
 * tap one from the next, so it is the line-up alone.
 */
function lineUpBox(arm: ArmId, close: boolean) {
  const out = ARMS[arm].out;
  const cars = queueCars(arm);
  const back = Math.max(...cars.map((car) => car.along)) + 5;
  if (close) {
    const xs = cars.map((car) => car.start.x);
    const zs = cars.map((car) => car.start.z);
    const pad = 5;
    return {
      x0: Math.min(...xs) - pad,
      x1: Math.max(...xs) + pad,
      z0: Math.min(...zs) - pad,
      z1: Math.max(...zs) + pad,
    };
  }
  const reach = Math.max(RING_R + 26, back);
  return {
    x0: Math.min(-RING_R - 4, out.x * reach),
    x1: Math.max(RING_R + 4, out.x * reach),
    z0: Math.min(-RING_R - 4, out.z * reach),
    z1: Math.max(RING_R + 4, out.z * reach),
  };
}

/**
 * Every car of one road is out on the table, one for each option of each
 * lane. The learner takes the front car of a lane and drives it to its place;
 * this is the list of them, and what is left to do.
 */
function LanesLevel({
  level,
  sideways,
  done,
}: {
  level: Level & { kind: "lanes" };
  sideways: boolean;
  done: boolean;
}) {
  const arm = level.arm;
  const lanes = ARMS[arm].lanes;
  const rest = useBoardStore((s) => s.lanes?.rest);
  const pickCar = useBoardStore((s) => s.pickCar);
  const show = useStage((s) => s.show);
  const cars = React.useMemo(() => queueCars(arm), [arm]);
  const home = React.useMemo(() => Object.keys(rest ?? {}), [rest]);
  const front = React.useMemo(() => pickable(cars, home), [cars, home]);
  const road = APPROACHES.find((a) => a.arm === arm);
  const allHome = home.length >= cars.length;
  // On a phone the list of every option would cover the cars it is about, so
  // it stays folded: the cars are picked on the table.
  const [listOpen, setListOpen] = React.useState(
    () =>
      typeof window === "undefined" ||
      !window.matchMedia("(max-width: 639px)").matches,
  );

  React.useEffect(() => {
    show([]);
    const phone = window.matchMedia("(max-width: 639px)").matches;
    flyTo(lineUpBox(arm, phone), sideways);
  }, [arm, sideways, show]);

  return (
    <div className="grid gap-3">
      <p className="m-0 text-[14px] font-semibold leading-snug text-white">
        Tap the front car of any lane and drive it to its place.
      </p>
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className={eyebrow}>
          {home.length} of {cars.length} cars home
        </p>
        <span aria-hidden className="flex gap-1">
          {cars.map((car) => (
            <span
              key={car.id}
              className={cn(
                "size-2.5 rounded-full border border-white/40",
                !home.includes(car.id) && "opacity-35",
              )}
              style={{ background: car.paint }}
            />
          ))}
        </span>
      </div>
      <button
        type="button"
        aria-expanded={listOpen}
        onClick={() => setListOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md border-2 border-white/15 px-3 text-left text-[13.5px] font-semibold outline-none transition-colors hover:bg-white/10 focus-visible:border-white"
      >
        Where each lane may go
        <span aria-hidden className="font-mono text-[16px] leading-none">
          {listOpen ? "−" : "+"}
        </span>
      </button>
      {listOpen && (
        <p className="m-0 text-[13.5px] leading-snug text-white/80">
          {road?.road}, {lanes} lanes each way. Its option code is{" "}
          <strong className="font-mono text-white">
            {OPTION_CODES[lanes]}
          </strong>
          : the number of options in each lane, counted from the kerb. There is
          one car for each option.
        </p>
      )}
      {listOpen &&
        Array.from({ length: lanes }, (_, i) => i + 1).map((lane) => (
          <section key={lane} aria-label={`Lane ${lane}`}>
            <p className="m-0 text-[13px] font-semibold leading-snug text-white/80">
              {laneRule(lanes, lane)}
            </p>
            <ul className="m-0 mt-1.5 grid list-none gap-1.5 p-0">
              {cars
                .filter((car) => car.lane === lane)
                .map((car) => {
                  const isHome = home.includes(car.id);
                  const canTake = front.includes(car);
                  return (
                    <li key={car.id}>
                      <button
                        type="button"
                        disabled={!canTake}
                        onClick={() => pickCar(car.id)}
                        className={cn(
                          chip,
                          chipOff,
                          "flex w-full items-center gap-3 disabled:hover:bg-white/5",
                          !canTake && !isHome && "opacity-55",
                        )}
                      >
                        <span
                          aria-hidden
                          className="h-4 w-7 shrink-0 rounded-[5px] border border-white/40"
                          style={{ background: car.paint }}
                        />
                        <span className="flex-1">
                          {car.option.label}{" "}
                          <span className="font-mono text-[11px] text-white/55">
                            {car.option.degrees}
                          </span>
                          {!car.option.confirmed && (
                            <span className="mt-0.5 block text-[12px] font-semibold text-kenya-gold">
                              {UNSURE_NOTE}
                            </span>
                          )}
                        </span>
                        {isHome ? (
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-kenya-green text-kenya-green-foreground">
                            <Icon icon={CheckIcon} size={12} />
                            <span className="sr-only">Home</span>
                          </span>
                        ) : canTake ? (
                          <span className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-widest text-[#f6c416]">
                            Drive
                          </span>
                        ) : (
                          <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest text-white/55">
                            Waiting
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}

      {allHome ? (
        <>
          <DoneNote>Every car is home. Level {level.n} done.</DoneNote>
          <LevelCheer level={level} />
          <LevelNext level={level} />
        </>
      ) : (
        done && (
          <>
            <p className="m-0 text-[13px] leading-snug text-white/70">
              You have done this level before. Drive the cars again, or go on.
            </p>
            <LevelNext level={level} />
          </>
        )
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
              {ended && <LevelCheer level={level} />}
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
  // what it is looking at above it: by half the share of the screen the panel
  // takes, which changes as the panel folds and opens. On a wide screen the
  // panel is at the side.
  const panel = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    const tall = window.matchMedia("(max-width: 639px)");
    const update = () => {
      const covered = panel.current
        ? panel.current.offsetHeight / Math.max(1, window.innerHeight)
        : 0.48;
      cam.lift = tall.matches ? Math.min(0.27, Math.max(0, covered / 2)) : 0;
      cam.side = tall.matches ? 0 : Math.min(0.3, 188 / window.innerWidth);
      redraw();
    };
    update();
    tall.addEventListener("change", update);
    const watcher =
      panel.current && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;
    if (panel.current) watcher?.observe(panel.current);
    return () => {
      tall.removeEventListener("change", update);
      watcher?.disconnect();
      cam.lift = 0;
      cam.side = 0;
    };
  }, []);

  const unit = unitOf(level);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end sm:flex-row sm:justify-start">
      <section
        ref={panel}
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
            <LanesLevel level={level} sideways={sideways} done={wasDone} />
          ) : level.kind === "watch" ? (
            <WatchLevel level={level} done={wasDone} onDone={completeLevel} />
          ) : null}
        </div>
      </section>
    </div>
  );
}
