/**
 * The Model Town Board game: the table, the examiner's task and the joystick,
 * filling the screen. It lives on the play page (`routes/board-play.tsx`).
 * The way in is the Board page (`board-levels.tsx`).
 * The store (`board-store.ts`) owns the run; this is the shell.
 */
import * as React from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";

import { BOARD_CARS, resolveCar } from "~/lib/board/cars";
import { faultRule, faultTip } from "~/lib/board/board-rules";
import {
  BOARD_CHALLENGES,
  blockCars,
  isRouteTask,
  type BoardChallenge,
} from "~/lib/board/challenges";
import {
  BOUNDS,
  CAR_COLORS,
  fullBoardSvg,
  placeOnPage,
} from "~/lib/board/full-board";
import type { Seat } from "~/lib/board/joystick";
import { pickable, queueCars } from "~/lib/board/lane-queue";
import {
  ROUTE_COLOR,
  challengeRoute,
  taskGoalBox,
  taskParks,
} from "~/lib/board/lessons";
import { distanceNear, poseAt, stepPoints } from "~/lib/board/network";
import {
  car,
  drive,
  elapsedSeconds,
  hasMoved,
  setPaused,
} from "~/lib/board/runtime";
import type { Fault } from "~/lib/board/referee";
import { SCORE_MAX } from "~/lib/board/score";
import { peekAt, useStage } from "~/lib/board/stage";
import { LevelCheer } from "~/components/board/board-cheer";
import {
  BOARD_CHALLENGE_IDS,
  useBoardStore,
  type BoardNotice,
} from "~/lib/board-store";
import { levelHref } from "~/lib/board-guides";
import {
  COURSE_LEVELS,
  levelAfter,
  levelById,
} from "~/lib/board/curriculum";
import { signCounts } from "~/lib/pelican-progress";
import { cn } from "~/lib/utils";

import { useParkingLayout } from "~/components/board/use-parking-layout";

import { Icon } from "~/components/brand/icon";
import { ShareButton } from "~/components/brand/share-button";
import {
  ChevronLeftIcon,
  CloseIcon,
  GridIcon,
  InfoIcon,
  PlayIcon,
  MenuIcon,
  RefreshIcon,
  SettingsIcon,
  StarIcon,
} from "~/components/brand/icons";
import { Button } from "~/components/ui/button";
import {
  BoardCameraPad,
  BoardZoomButtons,
} from "~/components/board/board-camera";
import { BoardCarPicks } from "~/components/board/board-car-picks";
import { BoardControls } from "~/components/board/board-controls";
import { BoardFaultTip } from "~/components/board/board-fault-tip";
import { BoardFinishCue } from "~/components/board/board-finish-cue";
import { BoardFps } from "~/components/board/board-fps";
import { BoardLearn } from "~/components/board/board-learn";
import { BoardLevel } from "~/components/board/board-level";
import { OpenLevelsContext } from "~/components/board/levels-sheet-context";
import { BoardPlayback, routeLines } from "~/components/board/board-playback";
import { BoardSettingsSheet } from "~/components/board/board-settings-sheet";
import { BoardSheet } from "~/components/board/board-sheet";
import { BoardSignCue } from "~/components/board/board-sign-cue";
import { BoardViewer } from "~/components/board/board-viewer";

// Only needed at the end of a round, and it brings framer-motion with it, so
// people who land here to read the guide never download it.
// The level picker, with its pictures, is only fetched when it is opened.
const BoardLevelsSheet = React.lazy(
  () => import("~/components/board/board-levels-sheet"),
);
const TrainerResultCard = React.lazy(() =>
  import("~/components/brand/trainer-result-card").then((m) => ({
    default: m.TrainerResultCard,
  })),
);

const POOL = BOARD_CHALLENGES.length;

/**
 * Where the learner stands until they choose: at the bottom on a tall screen,
 * where the board is tall too, and on the right on a wide one, where it lies
 * on its side and fills the screen.
 */
function useDefaultSeat(): Seat {
  const [seat, setSeat] = React.useState<Seat>("south");
  React.useEffect(() => {
    const wide = window.matchMedia("(min-aspect-ratio: 1/1)");
    const update = () => setSeat(wide.matches ? "east" : "south");
    update();
    wide.addEventListener("change", update);
    return () => wide.removeEventListener("change", update);
  }, []);
  return seat;
}

function Stars({ count, className }: { count: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`${count} of 3 stars`}
      className={cn("inline-flex gap-0.5", className)}
    >
      {[1, 2, 3].map((n) => (
        <Icon
          key={n}
          icon={StarIcon}
          size={16}
          className={n <= count ? "text-kenya-gold" : "text-white/25"}
        />
      ))}
    </span>
  );
}

/** Seconds as the clock shows them: minutes, then seconds. */
function clockTime(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * Time on this attempt. Nobody fails on the clock, but time over the task's
 * par comes off the score.
 */
function Clock({ running }: { running: boolean }) {
  const [seconds, setSeconds] = React.useState(0);
  React.useEffect(() => {
    setSeconds(Math.floor(elapsedSeconds()));
    if (!running) return;
    const id = window.setInterval(
      () => setSeconds(Math.floor(elapsedSeconds())),
      500,
    );
    return () => window.clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <span className="tabular-nums">
      {mm}:{ss}
    </span>
  );
}

const BOARD_ASPECT = (BOUNDS.x1 - BOUNDS.x0) / (BOUNDS.z1 - BOUNDS.z0);

/** The whole board, small, seen from the learner's side, with the car as a dot. */
function Minimap({
  svg,
  live,
  seat,
  finish,
  onPeek,
}: {
  svg: string;
  live: boolean;
  seat: Seat;
  /** The middle of the box the task ends in. */
  finish: { x: number; z: number };
  /** Show the car and the finish together on the table. */
  onPeek: () => void;
}) {
  const dot = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    let frame = 0;
    const place = () => {
      if (dot.current) {
        const at = placeOnPage(car.x, car.z, seat);
        dot.current.style.left = `${(at.left * 100).toFixed(1)}%`;
        dot.current.style.top = `${(at.top * 100).toFixed(1)}%`;
      }
      if (live) frame = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(frame);
  }, [live, svg, seat]);
  const sideways = seat === "east" || seat === "west";
  const end = placeOnPage(finish.x, finish.z, seat);
  return (
    <button
      type="button"
      aria-label="Show where this task ends"
      data-board-minimap
      disabled={!live}
      onClick={onPeek}
      className={cn(
        "pointer-events-auto relative block overflow-hidden rounded-md border-2 border-white/80 p-0 shadow-[0_3px_0_rgba(0,0,0,0.45)] outline-none focus-visible:border-kenya-gold",
        sideways ? "w-28 sm:w-40" : "w-[4.5rem] sm:w-24",
      )}
      style={{ aspectRatio: sideways ? 1 / BOARD_ASPECT : BOARD_ASPECT }}
    >
      <div
        className="size-full [&>svg]:block [&>svg]:size-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {/* The finish, ringed so it shows at this size. */}
      <span
        className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#5fe08a]/40"
        style={{
          left: `${(end.left * 100).toFixed(1)}%`,
          top: `${(end.top * 100).toFixed(1)}%`,
        }}
      />
      <span
        ref={dot}
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-kenya-gold"
      />
    </button>
  );
}

/** Where on a task's route the car is now, as a step of it. */
function stepUnderCar(challenge: BoardChallenge) {
  const route = challengeRoute(challenge);
  if (!route) return null;
  const index = poseAt(route, distanceNear(route, car)).step;
  return { route, index };
}

/**
 * Help while driving a task. "Next step" lights the stretch of road ahead and
 * gives its rule, and the drive carries on. "Show me" pauses the task and
 * drives the whole of it for the learner to watch.
 */
function TaskHint({
  challenge,
  attempt,
  onNextStep,
  onShowMe,
  bare,
  children,
}: {
  challenge: BoardChallenge;
  attempt: number;
  onNextStep: () => void;
  onShowMe: () => void;
  /** No Hint button: the first drive has nothing to be shown. */
  bare?: boolean;
  /** What stands between the buttons and the tip: a lost star, a sign ahead. */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [tip, setTip] = React.useState<{
    title: string;
    why: string;
    then?: string;
  } | null>(null);
  // A fresh attempt starts with no hint showing.
  React.useEffect(() => {
    setOpen(false);
    setTip(null);
  }, [attempt, challenge.id]);

  const nextStep = () => {
    const at = stepUnderCar(challenge);
    setOpen(false);
    if (!at) return;
    const { route, index } = at;
    const now = route.steps[index];
    const then = route.steps[index + 1];
    useStage.getState().show([
      {
        id: "now",
        points: stepPoints(route, index),
        color: ROUTE_COLOR,
        width: 2,
      },
      ...(then
        ? [
            {
              id: "then",
              points: stepPoints(route, index + 1),
              color: ROUTE_COLOR,
              width: 1.5,
              opacity: 0.5,
            },
          ]
        : []),
    ]);
    setTip({ title: now.title, why: now.why, then: then?.title });
    onNextStep();
  };

  // tall enough for a thumb
  const small =
    "min-h-11 rounded-md border-2 px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-widest outline-none transition-colors focus-visible:border-white";

  return (
    <>
      <div
        className={cn("pointer-events-auto flex flex-wrap gap-1.5", bare && "hidden")}
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            small,
            "inline-flex items-center gap-1.5 border-white/15 bg-[#101114]/85 hover:bg-white/15",
          )}
        >
          <Icon icon={InfoIcon} size={16} />
          Hint
        </button>
        {open && (
          <>
            <button
              type="button"
              onClick={nextStep}
              className={cn(
                small,
                "border-[#f6c416] bg-[#f6c416] text-[#17181b] hover:bg-[#ffd84d]",
              )}
            >
              Next step
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTip(null);
                onShowMe();
              }}
              className={cn(
                small,
                "border-white/40 bg-[#101114]/85 hover:bg-white/15",
              )}
            >
              Show me
            </button>
          </>
        )}
      </div>
      {children}
      {tip && (
        <div
          role="status"
          data-msg="tip"
          className="dr-rise pointer-events-auto relative w-full rounded-md border-2 border-[#f6c416] bg-[#101114]/90 py-2.5 pl-3.5 pr-11 shadow-[0_4px_0_rgba(0,0,0,0.4)]"
        >
          <p className="m-0 text-[14px] font-bold leading-snug">{tip.title}</p>
          <p
            data-fold="2"
            className="m-0 mt-1 text-[13px] leading-snug text-white/80"
          >
            {tip.why}
          </p>
          {tip.then && (
            <p
              data-fold="6"
              className="m-0 mt-1.5 text-[12.5px] font-semibold leading-snug text-kenya-gold"
            >
              Then: {tip.then}
            </p>
          )}
          <button
            type="button"
            aria-label="Close hint"
            onClick={() => {
              setTip(null);
              useStage.getState().clear();
            }}
            className="absolute right-0 top-0 inline-flex size-11 items-center justify-center rounded-md outline-none transition-colors hover:bg-white/15 focus-visible:bg-white/15"
          >
            <Icon icon={CloseIcon} size={16} />
          </button>
        </div>
      )}
    </>
  );
}

/**
 * The examiner's task. On a phone it folds to its title once the car is under
 * way, or after a few seconds, so the road is not read through it. A tap opens
 * it again for a while. On a wider screen there is room, and it stays open.
 */
function TaskCard({
  place,
  title,
  prompt,
}: {
  /** "Task 2 of 5". */
  place: string;
  title: string;
  prompt: string;
}) {
  const [open, setOpen] = React.useState(true);
  // Opened again by hand, it stays up while it is read, even on the move.
  const byHand = React.useRef(false);
  React.useEffect(() => {
    if (!open) return;
    if (window.matchMedia("(min-width: 640px)").matches) return;
    const fold = () => setOpen(false);
    const timer = window.setTimeout(fold, 6000);
    const poll = window.setInterval(() => {
      if (!byHand.current && Math.abs(car.speed) > 0.3) fold();
    }, 200);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(poll);
    };
  }, [open]);
  return (
    <div role="status" className="dr-rise w-full">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          byHand.current = !open;
          setOpen((v) => !v);
        }}
        className="pointer-events-auto block min-h-11 w-full rounded-md border-2 border-white/15 bg-[#101114]/85 px-3.5 py-2.5 text-left shadow-[0_4px_0_rgba(0,0,0,0.4)] outline-none focus-visible:border-white"
      >
        <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-kenya-gold">
          {place} · {title}
        </span>
        {open && (
          <span
            data-fold="1"
            className="mt-1.5 block text-[14.5px] font-semibold leading-snug"
          >
            {prompt}
          </span>
        )}
      </button>
    </div>
  );
}

/**
 * Keep the column of messages out of the way of the Finish button and the
 * joystick. When it grows too long for the screen it gives up detail, a step
 * at a time: the task folds to its title, the sign and the hint lose their
 * explanations, the sign waits while a hint or a lost star is showing, the
 * hint waits for the lost star, and last the sign goes and the hint drops its
 * "Then" line. Everything comes back as room does.
 *
 * It sets `display` by hand, outside React, because what fits depends on the
 * size the browser gives the text.
 */
function useFitColumn(column: React.RefObject<HTMLDivElement | null>) {
  React.useEffect(() => {
    const col = column.current;
    if (!col) return;
    const stick = document.querySelector("[data-board-stick]");
    const fit = () => {
      const stickTop =
        stick?.getBoundingClientRect().top ?? window.innerHeight - 232;
      // The Finish button stands under the column, and needs its own room
      // above the joystick.
      const limit = Math.min(window.innerHeight * 0.45, stickTop - 70) - 8;
      const folds = [...col.querySelectorAll<HTMLElement>("[data-fold]")];
      const message = (name: string) =>
        col.querySelector<HTMLElement>(`[data-msg="${name}"]`);
      const tip = message("tip");
      const sign = message("sign");
      const notice = message("notice");
      const apply = (level: number) => {
        for (const el of folds) {
          el.style.display = Number(el.dataset.fold) <= level ? "none" : "";
        }
        // A hint was asked for, so it outranks the sign. A lost star is
        // gone in a few seconds, so it outranks both while it shows.
        if (sign) {
          sign.style.display =
            level >= 5 || (level >= 3 && (tip || notice)) ? "none" : "";
        }
        if (tip) tip.style.display = level >= 4 && notice ? "none" : "";
      };
      let level = 0;
      apply(level);
      while (level < 6 && col.getBoundingClientRect().bottom > limit) {
        level += 1;
        apply(level);
      }
    };
    fit();
    // Messages come and go, and the joystick's note changes its height.
    const watcher = new MutationObserver(fit);
    watcher.observe(col, { childList: true, subtree: true });
    if (stick) watcher.observe(stick, { childList: true, subtree: true });
    window.addEventListener("resize", fit);
    return () => {
      watcher.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [column]);
}

/** The column of messages down the left of a drive. */
function HudColumn({ children }: { children: React.ReactNode }) {
  const column = React.useRef<HTMLDivElement>(null);
  useFitColumn(column);
  return (
    <div
      ref={column}
      data-board-hud-left
      className="flex min-w-0 max-w-[19rem] flex-1 flex-col items-start gap-2"
    >
      {children}
    </div>
  );
}

/**
 * A small mistake: the rule, a star gone, and the drive carries on. It takes
 * itself away once it has been read, so it leaves no gap in the column. The
 * same toast says the car has left its route: no star gone, but no pass.
 */
function StarLost({
  notice,
  lesson,
}: {
  notice: BoardNotice;
  /** A lesson has no stars to lose: only the rule is said. */
  lesson?: boolean;
}) {
  const [gone, setGone] = React.useState(false);
  React.useEffect(() => {
    setGone(false);
    const timer = window.setTimeout(() => setGone(true), 3600);
    return () => window.clearTimeout(timer);
  }, [notice.n]);
  if (gone) return null;
  const tip = faultTip(notice.fault);
  return (
    <div
      key={notice.n}
      role="status"
      data-msg="notice"
      className="dr-flash w-full rounded-md border-2 border-[#17181b] bg-[#f6c416] px-3.5 py-2.5 text-[#17181b] shadow-[0_4px_0_rgba(0,0,0,0.45)]"
      // Long enough to read a one-line rule.
      style={{ animationDuration: "3.6s" }}
    >
      <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-widest">
        {notice.route
          ? `Off route · ${tip.title}`
          : notice.back
            ? `Back a bit · ${tip.title}`
            : tip.title}
        {!lesson && !notice.route && " · 1 star lost"}
      </p>
      <p className="m-0 mt-1 text-[13.5px] font-semibold leading-snug">
        {notice.route
          ? "No rule broken, so drive on if you like. This try will not pass. Restart to try again."
          : tip.rule}
      </p>
    </div>
  );
}

/** The task paused, with the right way through it playing on the table. */
function WatchCard({
  wrongStep,
  onDone,
}: {
  /** The step the drive went wrong on, when it was stopped by the examiner. */
  wrongStep: number | null;
  onDone: () => void;
}) {
  const route = useStage((s) => s.route);
  const step = useStage((s) => s.step);
  const show = useStage((s) => s.show);
  React.useEffect(() => {
    if (route) show(routeLines(route, step));
  }, [route, step, show]);
  if (!route) return null;
  return (
    <BoardSheet
      tone="watch"
      strip="The right way, step by step"
      role="region"
      aria-label="The right way through this task"
    >
      <BoardPlayback
        note={
          wrongStep !== null && step === wrongStep
            ? "This is about where it went wrong."
            : null
        }
      />
      <Button variant="rush" size="lg" className="w-full" onClick={onDone}>
        <Icon icon={PlayIcon} size={16} />
        Try it yourself
      </Button>
    </BoardSheet>
  );
}

/**
 * The car has stood still for a while, away from the green box: the way to
 * start again is offered here, so nobody has to find it in the menu.
 */
function StuckChip({ onRestart }: { onRestart: () => void }) {
  const [stuck, setStuck] = React.useState(false);
  React.useEffect(() => {
    let still = 0;
    const timer = window.setInterval(() => {
      still = hasMoved() && Math.abs(car.speed) < 0.2 ? still + 0.5 : 0;
      setStuck(still >= 5);
    }, 500);
    return () => window.clearInterval(timer);
  }, []);
  if (!stuck) return null;
  return (
    <div className="dr-rise pointer-events-none absolute inset-x-0 bottom-[calc(13.5rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-3">
      <button
        type="button"
        onClick={onRestart}
        className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-md border-2 border-[#17181b] bg-[#f6c416] px-4 text-[14px] font-bold text-[#17181b] outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <Icon icon={RefreshIcon} size={16} />
        Stuck? Start again
      </button>
    </div>
  );
}

const hudButton =
  "inline-flex size-11 items-center justify-center rounded-md border-2 border-white/15 bg-[#101114]/85 outline-none transition-colors hover:bg-white/15 focus-visible:border-white";
const moreItem =
  "flex min-h-11 items-center gap-2.5 rounded-sm px-2.5 text-left text-[14px] font-semibold text-white outline-none transition-colors hover:bg-white/10 focus-visible:bg-white/10";

/** Said once, on a learner's first drive. */
const COACH_STEPS = [
  "Push the joystick toward where you want to go. Let go to stop.",
  "The green box is where the task ends. Stop inside it. The small map shows where it is.",
  "Stuck? Hint shows the next step, or drives the task for you to watch.",
] as const;

/**
 * The game itself: the table, the examiner's task and the joystick, filling
 * the screen. It draws nothing until the store has a round or a lesson open,
 * which the play page starts.
 */
export function BoardGame() {
  const s = useBoardStore(
    useShallow((st) => ({
      settings: st.settings,
      progress: st.progress,
      overlayOpen: st.overlayOpen,
      mode: st.mode,
      level: st.level,
      phase: st.phase,
      queue: st.queue,
      pos: st.pos,
      faults: st.faults,
      taskFaults: st.taskFaults,
      tries: st.tries,
      hinted: st.hinted,
      bestStars: st.bestStars,
      fault: st.fault,
      notice: st.notice,
      lastStars: st.lastStars,
      offRoute: st.offRoute,
      missed: st.missed,
      lastScore: st.lastScore,
      lastSeconds: st.lastSeconds,
      lastPar: st.lastPar,
      lastBest: st.lastBest,
      attempt: st.attempt,
      lanes: st.lanes,
      pickCar: st.pickCar,
      putBack: st.putBack,
      runClean: st.runClean,
      runFaulted: st.runFaulted,
      runFaultRules: st.runFaultRules,
      runBestStreak: st.runBestStreak,
      start: st.start,
      retry: st.retry,
      restart: st.restart,
      next: st.next,
      exit: st.exit,
      learn: st.learn,
      startLevel: st.startLevel,
      hint: st.hint,
      watch: st.watch,
      resume: st.resume,
      resetProgress: st.resetProgress,
    })),
  );
  const [mounted, setMounted] = React.useState(false);
  const [unsupported, setUnsupported] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  // Every level, over the game. Asked for once, it stays loaded.
  const [levelsOpen, setLevelsOpen] = React.useState(false);
  const [levelsAsked, setLevelsAsked] = React.useState(false);
  const openLevels = React.useCallback(() => {
    setLevelsAsked(true);
    setLevelsOpen(true);
  }, []);
  const [wrongStep, setWrongStep] = React.useState<number | null>(null);
  // Asked before a drive that is under way is thrown away.
  const [leaving, setLeaving] = React.useState(false);
  // Restart, Settings and the zoom buttons, behind one button.
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [coachStep, setCoachStep] = React.useState(0);
  const coaching = !s.settings.coached;
  const setSetting = useBoardStore((st) => st.setSetting);
  const endCoach = () => setSetting({ coached: true });
  const navigate = useNavigate();
  // The board is drawn. Until then only the loader shows: no task, no joystick.
  const [painted, setPainted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!s.overlayOpen) setPainted(false);
  }, [s.overlayOpen]);

  // With the settings, the levels or the "leave?" question over the table,
  // the drive holds still: the car, the referee and the clock.
  const held = settingsOpen || levelsOpen || leaving;
  React.useEffect(() => {
    setPaused(held);
    return () => setPaused(false);
  }, [held]);
  // Any new attempt, or the drive ending, withdraws the question.
  React.useEffect(() => {
    setLeaving(false);
    setMoreOpen(false);
  }, [s.phase, s.attempt]);
  const heldRef = React.useRef({ settingsOpen, levelsOpen, leaving });
  heldRef.current = { settingsOpen, levelsOpen, leaving };

  /** Leave the board. Mid-drive, ask first: it is one tap from a restart. */
  const askToLeave = () => {
    const store = useBoardStore.getState();
    if (store.phase === "driving" && hasMoved() && !heldRef.current.leaving) {
      setLeaving(true);
      return;
    }
    setLeaving(false);
    store.exit();
  };
  const askRef = React.useRef(askToLeave);
  askRef.current = askToLeave;

  /** Pause the task and play the right way through it. */
  const showTheWay = (kind: "show_me" | "after_fault") => {
    const current = useBoardStore.getState();
    const task = current.queue[current.pos];
    const at = task ? stepUnderCar(task) : null;
    if (!at) return;
    const wrong = kind === "after_fault" ? at.index : null;
    setWrongStep(wrong);
    s.hint(kind);
    s.watch();
    useStage.getState().watch(at.route, { pauseAt: wrong ?? undefined });
  };

  // Where the learner stands, and whether the car holds its lane, go straight
  // to the drive: the joystick reads them on every step.
  const defaultSeat = useDefaultSeat();
  const seat = s.settings.seat ?? defaultSeat;
  const assist = s.settings.assist ?? true;
  // Drawn once a visit, so a random car stays the same from task to task.
  const [carRoll] = React.useState(() => Math.random());
  const boardCar = resolveCar(s.settings.car, carRoll);
  React.useEffect(() => {
    drive.seat = seat;
    drive.assist = assist;
  }, [seat, assist]);

  const challenge = s.queue[s.pos] ?? null;
  // A lane options level: every car of one road is out, and one is driven at
  // a time. The one being driven is the learner's car for now.
  const lineUp = React.useMemo(
    () => (s.lanes ? queueCars(s.lanes.arm) : null),
    [s.lanes],
  );
  const pickedCar =
    lineUp?.find((one) => one.id === s.lanes?.picked) ?? null;
  const lanesRest = s.lanes?.rest;
  const frontCars = React.useMemo(
    () =>
      lineUp && lanesRest ? pickable(lineUp, Object.keys(lanesRest)) : [],
    [lineUp, lanesRest],
  );
  // An upside-down car a card is talking about (`blocked-roads`).
  const shownBlock = useStage((st) => st.block);
  const standingCars = React.useMemo(
    () =>
      shownBlock
        ? blockCars(shownBlock).map((one) => ({
            car: BOARD_CARS[0].id,
            paint: one.paint ?? CAR_COLORS.red,
            plate: "KCZ 718M",
            x: one.x,
            z: one.z,
            heading: one.heading,
            flipped: true,
          }))
        : lineUp && lanesRest && !pickedCar
          ? lineUp.map((one) => ({
              car: one.car,
              paint: one.paint,
              plate: one.plate,
              ...(lanesRest[one.id] ?? one.start),
              pick: frontCars.includes(one) ? one.id : undefined,
            }))
          : undefined,
    [shownBlock, lineUp, lanesRest, pickedCar, frontCars],
  );
  // The level of the course the game was opened on, if it was.
  const level = levelById(s.level) ?? null;
  // Another level, or none: the picker has done its job.
  React.useEffect(() => setLevelsOpen(false), [s.level]);
  // The first drive: nothing graded, so no clock, no stars and no hints.
  const warmup = level?.kind === "warmup";
  // A lesson car or an Easy level: a miss is "not quite", not an examiner.
  // A broken lane rule ends the attempt there too; only the words are kinder.
  const kindly =
    pickedCar != null || (level?.kind === "drive" && level.difficulty === "Easy");
  // Reading or watching: no task, no clock, no joystick.
  const offClock = s.mode !== "drive";
  const nextUp = level ? levelAfter(level) : undefined;
  const nextRef = React.useRef<string | null>(null);
  nextRef.current = nextUp?.id ?? null;
  // A popup is over the bottom of the screen. On a phone the clock and the
  // minimap step aside for it, so the zoom buttons stay clear above it.
  const sheetUp = s.phase !== "driving";
  // A popup is up, or the leave question: the other controls step back.
  const quiet = sheetUp || leaving;
  const reverseTask =
    challenge != null && isRouteTask(challenge) && challenge.reverse;
  const last = s.pos >= s.queue.length - 1;

  // Lock the page behind the overlay, and give the keyboard its shortcuts.
  React.useEffect(() => {
    if (!s.overlayOpen) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      const store = useBoardStore.getState();
      // The settings sheet closes itself on Escape. It must not take the
      // board with it.
      if (heldRef.current.settingsOpen || heldRef.current.levelsOpen) return;
      if (e.key === "Escape") askRef.current();
      if (e.key === "Enter") {
        if (store.phase === "fault") store.retry();
        if (store.phase === "passed") {
          // A level's pass card goes on to the next level, not a next task.
          if (!store.level) store.next();
          else if (nextRef.current) {
            navigate(levelHref(nextRef.current), { replace: true });
          }
        }
        if (store.phase === "watch") store.resume();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navigate is stable
  }, [s.overlayOpen]);

  // The green box of a parking task moves with the parked cars.
  const layout = useParkingLayout();
  const minimap = React.useMemo(
    () =>
      challenge
        ? fullBoardSvg({
            box: taskGoalBox(challenge),
            seen: seat,
            numbers: false,
            // a blocked way shows on the small map too
            cars: challenge.otherCars
              .filter((other) => other.flipped)
              .map((other) => ({
                x: other.x,
                z: other.z,
                heading: other.heading,
                color: CAR_COLORS.red,
                flipped: true,
              })),
          })
        : "",
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see `layout`
    [challenge, seat, layout],
  );

  const goalBox = React.useMemo(
    () => (challenge ? taskGoalBox(challenge) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see `layout`
    [challenge, layout],
  );
  /** Back the view off to show the car and the finish together. */
  const peek = () => {
    if (!goalBox) return;
    peekAt(
      {
        x0: Math.min(goalBox.x0, car.x - 3),
        x1: Math.max(goalBox.x1, car.x + 3),
        z0: Math.min(goalBox.z0, car.z - 3),
        z1: Math.max(goalBox.z1, car.z + 3),
      },
      seat === "east" || seat === "west",
    );
  };

  const overlay = (
    <div className="fixed inset-0 z-40 overflow-hidden bg-[#101114] text-white">
      {unsupported ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="m-0 max-w-sm text-[15px] leading-snug">
            This phone or browser can't draw the game board. The guides still
            have every lane rule, and the sign trainers work everywhere.
          </p>
          <Button asChild variant="rush">
            {/* a full page load: it leaves the game behind cleanly */}
            <a href="/guides">Read the guides</a>
          </Button>
          <Button variant="paper" onClick={s.exit}>
            Close
          </Button>
        </div>
      ) : (
        <BoardViewer
          challenge={challenge}
          driving={s.phase === "driving"}
          attempt={s.attempt}
          quality={s.settings.quality}
          seat={seat}
          car={pickedCar?.car ?? boardCar}
          paint={pickedCar?.paint}
          extraCars={standingCars}
          learning={offClock}
          focus={s.phase === "fault"}
          // The first go at a task opens on where it ends. A retry does not,
          // and nor does a lesson car, whose line is already on the table.
          sweep={s.tries === 1 && !warmup && !pickedCar && s.mode === "drive"}
          onUnsupported={() => setUnsupported(true)}
          onPainted={() => setPainted(true)}
          className="absolute inset-0"
        />
      )}

      {/* While the table loads there is no task bar yet, so the way out is
          drawn here. Learn and level panels bring their own. */}
      {!unsupported && !painted && s.mode === "drive" && (
        <button
          type="button"
          aria-label="Close"
          onClick={s.exit}
          className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 inline-flex size-11 items-center justify-center rounded-md border-2 border-white/15 bg-[#101114]/85 outline-none transition-colors hover:bg-white/15 focus-visible:border-white sm:right-6 sm:top-5"
        >
          <Icon icon={CloseIcon} size={20} />
        </button>
      )}

      <BoardFps />

      {/* The learner can slide and zoom the view, in a drive and off the clock. */}
      {!unsupported && s.phase !== "complete" && (
        <BoardCameraPad
          seat={seat}
          driving={s.phase === "driving"}
          // In a drive the zoom buttons stand under the minimap instead.
          buttons={offClock}
          buttonsClassName={
            offClock
              ? "top-[max(0.75rem,env(safe-area-inset-top))] sm:top-5"
              : undefined
          }
        />
      )}

      {!unsupported && s.mode === "learn" && (
        <BoardLearn seat={seat} onSettings={() => setSettingsOpen(true)} />
      )}
      {!unsupported && s.mode === "level" && level && (
        <OpenLevelsContext.Provider value={openLevels}>
          <BoardLevel
            key={level.id}
            level={level}
            seat={seat}
            onSettings={() => setSettingsOpen(true)}
          />
        </OpenLevelsContext.Provider>
      )}

      {!unsupported &&
        painted &&
        s.mode === "level" &&
        s.lanes &&
        !settingsOpen && (
          <BoardCarPicks cars={frontCars} onPick={s.pickCar} />
        )}

      {/* The examiner's task, top left. Status and the way out, top right. */}
      {!unsupported && painted && challenge && s.phase !== "complete" && (
        <div
          data-board-hud
          className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5"
        >
          {/* Everything said to the learner while driving stands in this one
              column, one under the other, so nothing lands on anything. */}
          {s.phase === "driving" ? (
            <HudColumn>
              <TaskCard
                key={`${challenge.id}-${s.attempt}`}
                place={
                  level
                    ? `Level ${level.n} of ${COURSE_LEVELS.length}`
                    : `Task ${s.pos + 1} of ${s.queue.length}`
                }
                title={challenge.title}
                prompt={challenge.prompt}
              />
              <TaskHint
                challenge={challenge}
                attempt={s.attempt}
                onNextStep={() => s.hint("next_step")}
                onShowMe={() => showTheWay("show_me")}
                bare={warmup}
              >
                {s.notice && (
                  <StarLost
                    notice={s.notice}
                    lesson={pickedCar != null || warmup}
                  />
                )}
                <BoardSignCue active />
              </TaskHint>
            </HudColumn>
          ) : (
            <span />
          )}

          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="pointer-events-auto flex items-center gap-2">
              {/* A popup owns the screen: only the way out stays beside it. */}
              {!quiet && (
                <button
                  type="button"
                  aria-label="More: restart, settings, zoom"
                  aria-expanded={moreOpen}
                  aria-controls="board-more"
                  onClick={() => setMoreOpen((v) => !v)}
                  className={cn(hudButton, moreOpen && "border-white bg-white/15")}
                >
                  <Icon icon={MenuIcon} size={20} />
                </button>
              )}
              <button
                type="button"
                aria-label="Close"
                onClick={askToLeave}
                className={hudButton}
              >
                <Icon icon={CloseIcon} size={20} />
              </button>
            </div>
            {moreOpen && !quiet && (
              <div
                id="board-more"
                className="dr-rise pointer-events-auto grid w-48 gap-1 rounded-md border-2 border-white/15 bg-[#101114]/95 p-1.5"
              >
                <button
                  type="button"
                  className={moreItem}
                  onClick={() => {
                    setMoreOpen(false);
                    s.restart();
                  }}
                >
                  <Icon icon={RefreshIcon} size={18} />
                  Restart
                </button>
                {pickedCar && (
                  <button
                    type="button"
                    className={moreItem}
                    onClick={() => {
                      setMoreOpen(false);
                      s.putBack();
                    }}
                  >
                    <Icon icon={ChevronLeftIcon} size={18} />
                    Put it back
                  </button>
                )}
                {level && (
                  <button
                    type="button"
                    className={moreItem}
                    onClick={() => {
                      setMoreOpen(false);
                      openLevels();
                    }}
                  >
                    <Icon icon={GridIcon} size={18} />
                    All levels
                  </button>
                )}
                <button
                  type="button"
                  className={moreItem}
                  onClick={() => {
                    setMoreOpen(false);
                    setSettingsOpen(true);
                  }}
                >
                  <Icon icon={SettingsIcon} size={18} />
                  Settings
                </button>
                <BoardZoomButtons
                  driving
                  className="flex-row justify-between border-t border-white/15 pt-1.5 [&>button]:flex-1"
                />
              </div>
            )}
            {/* A car from a line-up is a lesson: no clock, no stars. */}
            {!pickedCar && !warmup && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md border-2 border-white/15 bg-[#101114]/85 px-2.5 py-1.5 font-mono text-[12px] font-bold",
                  sheetUp && "max-sm:hidden",
                )}
              >
                <Clock
                  running={s.phase === "driving" && !held}
                  key={s.attempt}
                />
                {/* Off its route the drive cannot pass, so there are no stars to show. */}
                {s.offRoute ? (
                  <span
                    role="status"
                    data-msg="off-route"
                    className="rounded-sm bg-[#f6c416] px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-[#17181b]"
                  >
                    Off route
                  </span>
                ) : (
                  <Stars count={Math.max(1, 3 - s.faults)} />
                )}
              </div>
            )}
            {goalBox && (
              <div className={cn(sheetUp && "max-sm:hidden")}>
                <Minimap
                  svg={minimap}
                  live={s.phase === "driving"}
                  seat={seat}
                  finish={{
                    x: (goalBox.x0 + goalBox.x1) / 2,
                    z: (goalBox.z0 + goalBox.z1) / 2,
                  }}
                  onPeek={peek}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* First drive only: three short tips, one at a time. */}
      {!unsupported &&
        painted &&
        coaching &&
        !warmup &&
        s.mode === "drive" &&
        s.phase === "driving" &&
        !held && (
          <div
            role="status"
            className="dr-rise absolute inset-x-0 bottom-[calc(13.5rem+env(safe-area-inset-bottom))] z-30 mx-auto w-[min(19rem,calc(100%-1.5rem))] rounded-md border-2 border-[#17181b] bg-[#f6c416] p-3 text-[#17181b] shadow-[0_6px_0_rgba(0,0,0,0.45)]"
          >
            <p className="m-0 text-[14px] font-bold leading-snug">
              {COACH_STEPS[coachStep]}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-widest">
                Tip {coachStep + 1} of {COACH_STEPS.length}
              </span>
              <span className="flex items-center gap-1">
                {coachStep < COACH_STEPS.length - 1 && (
                  <button
                    type="button"
                    onClick={endCoach}
                    className="min-h-11 px-3 font-mono text-[11px] font-bold uppercase tracking-widest underline underline-offset-4 outline-none"
                  >
                    Skip
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    coachStep < COACH_STEPS.length - 1
                      ? setCoachStep((n) => n + 1)
                      : endCoach()
                  }
                  className="min-h-11 rounded-md bg-[#17181b] px-4 font-mono text-[11px] font-bold uppercase tracking-widest text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {coachStep < COACH_STEPS.length - 1 ? "Next" : "Got it"}
                </button>
              </span>
            </div>
          </div>
        )}

      {!unsupported &&
        painted &&
        challenge &&
        s.phase === "driving" &&
        !settingsOpen && (
          <BoardFinishCue parks={taskParks(challenge)} onPeek={peek} />
        )}
      {!unsupported && painted && s.mode === "drive" && (
        <BoardControls
          active={s.phase === "driving" && !held}
          reverse={reverseTask}
          quietHint={coaching && !warmup}
          note={
            reverseTask
              ? "To reverse: stop, pull the joystick back and hold it. The back of the car goes where you point."
              : undefined
          }
        />
      )}
      {!unsupported &&
        painted &&
        s.mode === "drive" &&
        s.phase === "driving" &&
        !held &&
        !(coaching && !warmup) && (
          <StuckChip key={s.attempt} onRestart={s.restart} />
        )}
      {levelsAsked && level && (
        <React.Suspense fallback={null}>
          <BoardLevelsSheet
            open={levelsOpen}
            onOpenChange={setLevelsOpen}
            level={level}
          />
        </React.Suspense>
      )}
      <BoardSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        seat={seat}
        car={boardCar}
      />

      {/* Leaving mid-drive: one question, so a slip of the thumb costs nothing. */}
      {leaving && s.phase === "driving" && (
        <BoardSheet
          tone="ask"
          strip="Before you go"
          role="alertdialog"
          aria-labelledby="board-leave-title"
        >
          <h2
            id="board-leave-title"
            className="m-0 font-display text-[clamp(22px,5.5vw,28px)] font-extrabold uppercase leading-none tracking-tight"
          >
            Close the board?
          </h2>
          <p className="m-0 text-[13.5px] leading-snug text-ink-2">
            The tasks you have passed are saved. This one starts again next
            time.
          </p>
          <div className="flex gap-2 [&>*]:flex-1">
            <Button
              variant="rush"
              size="lg"
              onClick={() => setLeaving(false)}
              autoFocus
            >
              Keep driving
            </Button>
            <Button variant="paper" size="lg" onClick={askToLeave}>
              Close
            </Button>
          </div>
        </BoardSheet>
      )}

      {/* Stopped by the referee: the rule, and another go. */}
      {s.phase === "fault" && s.fault && (
        <BoardSheet
          tone="fault"
          strip={
            s.missed
              ? "Not a pass"
              : kindly
                ? "Not quite"
                : "The examiner stopped you"
          }
          role="alertdialog"
          aria-labelledby="board-fault-title"
        >
          <h2
            id="board-fault-title"
            className="m-0 font-display text-[clamp(22px,5.5vw,28px)] font-extrabold uppercase leading-none tracking-tight"
          >
            {s.missed ? "You left the route" : faultTip(s.fault).title}
          </h2>
          {challenge && (
            <p className="m-0 text-[13px] leading-snug text-ink-2">
              You were asked: {challenge.prompt}
            </p>
          )}
          <BoardFaultTip tip={faultTip(s.fault)} offRoute={s.missed} />
          {s.missed && s.lastScore != null && (
            <p className="m-0 text-[13.5px] font-semibold leading-snug text-ink">
              Score {s.lastScore} of {SCORE_MAX.toLocaleString("en")}. Not
              saved. You reached the box, but not by the way you were asked to
              go.
            </p>
          )}
          <p className="m-0 flex items-center gap-2 text-[12.5px] font-semibold leading-snug text-ink-2">
            <span
              aria-hidden
              className="inline-block h-1.5 w-7 shrink-0 rounded-full bg-[#ff6b5e]"
            />
            The line on the table is the way you drove.
          </p>
          <Button
            variant="rush"
            size="lg"
            className="w-full"
            onClick={s.retry}
            autoFocus
          >
            <Icon icon={RefreshIcon} size={16} />
            Try again
          </Button>
          <Button
            variant="ink"
            className="w-full"
            onClick={() => showTheWay("after_fault")}
          >
            <Icon icon={PlayIcon} size={14} />
            Watch the right way
          </Button>
          <button
            type="button"
            onClick={pickedCar ? s.putBack : s.exit}
            className="min-h-11 w-full text-center text-[13.5px] font-semibold text-ink-2 underline underline-offset-4 outline-none hover:text-ink focus-visible:text-ink"
          >
            {pickedCar ? "Back to the cars" : "Close"}
          </button>
          {level && !pickedCar && (
            <button
              type="button"
              onClick={openLevels}
              className="-mt-2 flex min-h-11 w-full items-center justify-center text-[13.5px] font-semibold text-ink-2 underline underline-offset-4 outline-none hover:text-ink focus-visible:text-ink"
            >
              All levels
            </button>
          )}
        </BoardSheet>
      )}

      {s.phase === "watch" && (
        <WatchCard wrongStep={wrongStep} onDone={s.resume} />
      )}

      {s.phase === "passed" && challenge && (
        <BoardSheet
          tone="pass"
          role="status"
          strip={
            warmup ? (
              "Done"
            ) : (
              <>
                Passed
                <Stars count={s.lastStars} />
              </>
            )
          }
        >
          <h2 className="m-0 font-display text-[clamp(22px,5.5vw,28px)] font-extrabold uppercase leading-none tracking-tight">
            {warmup
              ? "You can drive it."
              : s.taskFaults === 0
              ? s.hinted
                ? "Passed, with a hint."
                : "Clean, first try."
              : s.tries > 1
                ? `Passed on try ${s.tries}.`
                : challenge.title}
          </h2>
          <p className="m-0 text-[13.5px] leading-snug text-ink-2">
            {warmup
              ? "Push to go, let go to stop. That is all the control there is. Now learn the board you will drive on."
              : s.taskFaults > 0
              ? `You got there with ${s.taskFaults} ${s.taskFaults === 1 ? "mistake" : "mistakes"}. ${level ? "Drive it again for all three stars, or carry on." : "It will come back in a later round."}`
              : s.hinted
                ? level
                  ? "You got there with help. Try it again on your own, or carry on."
                  : "You got there with help. It will come back in a later round, to do on your own."
                : taskParks(challenge)
                  ? "In the bay, inside the lines and straight."
                  : isRouteTask(challenge)
                    ? "Right way, right lane, and you stopped in the box."
                    : "Right lane, right exit, and you stopped in the box."}
          </p>
          {!warmup && s.lastScore != null && (
            <div
              data-msg="score"
              className="space-y-1.5 border-2 border-ink bg-paper-2 p-3 text-left"
            >
              <p className="m-0 flex items-baseline justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                  {s.lastBest ? "Score · New best" : "Score"}
                </span>
                <span className="font-display text-[26px] font-extrabold tabular-nums leading-none text-ink">
                  {s.lastScore.toLocaleString("en")}
                </span>
              </p>
              <p className="m-0 text-[12.5px] leading-snug text-ink-2">
                Time {clockTime(s.lastSeconds)}, par {clockTime(s.lastPar)}.
                Start at {SCORE_MAX.toLocaleString("en")}. Each mistake takes
                150, a hint 100, and time over par up to 400.
              </p>
            </div>
          )}
          {level && <LevelCheer level={level} className="text-ink" />}
          {level && nextUp && (
            <Button
              asChild
              variant="rush"
              size="lg"
              className="h-auto min-h-12 w-full whitespace-normal py-2 text-center leading-snug"
            >
              <Link to={levelHref(nextUp.id)} replace>
                Next: level {nextUp.n}, {nextUp.title}
              </Link>
            </Button>
          )}
          <div className="flex gap-2">
            {level ? (
              <>
                <Button
                  variant="paper"
                  size="lg"
                  className="flex-1"
                  onClick={() => s.startLevel(level.id)}
                >
                  <Icon icon={RefreshIcon} size={16} />
                  Again
                </Button>
                <Button
                  variant="paper"
                  size="lg"
                  className="flex-1"
                  onClick={openLevels}
                >
                  All levels
                </Button>
              </>
            ) : (
              <Button
                variant="rush"
                size="lg"
                className="flex-1"
                onClick={s.next}
                autoFocus
              >
                {last ? "See how you did" : "Next task"}
              </Button>
            )}
            {/* A clean pass is the moment worth sending to someone. */}
            {s.taskFaults === 0 && !s.hinted && !warmup && (
              <ShareButton
                surface="board_task_passed"
                payload={{ kind: "board", total: 1, firstTry: 1 }}
              />
            )}
          </div>
        </BoardSheet>
      )}

      {s.phase === "complete" && (
        <React.Suspense fallback={null}>
          <TrainerResultCard
            trainer="board"
            selfGraded
            scope="round"
            signsTotal={s.queue.length}
            recalled={s.queue.length}
            firstTry={s.runClean.length}
            missed={s.runFaulted.map((id) => ({
              id,
              name: BOARD_CHALLENGES.find((c) => c.id === id)?.title ?? id,
            }))}
            poolTotal={POOL}
            counts={signCounts(s.progress, BOARD_CHALLENGE_IDS)}
            bestStreak={s.runBestStreak}
            summary={
              s.runFaulted.length > 0
                ? `${s.runClean.length} of ${s.queue.length} tasks clean. These rules stopped you:`
                : s.runClean.length === s.queue.length
                  ? "Every task on the first try."
                  : `${s.runClean.length} of ${s.queue.length} tasks clean. The rest took a hint.`
            }
            missedSlot={
              <ul className="m-0 grid list-none gap-1.5 p-0 text-left">
                {s.runFaultRules.map((id) => (
                  <li
                    key={id}
                    className="border-2 border-ink bg-paper-2 px-3 py-2 text-[13px] font-semibold leading-snug text-ink"
                  >
                    {faultRule(id)}
                  </li>
                ))}
              </ul>
            }
            nextLabel="Drive another round"
            crossLink={{
              to: "/road-signs/pelican",
              label: "Learn the signs on the board",
            }}
            share={{
              surface: "board_complete",
              payload: {
                kind: "board",
                total: s.queue.length,
                firstTry: s.runClean.length,
              },
            }}
            onDrill={() => s.start(s.runFaulted)}
            onNext={() => s.start()}
            onResetMastery={s.resetProgress}
            onExit={s.exit}
          />
        </React.Suspense>
      )}
    </div>
  );

  return mounted && s.overlayOpen ? createPortal(overlay, document.body) : null;
}
