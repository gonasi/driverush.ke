/**
 * Learn mode: the board with no task and no clock. Four things to look at,
 * each on the table itself: where every lane can take you, what each thing
 * painted on the board means, routes across the whole board, and parking.
 * Tap anything and a car drives it, a step at a time, with the rule for each
 * step.
 */
import * as React from "react";
import { Link } from "react-router";

import { analytics } from "~/lib/analytics";
import { RULES_SOURCE, laneRule } from "~/lib/board/board-rules";
import { OPTION_CODES } from "~/lib/board/geometry";
import { BOARD_FEATURES } from "~/lib/board/features";
import { RING_R } from "~/lib/board/full-board";
import { ARMS, type ArmId } from "~/lib/board/geometry";
import type { Seat } from "~/lib/board/joystick";
import {
  APPROACHES,
  LESSONS,
  ROUTE_COLOR,
  ROUTE_RULES,
  laneOptions,
  lessonPlan,
  lessonRoute,
  type Lesson,
} from "~/lib/board/lessons";
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
import { useParkingLayout } from "~/components/board/use-parking-layout";
import {
  BoardPlayback,
  StepTags,
  UNSURE_NOTE,
  routeLines,
} from "~/components/board/board-playback";

type Tab = "lanes" | "board" | "routes" | "parking";

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "lanes", label: "Lanes" },
  { id: "board", label: "Board" },
  { id: "routes", label: "Routes" },
  { id: "parking", label: "Parking" },
];

/** What is being played back, for the heading over the steps. */
type Showing = {
  kind: "lane" | "route" | "parking";
  id: string;
  title: string;
  ask: string;
  color: string;
  /** The route rule that picked a route, said under its heading. */
  rule?: string;
};

const chip =
  "min-h-11 rounded-md border-2 px-3 py-2 text-left text-[13.5px] font-semibold leading-snug outline-none transition-colors focus-visible:border-white";
const chipOff = "border-white/15 bg-white/5 text-white hover:bg-white/10";
const chipOn = "border-[#f6c416] bg-[#f6c416] text-[#17181b]";
const eyebrow =
  "m-0 font-mono text-[10px] font-bold uppercase tracking-widest text-white/55";

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

export function BoardLearn({
  seat,
  onSettings,
}: {
  seat: Seat;
  onSettings: () => void;
}) {
  const route = useStage((s) => s.route);
  const step = useStage((s) => s.step);
  const ended = useStage((s) => s.ended);
  const show = useStage((s) => s.show);
  const watch = useStage((s) => s.watch);
  const clear = useStage((s) => s.clear);
  const toStep = useStage((s) => s.toStep);
  const learned = useBoardStore((s) => s.learned);
  const markLearned = useBoardStore((s) => s.markLearned);
  const exit = useBoardStore((s) => s.exit);
  const start = useBoardStore((s) => s.start);

  const [tab, setTab] = React.useState<Tab>("lanes");
  const [arm, setArm] = React.useState<ArmId>("S");
  const [lane, setLane] = React.useState(1);
  const [feature, setFeature] = React.useState<string | null>(null);
  const [showing, setShowing] = React.useState<Showing | null>(null);
  // lesson routes are worked out again when the parked cars move
  useParkingLayout();
  const sideways = seat === "east" || seat === "west";

  // On a phone the panel covers the bottom of the screen, so the camera holds
  // what it is looking at above it.
  React.useEffect(() => {
    const tall = window.matchMedia("(max-width: 639px)");
    const update = () => {
      cam.lift = tall.matches ? 0.24 : 0;
      // beside it on a wide screen: the panel is 23.5rem wide
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

  const options = React.useMemo(() => laneOptions(arm, lane), [arm, lane]);
  const picked = BOARD_FEATURES.find((f) => f.id === feature) ?? null;

  // What is painted on the table follows what the panel is showing.
  React.useEffect(() => {
    if (route) {
      show(routeLines(route, step, showing?.color ?? ROUTE_COLOR));
    } else if (tab === "lanes") {
      show(
        options.map((option) => ({
          id: option.id,
          points: option.route.points,
          color: option.color,
          width: 2.2,
        })),
      );
    } else if (tab === "board" && picked) {
      show([], picked.box);
    } else {
      show([]);
    }
  }, [route, step, tab, options, picked, showing, show]);

  // The camera goes to what was picked.
  React.useEffect(() => {
    if (route) return;
    if (tab === "lanes") flyTo(approachBox(arm), sideways);
    else if (tab === "board" && picked) flyTo(picked.box, sideways);
    else fitTable();
  }, [route, tab, arm, picked, sideways]);

  React.useEffect(() => {
    if (ended && showing && showing.kind !== "lane") markLearned(showing.id);
  }, [ended, showing, markLearned]);

  const play = (next: Showing, line: NonNullable<typeof route>) => {
    setShowing(next);
    watch(line);
    analytics.boardLessonViewed({ kind: next.kind, lesson_id: next.id });
  };

  const back = () => {
    clear();
    setShowing(null);
  };

  const pickTab = (next: Tab) => {
    clear();
    setShowing(null);
    // The parked cars stand somewhere new each time, so the farthest free
    // bay is not always the same one.
    if (next === "parking") shuffleParkingLayout();
    setTab(next);
  };

  const lessonRow = (lesson: Lesson) => {
    const line = lessonRoute(lesson);
    if (!line) return null;
    const picked = lesson.group === "routes" ? lessonPlan(lesson)?.rule : null;
    const rule = picked ? ROUTE_RULES[picked] : null;
    const done = learned?.includes(lesson.id);
    return (
      <li key={lesson.id}>
        <button
          type="button"
          className={cn(chip, chipOff, "flex w-full items-center gap-3")}
          onClick={() =>
            play(
              {
                kind: lesson.group === "parking" ? "parking" : "route",
                id: lesson.id,
                title: lesson.title,
                ask: lesson.ask,
                color: ROUTE_COLOR,
                rule: rule ? `${rule.name}. ${rule.says}` : undefined,
              },
              line,
            )
          }
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
              done
                ? "border-kenya-green bg-kenya-green text-kenya-green-foreground"
                : "border-white/25 text-white",
            )}
          >
            <Icon icon={done ? CheckIcon : PlayIcon} size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block">{lesson.title}</span>
            <span className="mt-0.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-white/55">
              {lesson.level} · {rule ? `${rule.name} · ` : ""}
              {line.steps.length} steps
              {line.steps.some((s) => s.gear === "reverse") && " · reversing"}
            </span>
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end sm:flex-row sm:justify-start">
      <section
        aria-label="Learn the board"
        className="dr-rise pointer-events-auto flex max-h-[54dvh] w-full flex-col border-t-2 border-white/15 bg-[#101114]/95 pb-[env(safe-area-inset-bottom)] text-white sm:h-full sm:max-h-none sm:w-[23.5rem] sm:border-r-2 sm:border-t-0"
      >
        <header className="flex items-center justify-between gap-2 px-3.5 pt-3">
          <h2 className="m-0 font-display text-[19px] font-extrabold uppercase leading-none tracking-tight">
            Learn the board
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Board settings: where you stand, sound"
              onClick={onSettings}
              className="inline-flex size-11 items-center justify-center rounded-md border-2 border-white/15 outline-none transition-colors hover:bg-white/15 focus-visible:border-white"
            >
              <Icon icon={SettingsIcon} size={20} />
            </button>
            <button
              type="button"
              aria-label="Close the board"
              onClick={exit}
              className="inline-flex size-11 items-center justify-center rounded-md border-2 border-white/15 outline-none transition-colors hover:bg-white/15 focus-visible:border-white"
            >
              <Icon icon={CloseIcon} size={20} />
            </button>
          </div>
        </header>

        <div
          role="tablist"
          aria-label="What to learn"
          className="mt-3 grid grid-cols-4 gap-1 px-3.5"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => pickTab(t.id)}
              className={cn(
                "min-h-11 rounded-md border-2 py-2 font-mono text-[11px] font-bold uppercase tracking-widest outline-none transition-colors focus-visible:border-white",
                tab === t.id ? chipOn : chipOff,
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 pb-4">
          {route && showing ? (
            <div className="grid gap-3">
              <button
                type="button"
                onClick={back}
                className="inline-flex min-h-11 items-center gap-1 self-start pr-4 font-mono text-[12px] font-bold uppercase tracking-widest text-white/80 outline-none hover:text-white focus-visible:underline"
              >
                <Icon icon={ChevronLeftIcon} size={14} />
                Back
              </button>
              <div>
                <h3 className="m-0 text-[17px] font-bold leading-snug">
                  {showing.title}
                </h3>
                <p className="m-0 mt-1 text-[13.5px] leading-snug text-white/75">
                  {showing.ask}
                </p>
                {showing.rule && (
                  <p className="m-0 mt-1.5 text-[13px] font-semibold leading-snug text-kenya-gold">
                    {showing.rule}
                  </p>
                )}
              </div>
              <BoardPlayback className="rounded-md border-2 border-white/15 bg-white/5 p-3" />
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
            </div>
          ) : tab === "lanes" ? (
            <div className="grid gap-3">
              <div>
                <p className={eyebrow}>Coming from</p>
                <div className="mt-1.5 grid grid-cols-4 gap-1">
                  {APPROACHES.map((a) => (
                    <button
                      key={a.arm}
                      type="button"
                      aria-pressed={arm === a.arm}
                      onClick={() => {
                        setArm(a.arm);
                        setLane((n) => Math.min(n, ARMS[a.arm].lanes));
                      }}
                      className={cn(
                        chip,
                        "px-1 text-center",
                        arm === a.arm ? chipOn : chipOff,
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <p className="m-0 mt-1.5 text-[12.5px] text-white/65">
                  {APPROACHES.find((a) => a.arm === arm)?.road},{" "}
                  {ARMS[arm].lanes} lanes each way. Option code{" "}
                  <strong className="font-mono text-white">
                    {OPTION_CODES[ARMS[arm].lanes]}
                  </strong>
                  : the number of options in each lane, from the kerb.
                </p>
              </div>
              <div>
                <p className={eyebrow}>In lane</p>
                <div className="mt-1.5 flex gap-1">
                  {Array.from({ length: ARMS[arm].lanes }, (_, i) => i + 1).map(
                    (n) => (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={lane === n}
                        onClick={() => setLane(n)}
                        className={cn(
                          chip,
                          "flex-1 text-center",
                          lane === n ? chipOn : chipOff,
                        )}
                      >
                        {n}
                      </button>
                    ),
                  )}
                </div>
                <p className="m-0 mt-2 text-[14px] font-semibold leading-snug">
                  {laneRule(ARMS[arm].lanes, lane)}
                </p>
                <p className="m-0 mt-1 text-[12.5px] leading-snug text-white/65">
                  Lane 1 is by the kerb. Change lanes only where the lines are
                  broken: mirrors, signal for 3 seconds, then move. Tap a turn
                  to watch it driven.
                </p>
              </div>
              <ul className="m-0 grid list-none gap-1.5 p-0">
                {options.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      className={cn(
                        chip,
                        chipOff,
                        "flex w-full items-center gap-3",
                      )}
                      onClick={() =>
                        play(
                          {
                            kind: "lane",
                            id: `${arm}${lane}-${option.id}`,
                            title: `Lane ${lane}: ${option.label.toLowerCase()}`,
                            ask: laneRule(ARMS[arm].lanes, lane),
                            color: option.color,
                          },
                          option.route,
                        )
                      }
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
            </div>
          ) : tab === "board" ? (
            <div className="grid gap-3">
              {picked ? (
                <div className="rounded-md border-2 border-[#f6c416] bg-white/5 p-3">
                  <h3 className="m-0 text-[17px] font-bold leading-snug">
                    {picked.name}
                  </h3>
                  <p className="m-0 mt-1.5 text-[14px] leading-snug text-white/85">
                    {picked.note}
                  </p>
                  {picked.sign && (
                    <Link
                      to={picked.sign.to}
                      className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-kenya-gold underline-offset-4 hover:underline"
                    >
                      The {picked.sign.label} sign
                      <Icon icon={ArrowRightIcon} size={13} />
                    </Link>
                  )}
                  <p className="m-0 mt-2 font-mono text-[10px] uppercase tracking-widest text-white/50">
                    {RULES_SOURCE}, Unit 3
                  </p>
                </div>
              ) : (
                <p className="m-0 text-[14px] leading-snug text-white/80">
                  Tap anything painted on the board to see it and what it asks
                  of you.
                </p>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                {BOARD_FEATURES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={feature === f.id}
                    onClick={() => {
                      setFeature(f.id);
                      analytics.boardLessonViewed({
                        kind: "feature",
                        lesson_id: f.id,
                      });
                    }}
                    className={cn(chip, feature === f.id ? chipOn : chipOff)}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <p className="m-0 text-[14px] leading-snug text-white/80">
                {tab === "routes"
                  ? "Rule 1: take the shortest correct route. Rule 2: if a continuous line blocks it, take the longest correct route. Rule 3: use the parking area only when there is no other route. Tap a route to watch it driven, a step at a time."
                  : "Parking and leaving a bay, forward and in reverse. Tap one to watch it, a step at a time."}
              </p>
              <ul className="m-0 grid list-none gap-1.5 p-0">
                {LESSONS.filter((l) => l.group === tab).map(lessonRow)}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => start()}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border-2 border-white/25 min-h-12 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white outline-none transition-colors hover:bg-white/10 focus-visible:border-white"
          >
            Drive the tasks yourself
            <Icon icon={ArrowRightIcon} size={14} />
          </button>
        </div>
      </section>
    </div>
  );
}
