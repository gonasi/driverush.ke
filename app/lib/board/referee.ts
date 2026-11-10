/**
 * Watches the car and calls a fault the moment a board rule is broken, the way
 * an examiner would stop you. Pure: give it the car and the time step, get back
 * a fault, a pass, or nothing.
 *
 * Every check has some slack (a distance or a short grace time) so brushing a
 * line doesn't end the attempt.
 */
import type { CarState } from "./car-sim";
import type { BoardChallenge, OtherCar } from "./challenges";
import {
  ARMS,
  BOARD_HALF,
  EXIT_CLEAR,
  RING_LANES,
  allowedTurns,
  dirOf,
  laneBearing,
  locate,
  turnBetween,
  wrapPi,
  type ArmId,
  type Turn,
} from "./geometry";

export type FaultId =
  | "off_road"
  | "wrong_way"
  | "centre_line"
  | "roundabout_lane_change"
  | "roundabout_stop"
  | "wrong_exit"
  | "wrong_destination"
  | "collision";

export type Fault = {
  id: FaultId;
  /** The approach lane, for lane faults. */
  lane?: number;
  /** How many lanes that approach road has. */
  lanes?: number;
  /** The turn the car actually made. */
  turn?: Turn;
  /** The turn the challenge asked for. */
  asked?: Turn;
  /** Off the road by driving past the end of the board. */
  pastEnd?: boolean;
};

export type RefResult = { fault?: Fault; goal?: boolean };

type RingVisit = {
  entryArm: ArmId;
  entryLane: number;
  /** Radians travelled clockwise in each ring lane. Index 0 is unused. */
  arc: number[];
  lastBearing: number | null;
};

export type RefState = {
  offTime: number;
  wrongWayTime: number;
  stopTime: number;
  goalTime: number;
  lastApproach: { arm: ArmId; lane: number } | null;
  ring: RingVisit | null;
};

export function createRef(): RefState {
  return {
    offTime: 0,
    wrongWayTime: 0,
    stopTime: 0,
    goalTime: 0,
    lastApproach: null,
    ring: null,
  };
}

const OFF_GRACE = 0.3;
const WRONG_WAY_GRACE = 0.8;
const WRONG_WAY_ANGLE = (115 * Math.PI) / 180;
const MOVING = 0.5;
const STOPPED = 0.2;
const ROUNDABOUT_STOP_GRACE = 2;
/** Crossing lanes to get in or out takes a few degrees. Staying takes more. */
const SETTLED_ARC = (40 * Math.PI) / 180;
const GOAL_HOLD = 0.35;
/** Each car is two circles, one over each axle. */
const BUMP_OFFSET = 1.1;
const BUMP_RADIUS = 0.95;

function bumpers(x: number, z: number, heading: number) {
  const dir = dirOf(heading);
  return [
    { x: x + dir.x * BUMP_OFFSET, z: z + dir.z * BUMP_OFFSET },
    { x: x - dir.x * BUMP_OFFSET, z: z - dir.z * BUMP_OFFSET },
  ];
}

function hits(car: CarState, other: OtherCar): boolean {
  for (const a of bumpers(car.x, car.z, car.heading)) {
    for (const b of bumpers(other.x, other.z, other.heading)) {
      if (Math.hypot(a.x - b.x, a.z - b.z) < BUMP_RADIUS * 2) return true;
    }
  }
  return false;
}

export function refStep(
  ref: RefState,
  challenge: BoardChallenge,
  car: CarState,
  dt: number,
): RefResult {
  for (const other of challenge.otherCars) {
    if (hits(car, other)) return { fault: { id: "collision" } };
  }

  const loc = locate(car.x, car.z);

  if (loc.kind === "off") {
    ref.offTime += dt;
    if (ref.offTime > OFF_GRACE) {
      const pastEnd = Math.max(Math.abs(car.x), Math.abs(car.z)) > BOARD_HALF;
      return { fault: { id: "off_road", pastEnd } };
    }
    return {};
  }
  ref.offTime = 0;

  const moving = car.speed > MOVING;

  if (loc.kind === "ring") {
    if (!ref.ring && ref.lastApproach) {
      ref.ring = {
        entryArm: ref.lastApproach.arm,
        entryLane: ref.lastApproach.lane,
        arc: new Array(RING_LANES + 1).fill(0),
        lastBearing: null,
      };
      ref.stopTime = 0;
    }
    const visit = ref.ring;

    // Clockwise means the car's heading sits a quarter turn past its bearing.
    const against =
      Math.abs(wrapPi(car.heading - (loc.bearing + Math.PI / 2))) >
      WRONG_WAY_ANGLE;
    ref.wrongWayTime = against && moving ? ref.wrongWayTime + dt : 0;
    if (ref.wrongWayTime > WRONG_WAY_GRACE) {
      return { fault: { id: "wrong_way" } };
    }

    ref.stopTime = car.speed < STOPPED ? ref.stopTime + dt : 0;
    if (ref.stopTime > ROUNDABOUT_STOP_GRACE) {
      return { fault: { id: "roundabout_stop" } };
    }

    if (visit) {
      if (visit.lastBearing != null) {
        const step = wrapPi(loc.bearing - visit.lastBearing);
        if (step > 0) visit.arc[loc.lane] += step;
      }
      visit.lastBearing = loc.bearing;
      for (let lane = 1; lane <= RING_LANES; lane += 1) {
        if (lane !== visit.entryLane && visit.arc[lane] > SETTLED_ARC) {
          return {
            fault: { id: "roundabout_lane_change", lane: visit.entryLane },
          };
        }
      }
    }
    return {};
  }

  // On an arm. Until the car is clear of the roundabout it still counts as on
  // it, so wobbling across the outer line isn't read as taking an exit.
  const visit = ref.ring;
  if (visit && loc.along < EXIT_CLEAR) {
    visit.lastBearing = null;
    return {};
  }

  if (visit) {
    ref.ring = null;
    ref.lastApproach = null;
    if (loc.side === "exit") {
      const turn = turnBetween(visit.entryArm, loc.arm);
      const lanes = ARMS[visit.entryArm].lanes;
      if (!allowedTurns(lanes, visit.entryLane).includes(turn)) {
        return {
          fault: { id: "wrong_exit", lane: visit.entryLane, lanes, turn },
        };
      }
      if (loc.arm !== challenge.goal.arm) {
        return {
          fault: { id: "wrong_destination", turn, asked: challenge.turn },
        };
      }
    }
  }

  const against =
    Math.abs(wrapPi(car.heading - laneBearing(loc.arm, loc.side))) >
    WRONG_WAY_ANGLE;
  ref.wrongWayTime = against && moving ? ref.wrongWayTime + dt : 0;
  if (ref.wrongWayTime > WRONG_WAY_GRACE) {
    // With no central reserve in the way, this is a crossed centre line.
    return {
      fault: {
        id: ARMS[loc.arm].medianHalf > 0 ? "wrong_way" : "centre_line",
      },
    };
  }

  if (loc.side === "approach" && !against) {
    ref.lastApproach = { arm: loc.arm, lane: loc.lane };
  }

  const goal = challenge.goal;
  const inBox =
    loc.side === "exit" &&
    loc.arm === goal.arm &&
    loc.along >= goal.alongMin &&
    loc.along <= goal.alongMax &&
    (goal.lane == null || loc.lane === goal.lane);
  ref.goalTime = inBox && car.speed < STOPPED ? ref.goalTime + dt : 0;
  if (ref.goalTime >= GOAL_HOLD) return { goal: true };

  return {};
}
