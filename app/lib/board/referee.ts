/**
 * Watches a free drive of a turn task and says what each mistake costs. The
 * rules of the road are `road-rules.ts`: small mistakes (bumping a kerb,
 * standing on the roundabout) lose a star and the drive goes on, and breaking
 * a rule (driving against the traffic, and every breach of lane discipline:
 * over a continuous line, changing lanes on the roundabout, leaving it in the
 * wrong lane) ends the attempt, the way an examiner would stop you.
 *
 * This file adds the task. A car may go anywhere on the board as long as it
 * breaks no rule. Leaving the way the task asked for (another exit, another
 * road, past the green box) is said once as a deviation: the drive goes on,
 * but stopping in the box afterwards is not a pass.
 *
 * Pure: give it the car, what it has just touched and the time step, and get
 * back any mistakes or a pass. Every check has some slack (a distance or a
 * short grace time) so brushing a line isn't punished.
 */
import type { CarState } from "./car";
import type { TurnChallenge } from "./challenges";
import { ARMS, type Turn } from "./geometry";
import type { Contact } from "./physics";
import { createRoad, roadStep, type RoadState } from "./road-rules";

export type SmallFaultId =
  | "kerb"
  | "central_reserve"
  | "island"
  | "roundabout_stop"
  | "crossing_stop"
  | "bay_line";
export type SeriousFaultId =
  | "wrong_exit"
  | "wrong_destination"
  | "wrong_way"
  | "centre_line"
  | "full_circle"
  | "collision"
  | "past_end"
  | "off_route"
  | "wrong_lane"
  | "stop_line"
  | "solid_line"
  | "roundabout_lane_change"
  | "exit_lane"
  | "u_turn_lane";

/**
 * Lane discipline the no-fail first drive only says: it shows the rule and
 * lets the learner carry on.
 */
export const LANE_FAULTS: ReadonlySet<FaultId> = new Set<FaultId>([
  "solid_line",
  "roundabout_lane_change",
  "exit_lane",
  "u_turn_lane",
]);
export type FaultId = SmallFaultId | SeriousFaultId;

/**
 * The lane rules. Breaking one ends the attempt on every graded level: an
 * Easy level puts the car back for other mistakes, never for these.
 */
export const STOPS_ALWAYS: ReadonlySet<FaultId> = new Set<FaultId>([
  "solid_line",
  "centre_line",
  "roundabout_lane_change",
  "wrong_exit",
  "exit_lane",
  "u_turn_lane",
  "full_circle",
  "wrong_lane",
]);

/**
 * Leaving the task's route without breaking a rule. The drive goes on, but it
 * can no longer pass.
 */
export const ROUTE_FAULTS: ReadonlySet<FaultId> = new Set<FaultId>([
  "off_route",
  "wrong_destination",
  "past_end",
]);

export type Fault = {
  id: FaultId;
  /**
   * Serious faults end the attempt. Small ones only cost a star. Leaving the
   * route is not serious: it is told through `RefResult.deviation`.
   */
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
  /**
   * The car has just left the task's route without breaking a rule. Said
   * once. The drive goes on, but reaching the goal is no longer a pass.
   */
  deviation?: Fault;
  goal?: boolean;
};

export const COLLISION: Fault = { id: "collision", serious: true };

export type RefState = {
  /** The rules of the road, as they stand for this car. */
  road: RoadState;
  goalTime: number;
  /** How long the car has been on a road the task doesn't use. */
  offRoute: number;
  /** How the car left the task's route, once it has. */
  off: Fault | null;
};

export function createRef(): RefState {
  return { road: createRoad(), goalTime: 0, offRoute: 0, off: null };
}

const STOPPED = 0.2;
const GOAL_HOLD = 0.35;
/** Clipping the mouth of a side road is forgiven. Driving down it is not. */
const OFF_ROUTE_GRACE = 1;
/** This far beyond the green box, the car has plainly driven past it. */
const PAST_BOX = 12;

export function refStep(
  ref: RefState,
  challenge: TurnChallenge,
  car: CarState,
  contacts: readonly Contact[],
  dt: number,
): RefResult {
  const road = roadStep(ref.road, car, contacts, dt, { stopLines: true });
  const result: RefResult = { small: road.small };
  if (road.fault) {
    result.fault = road.fault;
    return result;
  }
  /** Off the task's route, with no rule broken: said the first time only. */
  const deviate = (fault: Fault) => {
    if (ref.off) return;
    ref.off = fault;
    result.deviation = fault;
  };

  // The frame of the board is past the end of every road.
  if (road.frame) deviate({ id: "past_end", serious: false });

  const loc = road.loc;
  if (loc.kind === "off") return result;

  // The street, the two-way road and the parking zone are on the board, but
  // a turn task does not go that way.
  if (loc.kind === "road") {
    ref.offRoute += dt;
    if (ref.offRoute > OFF_ROUTE_GRACE) {
      deviate({ id: "off_route", serious: false, asked: challenge.turn });
    }
    return result;
  }
  ref.offRoute = 0;
  if (loc.kind === "ring") return result;

  // A legal exit, but not the one the task asked for.
  if (road.exited && road.exited.arm !== challenge.goal.arm) {
    deviate({
      id: "wrong_destination",
      serious: false,
      turn: road.exited.turn,
      asked: challenge.turn,
      lanes: ARMS[challenge.start.arm].lanes,
    });
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
    if (past > PAST_BOX) deviate({ id: "past_end", serious: false });
  }
  const inBox =
    loc.side === goalSide &&
    loc.arm === goal.arm &&
    loc.along >= goal.alongMin &&
    loc.along <= goal.alongMax &&
    (goal.lane == null || loc.lane === goal.lane);
  ref.goalTime = inBox && Math.abs(car.speed) < STOPPED ? ref.goalTime + dt : 0;
  if (ref.goalTime >= GOAL_HOLD) result.goal = true;

  return result;
}
