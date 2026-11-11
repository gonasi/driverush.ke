/**
 * One joystick drives the car: push the knob toward where you want it to go on
 * the table, further to go faster, and let go to stop.
 *
 * The learner stands at one side of the table (their seat) and the view never
 * turns, so "up" on the knob always means "away from me". From the south side
 * that is north; from the west side it is east.
 *
 * Lane assist: holding a curved lane with a thumb is the hard part, so while
 * the knob points roughly along the lane the car is in, the car steers for the
 * middle of that lane. Point clearly somewhere else (the next lane, an exit)
 * and the knob is obeyed as it is. The learner still decides everything; the
 * assist only irons out the wobble.
 *
 * Pure, and run once per physics step so the steering tracks the car as it
 * turns.
 */
import { CAR, type CarInput, type CarState } from "./car";
import type { BoardSide } from "./full-board";
import {
  bearingOf,
  dirOf,
  laneBearing,
  lanePoint,
  locate,
  ringRadius,
  wrapPi,
} from "./geometry";

/** Which side of the table the learner stands at. South is the bottom. */
export type Seat = BoardSide;
export const SEATS: readonly Seat[] = ["south", "west", "north", "east"];

/** The knob, as the screen sees it: `x` right, `y` down, at most 1 from centre. */
export type Stick = { x: number; y: number };

export type DriveOptions = { seat: Seat; assist: boolean };

/** What the assist remembers between steps. */
export type AssistState = {
  /** The lane the car came up the road in, until it has joined the ring. */
  entryLane: number | null;
};

export function createAssist(): AssistState {
  return { entryLane: null };
}

/** The compass bearing of "up" on the knob, for each seat. */
const AWAY: Record<Seat, number> = {
  south: 0,
  west: Math.PI / 2,
  north: Math.PI,
  east: -Math.PI / 2,
};

/** Inside this the knob counts as let go. */
export const STICK_DEADZONE = 0.18;
/** How hard the wheel turns per radian the car is off its target. */
const STEER_GAIN = 2;
/** Pointing this far behind the car brakes rather than spinning it round. */
const PULL_BACK = (135 * Math.PI) / 180;
/** How much speed a quarter-turn takes off, so tight bends stay holdable. */
const TURN_SLOWDOWN = 0.55;
const QUARTER_TURN = Math.PI / 2;
const RELEASE_BRAKE = 0.7;

/** The assist holds while the knob is within this of the lane's direction. */
export const ROAD_CONE = (30 * Math.PI) / 180;
/**
 * The roundabout bends, so a thumb lags behind it: the cone is wider there.
 * It is narrower on the outside, because pointing outward is how you ask for
 * an exit, and the car should leave the ring while the exit is still ahead.
 */
export const RING_CONE_IN = (55 * Math.PI) / 180;
export const RING_CONE_OUT = (38 * Math.PI) / 180;
/** The cone's edge is soft, so the assist fades rather than snaps. */
const CONE_EDGE = (8 * Math.PI) / 180;
/** Sideways grip the assist drives within on the roundabout, m/s². */
const BEND_GRIP = 3.2;
/** On the roundabout the assist looks this share of the lane's radius ahead. */
const RING_REACH = 0.5;
/** Joined the ring once this close to the middle of its lane, metres. */
const JOINED = 0.9;

/** The world direction the knob is pointing, for a learner at `seat`. */
export function stickBearing(stick: Stick, seat: Seat): number {
  return wrapPi(Math.atan2(stick.x, -stick.y) + AWAY[seat]);
}

/** Where the lane the car is in would take it, if it has one. */
function laneAhead(
  car: CarState,
  state: AssistState,
): {
  /** Where to steer to hold the lane. */
  heading: number;
  /** Which way the lane runs where the car is. */
  along: number;
  /** How far the knob may point left and right of that and still be held. */
  left: number;
  right: number;
  cap: number;
} | null {
  const loc = locate(car.x, car.z);
  const reach = 3.5 + 0.35 * car.speed;

  if (loc.kind === "arm") {
    state.entryLane = loc.side === "approach" ? loc.lane : null;
    const toward = loc.side === "approach" ? -1 : 1;
    const aim = lanePoint(
      loc.arm,
      loc.side,
      loc.lane,
      loc.along + toward * reach,
    );
    return {
      heading: bearingOf(aim.x - car.x, aim.z - car.z),
      along: laneBearing(loc.arm, loc.side),
      left: ROAD_CONE,
      right: ROAD_CONE,
      cap: CAR.maxSpeed,
    };
  }

  if (loc.kind === "ring") {
    // On the way in, head for the ring lane with the approach lane's number.
    // After that, hold whichever lane the car is in.
    let lane = loc.lane;
    if (state.entryLane != null) {
      if (Math.abs(loc.r - ringRadius(state.entryLane)) < JOINED) {
        state.entryLane = null;
      } else {
        lane = state.entryLane;
      }
    }
    const r = ringRadius(lane);
    // Aim a short way round the lane: short enough on the tight inner lanes
    // that the car doesn't cut the corner on its way in.
    const dir = dirOf(loc.bearing + Math.min(reach, r * RING_REACH) / r);
    return {
      heading: bearingOf(dir.x * r - car.x, dir.z * r - car.z),
      // Clockwise: the lane runs a quarter turn on from the car's bearing.
      along: loc.bearing + Math.PI / 2,
      left: RING_CONE_OUT,
      right: RING_CONE_IN,
      cap: Math.sqrt(BEND_GRIP * r),
    };
  }

  return null;
}

export function stickToInput(
  stick: Stick,
  car: CarState,
  input: CarInput,
  options: DriveOptions,
  state: AssistState,
): void {
  const push = Math.min(1, Math.hypot(stick.x, stick.y));
  // Keep the assist's memory of the approach lane fresh even when coasting.
  const lane = options.assist ? laneAhead(car, state) : null;

  if (push < STICK_DEADZONE) {
    // Let go: come to a stop, wheels straight.
    input.steer = 0;
    input.throttle = 0;
    input.brake = car.speed > 0 ? RELEASE_BRAKE : 0;
    return;
  }

  const knob = stickBearing(stick, options.seat);

  if (Math.abs(wrapPi(knob - car.heading)) > PULL_BACK) {
    input.steer = 0;
    input.throttle = 0;
    input.brake = 1;
    return;
  }

  let target = knob;
  let cap: number = CAR.maxSpeed;
  if (lane) {
    const off = wrapPi(knob - lane.along);
    const cone = off < 0 ? lane.left : lane.right;
    const hold = Math.max(
      0,
      Math.min(1, (cone + CONE_EDGE - Math.abs(off)) / (2 * CONE_EDGE)),
    );
    target = knob + hold * wrapPi(lane.heading - knob);
    cap = CAR.maxSpeed + hold * (lane.cap - CAR.maxSpeed);
  }

  const off = wrapPi(target - car.heading);
  input.steer = Math.max(-1, Math.min(1, off * STEER_GAIN));

  const reach = (push - STICK_DEADZONE) / (1 - STICK_DEADZONE);
  const turning = Math.min(1, Math.abs(off) / QUARTER_TURN);
  const speed = Math.min(
    cap,
    CAR.maxSpeed * reach * (1 - TURN_SLOWDOWN * turning),
  );
  input.throttle = car.speed < speed - 0.15 ? 1 : 0;
  input.brake = car.speed > speed + 1 ? 0.5 : 0;
}
