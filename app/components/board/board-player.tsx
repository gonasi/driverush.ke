/**
 * The Model Town Board trainer on its page. Before a run it is a still picture
 * of the board (in the server's HTML) with one Start button. Start opens a
 * fullscreen overlay with the table, the examiner's task and the joystick.
 * The store (`board-store.ts`) owns the run; this is the shell.
 */
import * as React from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/react/shallow";

import { resolveCar } from "~/lib/board/cars";
import { faultRule, faultTip } from "~/lib/board/board-rules";
import {
  BOARD_CHALLENGES,
  isRouteTask,
  type BoardChallenge,
} from "~/lib/board/challenges";
import {
  BOUNDS,
  CAR_COLORS,
  COLORS,
  fullBoardSvg,
  placeOnPage,
} from "~/lib/board/full-board";
import { laneBearing, lanePoint } from "~/lib/board/geometry";
import type { Seat } from "~/lib/board/joystick";
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
import { peekAt, useStage } from "~/lib/board/stage";
import { BOARD_CHALLENGE_IDS, useBoardStore } from "~/lib/board-store";
import { signCounts } from "~/lib/pelican-progress";
import { cn } from "~/lib/utils";

import { Icon } from "~/components/brand/icon";
import {
  CloseIcon,
  InfoIcon,
  LearnerIcon,
  PlayIcon,
  RefreshIcon,
  SettingsIcon,
  StarIcon,
} from "~/components/brand/icons";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import {
  BoardCameraPad,
  BoardZoomButtons,
} from "~/components/board/board-camera";
import { BoardControls } from "~/components/board/board-controls";
import { BoardFaultTip } from "~/components/board/board-fault-tip";
import { BoardFinishCue } from "~/components/board/board-finish-cue";
import { BoardFps } from "~/components/board/board-fps";
import { BoardLearn } from "~/components/board/board-learn";
import { BoardPlayback, routeLines } from "~/components/board/board-playback";
import { BoardSettingsSheet } from "~/components/board/board-settings-sheet";
import { BoardSheet } from "~/components/board/board-sheet";
import { BoardSignCue } from "~/components/board/board-sign-cue";
import { BoardViewer } from "~/components/board/board-viewer";

// Only needed at the end of a round, and it brings framer-motion with it, so
// people who land here to read the guide never download it.
const TrainerResultCard = React.lazy(() =>
  import("~/components/brand/trainer-result-card").then((m) => ({
    default: m.TrainerResultCard,
  })),
);

const POOL = BOARD_CHALLENGES.length;

/** The tasks by what they practise, for choosing one to drive. */
const TASK_GROUPS = [
  {
    title: "At the roundabout",
    tasks: BOARD_CHALLENGES.filter((c) => !isRouteTask(c)),
  },
  {
    title: "Routes",
    tasks: BOARD_CHALLENGES.filter(
      (c) => isRouteTask(c) && !/^(park|leave)-/.test(c.id),
    ),
  },
  {
    title: "Parking",
    tasks: BOARD_CHALLENGES.filter(
      (c) => isRouteTask(c) && /^(park|leave)-/.test(c.id),
    ),
  },
].filter((group) => group.tasks.length > 0);

/**
 * The still board, lying the way it does on a wide screen: the yellow car on
 * its start line, the red car parked.
 */
const POSTER = (() => {
  const start = lanePoint("S", "approach", 2, 50);
  const red = BOARD_CHALLENGES.find((c) => c.otherCars.length > 0)
    ?.otherCars[0];
  return fullBoardSvg({
    seen: "east",
    cover: true,
    cars: [
      {
        ...start,
        heading: laneBearing("S", "approach"),
        color: CAR_COLORS.player,
      },
      ...(red ? [{ ...red, color: CAR_COLORS.red }] : []),
    ],
  });
})();

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

/** Time on this attempt. It only informs; nobody fails on the clock. */
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
  children,
}: {
  challenge: BoardChallenge;
  attempt: number;
  onNextStep: () => void;
  onShowMe: () => void;
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
      <div className="pointer-events-auto flex flex-wrap gap-1.5">
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
 * itself away once it has been read, so it leaves no gap in the column.
 */
function StarLost({ notice }: { notice: { fault: Fault; n: number } }) {
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
        {tip.title} · 1 star lost
      </p>
      <p className="m-0 mt-1 text-[13.5px] font-semibold leading-snug">
        {tip.rule}
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

export function BoardPlayer({
  className,
  posterClassName = "aspect-[4/3] sm:aspect-video",
}: {
  className?: string;
  /** The still board's shape. The home page keeps it shallow on a wide screen. */
  posterClassName?: string;
}) {
  const s = useBoardStore(
    useShallow((st) => ({
      settings: st.settings,
      progress: st.progress,
      overlayOpen: st.overlayOpen,
      mode: st.mode,
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
      attempt: st.attempt,
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
      hint: st.hint,
      watch: st.watch,
      resume: st.resume,
      resetProgress: st.resetProgress,
    })),
  );
  const [mounted, setMounted] = React.useState(false);
  const [unsupported, setUnsupported] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [wrongStep, setWrongStep] = React.useState<number | null>(null);
  // Asked before a drive that is under way is thrown away.
  const [leaving, setLeaving] = React.useState(false);
  const [picking, setPicking] = React.useState(false);
  // The board is drawn. Until then only the loader shows: no task, no joystick.
  const [painted, setPainted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!s.overlayOpen) setPainted(false);
  }, [s.overlayOpen]);

  // With the settings or the "leave?" question over the table, the drive
  // holds still: the car, the referee and the clock.
  const held = settingsOpen || leaving;
  React.useEffect(() => {
    setPaused(held);
    return () => setPaused(false);
  }, [held]);
  // Any new attempt, or the drive ending, withdraws the question.
  React.useEffect(() => {
    setLeaving(false);
  }, [s.phase, s.attempt]);
  const heldRef = React.useRef({ settingsOpen, leaving });
  heldRef.current = { settingsOpen, leaving };

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
  // A popup is over the bottom of the screen. On a phone the clock and the
  // minimap step aside for it, so the zoom buttons stay clear above it.
  const sheetUp = s.phase !== "driving";
  const reverseTask =
    challenge != null && isRouteTask(challenge) && challenge.reverse;
  const counts = signCounts(mounted ? s.progress : {}, BOARD_CHALLENGE_IDS);
  const started = counts.known + counts.learning > 0;
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
      if (heldRef.current.settingsOpen) return;
      if (e.key === "Escape") askRef.current();
      if (e.key === "Enter") {
        if (store.phase === "fault") store.retry();
        if (store.phase === "passed") store.next();
        if (store.phase === "watch") store.resume();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", onKey);
    };
  }, [s.overlayOpen]);

  const minimap = React.useMemo(
    () =>
      challenge
        ? fullBoardSvg({
            box: taskGoalBox(challenge),
            seen: seat,
            numbers: false,
          })
        : "",
    [challenge, seat],
  );

  const goalBox = React.useMemo(
    () => (challenge ? taskGoalBox(challenge) : null),
    [challenge],
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
            This phone or browser can't draw the game board. The guide below the
            trainer still has the lane rules, and the sign trainers work
            everywhere.
          </p>
          <Button variant="paper" onClick={s.exit}>
            Back to the guide
          </Button>
        </div>
      ) : (
        <BoardViewer
          challenge={challenge}
          driving={s.phase === "driving"}
          attempt={s.attempt}
          quality={s.settings.quality}
          seat={seat}
          car={boardCar}
          learning={s.mode === "learn"}
          focus={s.phase === "fault"}
          onUnsupported={() => setUnsupported(true)}
          onPainted={() => setPainted(true)}
          className="absolute inset-0"
        />
      )}

      <BoardFps />

      {/* The learner can slide and zoom the view, in a drive and off the clock. */}
      {!unsupported && s.phase !== "complete" && (
        <BoardCameraPad
          seat={seat}
          driving={s.phase === "driving"}
          // In a drive the zoom buttons stand under the minimap instead.
          buttons={s.mode === "learn"}
          buttonsClassName={
            s.mode === "learn"
              ? "top-[max(0.75rem,env(safe-area-inset-top))] sm:top-5"
              : undefined
          }
        />
      )}

      {!unsupported && s.mode === "learn" && (
        <BoardLearn seat={seat} onSettings={() => setSettingsOpen(true)} />
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
                place={`Task ${s.pos + 1} of ${s.queue.length}`}
                title={challenge.title}
                prompt={challenge.prompt}
              />
              <TaskHint
                challenge={challenge}
                attempt={s.attempt}
                onNextStep={() => s.hint("next_step")}
                onShowMe={() => showTheWay("show_me")}
              >
                {s.notice && <StarLost notice={s.notice} />}
                <BoardSignCue active />
              </TaskHint>
            </HudColumn>
          ) : (
            <span />
          )}

          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                aria-label="Restart this task"
                onClick={s.restart}
                disabled={s.phase !== "driving"}
                className="inline-flex size-11 items-center justify-center rounded-md border-2 border-white/15 bg-[#101114]/85 outline-none transition-colors hover:bg-white/15 focus-visible:border-white disabled:opacity-40"
              >
                <Icon icon={RefreshIcon} size={20} />
              </button>
              <button
                type="button"
                aria-label="Board settings: where you stand, your car, lane assist, sound"
                onClick={() => setSettingsOpen(true)}
                className="inline-flex size-11 items-center justify-center rounded-md border-2 border-white/15 bg-[#101114]/85 outline-none transition-colors hover:bg-white/15 focus-visible:border-white"
              >
                <Icon icon={SettingsIcon} size={20} />
              </button>
              <button
                type="button"
                aria-label="Exit the board"
                onClick={askToLeave}
                className="inline-flex size-11 items-center justify-center rounded-md border-2 border-white/15 bg-[#101114]/85 outline-none transition-colors hover:bg-white/15 focus-visible:border-white"
              >
                <Icon icon={CloseIcon} size={20} />
              </button>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 rounded-md border-2 border-white/15 bg-[#101114]/85 px-2.5 py-1.5 font-mono text-[12px] font-bold",
                sheetUp && "max-sm:hidden",
              )}
            >
              <Clock running={s.phase === "driving" && !held} key={s.attempt} />
              <Stars count={Math.max(1, 3 - s.faults)} />
            </div>
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
            <BoardZoomButtons
              driving={s.phase === "driving"}
              className="pointer-events-auto"
            />
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
          note={
            reverseTask
              ? "To reverse: stop, pull the joystick back and hold it. The back of the car goes where you point."
              : undefined
          }
        />
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
            Leave the board?
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
              Leave
            </Button>
          </div>
        </BoardSheet>
      )}

      {/* Stopped by the referee: the rule, and another go. */}
      {s.phase === "fault" && s.fault && (
        <BoardSheet
          tone="fault"
          strip="The examiner stopped you"
          role="alertdialog"
          aria-labelledby="board-fault-title"
        >
          <h2
            id="board-fault-title"
            className="m-0 font-display text-[clamp(22px,5.5vw,28px)] font-extrabold uppercase leading-none tracking-tight"
          >
            {faultTip(s.fault).title}
          </h2>
          {challenge && (
            <p className="m-0 text-[13px] leading-snug text-ink-2">
              You were asked: {challenge.prompt}
            </p>
          )}
          <BoardFaultTip tip={faultTip(s.fault)} />
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
            onClick={s.exit}
            className="min-h-11 w-full text-center text-[13.5px] font-semibold text-ink-2 underline underline-offset-4 outline-none hover:text-ink focus-visible:text-ink"
          >
            Stop for now
          </button>
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
            <>
              Passed
              <Stars count={s.lastStars} />
            </>
          }
        >
          <h2 className="m-0 font-display text-[clamp(22px,5.5vw,28px)] font-extrabold uppercase leading-none tracking-tight">
            {s.taskFaults === 0
              ? s.hinted
                ? "Passed, with a hint."
                : "Clean, first try."
              : s.tries > 1
                ? `Passed on try ${s.tries}.`
                : challenge.title}
          </h2>
          <p className="m-0 text-[13.5px] leading-snug text-ink-2">
            {s.taskFaults > 0
              ? `You got there with ${s.taskFaults} ${s.taskFaults === 1 ? "mistake" : "mistakes"}. It will come back in a later round.`
              : s.hinted
                ? "You got there with help. It will come back in a later round, to do on your own."
                : taskParks(challenge)
                  ? "In the bay, inside the lines and straight."
                  : isRouteTask(challenge)
                    ? "Right way, right lane, and you stopped in the box."
                    : "Right lane, right exit, and you stopped in the box."}
          </p>
          <Button variant="rush" size="lg" onClick={s.next} autoFocus>
            {last ? "See how you did" : "Next task"}
          </Button>
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
            onDrill={() => s.start(s.runFaulted)}
            onNext={() => s.start()}
            onResetMastery={s.resetProgress}
            onExit={s.exit}
          />
        </React.Suspense>
      )}
    </div>
  );

  return (
    <>
      <div className={cn("border-2 border-ink", className)}>
        <button
          type="button"
          onClick={() => s.start()}
          aria-label="Start driving the Model Town Board"
          className={cn(
            "group relative block w-full overflow-hidden outline-none",
            posterClassName,
          )}
          style={{ backgroundColor: COLORS.grass }}
        >
          <span
            role="img"
            aria-label="The Model Town Board from above: a four-lane dual carriageway and a three-lane road meet at a roundabout, with each lane numbered from the kerb. Beside them are the parking zone, a street, and a two-way road with pedestrian crossings."
            className="block size-full [&>svg]:block [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: POSTER }}
          />
          <span className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors duration-200 group-hover:bg-ink/15 group-focus-visible:bg-ink/15">
            <span className="flex size-16 items-center justify-center rounded-full border-2 border-ink bg-rush text-white shadow-stamp">
              <Icon icon={PlayIcon} size={26} />
            </span>
          </span>
        </button>
        <div className="grid gap-3 border-t-2 border-ink bg-surface p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="rush"
              size="lg"
              className="w-full"
              onClick={() => s.start()}
            >
              <Icon icon={PlayIcon} size={18} />
              {started ? "Keep driving" : "Start driving"}
            </Button>
            <Button
              variant="ink"
              size="lg"
              className="w-full"
              onClick={s.learn}
            >
              <Icon icon={LearnerIcon} size={18} />
              Learn the board
            </Button>
          </div>
          <div>
            <button
              type="button"
              aria-expanded={picking}
              aria-controls="board-task-list"
              onClick={() => setPicking((v) => !v)}
              className="flex min-h-11 w-full items-center justify-between gap-3 border-2 border-ink bg-paper-2 px-3.5 py-2 text-left font-mono text-[11px] font-bold uppercase tracking-widest text-ink outline-none transition-colors hover:bg-paper-3 focus-visible:bg-paper-3"
            >
              Choose a task
              <span aria-hidden className="text-[15px] leading-none">
                {picking ? "−" : "+"}
              </span>
            </button>
            {picking && (
              <div id="board-task-list" className="dr-rise mt-3 grid gap-4">
                {TASK_GROUPS.map((group) => (
                  <section key={group.title} aria-label={group.title}>
                    <h3 className="m-0 mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-3">
                      {group.title}
                    </h3>
                    <ul className="m-0 grid list-none gap-1.5 p-0 sm:grid-cols-2">
                      {group.tasks.map((task) => {
                        const best = mounted ? (s.bestStars[task.id] ?? 0) : 0;
                        return (
                          <li key={task.id}>
                            <button
                              type="button"
                              onClick={() => s.start([task.id])}
                              className="flex min-h-11 w-full items-center justify-between gap-3 border-2 border-ink bg-surface px-3 py-2 text-left text-[13.5px] font-semibold leading-snug text-ink outline-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2"
                            >
                              {task.title}
                              <span
                                role="img"
                                aria-label={
                                  best > 0
                                    ? `Best: ${best} of 3 stars`
                                    : "Not driven yet"
                                }
                                className="inline-flex shrink-0 gap-0.5"
                              >
                                {[1, 2, 3].map((n) => (
                                  <Icon
                                    key={n}
                                    icon={StarIcon}
                                    size={14}
                                    className={
                                      n <= best
                                        ? "text-kenya-gold"
                                        : "text-ink/20"
                                    }
                                  />
                                ))}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
          {started ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                <span>
                  {counts.known} known · {counts.learning} learning
                </span>
                <span className="tabular-nums">of {POOL} tasks</span>
              </div>
              <Progress
                value={(counts.known / POOL) * 100}
                tone="green"
                showTicks={false}
                aria-label="Board tasks known"
                className="h-3"
              />
            </div>
          ) : (
            <p className="m-0 text-center font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              {POOL} tasks to drive · every lane, route and parking move to
              watch
            </p>
          )}
        </div>
      </div>
      {mounted && s.overlayOpen && createPortal(overlay, document.body)}
    </>
  );
}
