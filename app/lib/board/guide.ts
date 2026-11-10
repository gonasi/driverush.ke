/**
 * The lane-keeping driver. The learner never steers: this follows the lane for
 * them, slows for bends, and does what the three controls ask (go, lane left or
 * exit, lane right). What is left for the learner is what the board tests:
 * which lane, which exit, and when to stop.
 *
 * It steers the same car model as before (`car-sim.ts`), so the car still moves
 * like a car. Pure, and stepped at a fixed rate by `runtime.ts`.
 */
import { CAR, stepCar, type CarInput, type CarState } from "./car-sim";
import type { BoardChallenge } from "./challenges";
import {
  ARMS,
  ARM_ORDER,
  BOARD_HALF,
  EXIT_CLEAR,
  SOLID_ZONE,
  TAU,
  bearingOf,
  laneBearing,
  lanePoint,
  locate,
  ringRadius,
  turnBetween,
  wrapPi,
  type ArmId,
  type Turn,
  type Vec,
} from "./geometry";
import {
  approachPath,
  exitPath,
  exitRoadPath,
  joinBearing,
  offsetOn,
  ringPath,
} from "./lane-paths";

/** Where the car is on its trip through the junction. */
type Segment =
  | { kind: "approach"; arm: ArmId; lane: number }
  | {
      kind: "ring";
      entryArm: ArmId;
      lane: number;
      /** Radians travelled round the roundabout so far. */
      arc: number;
      lastBearing: number;
      exit: ArmId | null;
    }
  | { kind: "exit"; arm: ArmId; lane: number };

export type GuideEvent =
  | {
      type: "exited";
      entryArm: ArmId;
      entryLane: number;
      arm: ArmId;
      turn: Turn;
    }
  | { type: "full_circle"; lane: number }
  | { type: "stopped_on_roundabout" }
  | { type: "past_end" };

/** Why a button press was refused. Each one is a small mistake. */
export type Refusal =
  | "kerb"
  | "central_reserve"
  | "centre_line"
  | "solid_line"
  | "roundabout_lane_change";

export type Press =
  | { ok: true; did: "lane" | "exit" | "nothing" }
  | { ok: false; why: Refusal };

export type Guide = {
  seg: Segment;
  path: Vec[];
  /** Speed the road allows at each path point, from how tight it bends. */
  limit: number[];
  /** Index of the path point nearest the car. Only ever moves forward. */
  at: number;
  /** The learner has signalled to leave at the next exit. */
  exitArmed: boolean;
  indicator: "left" | "right" | null;
  indicatorTime: number;
  braking: boolean;
  stopTime: number;
  stopWarned: boolean;
  done: boolean;
  input: CarInput;
};

/** Sideways grip the car is driven within, m/s². Sets the speed in bends. */
const GRIP = 3.2;
/** How hard the driver brakes for a bend ahead, and when Go is released. */
const EASE_OFF = 3.5;
const RELEASE_BRAKE = 0.55;
/** Curvature is measured over this much road either side of a point. */
const BEND_WINDOW = 3;
const SCAN_AHEAD = 18;
const STEER_GAIN = 2.2;
/** An exit this close ahead is already missed; the car takes the one after. */
const EXIT_LEAD = 4;
const INDICATOR_TIME = 1.6;
const STOPPED = 0.2;
const ROUNDABOUT_STOP_GRACE = 2.5;

function measure(path: Vec[]): number[] {
  const dist = [0];
  for (let i = 1; i < path.length; i += 1) {
    dist.push(
      dist[i - 1] +
        Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z),
    );
  }
  const limit: number[] = [];
  let back = 0;
  let fore = 0;
  for (let i = 0; i < path.length; i += 1) {
    while (back < i && dist[i] - dist[back + 1] >= BEND_WINDOW) back += 1;
    while (fore < path.length - 1 && dist[fore] - dist[i] < BEND_WINDOW) {
      fore += 1;
    }
    if (back === i || fore === i) {
      limit.push(CAR.maxSpeed);
      continue;
    }
    const turn = Math.abs(
      wrapPi(
        bearingOf(path[fore].x - path[i].x, path[fore].z - path[i].z) -
          bearingOf(path[i].x - path[back].x, path[i].z - path[back].z),
      ),
    );
    const span = (dist[fore] - dist[back]) / 2;
    const bend = turn / Math.max(span, 0.5);
    limit.push(Math.min(CAR.maxSpeed, Math.sqrt(GRIP / Math.max(bend, 1e-3))));
  }
  return limit;
}

function follow(g: Guide, path: Vec[]): void {
  g.path = path;
  g.limit = measure(path);
  g.at = 0;
}

function signal(g: Guide, side: "left" | "right", hold = false): void {
  g.indicator = side;
  g.indicatorTime = hold ? Infinity : INDICATOR_TIME;
}

export function createGuide(challenge: BoardChallenge): Guide {
  const { arm, lane, along } = challenge.start;
  const g: Guide = {
    seg: { kind: "approach", arm, lane },
    path: [],
    limit: [],
    at: 0,
    exitArmed: false,
    indicator: null,
    indicatorTime: 0,
    braking: false,
    stopTime: 0,
    stopWarned: false,
    done: false,
    input: { steer: 0, throttle: 0, brake: 0 },
  };
  const start = lanePoint(arm, "approach", lane, along);
  follow(g, approachPath(arm, lane, along, offsetOn(arm, "approach", start)));
  return g;
}

/** Put a car on the challenge's start line, facing the roundabout. */
export function placeAtStart(challenge: BoardChallenge, car: CarState): void {
  const { arm, lane, along } = challenge.start;
  const start = lanePoint(arm, "approach", lane, along);
  car.x = start.x;
  car.z = start.z;
  car.heading = laneBearing(arm, "approach");
  car.speed = 0;
  car.steer = 0;
}

function alongOf(arm: ArmId, car: CarState): number {
  const { out } = ARMS[arm];
  return car.x * out.x + car.z * out.z;
}

/** In the last stretch before the roundabout, or on it. */
function inJunction(g: Guide, car: CarState): boolean {
  if (g.seg.kind === "ring") return true;
  return g.seg.kind === "approach" && alongOf(g.seg.arm, car) < SOLID_ZONE;
}

/** Near the roundabout the left button signals for an exit. */
export function leftMeansExit(g: Guide, car: CarState): boolean {
  return inJunction(g, car);
}

/** The first exit far enough ahead to still take, going clockwise. */
function nextExit(lane: number, bearing: number): ArmId {
  let best: ArmId = ARM_ORDER[0];
  let least = Infinity;
  for (const arm of ARM_ORDER) {
    const exitLane = Math.min(lane, ARMS[arm].lanes);
    let ahead = (joinBearing(arm, "exit", exitLane, lane) - bearing) % TAU;
    if (ahead < 0) ahead += TAU;
    if (ahead * ringRadius(lane) < EXIT_LEAD) ahead += TAU;
    if (ahead < least) {
      least = ahead;
      best = arm;
    }
  }
  return best;
}

function takeNextExit(g: Guide, car: CarState): void {
  if (g.seg.kind !== "ring" || g.seg.exit) return;
  const bearing = bearingOf(car.x, car.z);
  const arm = nextExit(g.seg.lane, bearing);
  g.seg.exit = arm;
  follow(
    g,
    exitPath(g.seg.lane, bearing, arm, Math.min(g.seg.lane, ARMS[arm].lanes)),
  );
  signal(g, "left", true);
}

function changeLane(g: Guide, car: CarState, by: -1 | 1): Press {
  const seg = g.seg;
  if (seg.kind === "ring") return { ok: false, why: "roundabout_lane_change" };
  const arm = ARMS[seg.arm];
  const lane = seg.lane + by;
  // Lane 1 is by the kerb, on the driver's left. The highest is by the centre.
  if (lane < 1) return { ok: false, why: "kerb" };
  if (lane > arm.lanes) {
    return {
      ok: false,
      why: arm.medianHalf > 0 ? "central_reserve" : "centre_line",
    };
  }
  const along = alongOf(seg.arm, car);
  seg.lane = lane;
  if (seg.kind === "approach") {
    follow(
      g,
      approachPath(seg.arm, lane, along, offsetOn(seg.arm, "approach", car)),
    );
  } else {
    follow(
      g,
      exitRoadPath(seg.arm, lane, along, offsetOn(seg.arm, "exit", car)),
    );
  }
  signal(g, by < 0 ? "left" : "right");
  return { ok: true, did: "lane" };
}

export function pressLeft(g: Guide, car: CarState): Press {
  if (g.done) return { ok: true, did: "nothing" };
  if (inJunction(g, car)) {
    if (g.exitArmed) return { ok: true, did: "nothing" };
    g.exitArmed = true;
    signal(g, "left", true);
    takeNextExit(g, car);
    return { ok: true, did: "exit" };
  }
  return changeLane(g, car, -1);
}

export function pressRight(g: Guide, car: CarState): Press {
  if (g.done) return { ok: true, did: "nothing" };
  if (g.seg.kind === "approach" && inJunction(g, car)) {
    return { ok: false, why: "solid_line" };
  }
  return changeLane(g, car, 1);
}

/** Advance the car one step: steer along the lane, hold the right speed. */
export function guideStep(
  g: Guide,
  car: CarState,
  go: boolean,
  dt: number,
): GuideEvent[] {
  const events: GuideEvent[] = [];
  const { path } = g;

  while (
    g.at < path.length - 1 &&
    Math.hypot(path[g.at + 1].x - car.x, path[g.at + 1].z - car.z) <=
      Math.hypot(path[g.at].x - car.x, path[g.at].z - car.z)
  ) {
    g.at += 1;
  }

  // Aim at a point a little way down the lane, further when going faster.
  const reach = 3.5 + 0.35 * car.speed;
  let aim = g.at;
  let run = 0;
  while (aim < path.length - 1 && run < reach) {
    run += Math.hypot(
      path[aim + 1].x - path[aim].x,
      path[aim + 1].z - path[aim].z,
    );
    aim += 1;
  }
  const want = bearingOf(path[aim].x - car.x, path[aim].z - car.z);
  g.input.steer = Math.max(
    -1,
    Math.min(1, wrapPi(want - car.heading) * STEER_GAIN),
  );

  // The fastest the road ahead allows, braking in time for any bend.
  let allowed: number = CAR.maxSpeed;
  run = 0;
  for (let i = g.at; i < path.length - 1 && run < SCAN_AHEAD; i += 1) {
    allowed = Math.min(
      allowed,
      Math.sqrt(g.limit[i] ** 2 + 2 * EASE_OFF * run),
    );
    run += Math.hypot(path[i + 1].x - path[i].x, path[i + 1].z - path[i].z);
  }
  const target = go ? allowed : 0;
  g.input.throttle = car.speed < target - 0.1 ? 1 : 0;
  if (!go) {
    g.input.brake = car.speed > 0 ? RELEASE_BRAKE : 0;
  } else if (car.speed > target + 0.4) {
    g.input.brake = Math.max(0.2, Math.min(0.8, (car.speed - target) / 2));
  } else {
    g.input.brake = 0;
  }
  g.braking = g.input.brake > 0 && car.speed > 0.05;

  stepCar(car, g.input, dt);

  if (g.indicator) {
    g.indicatorTime -= dt;
    if (g.indicatorTime <= 0) g.indicator = null;
  }

  const seg = g.seg;
  const loc = locate(car.x, car.z);

  if (seg.kind === "approach" && loc.kind === "ring") {
    const bearing = bearingOf(car.x, car.z);
    g.seg = {
      kind: "ring",
      entryArm: seg.arm,
      lane: seg.lane,
      arc: 0,
      lastBearing: bearing,
      exit: null,
    };
    g.stopTime = 0;
    if (g.exitArmed) takeNextExit(g, car);
    return events;
  }

  if (seg.kind === "ring") {
    const bearing = bearingOf(car.x, car.z);
    const step = wrapPi(bearing - seg.lastBearing);
    if (step > 0) seg.arc += step;
    seg.lastBearing = bearing;

    g.stopTime = car.speed < STOPPED ? g.stopTime + dt : 0;
    if (g.stopTime > ROUNDABOUT_STOP_GRACE && !g.stopWarned) {
      g.stopWarned = true;
      events.push({ type: "stopped_on_roundabout" });
    }

    if (!seg.exit) {
      // Only the innermost lane may go all the way round.
      if (seg.lane < 4 && seg.arc > TAU + 0.12) {
        g.done = true;
        events.push({ type: "full_circle", lane: seg.lane });
        return events;
      }
      if (g.at > path.length - 40) follow(g, ringPath(seg.lane, bearing));
      return events;
    }

    if (loc.kind === "arm" && loc.along >= EXIT_CLEAR) {
      const arm = seg.exit;
      events.push({
        type: "exited",
        entryArm: seg.entryArm,
        entryLane: seg.lane,
        arm,
        turn: turnBetween(seg.entryArm, arm),
      });
      g.seg = {
        kind: "exit",
        arm,
        lane: Math.min(seg.lane, ARMS[arm].lanes),
      };
      g.exitArmed = false;
      g.indicator = null;
    }
    return events;
  }

  if (seg.kind === "exit" && alongOf(seg.arm, car) > BOARD_HALF) {
    g.done = true;
    events.push({ type: "past_end" });
  }
  return events;
}
