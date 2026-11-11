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
} from "~/lib/board/lessons";
import { distanceNear, poseAt, stepPoints } from "~/lib/board/network";
import { car, drive, elapsedSeconds } from "~/lib/board/runtime";
import { useStage } from "~/lib/board/stage";
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
import { BoardCameraPad } from "~/components/board/board-camera";
import { BoardControls } from "~/components/board/board-controls";
import { BoardFaultTip } from "~/components/board/board-fault-tip";
import { BoardLearn } from "~/components/board/board-learn";
import {
  BoardPlayback,
  routeLines,
} from "~/components/board/board-playback";
import { BoardSettingsSheet } from "~/components/board/board-settings-sheet";
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
}: {
  svg: string;
  live: boolean;
  seat: Seat;
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
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-md border-2 border-white/80 shadow-[0_3px_0_rgba(0,0,0,0.45)]",
        sideways ? "w-28 sm:w-40" : "w-[4.5rem] sm:w-24",
      )}
      style={{ aspectRatio: sideways ? 1 / BOARD_ASPECT : BOARD_ASPECT }}
    >
      <div
        className="size-full [&>svg]:block [&>svg]:size-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <span
        ref={dot}
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-kenya-gold"
      />
    </div>
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
}: {
  challenge: BoardChallenge;
  attempt: number;
  onNextStep: () => void;
  onShowMe: () => void;
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
    <div className="pointer-events-auto mt-2 max-w-[19rem]">
      {tip && (
        <div
          role="status"
          className="dr-rise mb-2 rounded-md border-2 border-[#f6c416] bg-[#101114]/90 px-3.5 py-2.5 shadow-[0_4px_0_rgba(0,0,0,0.4)]"
        >
          <p className="m-0 text-[14px] font-bold leading-snug">{tip.title}</p>
          <p className="m-0 mt-1 text-[13px] leading-snug text-white/80">
            {tip.why}
          </p>
          {tip.then && (
            <p className="m-0 mt-1.5 text-[12.5px] font-semibold leading-snug text-kenya-gold">
              Then: {tip.then}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
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
    <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-8">
      <div
        role="region"
        aria-label="The right way through this task"
        className="dr-rise w-full max-w-md rounded-md border-2 border-white/20 bg-[#101114]/95 p-4 text-white shadow-[0_6px_0_rgba(0,0,0,0.45)]"
      >
        <p className="m-0 mb-3 font-mono text-[10.5px] font-bold uppercase tracking-widest text-white/60">
          The right way, step by step
        </p>
        <BoardPlayback
          note={
            wrongStep !== null && step === wrongStep
              ? "This is about where it went wrong."
              : null
          }
        />
        <Button
          variant="rush"
          size="lg"
          className="mt-4 w-full"
          onClick={onDone}
        >
          <Icon icon={PlayIcon} size={16} />
          Try it yourself
        </Button>
      </div>
    </div>
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
  React.useEffect(() => setMounted(true), []);

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
      if (e.key === "Escape") store.exit();
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
          onUnsupported={() => setUnsupported(true)}
          className="absolute inset-0"
        />
      )}

      {/* Off the clock the learner can slide and zoom the view. */}
      {!unsupported && s.phase !== "driving" && s.phase !== "complete" && (
        <BoardCameraPad
          seat={seat}
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
      {!unsupported && challenge && s.phase !== "complete" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
          <div>
            <div
              key={`${challenge.id}-${s.attempt}`}
              className="dr-rise max-w-[19rem] rounded-md border-2 border-white/15 bg-[#101114]/85 px-3.5 py-3 shadow-[0_4px_0_rgba(0,0,0,0.4)]"
            >
              <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-widest text-kenya-gold">
                Task {s.pos + 1} of {s.queue.length} · {challenge.title}
              </p>
              <p className="m-0 mt-1.5 text-[14.5px] font-semibold leading-snug">
                {challenge.prompt}
              </p>
            </div>
            {s.phase === "driving" && isRouteTask(challenge) && challenge.reverse && (
              <p className="m-0 mt-2 max-w-[19rem] rounded-md border-2 border-white/15 bg-[#101114]/85 px-3 py-2 text-[12.5px] font-semibold leading-snug">
                To reverse: stop, then pull the joystick back and hold it. The
                back of the car goes where you point.
              </p>
            )}
            {s.phase === "driving" && (
              <TaskHint
                challenge={challenge}
                attempt={s.attempt}
                onNextStep={() => s.hint("next_step")}
                onShowMe={() => showTheWay("show_me")}
              />
            )}
          </div>

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
                onClick={s.exit}
                className="inline-flex size-11 items-center justify-center rounded-md border-2 border-white/15 bg-[#101114]/85 outline-none transition-colors hover:bg-white/15 focus-visible:border-white"
              >
                <Icon icon={CloseIcon} size={20} />
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-md border-2 border-white/15 bg-[#101114]/85 px-2.5 py-1.5 font-mono text-[12px] font-bold">
              <Clock running={s.phase === "driving"} key={s.attempt} />
              <Stars count={Math.max(1, 3 - s.faults)} />
            </div>
            <Minimap svg={minimap} live={s.phase === "driving"} seat={seat} />
          </div>
        </div>
      )}

      {/* A small mistake: the rule, a star gone, and the drive carries on. */}
      {s.phase === "driving" && s.notice && (
        <div
          key={s.notice.n}
          role="status"
          className="dr-flash pointer-events-none absolute inset-x-0 top-[42%] z-20 flex justify-center px-4"
          // Long enough to read a one-line rule.
          style={{ animationDuration: "3.6s" }}
        >
          <div className="max-w-xs rounded-md border-2 border-[#17181b] bg-[#f6c416] px-3.5 py-2.5 text-center text-[#17181b] shadow-[0_4px_0_rgba(0,0,0,0.45)]">
            <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-widest">
              {faultTip(s.notice.fault).title} · 1 star lost
            </p>
            <p className="m-0 mt-1 text-[13.5px] font-semibold leading-snug">
              {faultTip(s.notice.fault).rule}
            </p>
          </div>
        </div>
      )}

      {!unsupported && s.mode === "drive" && challenge && (
        <BoardSignCue challenge={challenge} active={s.phase === "driving"} />
      )}
      {!unsupported && s.mode === "drive" && (
        <BoardControls active={s.phase === "driving" && !settingsOpen} />
      )}
      <BoardSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        seat={seat}
        car={boardCar}
      />

      {/* Stopped by the referee: the rule, and another go. */}
      {s.phase === "fault" && s.fault && (
        <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-8">
          <div
            role="alertdialog"
            aria-labelledby="board-fault-title"
            className="dr-rise w-full max-w-md border-2 border-ink bg-surface text-ink shadow-stamp-xl"
          >
            <p className="m-0 bg-rush px-4 py-2 font-mono text-[10.5px] font-bold uppercase tracking-widest text-white">
              The examiner stopped you
            </p>
            <div className="grid gap-3 p-4">
              <h2
                id="board-fault-title"
                className="m-0 font-display text-[clamp(22px,5.5vw,28px)] font-extrabold uppercase leading-none tracking-tight"
              >
                {faultTip(s.fault).title}
              </h2>
              <BoardFaultTip tip={faultTip(s.fault)} />
              <div className="flex gap-2 [&>*]:flex-1">
                <Button variant="rush" size="lg" onClick={s.retry} autoFocus>
                  <Icon icon={RefreshIcon} size={16} />
                  Try again
                </Button>
                <Button variant="paper" size="lg" onClick={s.exit}>
                  Stop
                </Button>
              </div>
              <Button
                variant="ink"
                className="w-full"
                onClick={() => showTheWay("after_fault")}
              >
                <Icon icon={PlayIcon} size={14} />
                Watch the right way
              </Button>
            </div>
          </div>
        </div>
      )}

      {s.phase === "watch" && (
        <WatchCard wrongStep={wrongStep} onDone={s.resume} />
      )}

      {s.phase === "passed" && challenge && (
        <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-8">
          <div
            role="status"
            className="dr-rise w-full max-w-md border-2 border-ink bg-surface text-ink shadow-stamp-xl"
          >
            <p className="m-0 flex items-center justify-between bg-kenya-green px-4 py-2 font-mono text-[10.5px] font-bold uppercase tracking-widest text-kenya-green-foreground">
              Passed
              <Stars count={s.lastStars} />
            </p>
            <div className="grid gap-3 p-4">
              <h2 className="m-0 font-display text-[clamp(22px,5.5vw,28px)] font-extrabold uppercase leading-none tracking-tight">
                {s.faults === 0 ? "Clean, first try." : challenge.title}
              </h2>
              <p className="m-0 text-[13.5px] leading-snug text-ink-2">
                {s.faults === 0
                  ? "Right lane, right exit, and you stopped in the box."
                  : `You got there with ${s.faults} ${s.faults === 1 ? "mistake" : "mistakes"}. It will come back in a later round.`}
              </p>
              <Button variant="rush" size="lg" onClick={s.next} autoFocus>
                {last ? "See how you did" : "Next task"}
              </Button>
            </div>
          </div>
        </div>
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
                : "Every task on the first try."
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
