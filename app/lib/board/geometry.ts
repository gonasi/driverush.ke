/**
 * The roundabout and the four roads into it, as the rules see them: lanes,
 * turns, and "where is this point?". The numbers come from `full-board.ts`,
 * which lays out the whole board, so the rules and the drawing cannot disagree.
 * No three.js in here, so the rules can be tested on their own.
 *
 * Top view, metres. `x` runs east and `z` runs south, which matches both SVG
 * (x right, y down) and the three.js ground plane. Bearings are compass angles
 * in radians: 0 is north, a quarter turn clockwise is east.
 */
import {
  ARMS as BOARD_ARMS,
  ISLAND_R as BOARD_ISLAND_R,
  LANE,
  RING_LANE,
  RING_LANES as BOARD_RING_LANES,
  RING_R,
  SOLID_TO,
  otherRoad,
  reserveAt,
  type ArmId,
  type OtherRoad,
} from "./full-board";

export type { ArmId } from "./full-board";

/** A lane on a road. The roundabout's own lanes are a little wider. */
export const LANE_W = LANE;
export const RING_LANE_W = RING_LANE;
export const ISLAND_R = BOARD_ISLAND_R;
export const RING_LANES = BOARD_RING_LANES;
export const RING_OUTER_R = RING_R;
/**
 * Lane lines are continuous for this far before the roundabout: choose your lane
 * before them, because a continuous white line means no changing lanes.
 */
export const SOLID_ZONE = SOLID_TO;
/** A car has left the roundabout once it is this far out along an arm. */
export const EXIT_CLEAR = RING_OUTER_R + 3;

export type Vec = { x: number; z: number };

/** Clockwise, the way traffic goes round. */
export const ARM_ORDER: readonly ArmId[] = ["S", "W", "N", "E"];

export type Arm = {
  id: ArmId;
  /** Lanes each way. */
  lanes: number;
  /** Half the width of the central reserve, or 0 where there is only a line. */
  medianHalf: number;
  /** Unit vector from the centre out along the arm. */
  out: Vec;
  /** How far the arm runs from the centre. */
  length: number;
};

const arm = (id: ArmId): Arm => ({
  id,
  lanes: BOARD_ARMS[id].lanes,
  medianHalf: BOARD_ARMS[id].reserve,
  out: BOARD_ARMS[id].out,
  length: BOARD_ARMS[id].length,
});

export const ARMS: Record<ArmId, Arm> = {
  S: arm("S"),
  W: arm("W"),
  N: arm("N"),
  E: arm("E"),
};

export type Side = "approach" | "exit";
export type Turn = "left" | "straight" | "right" | "back";

// ---- small maths --------------------------------------------------------------

export const TAU = Math.PI * 2;

/** Wrap an angle to (-π, π]. */
export function wrapPi(a: number): number {
  let r = a % TAU;
  if (r > Math.PI) r -= TAU;
  if (r <= -Math.PI) r += TAU;
  return r;
}

/** Compass bearing of a direction or of a point seen from the centre. */
export function bearingOf(x: number, z: number): number {
  return Math.atan2(x, -z);
}

/** Unit vector for a bearing. */
export function dirOf(bearing: number): Vec {
  return { x: Math.sin(bearing), z: -Math.cos(bearing) };
}

/** The left-hand side of a direction of travel. Kenya keeps left. */
export function leftOf(v: Vec): Vec {
  return { x: v.z, z: -v.x };
}

// ---- lanes -------------------------------------------------------------------

export function armHalfWidth(arm: Arm): number {
  return arm.medianHalf + arm.lanes * LANE_W;
}

/** Lane 1 is the outermost lane, by the kerb. Distance from the arm's centre line. */
export function laneOffset(arm: Arm, lane: number): number {
  return arm.medianHalf + (arm.lanes - lane + 0.5) * LANE_W;
}

/** Which way traffic faces on one side of an arm. */
export function laneBearing(armId: ArmId, side: Side): number {
  const { out } = ARMS[armId];
  return side === "exit" ? bearingOf(out.x, out.z) : bearingOf(-out.x, -out.z);
}

/** A point in the middle of a lane, `along` metres from the centre. */
export function lanePoint(
  armId: ArmId,
  side: Side,
  lane: number,
  along: number,
): Vec {
  const arm = ARMS[armId];
  const heading = side === "exit" ? arm.out : { x: -arm.out.x, z: -arm.out.z };
  const left = leftOf(heading);
  const off = laneOffset(arm, lane);
  return {
    x: arm.out.x * along + left.x * off,
    z: arm.out.z * along + left.z * off,
  };
}

/** Ring lane 1 is the outermost, lane 4 hugs the island. */
export function ringRadius(lane: number): number {
  return RING_OUTER_R - (lane - 0.5) * RING_LANE_W;
}

export function ringLaneAt(r: number): number {
  const lane = Math.floor((RING_OUTER_R - r) / RING_LANE_W) + 1;
  return Math.min(RING_LANES, Math.max(1, lane));
}

// ---- where is this point? ----------------------------------------------------

export type Location =
  | { kind: "ring"; lane: number; r: number; bearing: number }
  | { kind: "arm"; arm: ArmId; side: Side; lane: number; along: number }
  /** One of the board's other roads, which no task uses yet. */
  | { kind: "road"; what: OtherRoad }
  | { kind: "off"; what: "island" | "median" | "verge" };

export function locate(x: number, z: number): Location {
  const r = Math.hypot(x, z);
  if (r < ISLAND_R) return { kind: "off", what: "island" };
  if (r <= RING_OUTER_R) {
    return { kind: "ring", lane: ringLaneAt(r), r, bearing: bearingOf(x, z) };
  }
  for (const id of ARM_ORDER) {
    const arm = ARMS[id];
    const along = x * arm.out.x + z * arm.out.z;
    if (along <= 0 || along > arm.length) continue;
    // Positive on the side that drives toward the roundabout.
    const inward = leftOf({ x: -arm.out.x, z: -arm.out.z });
    const lat = x * inward.x + z * inward.z;
    const dist = Math.abs(lat);
    if (dist > armHalfWidth(arm)) continue;
    // A gap in the reserve is road: the innermost lane of whichever side.
    if (dist < arm.medianHalf && reserveAt(id, along)) {
      return { kind: "off", what: "median" };
    }
    const fromCentre = Math.max(0, dist - arm.medianHalf);
    const lane = Math.min(
      arm.lanes,
      Math.max(1, arm.lanes - Math.floor(fromCentre / LANE_W)),
    );
    return {
      kind: "arm",
      arm: id,
      side: lat > 0 ? "approach" : "exit",
      lane,
      along,
    };
  }
  const other = otherRoad(x, z);
  if (other) return { kind: "road", what: other };
  return { kind: "off", what: "verge" };
}

// ---- turns -------------------------------------------------------------------

/** The turn you make by entering on one arm and leaving on another. */
export function turnBetween(entry: ArmId, exit: ArmId): Turn {
  const steps = (ARM_ORDER.indexOf(exit) - ARM_ORDER.indexOf(entry) + 4) % 4;
  return (["back", "left", "straight", "right"] as const)[steps];
}

/** The arm you reach from `entry` by making `turn`. */
export function armForTurn(entry: ArmId, turn: Turn): ArmId {
  const steps = { back: 0, left: 1, straight: 2, right: 3 }[turn];
  return ARM_ORDER[(ARM_ORDER.indexOf(entry) + steps) % 4];
}

const ALL_TURNS: readonly Turn[] = ["right", "back", "left", "straight"];

/**
 * What each approach lane may do, from the handbook (Unit 3) and the option
 * codes driving schools teach. The four-lane road is "2124": lane 1 straight or
 * left, lane 2 straight only, lane 3 straight or right, lane 4 right, back,
 * left the long way round, or straight after going round. The three-lane road
 * is "215": lanes 1 and 2 the same, and lane 3 takes the rest.
 */
export function allowedTurns(lanes: number, lane: number): readonly Turn[] {
  if (lane <= 1) return ["straight", "left"];
  if (lane === 2) return ["straight"];
  if (lanes === 4 && lane === 3) return ["straight", "right"];
  return ALL_TURNS;
}

/** The approach lanes that may make a turn, lowest first. */
export function lanesForTurn(lanes: number, turn: Turn): number[] {
  const out: number[] = [];
  for (let lane = 1; lane <= lanes; lane += 1) {
    if (allowedTurns(lanes, lane).includes(turn)) out.push(lane);
  }
  return out;
}

/** The option code for a road: how many options each lane has, kerb lane first. */
export const OPTION_CODES: Record<number, string> = { 4: "2124", 3: "215" };

/**
 * The lanes a car may leave the roundabout in. It leaves in the lane with the
 * number it came round in, or the innermost lane where the road out has fewer.
 * The handbook gives lane 3 of the three-lane road one more: turning right onto
 * the four-lane road it may enter lane 3 or lane 4.
 */
export function exitLanes(
  entryLanes: number,
  entryLane: number,
  turn: Turn,
  outLanes: number,
): number[] {
  const same = Math.min(entryLane, outLanes);
  if (entryLanes === 3 && entryLane === 3 && turn === "right" && outLanes === 4) {
    return [same, 4];
  }
  return [same];
}
