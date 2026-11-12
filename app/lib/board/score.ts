/**
 * The score for one passed drive: a number out of 1,000, made from how clean
 * the drive was and how long it took against the task's par time. It is the
 * number a leaderboard will rank on, so it is worked out the same way every
 * time from what is saved with it, and carries a version for the day the sums
 * change.
 *
 * Start at 1,000. Each mistake takes 150, a hint takes 100, and time over par
 * takes up to 400. Nothing is added for beating par, so driving flat out earns
 * nothing: between two equal scores the quicker drive ranks higher.
 */
import type { Route } from "./network";

export const SCORE_VERSION = 1;
export const SCORE_MAX = 1000;
const PER_FAULT = 150;
const HINT = 100;
const TIME_MOST = 400;
/** A drive that left the task's route. Shown, never saved. */
export const OFF_ROUTE_SCORE = 50;

/**
 * What par is made of. A careful drive goes at about this many metres a
 * second forward and in reverse, waits this long at each stop line, takes this
 * long to line up in a bay, and this long to set off and to stop in the box.
 */
const PAR = {
  forward: 4,
  reverse: 1.2,
  stopLine: 3,
  bay: 6,
  ends: 4,
} as const;

/** The time a careful drive of this route takes, in seconds. */
export function parSeconds(route: Route, parks: boolean): number {
  let forward = 0;
  let reverse = 0;
  let stops = 0;
  for (const step of route.steps) {
    const length = step.to - step.from;
    if (step.gear === "reverse") reverse += length;
    else forward += length;
    if (step.control === "stop") stops += 1;
  }
  return Math.ceil(
    forward / PAR.forward +
      reverse / PAR.reverse +
      stops * PAR.stopLine +
      (parks ? PAR.bay : 0) +
      PAR.ends,
  );
}

export type ScoreInput = {
  /** Mistakes on this attempt. */
  faults: number;
  hinted: boolean;
  /** How long the drive took, seconds. */
  seconds: number;
  /** The task's par time, seconds. */
  par: number;
};

export function scoreFor({ faults, hinted, seconds, par }: ScoreInput): number {
  const over = par > 0 ? Math.min(1, Math.max(0, (seconds - par) / par)) : 0;
  return Math.max(
    0,
    SCORE_MAX -
      PER_FAULT * faults -
      (hinted ? HINT : 0) -
      Math.round(TIME_MOST * over),
  );
}

/** A saved best: the score, and everything it was worked out from. */
export type BestScore = {
  v: number;
  score: number;
  /** How long the drive took, milliseconds. */
  ms: number;
  par: number;
  faults: number;
  hinted: boolean;
};

/** Is this drive better than the saved one? Higher score, then quicker. */
export function beats(next: BestScore, best: BestScore | undefined): boolean {
  if (!best || best.v !== next.v) return true;
  return (
    next.score > best.score || (next.score === best.score && next.ms < best.ms)
  );
}
