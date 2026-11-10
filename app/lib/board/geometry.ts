/**
 * The Model Town Board as numbers: one roundabout where a four-lane road meets a
 * three-lane road, laid out from the NTSA Kenya Learner Driver Handbook (2016),
 * Unit 3. Everything else reads this file: the 3D scene, the 2D drawing and the
 * referee. No three.js in here, so the rules can be tested on their own.
 *
 * Top view, metres. `x` runs east and `z` runs south, which matches both SVG
 * (x right, y down) and the three.js ground plane. Bearings are compass angles
 * in radians: 0 is north, a quarter turn clockwise is east.
 */

export const LANE_W = 3.5;
/** The board is a square this far from the centre in each direction. */
export const BOARD_HALF = 60;
export const ISLAND_R = 5;
export const RING_LANES = 4;
export const RING_OUTER_R = ISLAND_R + RING_LANES * LANE_W;
/** Half the width of the raised central reserve on the four-lane road. */
export const MEDIAN_HALF = 0.8;
/** Where the central reserve starts, measured from the centre. */
export const MEDIAN_START = RING_OUTER_R + 4;
/** A car has left the roundabout once it is this far out along an arm. */
export const EXIT_CLEAR = RING_OUTER_R + 3;

export type Vec = { x: number; z: number };

export type ArmId = "S" | "W" | "N" | "E";
/** Clockwise, the way traffic goes round. */
export const ARM_ORDER: readonly ArmId[] = ["S", "W", "N", "E"];

export type Arm = {
  id: ArmId;
  /** Lanes each way. */
  lanes: number;
  medianHalf: number;
  /** Unit vector from the centre out along the arm. */
  out: Vec;
};

export const ARMS: Record<ArmId, Arm> = {
  S: { id: "S", lanes: 4, medianHalf: MEDIAN_HALF, out: { x: 0, z: 1 } },
  W: { id: "W", lanes: 3, medianHalf: 0, out: { x: -1, z: 0 } },
  N: { id: "N", lanes: 4, medianHalf: MEDIAN_HALF, out: { x: 0, z: -1 } },
  E: { id: "E", lanes: 3, medianHalf: 0, out: { x: 1, z: 0 } },
};

export type Side = "approach" | "exit";
export type Turn = "left" | "straight" | "right" | "back";

/** Decoration only. Kept here so the texture can paint each tree's shadow. */
export const TREES: readonly { x: number; z: number; s: number }[] = [
  { x: -30, z: -27, s: 1.1 },
  { x: -45, z: -41, s: 1.3 },
  { x: -25, z: -49, s: 0.9 },
  { x: -51, z: -21, s: 1 },
  { x: 31, z: -29, s: 1.2 },
  { x: 47, z: -45, s: 1 },
  { x: 25, z: -51, s: 1.1 },
  { x: 52, z: -20, s: 0.9 },
  { x: -33, z: 29, s: 1 },
  { x: -47, z: 45, s: 1.2 },
  { x: -25, z: 52, s: 0.9 },
  { x: -52, z: 23, s: 1.1 },
  { x: 33, z: 27, s: 1.3 },
  { x: 45, z: 43, s: 1 },
  { x: 26, z: 53, s: 1.1 },
  { x: 53, z: 21, s: 0.9 },
  // The one on the roundabout's island.
  { x: 0, z: 0, s: 0.75 },
];

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
  return RING_OUTER_R - (lane - 0.5) * LANE_W;
}

export function ringLaneAt(r: number): number {
  const lane = Math.floor((RING_OUTER_R - r) / LANE_W) + 1;
  return Math.min(RING_LANES, Math.max(1, lane));
}

// ---- where is this point? ----------------------------------------------------

export type Location =
  | { kind: "ring"; lane: number; r: number; bearing: number }
  | { kind: "arm"; arm: ArmId; side: Side; lane: number; along: number }
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
    if (along <= 0 || along > BOARD_HALF) continue;
    // Positive on the side that drives toward the roundabout.
    const inward = leftOf({ x: -arm.out.x, z: -arm.out.z });
    const lat = x * inward.x + z * inward.z;
    const dist = Math.abs(lat);
    if (dist > armHalfWidth(arm)) continue;
    if (dist < arm.medianHalf && along >= MEDIAN_START) {
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
 * What each approach lane may do, from the handbook (Unit 3, page 13). On the
 * four-lane road: lane 1 straight or left, lane 2 straight only, lane 3 straight
 * or right, lane 4 anything. The three-lane road is "2, 1, 5": lane 3 takes the
 * rest. A driving school still has to confirm lane 3 there, so no challenge
 * starts on the three-lane road yet.
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
