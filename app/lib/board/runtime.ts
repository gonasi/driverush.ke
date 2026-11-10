/**
 * The live drive: one car, the pedals and wheel, and the referee, stepped at a
 * fixed rate. It sits in module scope on purpose. The 3D scene reads `car` every
 * frame and the controls write `input`, and neither goes through React.
 */
import { stepCar, type CarInput, type CarState } from "./car-sim";
import type { BoardChallenge } from "./challenges";
import { laneBearing, lanePoint } from "./geometry";
import { createRef, refStep, type Fault, type RefState } from "./referee";

const STEP = 1 / 60;
/** A stalled tab mustn't fast-forward the car when it wakes. */
const MAX_FRAME = 0.1;

export const car: CarState = { x: 0, z: 0, heading: 0, speed: 0, steer: 0 };
export const input: CarInput = { steer: 0, throttle: 0, brake: 0 };

type Callbacks = { onFault: (fault: Fault) => void; onGoal: () => void };

let challenge: BoardChallenge | null = null;
let ref: RefState = createRef();
let callbacks: Callbacks | null = null;
let driving = false;
let carry = 0;
let elapsed = 0;

export function resetInput(): void {
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
  carry = 0;
  elapsed = 0;
  driving = true;
  resetInput();
}

export function stopDriving(): void {
  driving = false;
  car.speed = 0;
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
  if (!driving || !challenge || !callbacks) return;
  carry += Math.min(frameSeconds, MAX_FRAME);
  while (carry >= STEP) {
    carry -= STEP;
    elapsed += STEP;
    stepCar(car, input, STEP);
    const result = refStep(ref, challenge, car, STEP);
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
