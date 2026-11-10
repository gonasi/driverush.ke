/**
 * The line a car follows when it does a turn properly: up its approach lane,
 * round the roundabout in the lane with the same number, and out. Used by the
 * tests to drive the board, and later to show a learner the correct route.
 */
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

export function lanePath(
  entry: ArmId,
  lane: number,
  turn: Turn,
  startAlong = 50,
  endAlong = 50,
): Vec[] {
  const exit = armForTurn(entry, turn);
  const exitLane = Math.min(lane, ARMS[exit].lanes);
  const radius = ringRadius(lane);
  const joinIn = Math.sqrt(radius ** 2 - laneOffset(ARMS[entry], lane) ** 2);
  const joinOut = Math.sqrt(
    radius ** 2 - laneOffset(ARMS[exit], exitLane) ** 2,
  );

  const points: Vec[] = [];
  for (let along = startAlong; along > joinIn; along -= STEP) {
    points.push(lanePoint(entry, "approach", lane, along));
  }

  const a = lanePoint(entry, "approach", lane, joinIn);
  const b = lanePoint(exit, "exit", exitLane, joinOut);
  const from = bearingOf(a.x, a.z);
  let sweep = (bearingOf(b.x, b.z) - from) % TAU;
  if (sweep < 0) sweep += TAU;
  const steps = Math.max(1, Math.ceil((sweep * radius) / STEP));
  for (let i = 0; i <= steps; i += 1) {
    const dir = dirOf(from + (sweep * i) / steps);
    points.push({ x: dir.x * radius, z: dir.z * radius });
  }

  for (let along = joinOut + STEP; along <= endAlong; along += STEP) {
    points.push(lanePoint(exit, "exit", exitLane, along));
  }
  return points;
}
