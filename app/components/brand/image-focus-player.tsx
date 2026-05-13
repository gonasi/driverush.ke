import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01FreeIcons,
  ArrowRight01FreeIcons,
  AwardFreeIcons,
  Cancel01FreeIcons,
  Configuration01FreeIcons,
  PauseFreeIcons,
  PlayFreeIcons,
  RefreshFreeIcons,
  Tick02FreeIcons,
  VolumeHighFreeIcons,
} from "@hugeicons/core-free-icons";
import { useShallow } from "zustand/react/shallow";

import { describeCategorySet, getSignCategory } from "~/lib/image-focus";
import { ease, transition } from "~/lib/motion";
import { isMastered } from "~/lib/pelican-progress";
import {
  getMasteredCount,
  getPracticeRegions,
  usePelicanStore,
} from "~/lib/pelican-store";
import { cn } from "~/lib/utils";

import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "~/components/ui/sheet";
import { CelebrationConfetti } from "~/components/brand/celebration-confetti";
import { ImageFocusStage } from "~/components/brand/image-focus-stage";

// --- motion -----------------------------------------------------------------
// The answer cascades in (headline → meta → note → actions) the moment the
// camera lands.
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
 * The reveal timer — our Tach `<Progress>` bar pinned above the navbar, draining
 * as the recall window closes. It subscribes to the store's `timeRemaining`
 * itself (so only this tiny node re-renders on each ~100 ms tick) and the
 * indicator runs a short linear `width` transition so the drain reads as
 * continuous. The player only mounts it while the timer's actually running (it
 * unmounts on pause / settings / reveal and remounts fresh on resume), so it
 * always starts full and lands empty as the answer appears.
 */
function RevealCountdown({ seconds }: { seconds: number }) {
  const timeRemaining = usePelicanStore((st) => st.timeRemaining);
  const pct = Math.max(
    0,
    Math.min(100, Math.round((timeRemaining / Math.max(0.001, seconds)) * 100)),
  );
  return (
    <Progress
      value={pct}
      showTicks
      aria-label="Time left to recall this sign"
      indicatorClassName="duration-200 ease-linear"
      className="pointer-events-none absolute inset-x-0 top-0 z-30 h-3"
    />
  );
}

/**
 * The Pelican road-sign recall trainer — a presentational shell over the Zustand
 * store (`pelican-store.ts`), which owns the state machine, timers and audio.
 * The "ready" card is in-page; pressing Start opens an immersive fullscreen
 * overlay (portalled to `<body>`) that pans + zooms over the chart, dims/blurs
 * the rest, and reveals the name in a bottom sheet (with optional self-grading).
 */
export function ImageFocusPlayer({ className }: { className?: string }) {
  const s = usePelicanStore(
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
      // actions (stable references)
      start: st.start,
      pause: st.pause,
      resume: st.resume,
      next: st.next,
      prev: st.prev,
      revealNow: st.revealNow,
      gradeAndNext: st.gradeAndNext,
      replayRegionAudio: st.replayRegionAudio,
      setSettingsOpen: st.setSettingsOpen,
      exit: st.exit,
    })),
  );
  const region = s.queue[s.pos];
  const focusedView = s.phase === "focused" || s.phase === "revealed";

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
      if (e.key === "Escape") usePelicanStore.getState().exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s.overlayOpen]);

  // Tear down timers/audio if the player unmounts (e.g. navigating away).
  React.useEffect(() => () => usePelicanStore.getState().exit(), []);

  const practiced = React.useMemo(
    () => getPracticeRegions(s.board, s.settings.categories),
    [s.board, s.settings.categories],
  );
  const total = practiced.length;
  const masteredCount = getMasteredCount(s.progress, practiced);

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
  const cat = region ? getSignCategory(region.category) : null;
  const revealDelay = region?.revealDelay ?? settings.revealDelay;
  const effectiveRunning =
    s.overlayOpen && running && !s.settingsOpen && phase !== "complete";
  const showCountdown =
    effectiveRunning && phase === "focused" && settings.revealMode === "auto";
  const orderLabel =
    settings.order === "shuffle"
      ? "shuffled"
      : settings.reverse
        ? "reverse order"
        : "in order";
  const configSummary = `${total} sign${total === 1 ? "" : "s"} · ${orderLabel}${settings.selfGrading ? " · self-grading" : ""}`;
  const paused = s.overlayOpen && !running && phase !== "complete";
  const filtered = settings.categories.length > 0;
  const studiedSet = describeCategorySet(settings.categories);
  // This run's tally (self-grading): distinct signs recalled, taps missed,
  // and how many were nailed without ever slipping. A run can only finish once
  // every sign's been recalled (misses re-queue), so finishing = a win.
  const runRecalledN = s.runRecalled.length;
  const runMissCount = s.runMissCount;
  const firstTry = s.runRecalled.filter(
    (id) => !s.runMissed.includes(id),
  ).length;
  const flawless = runMissCount === 0;
  const allMastered = total > 0 && masteredCount >= total;
  const masteryPct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;

  // ---------- ready card (not playing) ----------
  if (!s.overlayOpen) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="relative">
          <ImageFocusStage
            imageSrc={s.board.imageSrc}
            region={null}
            focused={false}
            blurIntensity={settings.blurIntensity}
            dimIntensity={settings.dimIntensity}
            animationDuration={s.board.settings.animationDuration}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/45 px-6 text-center backdrop-blur-[1px]">
            <Button variant="rush" size="lg" onClick={() => s.start()}>
              <HugeiconsIcon icon={PlayFreeIcons} size={18} strokeWidth={2.5} />
              Start trainer
            </Button>
            <span className="font-mono text-[11px] uppercase tracking-widest text-paper">
              {total} sign{total === 1 ? "" : "s"}
            </span>
            {settings.selfGrading && (
              <div className="w-full max-w-55">
                <Progress
                  value={masteryPct}
                  tone="green"
                  showTicks={false}
                  aria-label="Signs mastered"
                  className="h-3"
                />
                <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-widest text-paper/80">
                  {masteredCount} / {total} mastered
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            {configSummary}
          </span>
          <Button
            variant="paper"
            size="sm"
            onClick={() => s.setSettingsOpen(true)}
          >
            <HugeiconsIcon
              icon={Configuration01FreeIcons}
              size={14}
              strokeWidth={2.5}
            />
            Settings
          </Button>
        </div>
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
      {/* Stage — fills the whole viewport; everything else floats on top */}
      <ImageFocusStage
        imageSrc={s.board.imageSrc}
        region={region ?? null}
        focused={focusedView}
        blurIntensity={settings.blurIntensity}
        dimIntensity={settings.dimIntensity}
        animationDuration={s.board.settings.animationDuration}
        fill
        className="absolute inset-0"
      />

      {/* tap-to-reveal target (manual mode) — below the chrome, above the stage */}
      {phase === "focused" && settings.revealMode === "manual" && (
        <button
          type="button"
          aria-label="Reveal answer"
          onClick={() => s.revealNow()}
          className="absolute inset-0 z-0 cursor-pointer"
        />
      )}

      {/* reveal countdown — slim "Tach" bar pinned above the navbar */}
      {showCountdown && (
        <RevealCountdown key={region?.id ?? "t"} seconds={revealDelay} />
      )}

      {/* top bar — slim & steady (tabular counter, no jitter); the extra top
          padding always reserves room for the reveal bar above it */}
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
          <HugeiconsIcon icon={Cancel01FreeIcons} size={14} strokeWidth={2.5} />
          Exit
        </Button>
        <span className="whitespace-nowrap bg-ink/70 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider tabular-nums text-paper">
          {settings.selfGrading
            ? `${runRecalledN} / ${total}${runMissCount > 0 ? ` · ✗${runMissCount}` : ""}`
            : `${pos + 1} / ${total}`}
        </span>
        <Button
          variant="paper"
          size="sm"
          onClick={() => s.setSettingsOpen(true)}
          aria-label="Settings"
          className="pointer-events-auto"
        >
          <HugeiconsIcon
            icon={Configuration01FreeIcons}
            size={14}
            strokeWidth={2.5}
          />
        </Button>
      </motion.div>

      {/* manual reveal button */}
      {phase === "focused" && settings.revealMode === "manual" && (
        <motion.div
          className="absolute inset-x-0 bottom-24 z-20 flex justify-center"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition.enter}
        >
          <Button variant="rush" size="lg" onClick={() => s.revealNow()}>
            Reveal answer
          </Button>
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
              <HugeiconsIcon
                icon={ArrowLeft01FreeIcons}
                size={14}
                strokeWidth={2.5}
              />
            </Button>
            <Button
              variant="paper"
              size="sm"
              onClick={() => (running ? s.pause() : s.resume())}
            >
              <HugeiconsIcon
                icon={running ? PauseFreeIcons : PlayFreeIcons}
                size={14}
                strokeWidth={2.5}
              />
              {running ? "Pause" : "Resume"}
            </Button>
            <Button
              variant="paper"
              size="sm"
              onClick={() => s.start()}
              aria-label="Restart"
            >
              <HugeiconsIcon
                icon={RefreshFreeIcons}
                size={14}
                strokeWidth={2.5}
              />
            </Button>
            <Button
              variant="paper"
              size="sm"
              onClick={() => s.next()}
              aria-label="Skip / next sign"
            >
              Skip
              <HugeiconsIcon
                icon={ArrowRight01FreeIcons}
                size={14}
                strokeWidth={2.5}
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
                <HugeiconsIcon
                  icon={PlayFreeIcons}
                  size={18}
                  strokeWidth={2.5}
                />
                Resume
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* run complete — a confetti result card for a self-graded run (you can't
          finish one without recalling every sign, since misses re-queue), or a
          plain "deck done" card for a hands-free flip-through */}
      <AnimatePresence>
        {phase === "complete" && (
          <motion.div
            key="complete"
            className="absolute inset-0 z-30 flex items-center justify-center bg-ink/70 px-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {settings.selfGrading && (
              <CelebrationConfetti bursts={flawless || allMastered ? 4 : 2} />
            )}
            <motion.div
              variants={ANSWER_CONTAINER}
              initial="hidden"
              animate="show"
              className="relative w-full max-w-sm border-2 border-ink bg-surface shadow-stamp-xl"
            >
              <div className="flex items-center justify-between gap-3 bg-ink px-4 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-widest text-paper">
                <span>
                  {!settings.selfGrading
                    ? "DR · DECK DONE"
                    : allMastered
                      ? "DR · SET MASTERED"
                      : flawless
                        ? "DR · FLAWLESS"
                        : "DR · NICE RUN"}
                </span>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => s.exit()}
                  className="-my-1 inline-flex size-6 shrink-0 items-center justify-center border-2 border-paper text-paper outline-none transition-colors duration-100 hover:bg-paper hover:text-ink focus-visible:bg-paper focus-visible:text-ink"
                >
                  <HugeiconsIcon
                    icon={Cancel01FreeIcons}
                    size={13}
                    strokeWidth={2.75}
                  />
                </button>
              </div>

              <div className="flex flex-col items-center gap-3 px-6 py-7">
                {settings.selfGrading ? (
                  <>
                    <motion.div
                      variants={ANSWER_HEADLINE}
                      className="flex size-14 items-center justify-center border-2 border-ink bg-kenya-green text-white"
                    >
                      <HugeiconsIcon
                        icon={AwardFreeIcons}
                        size={28}
                        strokeWidth={2.25}
                      />
                    </motion.div>
                    <motion.span
                      variants={ANSWER_HEADLINE}
                      className="font-display text-[clamp(22px,5.5vw,30px)] font-extrabold uppercase leading-[0.95] tracking-tight text-ink"
                    >
                      {allMastered ? (
                        <>
                          Set <span className="italic text-rush">nailed</span>.
                        </>
                      ) : flawless ? (
                        <span className="italic text-rush">Flawless.</span>
                      ) : (
                        <>
                          Run <span className="italic text-rush">complete</span>
                          .
                        </>
                      )}
                    </motion.span>

                    {filtered && (
                      <motion.div
                        variants={ANSWER_ITEM}
                        className="flex flex-wrap items-center justify-center gap-1.5"
                      >
                        {settings.categories.map((id) => {
                          const c = getSignCategory(id);
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 border-2 border-ink bg-paper-3 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-2"
                            >
                              <span aria-hidden>{c.emoji}</span>
                              {c.label}
                            </span>
                          );
                        })}
                      </motion.div>
                    )}

                    <motion.p
                      variants={ANSWER_ITEM}
                      className="m-0 text-[13.5px] leading-snug text-ink-2"
                    >
                      All {total}{" "}
                      {filtered ? studiedSet : `sign${total === 1 ? "" : "s"}`}{" "}
                      recalled.{" "}
                      {flawless
                        ? "Every one on the first try. Clean."
                        : `First try: ${firstTry} of ${total}. ${runMissCount} second look${runMissCount === 1 ? "" : "s"}.`}
                    </motion.p>

                    <motion.div variants={ANSWER_ITEM} className="w-full">
                      <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                        <span>
                          {allMastered
                            ? "🏆 Mastered: the whole set, cold"
                            : "Mastery"}
                        </span>
                        <span className="tabular-nums">
                          {masteredCount} / {total}
                        </span>
                      </div>
                      <Progress
                        value={masteryPct}
                        tone="green"
                        showTicks={false}
                        aria-label="Signs mastered"
                        className="h-3"
                      />
                      {allMastered && (
                        <button
                          type="button"
                          onClick={() =>
                            usePelicanStore.getState().resetProgress()
                          }
                          className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-3 outline-none hover:text-ink focus-visible:text-ink"
                        >
                          <HugeiconsIcon
                            icon={RefreshFreeIcons}
                            size={11}
                            strokeWidth={2.5}
                          />
                          Reset mastery
                        </button>
                      )}
                    </motion.div>

                    <motion.div
                      variants={ANSWER_ITEM}
                      className="mt-1 flex flex-wrap items-center justify-center gap-2"
                    >
                      <Button
                        variant="rush"
                        size="lg"
                        onClick={() => s.start()}
                      >
                        <HugeiconsIcon
                          icon={RefreshFreeIcons}
                          size={18}
                          strokeWidth={2.5}
                        />
                        Play again
                      </Button>
                      <Button
                        variant="paper"
                        size="lg"
                        onClick={() => s.exit()}
                      >
                        Done
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.span
                      variants={ANSWER_HEADLINE}
                      className="font-display text-[clamp(20px,5.5vw,28px)] font-extrabold uppercase leading-tight tracking-tight text-ink"
                    >
                      That's all {total} sign{total === 1 ? "" : "s"}.
                    </motion.span>
                    <motion.div
                      variants={ANSWER_ITEM}
                      className="mt-1 flex gap-2"
                    >
                      <Button
                        variant="rush"
                        size="lg"
                        onClick={() => s.start()}
                      >
                        <HugeiconsIcon
                          icon={RefreshFreeIcons}
                          size={18}
                          strokeWidth={2.5}
                        />
                        Play again
                      </Button>
                      <Button
                        variant="paper"
                        size="lg"
                        onClick={() => s.exit()}
                      >
                        Done
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
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
          {region && (
            <motion.div
              key={region.id}
              variants={ANSWER_CONTAINER}
              initial="hidden"
              animate="show"
              className="mx-auto w-full max-w-2xl space-y-3 p-4 sm:p-5"
            >
              <motion.div variants={ANSWER_HEADLINE}>
                <SheetTitle className="m-0 font-display text-[clamp(22px,4.5vw,32px)] font-extrabold uppercase leading-[0.95] tracking-tight text-ink">
                  {region.name || "(unnamed sign)"}
                </SheetTitle>
              </motion.div>
              <motion.div
                variants={ANSWER_ITEM}
                className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-3"
              >
                <span className="text-ink-2">
                  {cat?.emoji} {cat?.label}
                </span>
                {region.code && <span>· {region.code}</span>}
              </motion.div>
              <motion.div variants={ANSWER_ITEM}>
                {region.note ? (
                  <SheetDescription className="m-0 text-[13.5px] leading-snug text-ink-2">
                    {region.note}
                  </SheetDescription>
                ) : (
                  <SheetDescription className="sr-only">
                    Road sign answer
                  </SheetDescription>
                )}
              </motion.div>
              {settings.playAudio && region.audioSrc && (
                <motion.div variants={ANSWER_ITEM}>
                  <Button
                    variant="paper"
                    size="sm"
                    onClick={() => s.replayRegionAudio()}
                  >
                    <HugeiconsIcon
                      icon={VolumeHighFreeIcons}
                      size={14}
                      strokeWidth={2.5}
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
                      <HugeiconsIcon
                        icon={Tick02FreeIcons}
                        size={14}
                        strokeWidth={2.75}
                      />
                      Knew it
                    </Button>
                    <Button
                      variant="rush"
                      className="flex-1"
                      onClick={() => s.gradeAndNext("missed")}
                    >
                      <HugeiconsIcon
                        icon={Cancel01FreeIcons}
                        size={14}
                        strokeWidth={2.75}
                      />
                      Missed it
                    </Button>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
                    Missed → it comes back later this run.
                    {isMastered(s.progress, region.id) ? " · mastered ✓" : ""}
                  </p>
                </motion.div>
              ) : (
                <motion.div variants={ANSWER_ITEM} className="flex gap-2 pt-1">
                  <Button variant="paper" onClick={() => s.prev()}>
                    <HugeiconsIcon
                      icon={ArrowLeft01FreeIcons}
                      size={14}
                      strokeWidth={2.5}
                    />
                    Prev
                  </Button>
                  <Button
                    variant="ink"
                    className="flex-1"
                    onClick={() => s.next()}
                  >
                    Next
                    <HugeiconsIcon
                      icon={ArrowRight01FreeIcons}
                      size={14}
                      strokeWidth={2.5}
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
