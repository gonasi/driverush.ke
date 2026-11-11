/**
 * The line a car follows when it does a turn properly: up its approach lane,
 * round the roundabout in the ring lane with the same number, and out in the
 * exit lane with that number. The tests point the joystick along these, and a
 * "show me the route" helper can draw them later.
 */
import { RESERVE, U_TURN_GAPS } from "./full-board";
import {
  ARMS,
  TAU,
  armForTurn,
  bearingOf,
  dirOf,
  laneOffset,
  lanePoint,
  ringRadius,
  type ArmId,
  type Turn,
  type Vec,
} from "./geometry";

const STEP = 1.5;

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

/** Where a road lane meets the ring lane it feeds, measured along the arm. */
function joinAlong(armId: ArmId, roadLane: number, ringLane: number) {
  const off = laneOffset(ARMS[armId], roadLane);
  return Math.sqrt(Math.max(0, ringRadius(ringLane) ** 2 - off ** 2));
}

/**
 * The whole route for one turn. `extraTurns` adds full circles of the
 * roundabout first, for testing what happens when a car keeps going round.
 */
export function lanePath(
  entry: ArmId,
  lane: number,
  turn: Turn,
  startAlong = 56,
  endAlong = 56,
  extraTurns = 0,
): Vec[] {
  const exit = armForTurn(entry, turn);
  const exitLane = Math.min(lane, ARMS[exit].lanes);
  const radius = ringRadius(lane);
  const joinIn = joinAlong(entry, lane, lane);
  const joinOut = joinAlong(exit, exitLane, lane);

  const points: Vec[] = [];
  for (let along = startAlong; along > joinIn; along -= STEP) {
    points.push(lanePoint(entry, "approach", lane, along));
  }

  const a = lanePoint(entry, "approach", lane, joinIn);
  const b = lanePoint(exit, "exit", exitLane, joinOut);
  const from = bearingOf(a.x, a.z);
  let sweep = (bearingOf(b.x, b.z) - from) % TAU;
  if (sweep < 0) sweep += TAU;
  sweep += TAU * extraTurns;
  const steps = Math.max(1, Math.ceil((sweep * radius) / STEP));
  for (let i = 0; i <= steps; i += 1) {
    const dir = dirOf(from + (sweep * i) / steps);
    points.push({ x: dir.x * radius, z: dir.z * radius });
  }

  for (let along = joinOut + STEP; along <= endAlong; along += STEP) {
    points.push(lanePoint(exit, "exit", exitLane, along));
  }
  return rounded(points);
}

/**
 * The route for turning back: straight across the roundabout from the south,
 * over to the lane beside the reserve, round through the first gap in it, and
 * back down the other side. The turn starts as the gap opens, so the car swings
 * through the middle of it.
 */
export function turnBackPath(
  lane: number,
  startAlong = 56,
  endAlong = 40,
): Vec[] {
  const gap = U_TURN_GAPS[0];
  const inside = laneOffset(ARMS.N, ARMS.N.lanes);
  // Wide enough to clear the end of the reserve, tight enough to stay in the gap.
  const radius = Math.max(inside, RESERVE + 1.8);
  const centre = gap.from + 0.4;
  const out = lanePath("S", lane, "straight", startAlong, 36);
  const points: Vec[] = [];
  for (let along = 50; along < centre; along += STEP) {
    points.push(lanePoint("N", "exit", ARMS.N.lanes, along));
  }
  // North is up the board, so the car turns right, through east, to face south.
  for (let i = 0; i <= 12; i += 1) {
    const t = (Math.PI * i) / 12;
    points.push({
      x: -Math.cos(t) * radius,
      z: -centre - Math.sin(t) * radius,
    });
  }
  for (let along = centre - STEP; along >= endAlong; along -= STEP) {
    points.push(lanePoint("N", "approach", ARMS.N.lanes, along));
  }
  return [...out, ...rounded(points, 1)];
}
