/**
 * The Model Town Board trainer on its page. Before a run it is a still picture
 * of the board (in the server's HTML) with one Start button. Start opens a
 * fullscreen overlay with the live 3D board, the examiner's task, the wheel and
 * the pedals. The store (`board-store.ts`) owns the run; this is the shell.
 */
import * as React from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/react/shallow";

import { faultRule, faultTip } from "~/lib/board/board-rules";
import { boardSvg, BOARD_COLORS } from "~/lib/board/board-svg";
import { BOARD_CHALLENGES } from "~/lib/board/challenges";
import { laneBearing, lanePoint, BOARD_HALF } from "~/lib/board/geometry";
import { car, elapsedSeconds } from "~/lib/board/runtime";
import { BOARD_CHALLENGE_IDS, useBoardStore } from "~/lib/board-store";
import { signCounts } from "~/lib/pelican-progress";
import { cn } from "~/lib/utils";

import { Icon } from "~/components/brand/icon";
import {
  CloseIcon,
  PlayIcon,
  RefreshIcon,
  StarIcon,
} from "~/components/brand/icons";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { BoardControls } from "~/components/board/board-controls";
import { BoardFaultTip } from "~/components/board/board-fault-tip";
import { BoardViewer } from "~/components/board/board-viewer";

// Only needed at the end of a round, and it brings framer-motion with it, so
// people who land here to read the guide never download it.
const TrainerResultCard = React.lazy(() =>
  import("~/components/brand/trainer-result-card").then((m) => ({
    default: m.TrainerResultCard,
  })),
);

const POOL = BOARD_CHALLENGES.length;

/** The still board: the yellow car on its start line, the red car parked. */
const POSTER = (() => {
  const start = lanePoint("S", "approach", 2, 46);
  const red = BOARD_CHALLENGES.find((c) => c.otherCars.length > 0)
    ?.otherCars[0];
  return boardSvg({
    cover: true,
    cars: [
      {
        ...start,
        heading: laneBearing("S", "approach"),
        color: BOARD_COLORS.player,
      },
      ...(red ? [{ ...red, color: BOARD_COLORS.red }] : []),
    ],
  });
})();

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

/** The whole board, small, with the car as a dot. */
function Minimap({ svg, live }: { svg: string; live: boolean }) {
  const dot = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    let frame = 0;
    const place = () => {
      if (dot.current) {
        const x = ((car.x + BOARD_HALF) / (BOARD_HALF * 2)) * 100;
        const y = ((car.z + BOARD_HALF) / (BOARD_HALF * 2)) * 100;
        dot.current.style.left = `${x.toFixed(1)}%`;
        dot.current.style.top = `${y.toFixed(1)}%`;
      }
      if (live) frame = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(frame);
  }, [live, svg]);
  return (
    <div
      aria-hidden
      className="relative size-[4.75rem] overflow-hidden rounded-full border-2 border-white/80 shadow-[0_3px_0_rgba(0,0,0,0.45)] sm:size-28"
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

export function BoardPlayer({ className }: { className?: string }) {
  const s = useBoardStore(
    useShallow((st) => ({
      settings: st.settings,
      progress: st.progress,
      overlayOpen: st.overlayOpen,
      phase: st.phase,
      queue: st.queue,
      pos: st.pos,
      faults: st.faults,
      fault: st.fault,
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
      resetProgress: st.resetProgress,
    })),
  );
  const [mounted, setMounted] = React.useState(false);
  const [unsupported, setUnsupported] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", onKey);
    };
  }, [s.overlayOpen]);

  const minimap = React.useMemo(
    () => (challenge ? boardSvg({ goal: challenge.goal }) : ""),
    [challenge],
  );

  const overlay = (
    <div className="fixed inset-0 z-40 overflow-hidden bg-[#101114] text-white">
      {unsupported ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="m-0 max-w-sm text-[15px] leading-snug">
            This phone or browser can't draw the 3D board. The guide below the
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
          onUnsupported={() => setUnsupported(true)}
          className="absolute inset-0"
        />
      )}

      {/* The examiner's task, top left. Status and the way out, top right. */}
      {!unsupported && challenge && s.phase !== "complete" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
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

          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Restart this task"
                onClick={s.restart}
                disabled={s.phase !== "driving"}
                className="inline-flex size-9 items-center justify-center rounded-md border-2 border-white/15 bg-[#101114]/85 outline-none transition-colors hover:bg-white/15 focus-visible:border-white disabled:opacity-40"
              >
                <Icon icon={RefreshIcon} size={16} />
              </button>
              <button
                type="button"
                aria-label="Exit the board"
                onClick={s.exit}
                className="inline-flex size-9 items-center justify-center rounded-md border-2 border-white/15 bg-[#101114]/85 outline-none transition-colors hover:bg-white/15 focus-visible:border-white"
              >
                <Icon icon={CloseIcon} size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-md border-2 border-white/15 bg-[#101114]/85 px-2.5 py-1.5 font-mono text-[12px] font-bold">
              <Clock running={s.phase === "driving"} key={s.attempt} />
              <Stars count={Math.max(1, 3 - s.faults)} />
            </div>
            <Minimap svg={minimap} live={s.phase === "driving"} />
          </div>
        </div>
      )}

      {!unsupported && <BoardControls active={s.phase === "driving"} />}

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
            </div>
          </div>
        </div>
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
                  : `You got there after ${s.faults} ${s.faults === 1 ? "stop" : "stops"}. It will come back in a later round.`}
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
          className="group relative block aspect-[4/3] w-full overflow-hidden bg-[#4d9a3c] outline-none sm:aspect-video"
        >
          <span
            role="img"
            aria-label="The Model Town Board from above: a four-lane road and a three-lane road meet at a roundabout, with each lane numbered from the kerb"
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
          <Button
            variant="rush"
            size="lg"
            className="w-full"
            onClick={() => s.start()}
          >
            <Icon icon={PlayIcon} size={18} />
            {started ? "Keep driving" : "Start driving"}
          </Button>
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
              {POOL} tasks · wheel and pedals, or arrow keys
            </p>
          )}
        </div>
      </div>
      {mounted && s.overlayOpen && createPortal(overlay, document.body)}
    </>
  );
}
