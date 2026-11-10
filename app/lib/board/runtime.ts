/**
 * The live drive: one car, the lane-keeping driver, the collision world and the
 * referee, stepped at a fixed rate. It sits in module scope on purpose. The
 * stage reads `car` and `view` every frame and the controls set `controls.go`
 * or call `pressLeft` / `pressRight`, and none of it goes through React.
 */
import type { CarState } from "./car-sim";
import type { BoardChallenge } from "./challenges";
import {
  createGuide,
  guideStep,
  leftMeansExit,
  placeAtStart,
  pressLeft as guideLeft,
  pressRight as guideRight,
  type Guide,
  type Press,
} from "./guide";
import type { OtherPose, Physics } from "./physics";
import { COLLISION, inGoalBox, judge, smallFault, type Fault } from "./referee";

const STEP = 1 / 60;
/** A stalled tab mustn't fast-forward the car when it wakes. */
const MAX_FRAME = 0.1;
const STOPPED = 0.2;
const GOAL_HOLD = 0.35;

export const car: CarState = { x: 0, z: 0, heading: 0, speed: 0, steer: 0 };
/** Held down by the Go button. */
export const controls = { go: false };

/** What the stage and the buttons need to know about the drive, beyond `car`. */
export const view = {
  others: [] as OtherPose[],
  indicator: null as "left" | "right" | null,
  braking: false,
  /** Near and on the roundabout, the left button signals for an exit. */
  leftIsExit: false,
  /** Set for a moment when something is hit or refused, 0 to 1. */
  jolt: 0,
};

type Callbacks = {
  /** A serious mistake: the attempt is over. */
  onFault: (fault: Fault) => void;
  /** A small mistake: a star is lost and the drive goes on. */
  onSmall: (fault: Fault) => void;
  onGoal: () => void;
};

// Matter.js lives behind `physics.ts`. It is fetched the first time someone
// starts a drive, so a visitor who only reads the guide never downloads it.
let engine: typeof import("./physics") | null = null;
let loading: Promise<void> | null = null;

/** Fetch the collision engine. The car waits on its start line until it's in. */
export function loadPhysics(): Promise<void> {
  loading ??= import("./physics").then((mod) => {
    engine = mod;
    if (driving && challenge && !physics) {
      physics = mod.createPhysics(challenge, car);
      view.others = physics.poses;
    }
  });
  return loading;
}

let challenge: BoardChallenge | null = null;
let guide: Guide | null = null;
let physics: Physics | null = null;
let callbacks: Callbacks | null = null;
let driving = false;
let carry = 0;
let elapsed = 0;
let goalTime = 0;

export function resetInput(): void {
  controls.go = false;
}

/** Put the car on its start line and hand control to the learner. */
export function beginChallenge(next: BoardChallenge, cb: Callbacks): void {
  placeAtStart(next, car);
  challenge = next;
  callbacks = cb;
  guide = createGuide(next);
  physics = engine ? engine.createPhysics(next, car) : null;
  view.others = physics
    ? physics.poses
    : next.otherCars.map(({ x, z, heading }) => ({ x, z, heading }));
  view.indicator = null;
  view.braking = false;
  view.leftIsExit = false;
  view.jolt = 0;
  carry = 0;
  elapsed = 0;
  goalTime = 0;
  driving = true;
  resetInput();
  if (!engine) void loadPhysics();
}

export function stopDriving(): void {
  driving = false;
  car.speed = 0;
  view.braking = false;
  resetInput();
}

export function isDriving(): boolean {
  return driving;
}

/** Seconds spent driving this attempt. */
export function elapsedSeconds(): number {
  return elapsed;
}

function press(result: Press): Press {
  if (!result.ok && callbacks) {
    view.jolt = 0.6;
    callbacks.onSmall(smallFault(result.why));
  }
  return result;
}

/** The left button: lane left on a road, signal for an exit at the roundabout. */
export function pressLeft(): Press | null {
  if (!driving || !guide || physics?.crashed) return null;
  return press(guideLeft(guide, car));
}

/** The right button: lane right. */
export function pressRight(): Press | null {
  if (!driving || !guide || physics?.crashed) return null;
  return press(guideRight(guide, car));
}

/** Advance the drive by one rendered frame. */
export function tick(frameSeconds: number): void {
  if (!driving || !challenge || !callbacks || !guide || !physics || !engine) {
    return;
  }
  const { physicsStep } = engine;
  carry += Math.min(frameSeconds, MAX_FRAME);
  while (carry >= STEP) {
    carry -= STEP;
    elapsed += STEP;
    view.jolt = Math.max(0, view.jolt - STEP * 2.5);

    if (physics.crashed) {
      // The bump plays out, then the examiner calls it.
      if (physicsStep(physics, car)) {
        stopDriving();
        callbacks.onFault(COLLISION);
        return;
      }
      continue;
    }

    const events = guideStep(guide, car, controls.go, STEP);
    view.indicator = guide.indicator;
    view.braking = guide.braking;
    view.leftIsExit = leftMeansExit(guide, car);

    physicsStep(physics, car);
    if (physics.crashed) {
      view.jolt = Math.max(0.5, physics.impact);
      view.indicator = null;
      continue;
    }

    for (const event of events) {
      const fault = judge(event, challenge);
      if (!fault) continue;
      if (fault.serious) {
        stopDriving();
        callbacks.onFault(fault);
        return;
      }
      callbacks.onSmall(fault);
    }

    const parked = car.speed < STOPPED && inGoalBox(challenge, car);
    goalTime = parked ? goalTime + STEP : 0;
    if (goalTime >= GOAL_HOLD) {
      stopDriving();
      callbacks.onGoal();
      return;
    }
  }
}
