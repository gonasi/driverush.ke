/**
 * The referee for route tasks: the ones that leave the roundabout's roads for
 * the street, the two-way road and the parking bays. The rules of the road
 * are `road-rules.ts`, the same ones a turn task is held to. This file adds
 * the task: it checks the drive against the task's route, the line
 * `network.ts` found for it.
 *
 * A car may go anywhere on the board as long as it breaks no rule. Leaving
 * the route is said once as a deviation: the drive goes on, but it is no
 * longer a pass. On the route, it ends the attempt when the car runs one of
 * the route's stop lines, or makes a junction turn from the wrong lane. It
 * passes the task when the car stops in the green box, or in the bay,
 * straight.
 *
 * Giving way, at a give way line or to people on a crossing, is not enforced:
 * there is no other traffic on the board yet to give way to.
 */
import type { CarState } from "./car";
import { wrapPi } from "./geometry";
import { ROAD_BOX } from "./lessons";
import { poseAt, type Route } from "./network";
import type { Contact } from "./physics";
import type { Fault, RefResult } from "./referee";
import { createRoad, roadStep, type RoadState } from "./road-rules";

export type RouteRefState = {
  /** The rules of the road, as they stand for this car. */
  road: RoadState;
  /** How far along the route the car has got, metres. */
  progress: number;
  offTime: number;
  wrongWayTime: number;
  goalTime: number;
  /** How long the car has sat in the bay without being straight in it. */
  askewTime: number;
  /** The learner has been told the car is not straight in the bay. */
  askewTold: boolean;
  /** Stop lines the car has stopped at, by the step that starts at them. */
  stopped: number[];
  /** How long the car has come up to a junction turn out of its lane. */
  laneTime: number;
  /** The turn it came up to in the wrong lane, by step, until it is past. */
  wrongLaneAt: number | null;
  /** How the car left the route, once it has. */
  off: Fault | null;
};

export function createRouteRef(): RouteRefState {
  return {
    road: createRoad(),
    progress: 0,
    offTime: 0,
    wrongWayTime: 0,
    goalTime: 0,
    askewTime: 0,
    askewTold: false,
    stopped: [],
    laneTime: 0,
    wrongLaneAt: null,
    off: null,
  };
}

/** The car this far from the route's line has left the route. */
const CORRIDOR = 6;
/** Coming up to a junction turn, the car this far off the line is out of its lane. */
const LANE_STRICT = 3;
const OFF_GRACE = 1;
/** This far before a junction turn, the car should be in the lane for it. */
const TURN_APPROACH = 12;
/** Facing within this of the way the turn comes out, the car has made the turn. */
const TURNED = (45 * Math.PI) / 180;
const WRONG_WAY_ANGLE = (115 * Math.PI) / 180;
const WRONG_WAY_GRACE = 0.8;
const MOVING = 0.5;
const STOPPED = 0.2;
const GOAL_HOLD = 0.35;
/** A stop counts from this far before the line to just over it. */
const STOP_BEFORE = 9;
const STOP_AFTER = 2;
/** Past the line by this much without having stopped: the line was run. */
const STOP_RUN = 4.5;
/**
 * In the bay: how far the middle of the car may be from the middle of the bay,
 * along it and across it, and how straight it has to sit. A flush bay is long
 * and narrow; an angle bay is short and wide.
 */
const BAY_FIT = {
  flush_bay: { along: 3, across: 0.6, angle: (14 * Math.PI) / 180 },
  angle_bay: { along: 1.4, across: 1.1, angle: (20 * Math.PI) / 180 },
} as const;
const BAY_NEAR = 4;
const ASKEW_GRACE = 1.4;

/**
 * The nearest point of the route to the car, looking only a little behind
 * where it last was and some way ahead, so a route that crosses itself is not
 * confused with its own other half. A car that has left the route may come
 * back to it anywhere, so then the whole of it is looked at.
 */
function nearest(route: Route, car: CarState, from: number, wide = false) {
  let best = { distance: from, gap: Infinity, heading: 0 };
  // Where a route goes forward and then back over the same ground, as it does
  // at a bay, the way the car is moving says which of the two it is on.
  const moving =
    car.speed < -0.05 ? "reverse" : car.speed > 0.05 ? "forward" : null;
  for (let i = 0; i < route.points.length - 1; i += 1) {
    if (!wide && (route.at[i + 1] < from - 12 || route.at[i] > from + 30)) {
      continue;
    }
    if (moving) {
      const middle = (route.at[i] + route.at[i + 1]) / 2;
      const step = route.steps.find((s) => middle < s.to);
      if (step && step.gear !== moving) continue;
    }
    const a = route.points[i];
    const b = route.points[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const span = dx * dx + dz * dz;
    const t =
      span > 0
        ? Math.min(
            1,
            Math.max(0, ((car.x - a.x) * dx + (car.z - a.z) * dz) / span),
          )
        : 0;
    const gap = Math.hypot(a.x + dx * t - car.x, a.z + dz * t - car.z);
    if (gap < best.gap) {
      best = {
        gap,
        distance: route.at[i] + (route.at[i + 1] - route.at[i]) * t,
        heading: route.headings[i],
      };
    }
  }
  return best;
}

export function routeRefStep(
  ref: RouteRefState,
  route: Route,
  parks: boolean,
  car: CarState,
  contacts: readonly Contact[],
  dt: number,
): RefResult {
  const wasOff = ref.off != null;
  const at = nearest(route, car, ref.progress, wasOff);
  // Off the route, the car is only somewhere along it again once it is back
  // on its line.
  if (!wasOff || at.gap < CORRIDOR) ref.progress = at.distance;
  const index = Math.max(
    0,
    route.steps.findIndex((s) => at.distance < s.to),
  );
  const step = route.steps[index] ?? route.steps[route.steps.length - 1];
  const next = route.steps[index + 1];
  const speed = Math.abs(car.speed);
  const isTurn = (s: typeof step) =>
    s.maneuver === "turn_left" || s.maneuver === "turn_right";

  // Where the route itself crosses the other lane, to turn, turn back or
  // park, keeping left is not judged.
  const crossing =
    !wasOff &&
    (isTurn(step) ||
      step.maneuver === "u_turn" ||
      step.gear === "reverse" ||
      step.road === "angle_bay" ||
      step.road === "flush_bay");
  const road = roadStep(ref.road, car, contacts, dt, {
    crossing,
    stopLines: wasOff,
  });
  const result: RefResult = { small: road.small };
  if (road.fault) {
    result.fault = road.fault;
    return result;
  }
  /** Off the route, with no rule broken: said the first time only. */
  const deviate = (fault: Fault) => {
    if (ref.off) return;
    ref.off = fault;
    result.deviation = fault;
  };

  // The frame of the board is past the end of every road.
  if (road.frame) deviate({ id: "past_end", serious: false });

  if (!ref.off) {
    // away from the route's line
    ref.offTime = at.gap > CORRIDOR ? ref.offTime + dt : 0;
    if (ref.offTime > OFF_GRACE) deviate({ id: "off_route", serious: false });

    // facing against the way the route runs: turned round, going elsewhere
    const against =
      Math.abs(wrapPi(car.heading - at.heading)) > WRONG_WAY_ANGLE;
    ref.wrongWayTime = against && speed > MOVING ? ref.wrongWayTime + dt : 0;
    if (ref.wrongWayTime > WRONG_WAY_GRACE) {
      deviate({ id: "off_route", serious: false });
    }
  }

  if (!ref.off) {
    // A junction turn is made from the lane the route comes up to it in.
    // Coming up to it in another lane is only noted. Driving on past is the
    // car's own business. Making the turn from there is the wrong lane.
    const coming =
      next != null && isTurn(next) && at.distance > next.from - TURN_APPROACH;
    ref.laneTime = coming && at.gap > LANE_STRICT ? ref.laneTime + dt : 0;
    if (coming && ref.laneTime > OFF_GRACE) ref.wrongLaneAt = index + 1;
    if (ref.wrongLaneAt != null) {
      const turn = route.steps[ref.wrongLaneAt];
      if (index > ref.wrongLaneAt || (!coming && index < ref.wrongLaneAt)) {
        ref.wrongLaneAt = null;
      } else if (
        index === ref.wrongLaneAt &&
        Math.abs(wrapPi(car.heading - poseAt(route, turn.to).heading)) < TURNED
      ) {
        result.fault = { id: "wrong_lane", serious: true };
        return result;
      }
    }

    // the route's stop lines: a full stop before the line, every time
    for (let i = 0; i < route.steps.length; i += 1) {
      const line = route.steps[i];
      if (line.control !== "stop" || ref.stopped.includes(i)) continue;
      const past = at.distance - line.from;
      if (past > -STOP_BEFORE && past < STOP_AFTER && speed < STOPPED) {
        ref.stopped.push(i);
      } else if (past > STOP_RUN && past < STOP_RUN + 20) {
        result.fault = { id: "stop_line", serious: true };
        return result;
      }
    }
  }

  const still = speed < STOPPED;
  if (parks) {
    const end = route.points[route.points.length - 1];
    const facing = route.headings[route.headings.length - 1];
    const gap = Math.hypot(car.x - end.x, car.z - end.z);
    const last = route.steps[route.steps.length - 1];
    const fit = BAY_FIT[last?.road === "flush_bay" ? "flush_bay" : "angle_bay"];
    // where the car is in the bay's own frame: along the way it faces, and across
    const fx = Math.sin(facing);
    const fz = -Math.cos(facing);
    const along = (car.x - end.x) * fx + (car.z - end.z) * fz;
    const across = (car.x - end.x) * -fz + (car.z - end.z) * fx;
    const parked =
      Math.abs(along) < fit.along &&
      Math.abs(across) < fit.across &&
      Math.abs(wrapPi(car.heading - facing)) < fit.angle;
    ref.goalTime = parked && still ? ref.goalTime + dt : 0;
    if (ref.goalTime >= GOAL_HOLD) {
      result.goal = true;
      return result;
    }
    // stopped in the bay, but over a line or at an angle: say so, once in a while
    ref.askewTime = !parked && gap < BAY_NEAR && still ? ref.askewTime + dt : 0;
    // Once an attempt: lining up in a bay takes a few goes, and each of them
    // should not cost another star.
    if (ref.askewTime > ASKEW_GRACE && !ref.askewTold) {
      ref.askewTold = true;
      ref.askewTime = 0;
      result.small.push({ id: "bay_line", serious: false });
    }
    return result;
  }

  const inBox = at.distance >= route.length - ROAD_BOX && at.gap < 2.6;
  ref.goalTime = inBox && still ? ref.goalTime + dt : 0;
  if (ref.goalTime >= GOAL_HOLD) result.goal = true;
  return result;
}
