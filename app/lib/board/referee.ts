/**
 * Watches a free drive and says what each mistake costs. Small ones (bumping a
 * kerb, drifting over a continuous line) lose a star and the drive goes on.
 * Serious ones (the wrong exit, driving against the traffic) end the attempt,
 * the way an examiner would stop you.
 *
 * Pure: give it the car, what it has just touched and the time step, and get
 * back any mistakes or a pass. Every check has some slack (a distance or a
 * short grace time) so brushing a line isn't punished.
 */
import type { CarState } from "./car";
import type { BoardChallenge } from "./challenges";
import {
  ARMS,
  EXIT_CLEAR,
  RING_LANES,
  SOLID_ZONE,
  TAU,
  allowedTurns,
  laneBearing,
  locate,
  turnBetween,
  wrapPi,
  type ArmId,
  type Turn,
} from "./geometry";
import type { Contact } from "./physics";

export type SmallFaultId =
  | "kerb"
  | "central_reserve"
  | "island"
  | "solid_line"
  | "roundabout_lane_change"
  | "roundabout_stop";
export type SeriousFaultId =
  | "wrong_exit"
  | "wrong_destination"
  | "wrong_way"
  | "centre_line"
  | "full_circle"
  | "collision"
  | "past_end"
  | "off_route";
export type FaultId = SmallFaultId | SeriousFaultId;

export type Fault = {
  id: FaultId;
  /** Serious faults end the attempt. Small ones only cost a star. */
  serious: boolean;
  /** The approach lane, for lane faults. */
  lane?: number;
  /** How many lanes that approach road has. */
  lanes?: number;
  /** The turn the car actually made. */
  turn?: Turn;
  /** The turn the challenge asked for. */
  asked?: Turn;
};

export type RefResult = {
  /** Small mistakes made this step. The drive goes on. */
  small: Fault[];
  /** A serious mistake. The attempt is over. */
  fault?: Fault;
  goal?: boolean;
};

export const COLLISION: Fault = { id: "collision", serious: true };

type RingVisit = {
  entryArm: ArmId;
  entryLane: number;
  /** Radians travelled clockwise in each ring lane. Index 0 is unused. */
  arc: number[];
  total: number;
  lastBearing: number | null;
  warnedLane: boolean;
  warnedStop: boolean;
};

export type RefState = {
  wrongWayTime: number;
  stopTime: number;
  goalTime: number;
  lastApproach: { arm: ArmId; lane: number } | null;
  ring: RingVisit | null;
  /** The lane the car held when it reached the continuous lines. */
  zoneLane: number | null;
  /** How long the car has been in a different lane from `zoneLane`. */
  zoneDrift: number;
  /** Seconds until each kind of bump can cost a star again. */
  cooldown: Partial<Record<SmallFaultId, number>>;
  /** How long the car has been on a road the task doesn't use. */
  offRoute: number;
};

export function createRef(): RefState {
  return {
    wrongWayTime: 0,
    stopTime: 0,
    goalTime: 0,
    lastApproach: null,
    ring: null,
    zoneLane: null,
    zoneDrift: 0,
    cooldown: {},
    offRoute: 0,
  };
}

const WRONG_WAY_GRACE = 0.8;
const WRONG_WAY_ANGLE = (115 * Math.PI) / 180;
const MOVING = 0.5;
const STOPPED = 0.2;
const ROUNDABOUT_STOP_GRACE = 2.5;
/** Crossing lanes to get in or out takes a few degrees. Staying takes more. */
const SETTLED_ARC = (40 * Math.PI) / 180;
const GOAL_HOLD = 0.35;
/** A lane change counts once the car has sat in the new lane this long. */
const LINE_GRACE = 0.3;
/** One bump, one star: leaning on a kerb doesn't keep costing. */
const BUMP_COOLDOWN = 1.5;
/** Clipping the mouth of a side road is forgiven. Driving down it is not. */
const OFF_ROUTE_GRACE = 1;
/** This far beyond the green box, the car has plainly driven past it. */
const PAST_BOX = 12;

const BUMPS: Partial<Record<Contact, SmallFaultId>> = {
  kerb: "kerb",
  reserve: "central_reserve",
  island: "island",
};

function small(id: SmallFaultId): Fault {
  return { id, serious: false };
}

export function refStep(
  ref: RefState,
  challenge: BoardChallenge,
  car: CarState,
  contacts: readonly Contact[],
  dt: number,
): RefResult {
  const result: RefResult = { small: [] };

  for (const key of Object.keys(ref.cooldown) as SmallFaultId[]) {
    ref.cooldown[key] = Math.max(0, (ref.cooldown[key] ?? 0) - dt);
  }
  for (const contact of contacts) {
    if (contact === "end") {
      result.fault = { id: "past_end", serious: true };
      return result;
    }
    const id = BUMPS[contact];
    if (id && !(ref.cooldown[id]! > 0)) {
      ref.cooldown[id] = BUMP_COOLDOWN;
      result.small.push(small(id));
    }
  }

  const loc = locate(car.x, car.z);
  // Kerbs are solid, so this is only a car squeezed half onto one.
  if (loc.kind === "off") return result;

  // The street, the two-way road and the parking zone are on the board, but
  // no task goes that way yet.
  if (loc.kind === "road") {
    ref.offRoute += dt;
    if (ref.offRoute > OFF_ROUTE_GRACE) {
      result.fault = { id: "off_route", serious: true, asked: challenge.turn };
    }
    return result;
  }
  ref.offRoute = 0;

  const moving = car.speed > MOVING;

  if (loc.kind === "ring") {
    if (!ref.ring && ref.lastApproach) {
      ref.ring = {
        entryArm: ref.lastApproach.arm,
        entryLane: ref.lastApproach.lane,
        arc: new Array(RING_LANES + 1).fill(0),
        total: 0,
        lastBearing: null,
        warnedLane: false,
        warnedStop: false,
      };
      ref.stopTime = 0;
    }
    ref.zoneLane = null;
    const visit = ref.ring;

    // Clockwise means the car's heading sits a quarter turn past its bearing.
    const against =
      Math.abs(wrapPi(car.heading - (loc.bearing + Math.PI / 2))) >
      WRONG_WAY_ANGLE;
    ref.wrongWayTime = against && moving ? ref.wrongWayTime + dt : 0;
    if (ref.wrongWayTime > WRONG_WAY_GRACE) {
      result.fault = { id: "wrong_way", serious: true };
      return result;
    }

    ref.stopTime = car.speed < STOPPED ? ref.stopTime + dt : 0;
    if (ref.stopTime > ROUNDABOUT_STOP_GRACE && visit && !visit.warnedStop) {
      visit.warnedStop = true;
      result.small.push(small("roundabout_stop"));
    }

    if (visit) {
      if (visit.lastBearing != null) {
        const step = wrapPi(loc.bearing - visit.lastBearing);
        if (step > 0) {
          visit.arc[loc.lane] += step;
          visit.total += step;
        }
      }
      visit.lastBearing = loc.bearing;

      if (!visit.warnedLane) {
        for (let lane = 1; lane <= RING_LANES; lane += 1) {
          if (lane !== visit.entryLane && visit.arc[lane] > SETTLED_ARC) {
            visit.warnedLane = true;
            result.small.push({
              ...small("roundabout_lane_change"),
              lane: visit.entryLane,
            });
            break;
          }
        }
      }

      // Only the innermost lane may go all the way round.
      if (visit.entryLane < RING_LANES && visit.total > TAU + 0.12) {
        result.fault = {
          id: "full_circle",
          serious: true,
          lane: visit.entryLane,
        };
      }
    }
    return result;
  }

  // On an arm. Until the car is clear of the roundabout it still counts as on
  // it, so wobbling across the outer line isn't read as taking an exit.
  const visit = ref.ring;
  if (visit && loc.along < EXIT_CLEAR) {
    visit.lastBearing = null;
    return result;
  }

  if (visit) {
    ref.ring = null;
    ref.lastApproach = null;
    if (loc.side === "exit") {
      const turn = turnBetween(visit.entryArm, loc.arm);
      const lanes = ARMS[visit.entryArm].lanes;
      if (!allowedTurns(lanes, visit.entryLane).includes(turn)) {
        result.fault = {
          id: "wrong_exit",
          serious: true,
          lane: visit.entryLane,
          lanes,
          turn,
        };
        return result;
      }
      if (loc.arm !== challenge.goal.arm) {
        result.fault = {
          id: "wrong_destination",
          serious: true,
          turn,
          asked: challenge.turn,
        };
        return result;
      }
    }
  }

  const against =
    Math.abs(wrapPi(car.heading - laneBearing(loc.arm, loc.side))) >
    WRONG_WAY_ANGLE;
  ref.wrongWayTime = against && moving ? ref.wrongWayTime + dt : 0;
  if (ref.wrongWayTime > WRONG_WAY_GRACE) {
    // With no central reserve in the way, this is a crossed centre line.
    result.fault = {
      id: ARMS[loc.arm].medianHalf > 0 ? "wrong_way" : "centre_line",
      serious: true,
    };
    return result;
  }

  if (loc.side === "approach" && !against) {
    ref.lastApproach = { arm: loc.arm, lane: loc.lane };

    // Close to the roundabout the lane lines are continuous: no lane changes.
    if (loc.along < SOLID_ZONE) {
      if (ref.zoneLane == null) ref.zoneLane = loc.lane;
      ref.zoneDrift = loc.lane === ref.zoneLane ? 0 : ref.zoneDrift + dt;
      if (ref.zoneDrift > LINE_GRACE) {
        ref.zoneLane = loc.lane;
        ref.zoneDrift = 0;
        result.small.push(small("solid_line"));
      }
    } else {
      ref.zoneLane = null;
      ref.zoneDrift = 0;
    }
  }

  const goal = challenge.goal;
  const goalSide = goal.side ?? "exit";
  if (loc.arm === goal.arm && loc.side === goalSide) {
    // Leaving the roundabout the box is passed going out; coming back toward
    // it, going in.
    const past =
      goalSide === "exit"
        ? loc.along - goal.alongMax
        : goal.alongMin - loc.along;
    if (past > PAST_BOX) {
      result.fault = { id: "past_end", serious: true };
      return result;
    }
  }
  const inBox =
    loc.side === goalSide &&
    loc.arm === goal.arm &&
    loc.along >= goal.alongMin &&
    loc.along <= goal.alongMax &&
    (goal.lane == null || loc.lane === goal.lane);
  ref.goalTime = inBox && car.speed < STOPPED ? ref.goalTime + dt : 0;
  if (ref.goalTime >= GOAL_HOLD) result.goal = true;

  return result;
}
