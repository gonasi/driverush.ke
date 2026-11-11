/**
 * The live drive: one car, the joystick, the table's physics and the referee,
 * stepped at a fixed rate. It sits in module scope on purpose. The scene reads
 * `car` and `view` every frame and the controls write `stick`, and none of it
 * goes through React.
 */
import type { CarInput, CarState } from "./car";
import type { BoardChallenge } from "./challenges";
import { laneBearing, lanePoint } from "./geometry";
import {
  createAssist,
  stickToInput,
  type AssistState,
  type DriveOptions,
  type Stick,
} from "./joystick";
import type { OtherPose, Physics } from "./physics";
import {
  COLLISION,
  createRef,
  refStep,
  type Fault,
  type RefState,
} from "./referee";

const STEP = 1 / 60;
/** A stalled tab mustn't fast-forward the car when it wakes. */
const MAX_FRAME = 0.1;

export const car: CarState = { x: 0, z: 0, heading: 0, speed: 0, steer: 0 };
/** Where the learner is holding the knob. The controls write this. */
export const stick: Stick = { x: 0, y: 0 };
/** Where the learner stands, and whether lane assist is on. Set by the store. */
export const drive: DriveOptions = { seat: "south", assist: true };

/** What the scene needs to know about the drive, beyond `car`. */
export const view = {
  others: [] as OtherPose[],
  braking: false,
  /** Set for a moment when something is hit, 0 to 1. */
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

let challenge: BoardChallenge | null = null;
let physics: Physics | null = null;
let ref: RefState = createRef();
let assist: AssistState = createAssist();
let callbacks: Callbacks | null = null;
let driving = false;
let carry = 0;
let elapsed = 0;
const input: CarInput = { steer: 0, throttle: 0, brake: 0 };

/** Fetch the physics. The car waits on its start line until it's in. */
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

export function resetInput(): void {
  stick.x = 0;
  stick.y = 0;
  input.steer = 0;
  input.throttle = 0;
  input.brake = 0;
}

/** Put the car on its start line and hand control to the learner. */
export function beginChallenge(next: BoardChallenge, cb: Callbacks): void {
  const start = lanePoint(
    next.start.arm,
    "approach",
    next.start.lane,
    next.start.along,
  );
  car.x = start.x;
  car.z = start.z;
  car.heading = laneBearing(next.start.arm, "approach");
  car.speed = 0;
  car.steer = 0;
  challenge = next;
  callbacks = cb;
  ref = createRef();
  assist = createAssist();
  physics = engine ? engine.createPhysics(next, car) : null;
  view.others = physics
    ? physics.poses
    : next.otherCars.map(({ x, z, heading }) => ({ x, z, heading }));
  view.braking = false;
  view.jolt = 0;
  carry = 0;
  elapsed = 0;
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

/** Advance the drive by one rendered frame. */
export function tick(frameSeconds: number): void {
  if (!driving || !challenge || !callbacks || !physics || !engine) return;
  const { physicsStep } = engine;
  carry += Math.min(frameSeconds, MAX_FRAME);
  while (carry >= STEP) {
    carry -= STEP;
    elapsed += STEP;
    view.jolt = Math.max(0, view.jolt - STEP * 2.5);

    if (physics.crashed) {
      // The bump plays out, then the examiner calls it.
      if (physicsStep(physics, car, input)) {
        stopDriving();
        callbacks.onFault(COLLISION);
        return;
      }
      continue;
    }

    stickToInput(stick, car, input, drive, assist);
    view.braking = input.brake > 0 && car.speed > 0.05;
    physicsStep(physics, car, input);

    if (physics.crashed) {
      view.jolt = Math.max(0.5, physics.impact);
      view.braking = false;
      continue;
    }

    const result = refStep(ref, challenge, car, physics.contacts, STEP);
    for (const fault of result.small) {
      view.jolt = Math.max(view.jolt, 0.6 * Math.max(0.5, physics.impact));
      callbacks.onSmall(fault);
    }
    if (result.fault) {
      stopDriving();
      callbacks.onFault(result.fault);
      return;
    }
    if (result.goal) {
      stopDriving();
      callbacks.onGoal();
      return;
    }
  }
}
