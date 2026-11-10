/**
 * The end of a run, shared by both trainers. It answers "what next?": the signs
 * you missed, one tap to drill them, and a link to try the same signs in the
 * other trainer. That last one is the moat at work: chart and 3D feed each other.
 */
import type * as React from "react";
import { motion, type Variants } from "framer-motion";
import { Link } from "react-router";
import { Icon } from "~/components/brand/icon";
import {
  ArrowRightIcon,
  CloseIcon,
  RefreshIcon,
} from "~/components/brand/icons";

import pelican from "~/data/road-signs-pelican.json";
import { regionSpriteStyle, type FocusRegion } from "~/lib/image-focus";
import { signCrop } from "~/lib/sign-crops";
import { ease } from "~/lib/motion";
import type { SignCounts } from "~/lib/pelican-progress";
import { liveStreak, readPracticeStreak } from "~/lib/practice-streak";
import type { SharePayload } from "~/lib/share";
import {
  ROUND_SIZE,
  trainerHref,
  type RunScopeKind,
} from "~/lib/trainer-rounds";

import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { CelebrationConfetti } from "~/components/brand/celebration-confetti";
import { ShareButton } from "~/components/brand/share-button";
import { RoundDoneScene } from "~/components/brand/art/scenes";

const CARD = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
} satisfies Variants;
const ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.34, ease: ease.snap } },
} satisfies Variants;

const CHART_SRC = pelican.imageSrc as string;
const CHART_BY_CODE = new Map(
  (pelican.regions as FocusRegion[]).map((r) => [r.code, r]),
);
const THUMBNAILS_SHOWN = 6;
const THUMB_PAD = 0;

export type MissedSign = { id: string; code?: string; name: string };

function MissedThumbnails({ signs }: { signs: readonly MissedSign[] }) {
  const shown = signs.slice(0, THUMBNAILS_SHOWN);
  const more = signs.length - shown.length;
  return (
    <ul className="m-0 flex list-none flex-wrap justify-center gap-1.5 p-0">
      {shown.map((sign, index) => {
        const region = sign.code ? CHART_BY_CODE.get(sign.code) : undefined;
        return (
          <li
            key={sign.id}
            title={sign.name}
            aria-label={sign.name}
            className="dr-pop size-12 border-2 border-ink bg-white"
            style={
              {
                "--i": index + 4,
                ...(region
                  ? regionSpriteStyle(signCrop(region), CHART_SRC, THUMB_PAD)
                  : {}),
              } as React.CSSProperties
            }
          />
        );
      })}
      {more > 0 && (
        <li className="flex size-12 items-center justify-center border-2 border-ink bg-paper-3 font-mono text-[11px] font-bold text-ink-2">
          +{more}
        </li>
      )}
    </ul>
  );
}

export function TrainerResultCard({
  trainer,
  selfGraded,
  scope,
  signsTotal,
  recalled,
  firstTry,
  missed,
  poolTotal,
  counts,
  bestStreak = 0,
  share,
  onDrill,
  onNext,
  onResetMastery,
  onExit,
}: {
  trainer: "pelican" | "3d";
  selfGraded: boolean;
  scope: RunScopeKind;
  /** Distinct signs in this run. */
  signsTotal: number;
  recalled: number;
  firstTry: number;
  missed: readonly MissedSign[];
  poolTotal: number;
  counts: SignCounts;
  /** Longest run of "Knew it" in a row this run. */
  bestStreak?: number;
  share: { surface: string; payload: SharePayload };
  onDrill: () => void;
  onNext: () => void;
  onResetMastery: () => void;
  onExit: () => void;
}) {
  // Skip can finish a run without recalling everything, so a clean run is more
  // than just reaching the end.
  const flawless = firstTry === signsTotal && signsTotal > 0;
  const allKnown = poolTotal > 0 && counts.known >= poolTotal;
  const other =
    trainer === "pelican"
      ? { path: "/road-signs/3d", label: "in 3D" }
      : { path: "/road-signs/pelican", label: "on the chart" };
  const missedCodes = missed.flatMap((s) => (s.code ? [s.code] : []));
  const headline = !selfGraded
    ? `That's all ${signsTotal} signs.`
    : allKnown
      ? `All ${poolTotal} known.`
      : flawless
        ? "Flawless."
        : `${firstTry} of ${signsTotal} first try.`;
  const nextLabel = scope === "chart" ? "Go again" : `Next ${ROUND_SIZE} signs`;
  // Only mounts on the client (inside the trainer overlay), so reading storage
  // here can't cause a hydration mismatch.
  const days = liveStreak(readPracticeStreak()).days;
  const streakLine = [
    bestStreak >= 2 ? `Best streak ${bestStreak}` : null,
    days >= 1 ? `${days} day${days === 1 ? "" : "s"} in a row` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      key="complete"
      className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-ink/70 px-4 py-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Saved for a flawless round, so it still means something. */}
      {selfGraded && (flawless || allKnown) && <CelebrationConfetti bursts={2} />}
      <motion.div
        variants={CARD}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-sm border-2 border-ink bg-surface shadow-stamp-xl"
      >
        <div className="flex items-center justify-between gap-3 bg-ink px-4 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-widest text-paper">
          <span>{scope === "chart" ? "Whole chart" : "Round done"}</span>
          <button
            type="button"
            aria-label="Close"
            onClick={onExit}
            className="-my-1 inline-flex size-6 shrink-0 items-center justify-center border-2 border-paper text-paper outline-none transition-colors duration-100 hover:bg-paper hover:text-ink focus-visible:bg-paper focus-visible:text-ink"
          >
            <Icon
              icon={CloseIcon}
              size={13}
            />
          </button>
        </div>

        <RoundDoneScene crop className="h-24 border-b-2 border-ink sm:h-28" />

        <div className="flex flex-col items-center gap-3 px-5 py-6">
          <motion.h2
            variants={ITEM}
            className="m-0 font-display text-[clamp(24px,6vw,32px)] font-extrabold uppercase leading-[0.95] tracking-tight text-ink"
          >
            {headline}
          </motion.h2>

          {selfGraded && (
            <motion.p
              variants={ITEM}
              className="m-0 text-[13.5px] leading-snug text-ink-2"
            >
              {missed.length > 0
                ? `${recalled} of ${signsTotal} recalled. These tripped you up:`
                : recalled < signsTotal
                  ? `${recalled} of ${signsTotal} recalled. Skipped signs come back later.`
                  : "Every one on the first try."}
            </motion.p>
          )}

          {missed.length > 0 && (
            <motion.div variants={ITEM}>
              <MissedThumbnails signs={missed} />
            </motion.div>
          )}

          {selfGraded && (
            <motion.div variants={ITEM} className="dr-fill-in w-full">
              <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                <span>
                  {counts.known} known · {counts.learning} learning
                </span>
                <span className="tabular-nums">of {poolTotal}</span>
              </div>
              <Progress
                value={poolTotal > 0 ? (counts.known / poolTotal) * 100 : 0}
                tone="green"
                showTicks={false}
                aria-label="Signs known"
                className="h-3"
              />
              {streakLine && (
                <p className="m-0 mt-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-2">
                  {streakLine}
                </p>
              )}
              {allKnown && (
                <button
                  type="button"
                  onClick={onResetMastery}
                  className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-3 outline-none hover:text-ink focus-visible:text-ink"
                >
                  <Icon
                    icon={RefreshIcon}
                    size={11}
                  />
                  Reset progress
                </button>
              )}
            </motion.div>
          )}

          <motion.div variants={ITEM} className="mt-1 grid w-full gap-2">
            {missed.length > 0 ? (
              <>
                <Button variant="rush" size="lg" onClick={onDrill}>
                  <Icon
                    icon={RefreshIcon}
                    size={18}
                  />
                  Drill {missed.length === 1 ? "it" : `these ${missed.length}`}{" "}
                  again
                </Button>
                <Button variant="paper" onClick={onNext}>
                  {nextLabel}
                </Button>
              </>
            ) : (
              <Button variant="rush" size="lg" onClick={onNext}>
                {nextLabel}
                <Icon
                  icon={ArrowRightIcon}
                  size={16}
                />
              </Button>
            )}
            <Button variant="ink" asChild>
              <Link
                to={trainerHref(other.path, { codes: missedCodes, go: true })}
                onClick={onExit}
              >
                Try {missed.length > 0 ? "them" : "signs"} {other.label}
              </Link>
            </Button>
            <div className="flex gap-2 [&>*]:flex-1">
              {selfGraded && (
                <ShareButton
                  surface={share.surface}
                  payload={share.payload}
                  size="default"
                />
              )}
              <Button variant="paper" onClick={onExit}>
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
