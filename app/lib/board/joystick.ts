/**
 * One joystick drives the car: push the knob toward where you want to go on the
 * screen, further to go faster, and let go to stop. The camera always faces
 * north, so "up" on the knob is north whichever way the car is pointing, and
 * left never swaps with right.
 *
 * This turns the knob into the wheel and pedal values `car-sim.ts` already
 * understands. Pure, and run once per physics step so the steering tracks the
 * car's heading as it turns.
 */
import { CAR, type CarInput, type CarState } from "./car-sim";
import { wrapPi } from "./geometry";

/** The knob, as the screen sees it: `x` right, `y` down, at most 1 from centre. */
export type Stick = { x: number; y: number };

/** Inside this the knob counts as let go. */
export const STICK_DEADZONE = 0.18;
/** How hard the wheel turns per radian the car is off its target. */
const STEER_GAIN = 1.9;
/** Pointing this far behind the car brakes rather than spinning it round. */
const PULL_BACK = (135 * Math.PI) / 180;
/** How much speed a quarter-turn takes off, so tight bends stay holdable. */
const TURN_SLOWDOWN = 0.55;
const QUARTER_TURN = Math.PI / 2;

export function stickToInput(
  stick: Stick,
  car: CarState,
  input: CarInput,
): void {
  const push = Math.min(1, Math.hypot(stick.x, stick.y));

  if (push < STICK_DEADZONE) {
    // Let go: come to a stop, wheels straight.
    input.steer = 0;
    input.throttle = 0;
    input.brake = car.speed > 0 ? 0.7 : 0;
    return;
  }

  // Screen up is north, so the knob's angle is already a compass bearing.
  const off = wrapPi(Math.atan2(stick.x, -stick.y) - car.heading);

  if (Math.abs(off) > PULL_BACK) {
    input.steer = 0;
    input.throttle = 0;
    input.brake = 1;
    return;
  }

  input.steer = Math.max(-1, Math.min(1, off * STEER_GAIN));

  const reach = (push - STICK_DEADZONE) / (1 - STICK_DEADZONE);
  const bend = Math.min(1, Math.abs(off) / QUARTER_TURN);
  const target = CAR.maxSpeed * reach * (1 - TURN_SLOWDOWN * bend);
  input.throttle = car.speed < target - 0.15 ? 1 : 0;
  input.brake = car.speed > target + 1.2 ? 0.5 : 0;
}
