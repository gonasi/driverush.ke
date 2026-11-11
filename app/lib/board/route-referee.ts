/**
 * The referee for route tasks: the ones that leave the roundabout's roads for
 * the street, the two-way road and the parking bays. `referee.ts` knows the
 * roundabout lane by lane. This one checks a drive against the task's route,
 * the line `network.ts` found for it.
 *
 * It ends the attempt when the car leaves the route, is in the wrong lane at
 * the roundabout or coming up to a junction turn, drives against the traffic,
 * or runs a stop line. It passes
 * the task when the car stops in the green box, or in the bay, straight.
 *
 * Give way lines and pedestrian crossings are not enforced: there is no other
 * traffic on the board yet to give way to.
 */
import type { CarState } from "./car";
import { wrapPi } from "./geometry";
import { ROAD_BOX } from "./lessons";
import type { Route } from "./network";
import type { Contact } from "./physics";
import type { Fault, RefResult, SmallFaultId } from "./referee";

export type RouteRefState = {
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
  stopped: Set<number>;
  cooldown: Partial<Record<SmallFaultId, number>>;
};

export function createRouteRef(): RouteRefState {
  return {
    progress: 0,
    offTime: 0,
    wrongWayTime: 0,
    goalTime: 0,
    askewTime: 0,
    askewTold: false,
    stopped: new Set(),
    cooldown: {},
  };
}

/** How far from the route's line the car may be, by what it is doing there. */
const LANE_STRICT = 3;
const ROAD_LOOSE = 6;
const OFF_GRACE = 1;
/** This far before a junction turn, the car should be in the lane for it. */
const TURN_APPROACH = 12;
const WRONG_WAY_ANGLE = (115 * Math.PI) / 180;
const WRONG_WAY_GRACE = 0.8;
const MOVING = 0.5;
const STOPPED = 0.2;
const GOAL_HOLD = 0.35;
const BUMP_COOLDOWN = 1.5;
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

const BUMPS: Partial<Record<Contact, SmallFaultId>> = {
  kerb: "kerb",
  reserve: "central_reserve",
  island: "island",
};

/**
 * The nearest point of the route to the car, looking only a little behind
 * where it last was and some way ahead, so a route that crosses itself is not
 * confused with its own other half.
 */
function nearest(route: Route, car: CarState, from: number) {
  let best = { distance: from, gap: Infinity, heading: 0 };
  // Where a route goes forward and then back over the same ground, as it does
  // at a bay, the way the car is moving says which of the two it is on.
  const moving = car.speed < -0.05 ? "reverse" : car.speed > 0.05 ? "forward" : null;
  for (let i = 0; i < route.points.length - 1; i += 1) {
    if (route.at[i + 1] < from - 12 || route.at[i] > from + 30) continue;
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
      result.small.push({ id, serious: false });
    }
  }

  const at = nearest(route, car, ref.progress);
  ref.progress = at.distance;
  const index = Math.max(
    0,
    route.steps.findIndex((s) => at.distance < s.to),
  );
  const step = route.steps[index] ?? route.steps[route.steps.length - 1];
  const speed = Math.abs(car.speed);

  // off the route, or in the wrong lane where the lane is the whole point
  // The lane matters at the roundabout, and at a junction: in the turn itself
  // and on the last stretch up to it, where the car should already be in the
  // lane the turn is made from.
  const isTurn = (s: typeof step) =>
    s.maneuver === "turn_left" || s.maneuver === "turn_right";
  const next = route.steps[index + 1];
  const strict =
    step.maneuver === "hold_lane" ||
    step.maneuver === "ring" ||
    step.maneuver === "exit" ||
    isTurn(step) ||
    (next != null && isTurn(next) && at.distance > next.from - TURN_APPROACH);
  ref.offTime = at.gap > (strict ? LANE_STRICT : ROAD_LOOSE) ? ref.offTime + dt : 0;
  if (ref.offTime > OFF_GRACE) {
    // In the turn itself, the car has gone somewhere else. Before it, or at
    // the roundabout, it is in the wrong lane.
    const fault: Fault =
      strict && !isTurn(step)
        ? { id: "wrong_lane", serious: true }
        : { id: "off_route", serious: true };
    result.fault = fault;
    return result;
  }

  // facing against the way the route runs
  const against = Math.abs(wrapPi(car.heading - at.heading)) > WRONG_WAY_ANGLE;
  ref.wrongWayTime = against && speed > MOVING ? ref.wrongWayTime + dt : 0;
  if (ref.wrongWayTime > WRONG_WAY_GRACE) {
    result.fault = { id: "wrong_way", serious: true };
    return result;
  }

  // stop lines: a full stop before the line, every time
  for (let i = 0; i < route.steps.length; i += 1) {
    const line = route.steps[i];
    if (line.control !== "stop" || ref.stopped.has(i)) continue;
    const past = at.distance - line.from;
    if (past > -STOP_BEFORE && past < STOP_AFTER && speed < STOPPED) {
      ref.stopped.add(i);
    } else if (past > STOP_RUN && past < STOP_RUN + 20) {
      result.fault = { id: "stop_line", serious: true };
      return result;
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
