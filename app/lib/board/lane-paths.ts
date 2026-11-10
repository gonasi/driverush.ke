/**
 * The lines the guided car follows: along a road lane, round the roundabout in
 * the ring lane with the same number, and out at an exit. Each is a list of
 * points a metre or so apart, with the corners rounded off.
 */
import {
  ARMS,
  BOARD_HALF,
  TAU,
  bearingOf,
  dirOf,
  laneOffset,
  leftOf,
  ringRadius,
  type ArmId,
  type Side,
  type Vec,
} from "./geometry";

const STEP = 1.5;
/** How far a lane change takes, in metres of road. */
const LANE_CHANGE_LENGTH = 15;
/** Past the end of the board, so the referee sees the car run out of road. */
const RUN_OFF = 12;

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/** Round off corners (Chaikin), keeping the two ends where they are. */
function rounded(points: Vec[], passes = 2): Vec[] {
  let out = points;
  for (let pass = 0; pass < passes; pass += 1) {
    if (out.length < 3) return out;
    const next: Vec[] = [out[0]];
    for (let i = 0; i < out.length - 1; i += 1) {
      const a = out[i];
      const b = out[i + 1];
      next.push(
        { x: a.x * 0.75 + b.x * 0.25, z: a.z * 0.75 + b.z * 0.25 },
        { x: a.x * 0.25 + b.x * 0.75, z: a.z * 0.25 + b.z * 0.75 },
      );
    }
    next.push(out[out.length - 1]);
    out = next;
  }
  return out;
}

function onRing(lane: number, bearing: number): Vec {
  const dir = dirOf(bearing);
  const r = ringRadius(lane);
  return { x: dir.x * r, z: dir.z * r };
}

function arc(lane: number, from: number, sweep: number, out: Vec[]): void {
  const steps = Math.max(1, Math.ceil((sweep * ringRadius(lane)) / STEP));
  for (let i = 1; i <= steps; i += 1) {
    out.push(onRing(lane, from + (sweep * i) / steps));
  }
}

function heading(armId: ArmId, side: Side): Vec {
  const { out } = ARMS[armId];
  return side === "exit" ? out : { x: -out.x, z: -out.z };
}

/** How far left of an arm's centre line a point is, for traffic on `side`. */
export function offsetOn(armId: ArmId, side: Side, p: Vec): number {
  const left = leftOf(heading(armId, side));
  return p.x * left.x + p.z * left.z;
}

function onRoad(armId: ArmId, side: Side, along: number, offset: number): Vec {
  const { out } = ARMS[armId];
  const left = leftOf(heading(armId, side));
  return {
    x: out.x * along + left.x * offset,
    z: out.z * along + left.z * offset,
  };
}

/** Where a road lane meets the ring lane it feeds, measured along the arm. */
export function joinAlong(armId: ArmId, roadLane: number, ringLane: number) {
  const off = laneOffset(ARMS[armId], roadLane);
  return Math.sqrt(Math.max(0, ringRadius(ringLane) ** 2 - off ** 2));
}

/** The compass bearing, seen from the centre, of that meeting point. */
export function joinBearing(
  armId: ArmId,
  side: Side,
  roadLane: number,
  ringLane: number,
): number {
  const p = onRoad(
    armId,
    side,
    joinAlong(armId, roadLane, ringLane),
    laneOffset(ARMS[armId], roadLane),
  );
  return bearingOf(p.x, p.z);
}

/**
 * Up an approach lane and on round the roundabout. `fromOffset` is where the car
 * is now across the road, so a lane change eases over rather than jumping.
 */
export function approachPath(
  armId: ArmId,
  lane: number,
  fromAlong: number,
  fromOffset: number,
): Vec[] {
  const target = laneOffset(ARMS[armId], lane);
  const join = joinAlong(armId, lane, lane);
  const points: Vec[] = [];
  for (let along = fromAlong; along > join; along -= STEP) {
    const t = smoothstep((fromAlong - along) / LANE_CHANGE_LENGTH);
    points.push(
      onRoad(armId, "approach", along, fromOffset + (target - fromOffset) * t),
    );
  }
  points.push(onRoad(armId, "approach", join, target));
  arc(lane, joinBearing(armId, "approach", lane, lane), TAU * 0.75, points);
  return rounded(points);
}

/** Keep going round, from where the car is now. */
export function ringPath(lane: number, fromBearing: number, turns = 1.25) {
  const points: Vec[] = [onRing(lane, fromBearing)];
  arc(lane, fromBearing, TAU * turns, points);
  return points;
}

/** Round to an exit and out along its lane, past the end of the board. */
export function exitPath(
  ringLane: number,
  fromBearing: number,
  armId: ArmId,
  exitLane: number,
): Vec[] {
  const points: Vec[] = [onRing(ringLane, fromBearing)];
  let sweep =
    (joinBearing(armId, "exit", exitLane, ringLane) - fromBearing) % TAU;
  if (sweep < 0) sweep += TAU;
  arc(ringLane, fromBearing, sweep, points);
  const offset = laneOffset(ARMS[armId], exitLane);
  const join = joinAlong(armId, exitLane, ringLane);
  for (let along = join + STEP; along <= BOARD_HALF + RUN_OFF; along += STEP) {
    points.push(onRoad(armId, "exit", along, offset));
  }
  return rounded(points);
}

/** Along an exit road to the end, easing over to `lane` on the way. */
export function exitRoadPath(
  armId: ArmId,
  lane: number,
  fromAlong: number,
  fromOffset: number,
): Vec[] {
  const target = laneOffset(ARMS[armId], lane);
  const points: Vec[] = [];
  for (let along = fromAlong; along <= BOARD_HALF + RUN_OFF; along += STEP) {
    const t = smoothstep((along - fromAlong) / LANE_CHANGE_LENGTH);
    points.push(
      onRoad(armId, "exit", along, fromOffset + (target - fromOffset) * t),
    );
  }
  return rounded(points);
}
