import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Icon } from "~/components/brand/icon";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  SettingsIcon,
  DragIcon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
  CheckIcon,
  SoundIcon,
} from "~/components/brand/icons";
import { useShallow } from "zustand/react/shallow";

import { getSignCategory } from "~/lib/signs-3d";
import { ease, transition } from "~/lib/motion";
import { isMastered, signCounts } from "~/lib/pelican-progress";
import { runTally, type RunScope } from "~/lib/trainer-rounds";
import {
  getPracticeSigns,
  selectCanResume,
  useSigns3DStore,
} from "~/lib/signs-3d-store";
import { cn } from "~/lib/utils";

import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "~/components/ui/sheet";
import { RevealCountdown } from "~/components/brand/reveal-countdown";
import { TrainerReadyPanel } from "~/components/brand/trainer-ready-panel";
import { TrainerResultCard } from "~/components/brand/trainer-result-card";
import { Sign3DViewer } from "~/components/brand/sign-3d-viewer";

// --- motion -----------------------------------------------------------------
const ANSWER_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
} satisfies Variants;
const ANSWER_HEADLINE = {
  hidden: { opacity: 0, y: 22, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, ease: ease.snap },
  },
} satisfies Variants;
const ANSWER_ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.34, ease: ease.snap } },
} satisfies Variants;

/**
 * The 3D road-sign recognition trainer — a presentational shell over the Zustand
 * store (`signs-3d-store.ts`), which owns the state machine, timers and audio.
 * The "ready" card is in-page; pressing Start opens an immersive fullscreen
 * overlay (portalled to `<body>`) that renders the sign in 3D — spin it, then
 * name it before the timer drops; the answer drops in a bottom sheet.
 */
export function Sign3DPlayer({
  className,
  link,
  onStart,
}: {
  className?: string;
  /** A deep link to honour, if the learner arrived on one. */
  link: RunScope | null;
  onStart: (scope?: RunScope) => void;
}) {
  const s = useSigns3DStore(
    useShallow((st) => ({
      board: st.board,
      settings: st.settings,
      progress: st.progress,
      overlayOpen: st.overlayOpen,
      running: st.running,
      settingsOpen: st.settingsOpen,
      phase: st.phase,
      queue: st.queue,
      pos: st.pos,
      runRecalled: st.runRecalled,
      runMissed: st.runMissed,
      runMissCount: st.runMissCount,
      runScope: st.runScope,
      countdownLive: st.countdownLive,
      canResume: selectCanResume(st),
      inProgressRun: st.inProgressRun,
      // actions (stable references)
      start: st.start,
      resumeRun: st.resumeRun,
      pause: st.pause,
      resume: st.resume,
      next: st.next,
      prev: st.prev,
      revealNow: st.revealNow,
      gradeAndNext: st.gradeAndNext,
      replaySignAudio: st.replaySignAudio,
      setSettingsOpen: st.setSettingsOpen,
      exit: st.exit,
    })),
  );
  const sign = s.queue[s.pos];

  // Lock body scroll while the fullscreen overlay is open.
  React.useEffect(() => {
    if (!s.overlayOpen || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [s.overlayOpen]);

  // Escape exits the fullscreen overlay.
  React.useEffect(() => {
    if (!s.overlayOpen || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") useSigns3DStore.getState().exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s.overlayOpen]);

  // Tear down timers/audio if the player unmounts. pause() (not exit()) so the
  // saved run survives navigation — the user returns to a Resume CTA.
  React.useEffect(() => () => useSigns3DStore.getState().pause(), []);

  const practiced = React.useMemo(
    () => getPracticeSigns(s.board, s.settings.categories),
    [s.board, s.settings.categories],
  );
  const total = practiced.length;
  const poolIds = React.useMemo(() => practiced.map((r) => r.id), [practiced]);
  const counts = signCounts(s.progress, poolIds);
  const previewSrc = practiced[0]?.modelSrc;

  if (!s.board || total === 0) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center border-2 border-dashed border-ink bg-paper-3 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3",
          className,
        )}
      >
        No signs to practise
      </div>
    );
  }

  const { settings, phase, pos, running } = s;
  const cat = sign ? getSignCategory(sign.category) : null;
  const revealDelay = sign?.revealDelay ?? settings.revealDelay;
  const effectiveRunning =
    s.overlayOpen && running && !s.settingsOpen && phase !== "complete";
  const showCountdown =
    effectiveRunning && phase === "focused" && settings.revealMode === "auto";
  const paused = s.overlayOpen && !running && phase !== "complete";
  const tally = runTally(s.queue, s.runRecalled, s.runMissed);
  const savedRun =
    s.canResume && s.inProgressRun
      ? {
          nextSign: Math.min(
            s.inProgressRun.pos + 2,
            s.inProgressRun.queueIds.length,
          ),
          total: s.inProgressRun.queueIds.length,
        }
      : null;

  // ---------- ready card (not playing) ----------
  if (!s.overlayOpen) {
    return (
      <div className={className}>
        <div className="aspect-video w-full overflow-hidden border-2 border-ink bg-ink">
          <Sign3DViewer
            modelSrc={previewSrc}
            autoRotate
            interactive={false}
            onDark
            loaderLabel="Loading"
          />
        </div>
        <TrainerReadyPanel
          link={link}
          poolSize={total}
          chartSize={total}
          selfGrading={settings.selfGrading}
          counts={counts}
          savedRun={savedRun}
          onStart={onStart}
          onResume={() => s.resumeRun()}
          onSettings={() => s.setSettingsOpen(true)}
        />
      </div>
    );
  }

  // ---------- fullscreen overlay (playing) — portalled to <body> ----------
  const overlay = (
    <motion.div
      className="fixed inset-0 z-40 overflow-hidden bg-ink"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: ease.snap }}
    >
      {/* Stage — the 3D sign fills the viewport; chrome floats on top. The
          answer (name) stays hidden until reveal, so you have to recognise it. */}
      <Sign3DViewer
        modelSrc={sign?.modelSrc}
        onModelReady={useSigns3DStore.getState().markModelVisible}
        yaw={sign?.yaw}
        pitch={sign?.pitch}
        zoom={sign?.zoom}
        autoRotate={settings.autoRotate}
        interactive
        onDark
        loaderLabel="Loading the sign"
        className="absolute inset-0"
      />

      {/* reveal countdown — slim bar pinned above the navbar */}
      {showCountdown && (
        <RevealCountdown
          key={sign?.id ?? "t"}
          seconds={revealDelay}
          live={s.countdownLive}
        />
      )}

      {/* top bar */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-1.5 px-3 pb-2 pt-4"
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...transition.enter, delay: 0.1 }}
      >
        <Button
          variant="paper"
          size="sm"
          onClick={() => s.exit()}
          aria-label="Exit trainer"
          className="pointer-events-auto"
        >
          <Icon icon={CloseIcon} size={14} />
          Exit
        </Button>
        <span className="whitespace-nowrap bg-ink/70 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider tabular-nums text-paper">
          {settings.selfGrading
            ? `${tally.recalled} / ${tally.signsTotal}${s.runMissCount > 0 ? ` · ✗${s.runMissCount}` : ""}`
            : `${pos + 1} / ${s.queue.length}`}
        </span>
        <Button
          variant="paper"
          size="sm"
          onClick={() => s.setSettingsOpen(true)}
          aria-label="Settings"
          className="pointer-events-auto"
        >
          <Icon
            icon={SettingsIcon}
            size={14}
          />
        </Button>
      </motion.div>

      {/* spin hint + manual reveal — only while the answer is hidden */}
      {(phase === "initial" || phase === "focused") && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition.enter}
        >
          {phase === "focused" && settings.revealMode === "manual" && (
            <Button
              variant="rush"
              size="lg"
              onClick={() => s.revealNow()}
              className="pointer-events-auto"
            >
              Reveal answer
            </Button>
          )}
          <span className="inline-flex items-center gap-1.5 bg-ink/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-paper/80">
            <Icon icon={DragIcon} size={13} />
            Drag to look around
          </span>
        </motion.div>
      )}

      {/* bottom controls — slide up while you can navigate, away on reveal */}
      <AnimatePresence>
        {(phase === "initial" || phase === "focused") && (
          <motion.div
            key="controls"
            className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 bg-ink/80 px-3 py-3 backdrop-blur-sm"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={transition.page}
          >
            <Button
              variant="paper"
              size="sm"
              onClick={() => s.prev()}
              disabled={pos === 0}
              aria-label="Previous sign"
            >
              <Icon
                icon={ChevronLeftIcon}
                size={14}
              />
            </Button>
            <Button
              variant="paper"
              size="sm"
              onClick={() => (running ? s.pause() : s.resume())}
            >
              <Icon
                icon={running ? PauseIcon : PlayIcon}
                size={14}
              />
              {running ? "Pause" : "Resume"}
            </Button>
            <Button
              variant="paper"
              size="sm"
              onClick={() => s.start(s.runScope)}
              aria-label="Restart"
            >
              <Icon
                icon={RefreshIcon}
                size={14}
              />
            </Button>
            <Button
              variant="paper"
              size="sm"
              onClick={() => s.next()}
              aria-label="Skip / next sign"
            >
              Skip
              <Icon
                icon={ChevronRightIcon}
                size={14}
              />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* paused scrim */}
      <AnimatePresence>
        {paused && (
          <motion.div
            key="paused"
            className="absolute inset-0 z-30 flex items-center justify-center bg-ink/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...transition.enter, delay: 0.04 }}
            >
              <Button variant="paper" size="lg" onClick={() => s.resume()}>
                <Icon
                  icon={PlayIcon}
                  size={18}
                />
                Resume
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* run complete — confetti result card (self-grading) or a plain card */}
      <AnimatePresence>
        {phase === "complete" && (
          <TrainerResultCard
            trainer="3d"
            selfGraded={settings.selfGrading}
            scope={s.runScope.kind}
            signsTotal={tally.signsTotal}
            recalled={tally.recalled}
            firstTry={tally.firstTry}
            missed={practiced.filter((r) => s.runMissed.includes(r.id))}
            poolTotal={total}
            counts={counts}
            share={{
              surface: "signs3d_complete",
              payload: {
                kind: "signs3d",
                total: tally.signsTotal,
                firstTry: tally.firstTry,
              },
            }}
            onDrill={() => s.start({ kind: "drill", ids: s.runMissed })}
            onNext={() =>
              s.start(s.runScope.kind === "chart" ? { kind: "chart" } : undefined)
            }
            onResetMastery={() => useSigns3DStore.getState().resetProgress()}
            onExit={() => s.exit()}
          />
        )}
      </AnimatePresence>

      {/* answer bottom sheet */}
      <Sheet open={phase === "revealed"} modal={false}>
        <SheetContent
          side="bottom"
          hideOverlay
          showCloseButton={false}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="max-h-[70vh] gap-0 p-0"
        >
          {sign && (
            <motion.div
              key={sign.id}
              variants={ANSWER_CONTAINER}
              initial="hidden"
              animate="show"
              className="mx-auto w-full max-w-2xl space-y-3 p-4 sm:p-5"
            >
              <motion.div variants={ANSWER_HEADLINE}>
                <SheetTitle className="m-0 font-display text-[clamp(22px,4.5vw,32px)] font-extrabold uppercase leading-[0.95] tracking-tight text-ink">
                  {sign.name || "(unnamed sign)"}
                </SheetTitle>
              </motion.div>
              <motion.div
                variants={ANSWER_ITEM}
                className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-3"
              >
                <span className="text-ink-2">
                  {cat?.label}
                </span>
                {sign.code && <span>· {sign.code}</span>}
              </motion.div>
              <motion.div variants={ANSWER_ITEM}>
                {sign.note ? (
                  <SheetDescription className="m-0 text-[13.5px] leading-snug text-ink-2">
                    {sign.note}
                  </SheetDescription>
                ) : (
                  <SheetDescription className="sr-only">
                    Road sign answer
                  </SheetDescription>
                )}
              </motion.div>
              {settings.playAudio && sign.audioSrc && (
                <motion.div variants={ANSWER_ITEM}>
                  <Button
                    variant="paper"
                    size="sm"
                    onClick={() => s.replaySignAudio()}
                  >
                    <Icon
                      icon={SoundIcon}
                      size={14}
                    />
                    Replay sound
                  </Button>
                </motion.div>
              )}

              {settings.selfGrading ? (
                <motion.div variants={ANSWER_ITEM} className="space-y-3">
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="green"
                      className="flex-1"
                      onClick={() => s.gradeAndNext("knew")}
                    >
                      <Icon
                        icon={CheckIcon}
                        size={14}
                      />
                      Knew it
                    </Button>
                    <Button
                      variant="rush"
                      className="flex-1"
                      onClick={() => s.gradeAndNext("missed")}
                    >
                      <Icon
                        icon={CloseIcon}
                        size={14}
                      />
                      Missed it
                    </Button>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                    Missed → it comes back later this run.
                    {isMastered(s.progress, sign.id) ? " · known ✓" : ""}
                  </p>
                </motion.div>
              ) : (
                <motion.div variants={ANSWER_ITEM} className="flex gap-2 pt-1">
                  <Button variant="paper" onClick={() => s.prev()}>
                    <Icon
                      icon={ChevronLeftIcon}
                      size={14}
                    />
                    Prev
                  </Button>
                  <Button
                    variant="ink"
                    className="flex-1"
                    onClick={() => s.next()}
                  >
                    Next
                    <Icon
                      icon={ChevronRightIcon}
                      size={14}
                    />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );

  return typeof document !== "undefined"
    ? createPortal(overlay, document.body)
    : null;
}
