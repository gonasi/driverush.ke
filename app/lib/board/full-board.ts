/**
 * The whole Model Town Board. Its layout is the one driving schools paint, and
 * its proportions are measured off a reference drawing of that board, taking
 * one lane as 3.6 metres wide. The rules it teaches are the NTSA handbook's
 * (Unit 3).
 *
 * A four-lane dual carriageway with a central reserve runs up the board and
 * through the roundabout. A three-lane road crosses it there. Down the right
 * is a broad two-way road with two pedestrian crossings and flush parking. A
 * street joins the dual carriageway to that road, and the controlled (angle)
 * parking zone sits between the street and the three-lane road, with one
 * two-way aisle running through it.
 *
 * It is a plain painted board: green field, black roads, white paint, and thin
 * yellow kerbs at the junctions, at the ends of the reserve and round the
 * island.
 *
 * The learner stands at the bottom, so the yellow car drives away from them up
 * the dual carriageway to the roundabout. Seen from the right-hand side of the
 * table it is the reference drawing: dual carriageway left to right, two-way
 * road along the bottom.
 *
 * One thing is not as on the reference: the central reserve is 6 metres wide,
 * not a thin strip, so that a car making a U-turn through a gap has room to
 * come round into a lane.
 *
 * Top view, metres. `x` runs east, `z` runs south, and the roundabout's centre
 * is the origin. Pure data and drawing, no three.js.
 */

export const LANE = 3.6;
/** The roundabout: a small island and four lanes, each a little wider than a road lane. */
export const ISLAND_R = 4.4;
export const RING_LANES = 4;
export const RING_LANE = 4.5;
export const RING_R = ISLAND_R + RING_LANES * RING_LANE;
/**
 * Half the width of the central reserve on the dual carriageway. It is wide
 * so that a car turning back through a gap has room to come round into a lane.
 */
export const RESERVE = 3;
/** Lane lines are continuous this far out from the roundabout's centre. */
export const SOLID_TO = RING_R + 12.5;

/**
 * The edges of the board. The roads run right up to the frame. Every length
 * here is measured off the reference board, one lane width being 3.6 metres.
 */
export const BOUNDS = { x0: -59.7, x1: 78.1, z0: -151.6, z1: 64.3 } as const;

/** Half-widths of the two roads through the roundabout. */
const WIDE = RESERVE + 4 * LANE;
const NARROW = 3 * LANE;

/** The two-way road down the right: two broad lanes. */
const SIDE = { x0: 62, x1: 76.7, mid: 69.35 } as const;
/** The street from the dual carriageway across to the two-way road. */
const STREET = { z0: -106.5, z1: -92.4, mid: -99.45 } as const;
/**
 * The controlled parking zone: a broad two-way aisle from the three-lane road
 * up to the street, with a row of angle bays either side of it and green all
 * round.
 */
const PARK = { x0: 25.6, x1: 53.8, z0: -84.7, z1: -18.7 } as const;
const AISLE = { x0: 32.5, x1: 46.9 } as const;
/** Where the first bay line meets the aisle, and how far apart the lines are. */
const BAY_FIRST = -25.7;
const BAY_STEP = 7.34;
const BAY_COUNT = 8;
/** Flush parking: boxes painted at the kerb of the two-way road. */
const FLUSH = { x1: 65.1, z0: -62.6, z1: -40.6, bays: 2 } as const;
/** Pedestrian crossings on the two-way road. */
const CROSSINGS = [-81.1, -22.1] as const;
/** Corner radii: a road junction, a corner of the parking zone, a mouth of its aisle. */
const R_ROAD = 2.5;
const R_BLOCK = 1.2;
const R_AISLE = 1.2;

/**
 * The roads away from the roundabout, for the lane network (`network.ts`),
 * which needs the same numbers the paint uses.
 */
export const ROADS = {
  WIDE,
  NARROW,
  SIDE,
  STREET,
  PARK,
  AISLE,
  FLUSH,
  CROSSINGS,
  BAY_FIRST,
  BAY_STEP,
  BAY_COUNT,
  R_BLOCK,
  R_AISLE,
} as const;

export type ArmId = "S" | "W" | "N" | "E";
type Arm = {
  id: ArmId;
  lanes: number;
  reserve: number;
  out: { x: number; z: number };
  /** How far the arm runs from the centre. */
  length: number;
};

export const ARMS: Record<ArmId, Arm> = {
  S: {
    id: "S",
    lanes: 4,
    reserve: RESERVE,
    out: { x: 0, z: 1 },
    length: BOUNDS.z1,
  },
  W: {
    id: "W",
    lanes: 3,
    reserve: 0,
    out: { x: -1, z: 0 },
    length: -BOUNDS.x0,
  },
  N: {
    id: "N",
    lanes: 4,
    reserve: RESERVE,
    out: { x: 0, z: -1 },
    length: -BOUNDS.z0,
  },
  E: {
    id: "E",
    lanes: 3,
    reserve: 0,
    out: { x: 1, z: 0 },
    length: SIDE.x0,
  },
};
const ARM_LIST = [ARMS.S, ARMS.W, ARMS.N, ARMS.E];

/** How long each gap in the reserve is: a little over two lanes, room for one car to turn back through. */
const RESERVE_GAP = 7.8;
/**
 * Where each U-turn gap starts, as a distance from the centre: where the
 * reference board has them, with about thirteen lane widths of unbroken
 * reserve before each. The street joins between the two.
 */
const U_TURNS = [69.4, 121.9] as const;
/** The gaps in the reserve north of the roundabout, nearest first. */
export const U_TURN_GAPS: readonly { from: number; to: number }[] = U_TURNS.map(
  (from) => ({ from, to: from + RESERVE_GAP }),
);
/**
 * Where the dual carriageway has its raised reserve, as distances from the
 * centre. It starts right at the roundabout.
 */
const RESERVE_SPANS: Partial<Record<ArmId, [number, number][]>> = {
  S: [[RING_R + 0.5, BOUNDS.z1]],
  N: [
    [RING_R + 0.5, U_TURNS[0]],
    [U_TURNS[0] + RESERVE_GAP, U_TURNS[1]],
    [U_TURNS[1] + RESERVE_GAP, -BOUNDS.z0],
  ],
};

/** Is there raised reserve down the middle of this road, this far from the centre? */
export function reserveAt(id: ArmId, along: number): boolean {
  return (RESERVE_SPANS[id] ?? []).some(
    ([from, to]) => along >= from && along <= to,
  );
}

export const COLORS = {
  grass: "#177a2e",
  asphalt: "#17181a",
  white: "#f4f4ee",
  yellow: "#e6b01c",
  kerbBlack: "#1c1c1f",
  island: "#126b27",
  goal: "#5fe08a",
} as const;
const C = COLORS;

const n = (v: number) => Number(v.toFixed(2));

// ---- kerbs: every edge where tarmac meets the field ---------------------------

export type Segment = { ax: number; az: number; bx: number; bz: number };
export type Point = { x: number; z: number };

type Corner = {
  x: number;
  z: number;
  /** Unit directions of the two kerbs leaving the corner. */
  u: [number, number];
  v: [number, number];
  r: number;
};

/** Rounded corners at every junction, so there is room to turn. */
const CORNERS = {
  crossSouth: { x: SIDE.x0, z: NARROW, u: [-1, 0], v: [0, 1], r: R_ROAD },
  crossNorth: { x: SIDE.x0, z: -NARROW, u: [-1, 0], v: [0, -1], r: R_BLOCK },
  streetSouthEast: {
    x: SIDE.x0,
    z: STREET.z1,
    u: [-1, 0],
    v: [0, 1],
    r: R_BLOCK,
  },
  streetNorthEast: {
    x: SIDE.x0,
    z: STREET.z0,
    u: [-1, 0],
    v: [0, -1],
    r: R_ROAD,
  },
  streetNorthWest: { x: WIDE, z: STREET.z0, u: [1, 0], v: [0, -1], r: R_ROAD },
  streetSouthWest: { x: WIDE, z: STREET.z1, u: [1, 0], v: [0, 1], r: R_BLOCK },
  aisleTopWest: {
    x: AISLE.x0,
    z: STREET.z1,
    u: [-1, 0],
    v: [0, 1],
    r: R_AISLE,
  },
  aisleTopEast: { x: AISLE.x1, z: STREET.z1, u: [1, 0], v: [0, 1], r: R_AISLE },
  aisleFootWest: {
    x: AISLE.x0,
    z: -NARROW,
    u: [-1, 0],
    v: [0, -1],
    r: R_AISLE,
  },
  aisleFootEast: { x: AISLE.x1, z: -NARROW, u: [1, 0], v: [0, -1], r: R_AISLE },
} satisfies Record<string, Corner>;
const CORNER_LIST: Corner[] = Object.values(CORNERS);

/** Points along a corner's curve, from the first kerb round to the second. */
function cornerArc(c: Corner, steps = 8): Point[] {
  const ox = c.x + (c.u[0] + c.v[0]) * c.r;
  const oz = c.z + (c.u[1] + c.v[1]) * c.r;
  const from = Math.atan2(c.z + c.u[1] * c.r - oz, c.x + c.u[0] * c.r - ox);
  let sweep =
    Math.atan2(c.z + c.v[1] * c.r - oz, c.x + c.v[0] * c.r - ox) - from;
  if (sweep > Math.PI) sweep -= Math.PI * 2;
  if (sweep < -Math.PI) sweep += Math.PI * 2;
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = from + (sweep * i) / steps;
    points.push({ x: ox + Math.cos(a) * c.r, z: oz + Math.sin(a) * c.r });
  }
  return points;
}

const wideJoin = Math.sqrt(RING_R ** 2 - WIDE ** 2);
const narrowJoin = Math.sqrt(RING_R ** 2 - NARROW ** 2);

/**
 * The roundabout's own edge between two roads, in one quarter of the board:
 * from the dual carriageway's kerb round to the three-lane road's kerb.
 */
function ringArc(sx: number, sz: number, steps = 4): Point[] {
  const from = Math.atan2(sz * wideJoin, sx * WIDE);
  let sweep = Math.atan2(sz * NARROW, sx * narrowJoin) - from;
  if (sweep > Math.PI) sweep -= Math.PI * 2;
  if (sweep < -Math.PI) sweep += Math.PI * 2;
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = from + (sweep * i) / steps;
    points.push({ x: Math.cos(a) * RING_R, z: Math.sin(a) * RING_R });
  }
  return points;
}

const s = (ax: number, az: number, bx: number, bz: number): Segment => ({
  ax,
  az,
  bx,
  bz,
});

/** Straight kerbs, already shortened where a corner is rounded. */
function straightKerbs(): Segment[] {
  const { x0, z0, z1 } = BOUNDS;
  return [
    // the dual carriageway, north and south of the roundabout
    s(-WIDE, z0, -WIDE, -wideJoin),
    s(WIDE, z0, WIDE, STREET.z0 - R_ROAD),
    s(WIDE, STREET.z1 + R_BLOCK, WIDE, -wideJoin),
    s(-WIDE, wideJoin, -WIDE, z1),
    s(WIDE, wideJoin, WIDE, z1),
    // the three-lane road, west and east
    s(x0, -NARROW, -narrowJoin, -NARROW),
    s(x0, NARROW, -narrowJoin, NARROW),
    s(narrowJoin, -NARROW, AISLE.x0 - R_AISLE, -NARROW),
    s(AISLE.x1 + R_AISLE, -NARROW, SIDE.x0 - R_BLOCK, -NARROW),
    s(narrowJoin, NARROW, SIDE.x0 - R_ROAD, NARROW),
    // the two-way road
    s(SIDE.x0, z0, SIDE.x0, STREET.z0 - R_ROAD),
    s(SIDE.x0, STREET.z1 + R_BLOCK, SIDE.x0, -NARROW - R_BLOCK),
    s(SIDE.x0, NARROW + R_ROAD, SIDE.x0, z1),
    s(SIDE.x1, z0, SIDE.x1, z1),
    // the street
    s(WIDE + R_ROAD, STREET.z0, SIDE.x0 - R_ROAD, STREET.z0),
    s(WIDE + R_BLOCK, STREET.z1, AISLE.x0 - R_AISLE, STREET.z1),
    s(AISLE.x1 + R_AISLE, STREET.z1, SIDE.x0 - R_BLOCK, STREET.z1),
    // the aisle through the parking zone, and the bays either side of it
    s(AISLE.x0, STREET.z1 + R_AISLE, AISLE.x0, PARK.z0),
    s(AISLE.x1, STREET.z1 + R_AISLE, AISLE.x1, PARK.z0),
    s(AISLE.x0, PARK.z1, AISLE.x0, -NARROW - R_AISLE),
    s(AISLE.x1, PARK.z1, AISLE.x1, -NARROW - R_AISLE),
    s(AISLE.x0, PARK.z0, PARK.x0, PARK.z0),
    s(PARK.x0, PARK.z0, PARK.x0, PARK.z1),
    s(PARK.x0, PARK.z1, AISLE.x0, PARK.z1),
    s(AISLE.x1, PARK.z0, PARK.x1, PARK.z0),
    s(PARK.x1, PARK.z0, PARK.x1, PARK.z1),
    s(PARK.x1, PARK.z1, AISLE.x1, PARK.z1),
  ];
}

function pieces(points: Point[]): Segment[] {
  const out: Segment[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    out.push(s(points[i].x, points[i].z, points[i + 1].x, points[i + 1].z));
  }
  return out;
}

/** Every kerb on the board as short straight pieces: the walls a car bumps. */
export function kerbSegments(): Segment[] {
  const out = straightKerbs();
  for (const corner of CORNER_LIST) out.push(...pieces(cornerArc(corner)));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) out.push(...pieces(ringArc(sx, sz)));
  }
  return out;
}

/**
 * The kerbs painted yellow, as on the school's board: each corner of the
 * roundabout, the far side of the street, and the four square blocks at the
 * corners of the parking zone. A block is yellow along the street or road, down
 * its aisle side, and a short way down its outer side. Each is a line of
 * points along the kerb.
 */
export function kerbHighlights(): Point[][] {
  const p = (x: number, z: number): Point => ({ x, z });
  const back = (c: Corner) => cornerArc(c).reverse();
  const tail = 5;
  const stub = 3;
  return [
    // roundabout, far right, and the block at the foot of the parking zone beside it
    [
      p(WIDE, -wideJoin - stub),
      ...ringArc(1, -1),
      ...cornerArc(CORNERS.aisleFootWest),
      p(AISLE.x0, PARK.z1),
    ],
    // the other block at the foot of the parking zone
    [
      p(AISLE.x1, PARK.z1),
      ...back(CORNERS.aisleFootEast),
      ...cornerArc(CORNERS.crossNorth),
      p(SIDE.x0, -NARROW - R_BLOCK - stub),
    ],
    // the two blocks at the head of the parking zone, under the street
    [
      p(AISLE.x0, PARK.z0),
      ...back(CORNERS.aisleTopWest),
      ...cornerArc(CORNERS.streetSouthWest),
      p(WIDE, STREET.z1 + R_BLOCK + stub),
    ],
    [
      p(AISLE.x1, PARK.z0),
      ...back(CORNERS.aisleTopEast),
      ...cornerArc(CORNERS.streetSouthEast),
      p(SIDE.x0, STREET.z1 + R_BLOCK + stub),
    ],
    // the far side of the street
    [
      p(WIDE, STREET.z0 - R_ROAD - stub),
      ...back(CORNERS.streetNorthWest),
      ...cornerArc(CORNERS.streetNorthEast),
      p(SIDE.x0, STREET.z0 - R_ROAD - stub),
    ],
    // roundabout, near right: all the way along to the two-way road
    [
      p(WIDE, wideJoin + tail),
      ...ringArc(1, 1),
      ...cornerArc(CORNERS.crossSouth),
      p(SIDE.x0, NARROW + R_ROAD + stub),
    ],
    // roundabout, near left and far left
    [
      p(-WIDE, wideJoin + tail),
      ...ringArc(-1, 1),
      p(-narrowJoin - tail, NARROW),
    ],
    [
      p(-WIDE, -wideJoin - tail),
      ...ringArc(-1, -1),
      p(-narrowJoin - tail, -NARROW),
    ],
  ];
}

export type Box = { x0: number; x1: number; z0: number; z1: number };

/** The raised strips down the middle of the dual carriageway. */
export function reserves(): Box[] {
  const out: Box[] = [];
  for (const arm of ARM_LIST) {
    for (const [from, to] of RESERVE_SPANS[arm.id] ?? []) {
      const a = arm.out.z * from;
      const b = arm.out.z * to;
      out.push({
        x0: -RESERVE,
        x1: RESERVE,
        z0: Math.min(a, b),
        z1: Math.max(a, b),
      });
    }
  }
  return out;
}

// ---- lanes on the four roads into the roundabout ------------------------------

/** Lane 1 is by the kerb. Distance from the arm's centre line. */
export function laneOffset(arm: Arm, lane: number): number {
  return arm.reserve + (arm.lanes - lane + 0.5) * LANE;
}

/** The middle of a lane, `along` metres from the roundabout's centre. */
export function lanePoint(
  id: ArmId,
  side: "approach" | "exit",
  lane: number,
  along: number,
): Point {
  const arm = ARMS[id];
  const h = side === "exit" ? arm.out : { x: -arm.out.x, z: -arm.out.z };
  const off = laneOffset(arm, lane);
  // Kenya keeps left: the lane sits to the left of its direction of travel.
  return {
    x: arm.out.x * along + h.z * off,
    z: arm.out.z * along - h.x * off,
  };
}

/** Compass bearing of travel on one side of an arm, radians. */
export function laneBearing(id: ArmId, side: "approach" | "exit"): number {
  const { out } = ARMS[id];
  return side === "exit"
    ? Math.atan2(out.x, -out.z)
    : Math.atan2(-out.x, out.z);
}

// ---- drawing -------------------------------------------------------------------

const LINE = 0.3;
/**
 * One broken-line pattern for the whole board: lane lines, broken centre lines
 * and give way lines all use it. The roundabout's lane rings use a shorter one,
 * as on the reference.
 */
const DASH_ON = 2.4;
const DASH_OFF = 2;
const RING_ON = 1.9;
const RING_OFF = 1.3;

const fine = (v: number) => Number(v.toFixed(3));

/**
 * The dash pattern for a line `length` long, stretched a touch so the line
 * starts and ends on a whole dash and so touches whatever it runs between.
 */
function fitDashes(length: number, on = DASH_ON, off = DASH_OFF): string {
  const count = Math.max(1, Math.round((length + off) / (on + off)));
  const k = length / (count * on + (count - 1) * off);
  return `${fine(on * k)} ${fine(off * k)}`;
}

/** A broken line from one point to another, in whole dashes. */
function brokenLine(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  attrs: string,
): string {
  const length = Math.hypot(bx - ax, bz - az);
  return `<path d="M${n(ax)} ${n(az)} L${n(bx)} ${n(bz)}" ${attrs} stroke-dasharray="${fitDashes(length)}"/>`;
}

/** A dashed circle whose dashes go round a whole number of times, with no odd one at the join. */
function dashedRing(r: number, attrs: string): string {
  const round = Math.PI * 2 * r;
  const count = Math.round(round / (RING_ON + RING_OFF));
  const k = round / (count * (RING_ON + RING_OFF));
  return `<circle r="${n(r)}" ${attrs} stroke-dasharray="${fine(RING_ON * k)} ${fine(RING_OFF * k)}"/>`;
}
const KERB = 0.5;

function rect(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  extra = "",
): string {
  return `<rect x="${n(Math.min(x0, x1))}" y="${n(Math.min(z0, z1))}" width="${n(Math.abs(x1 - x0))}" height="${n(Math.abs(z1 - z0))}"${extra}/>`;
}

function at(x: number, z: number, bearing: number, body: string): string {
  return `<g transform="translate(${n(x)} ${n(z)}) rotate(${n((bearing * 180) / Math.PI)})">${body}</g>`;
}

function head(x: number, y: number, dx: number, dy: number, k = 1): string {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const pts = [
    [x - uy * 0.72 * k, y + ux * 0.72 * k],
    [x + ux * 1.5 * k, y + uy * 1.5 * k],
    [x + uy * 0.72 * k, y - ux * 0.72 * k],
  ];
  return `<polygon points="${pts.map(([a, b]) => `${n(a)},${n(b)}`).join(" ")}"/>`;
}

type ArrowKind = "straight" | "straight-left" | "straight-right" | "right";

/** No part of a lane arrow may come closer than this to the middle of its lane's edge. */
export const ARROW_HALF_WIDTH = 1.3;

/**
 * A lane arrow, drawn pointing up the page about the middle of its lane, then
 * turned to face along the lane. Every arrow stays within `ARROW_HALF_WIDTH`
 * of the lane's middle, so none touches a lane line, a kerb or the reserve.
 */
function arrow(kind: ArrowKind): string {
  const stroke = `fill="none" stroke="${C.white}" stroke-width="0.58" stroke-linecap="round"`;
  const parts: string[] = [];
  if (kind === "straight") {
    parts.push(
      `<path ${stroke} d="M0 2.8 V-1.4"/>`,
      head(0, -1.4, 0, -1, 0.85),
    );
  } else if (kind === "right") {
    // the shaft sits left of centre so the hook has room to turn right
    parts.push(
      `<path ${stroke} d="M-0.55 2.8 V0.1 Q-0.55 -1.05 0.1 -1.5"/>`,
      head(0.1, -1.5, 0.65, -0.45, 0.72),
    );
  } else {
    // ahead and a turn: the shaft moves away from the turn, so both fit the lane
    const m = kind === "straight-left" ? -1 : 1;
    const shaft = -0.42 * m;
    parts.push(
      `<path ${stroke} d="M${shaft} 2.8 V-1.5"/>`,
      head(shaft, -1.5, 0, -1, 0.78),
      `<path ${stroke} d="M${shaft} 2.1 Q${shaft} 1.2 ${0.22 * m} 0.6"/>`,
      head(0.22 * m, 0.6, 0.72 * m, -0.68, 0.62),
    );
  }
  return `<g fill="${C.white}">${parts.join("")}</g>`;
}

/** The handbook's lane tables: the kerb lane turns left, the inside lane turns right. */
function arrowFor(arm: Arm, lane: number): ArrowKind {
  if (lane === 1) return "straight-left";
  if (lane === 2) return "straight";
  if (arm.lanes === 4 && lane === 4) return "right";
  return "straight-right";
}

/** A point on an arm, `offset` metres left of its centre (the exit side). */
function armPoint(arm: Arm, offset: number, along: number): Point {
  return {
    x: arm.out.x * along + arm.out.z * offset,
    z: arm.out.z * along - arm.out.x * offset,
  };
}

/** A line along an arm, `offset` metres left of its centre (the exit side). */
function armLine(arm: Arm, offset: number, from: number, to: number): string {
  const lx = arm.out.z;
  const lz = -arm.out.x;
  return `M${n(arm.out.x * from + lx * offset)} ${n(arm.out.z * from + lz * offset)} L${n(arm.out.x * to + lx * offset)} ${n(arm.out.z * to + lz * offset)}`;
}

type ArmPaint = { broken: string; solid: string; ticks: string; marks: string };

/**
 * Where a road's lane lines stop: the frame, except on the road to the right,
 * which ends at its stop line.
 */
function armEnd(arm: Arm): number {
  return arm.id === "E" ? arm.length - R_BLOCK : arm.length;
}

/**
 * The roundabout's outer edge across the mouth of a road, kerb to kerb, as a
 * broken line with a dash sitting on every line that meets it. So each lane
 * line ends on a mark, never in a gap, and the gaps are all the same.
 */
function mouthArc(arm: Arm, offsets: number[]): string {
  const angleOf = (offset: number) => {
    const p = armPoint(arm, offset, Math.sqrt(RING_R ** 2 - offset ** 2));
    return Math.atan2(p.z, p.x);
  };
  // measured from the road's own direction, so nothing wraps round
  const axis = Math.atan2(arm.out.z, arm.out.x);
  const turns = offsets
    .map((offset) => {
      let turn = angleOf(offset) - axis;
      if (turn > Math.PI) turn -= Math.PI * 2;
      if (turn < -Math.PI) turn += Math.PI * 2;
      return turn;
    })
    .sort((a, b) => a - b);
  const gap = RING_OFF / RING_R;
  const point = (turn: number) =>
    `${n(Math.cos(axis + turn) * RING_R)} ${n(Math.sin(axis + turn) * RING_R)}`;
  const dashes: string[] = [];
  for (let i = 0; i < turns.length; i += 1) {
    const from = i === 0 ? turns[0] : (turns[i - 1] + turns[i]) / 2 + gap / 2;
    const to =
      i === turns.length - 1
        ? turns[i]
        : (turns[i] + turns[i + 1]) / 2 - gap / 2;
    dashes.push(`M${point(from)} A${RING_R} ${RING_R} 0 0 1 ${point(to)}`);
  }
  return dashes.join(" ");
}

function armPaint(arm: Arm, numbers: boolean, white: string): ArmPaint {
  const broken: string[] = [];
  const solid: string[] = [];
  const meets: number[] = [];
  const end = armEnd(arm);
  const solidTo = Math.min(SOLID_TO, end);
  const edge = arm.reserve + arm.lanes * LANE;
  for (const side of [-1, 1]) {
    for (let k = 1; k < arm.lanes; k += 1) {
      const offset = side * (arm.reserve + k * LANE);
      const from = Math.sqrt(RING_R ** 2 - offset ** 2);
      // Continuous close to the roundabout, on both sides. Then one gap, and
      // whole dashes from there to the end of the road, in step across the lanes.
      solid.push(armLine(arm, offset, from, solidTo));
      meets.push(offset);
      if (end - solidTo > DASH_OFF + DASH_ON) {
        const a = armPoint(arm, offset, solidTo + DASH_OFF);
        const b = armPoint(arm, offset, end);
        broken.push(brokenLine(a.x, a.z, b.x, b.z, white));
      }
    }
    meets.push(side * edge);
    // the edge of the reserve, or the one centre line both sides share
    if (arm.reserve > 0) meets.push(side * arm.reserve);
    else if (side < 0) meets.push(0);
  }
  const bearing = laneBearing(arm.id, "approach");
  const marks: string[] = [];
  for (let lane = 1; lane <= arm.lanes; lane += 1) {
    const a = lanePoint(arm.id, "approach", lane, RING_R + 5.4);
    marks.push(at(a.x, a.z, bearing, arrow(arrowFor(arm, lane))));
    if (!numbers) continue;
    const t = lanePoint(arm.id, "approach", lane, RING_R + 10.4);
    marks.push(
      at(
        t.x,
        t.z,
        bearing,
        `<text y="0.8" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="2.2" fill="${C.white}">${lane}</text>`,
      ),
    );
  }
  return {
    broken: broken.join(""),
    solid: solid.join(" "),
    ticks: mouthArc(arm, meets),
    marks: marks.join(""),
  };
}

/** A zebra crossing over the two-way road: six bars, kerb to kerb. */
const CROSSING_HALF = 3.6;
function crossing(z: number): string {
  const bars: string[] = [];
  const pitch = (SIDE.x1 - SIDE.x0 - 1) / 6;
  for (let k = 0; k < 6; k += 1) {
    const x = SIDE.x0 + 0.5 + k * pitch + (pitch - 1) / 2;
    bars.push(rect(x, z - CROSSING_HALF, x + 1, z + CROSSING_HALF));
  }
  return bars.join("");
}

/**
 * The angle bays, at 45 degrees. Every line leans the same way, so the row on
 * the left suits traffic driving up the aisle and the row on the right suits
 * traffic driving down it.
 */
function bayLines(): string[] {
  const lines: string[] = [];
  // every line runs from the aisle right to the back of its bay
  const clear = 0;
  const reach = AISLE.x0 - PARK.x0;
  for (let k = 0; k < BAY_COUNT; k += 1) {
    const z = BAY_FIRST - k * BAY_STEP;
    lines.push(
      `M${AISLE.x0} ${n(z)} L${n(AISLE.x0 - reach)} ${n(z - reach)}`,
      `M${AISLE.x1} ${n(z)} L${n(AISLE.x1 + reach)} ${n(z + reach)}`,
    );
  }
  // the short lines along the aisle that close the odd corner at each end of a row
  const last = BAY_FIRST - (BAY_COUNT - 1) * BAY_STEP;
  for (const x of [AISLE.x0, AISLE.x1]) {
    lines.push(
      `M${x} ${n(PARK.z1 - clear)} V${BAY_FIRST}`,
      `M${x} ${n(last)} V${n(PARK.z0 + clear)}`,
    );
  }
  return lines;
}

function polyline(points: Point[]): string {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${n(p.x)} ${n(p.z)}`)
    .join(" ");
}

/** A side of the table. South is the bottom of the board as it is laid out here. */
export type BoardSide = "south" | "west" | "north" | "east";

/** How far the page is turned, in degrees, to see the board from each side. */
const TURN: Record<BoardSide, number> = {
  south: 0,
  east: 90,
  north: 180,
  west: 270,
};

/**
 * Where a point on the board lands on the page, as fractions of its width and
 * height, when the board is seen from `side`. For putting a marker on a drawing.
 */
export function placeOnPage(
  x: number,
  z: number,
  side: BoardSide = "south",
): { left: number; top: number } {
  const w = BOUNDS.x1 - BOUNDS.x0;
  const h = BOUNDS.z1 - BOUNDS.z0;
  const u = (x - BOUNDS.x0) / w;
  const v = (z - BOUNDS.z0) / h;
  if (side === "east") return { left: 1 - v, top: u };
  if (side === "north") return { left: 1 - u, top: 1 - v };
  if (side === "west") return { left: v, top: 1 - u };
  return { left: u, top: v };
}

export type FullBoardOptions = {
  /** Pixel width for a standalone image. Left out, the SVG fills its box. */
  width?: number;
  /** Leave the kerbs out, for a scene that builds them in 3D. */
  noKerbs?: boolean;
  /** Paint lane numbers behind the arrows, as the reference board does. On unless turned off. */
  numbers?: boolean;
  /**
   * Which side of the table the board is seen from. From the south (the
   * default) the dual carriageway runs away up the page. From the east it runs
   * left to right, with the two-way road along the bottom.
   */
  seen?: BoardSide;
  /** Fill its box and crop, instead of fitting inside it. */
  cover?: boolean;
  /** Show only this part of the board. Left out, the whole board. */
  view?: Box;
  /** Numbered discs for pointing things out in a caption. */
  marks?: { x: number; z: number; label: string }[];
  /** The green box the task ends in, on the way out of the roundabout. */
  goal?: {
    arm: ArmId;
    /** Left out, the side leaving the roundabout. */
    side?: "approach" | "exit";
    lane?: number;
    alongMin: number;
    alongMax: number;
  };
  /** A green box anywhere on the board, for a task that ends off these roads. */
  box?: Box;
  cars?: { x: number; z: number; heading: number; color: string }[];
  /** Lines drawn over the paint: a route, or the lane network for checking. */
  routes?: {
    points: Point[];
    color: string;
    /** Metres. Left out, 0.9. */
    width?: number;
    dashed?: boolean;
    opacity?: number;
    /** An arrowhead at the far end. */
    arrow?: boolean;
  }[];
};

/** Parts of the board worth a picture of their own. */
export const BOARD_VIEWS = {
  roundabout: {
    x0: -RING_R - 24,
    x1: RING_R + 24,
    z0: -RING_R - 24,
    z1: RING_R + 24,
  },
  parking: {
    x0: WIDE - 4,
    x1: BOUNDS.x1,
    z0: STREET.z0 - 6,
    z1: NARROW + 4,
  },
} as const satisfies Record<string, Box>;

/** Where the features a caption points out are, for the whole-board picture. */
export const BOARD_LANDMARKS = {
  dualCarriageway: { x: -(RESERVE + 2 * LANE), z: -104 },
  uTurnGap: { x: 0, z: -(U_TURNS[0] + RESERVE_GAP / 2) },
  roundabout: { x: 0, z: 0 },
  threeLaneRoad: { x: -40, z: 0 },
  parking: { x: (AISLE.x0 + AISLE.x1) / 2, z: (PARK.z0 + PARK.z1) / 2 },
  street: { x: (AISLE.x1 + SIDE.x0) / 2, z: STREET.mid },
  twoWayRoad: { x: SIDE.mid, z: 34 },
  crossing: { x: SIDE.mid, z: CROSSINGS[1] },
  flushParking: {
    x: (SIDE.x0 + FLUSH.x1) / 2 + 3,
    z: (FLUSH.z0 + FLUSH.z1) / 2,
  },
} as const;

/** The learner's car and the other car, wherever they are drawn. */
export const CAR_COLORS = { player: "#e89a00", red: "#b8141b" } as const;

/** The corners of a task's green box, for drawing it flat or on the table. */
export function goalBox(goal: NonNullable<FullBoardOptions["goal"]>): Box {
  const arm = ARMS[goal.arm];
  // offsets are measured to the left of the way out, so the side driving in is negative
  const side = goal.side === "approach" ? -1 : 1;
  const inner =
    goal.lane == null ? arm.reserve : laneOffset(arm, goal.lane) - LANE / 2;
  const outer =
    goal.lane == null
      ? arm.reserve + arm.lanes * LANE
      : laneOffset(arm, goal.lane) + LANE / 2;
  const a = armPoint(arm, side * inner, goal.alongMin);
  const b = armPoint(arm, side * outer, goal.alongMax);
  return {
    x0: Math.min(a.x, b.x),
    x1: Math.max(a.x, b.x),
    z0: Math.min(a.z, b.z),
    z1: Math.max(a.z, b.z),
  };
}

export function fullBoardSvg(options: FullBoardOptions = {}): string {
  const { x0, x1, z0, z1 } = BOUNDS;
  const w = x1 - x0;
  const h = z1 - z0;
  const side = options.seen ?? "south";
  const sideways = side === "east" || side === "west";
  const v = options.view ?? BOUNDS;
  const vw = v.x1 - v.x0;
  const vh = v.z1 - v.z0;
  const across = sideways ? vh : vw;
  const down = sideways ? vw : vh;
  const size = options.width
    ? ` width="${options.width}" height="${Math.round((options.width * down) / across)}"`
    : "";
  const viewBox = {
    south: `${n(v.x0)} ${n(v.z0)} ${n(vw)} ${n(vh)}`,
    east: `${n(-v.z1)} ${n(v.x0)} ${n(vh)} ${n(vw)}`,
    north: `${n(-v.x1)} ${n(-v.z1)} ${n(vw)} ${n(vh)}`,
    west: `${n(v.z0)} ${n(-v.x1)} ${n(vh)} ${n(vw)}`,
  }[side];
  // Marks stay upright whichever way the board is turned.
  const markSize = Math.max(2.6, Math.min(vw, vh) / 34);
  const marks = (options.marks ?? [])
    .map(
      (mark) =>
        `<g transform="translate(${n(mark.x)} ${n(mark.z)}) rotate(${-TURN[side]})"><circle r="${n(markSize)}" fill="${C.yellow}" stroke="${C.kerbBlack}" stroke-width="${n(markSize * 0.14)}"/><text y="${n(markSize * 0.38)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${n(markSize * 1.15)}" fill="${C.kerbBlack}">${mark.label}</text></g>`,
    )
    .join("");

  const tarmac = [
    `<circle r="${RING_R}"/>`,
    rect(-WIDE, z0, WIDE, z1),
    rect(x0, -NARROW, SIDE.x0, NARROW),
    rect(SIDE.x0, z0, SIDE.x1, z1),
    rect(WIDE, STREET.z0, SIDE.x0, STREET.z1),
    rect(AISLE.x0, STREET.z1, AISLE.x1, -NARROW),
    rect(PARK.x0, PARK.z0, PARK.x1, PARK.z1),
    ...CORNER_LIST.map((c) => {
      const arc = cornerArc(c);
      return `<path d="M${n(c.x)} ${n(c.z)} ${arc.map((p) => `L${n(p.x)} ${n(p.z)}`).join(" ")} Z"/>`;
    }),
  ].join("");

  const white = `fill="none" stroke="${C.white}" stroke-width="${LINE}"`;
  const yellow = `fill="none" stroke="${C.yellow}" stroke-width="0.4"`;
  const stop = `fill="none" stroke="${C.white}" stroke-width="0.6"`;
  const giveWay = `fill="none" stroke="${C.white}" stroke-width="0.5"`;
  const arms = ARM_LIST.map((arm) =>
    armPaint(arm, options.numbers ?? true, white),
  );
  const ring = Array.from({ length: RING_LANES - 1 }, (_, i) =>
    dashedRing(RING_R - (i + 1) * RING_LANE, white),
  ).join("");

  const yellowKerb = `fill="none" stroke="${C.yellow}" stroke-width="${KERB}" stroke-linecap="round" stroke-linejoin="round"`;
  const kerbs = options.noKerbs
    ? ""
    : `<path d="${kerbHighlights().map(polyline).join(" ")}" ${yellowKerb}/>`;

  // the reserve: a green strip with a yellow kerb capping each end, as on the
  // school's board (an end at the frame has no cap)
  const capLength = 3;
  const strips = reserves()
    .map((r) => {
      const xa = r.x0 + 0.3;
      const xb = r.x1 - 0.3;
      const caps: string[] = [];
      if (r.z0 > z0 + 0.1) {
        caps.push(
          `M${xa} ${n(r.z0 + capLength)} V${n(r.z0 + 0.3)} H${xb} V${n(r.z0 + capLength)}`,
        );
      }
      if (r.z1 < z1 - 0.1) {
        caps.push(
          `M${xa} ${n(r.z1 - capLength)} V${n(r.z1 - 0.3)} H${xb} V${n(r.z1 - capLength)}`,
        );
      }
      return (
        rect(
          r.x0 + 0.05,
          r.z0 + 0.05,
          r.x1 - 0.05,
          r.z1 - 0.05,
          ` rx="0.5" fill="${C.island}"`,
        ) +
        (options.noKerbs
          ? ""
          : `<path d="${caps.join(" ")}" fill="none" stroke="${C.yellow}" stroke-width="0.55" stroke-linecap="round" stroke-linejoin="round"/>`)
      );
    })
    .join("");

  const flush: string[] = [
    `M${SIDE.x0} ${FLUSH.z0} H${FLUSH.x1} V${FLUSH.z1} H${SIDE.x0}`,
  ];
  const box = (FLUSH.z1 - FLUSH.z0) / FLUSH.bays;
  for (let k = 1; k < FLUSH.bays; k += 1) {
    flush.push(`M${SIDE.x0} ${n(FLUSH.z0 + k * box)} H${FLUSH.x1}`);
  }

  const aisleMid = (AISLE.x0 + AISLE.x1) / 2;
  // two dashes across each gap in the reserve, from one piece of it to the next
  const gaps = (RESERVE_SPANS.N ?? [])
    .slice(0, -1)
    .map((span) => brokenLine(0, -span[1], 0, -span[1] - RESERVE_GAP, giveWay))
    .join("");

  const target = options.box ?? (options.goal ? goalBox(options.goal) : null);
  const goal = target
    ? rect(
        target.x0 + 0.3,
        target.z0,
        target.x1 - 0.3,
        target.z1,
        ` rx="0.8" fill="${C.goal}" fill-opacity="0.5" stroke="${C.goal}" stroke-width="0.5"`,
      )
    : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${size}${options.cover ? ` preserveAspectRatio="xMidYMid slice"` : ""}>`,
    `<g transform="rotate(${TURN[side]})">`,
    rect(x0, z0, x1, z1, ` fill="${C.grass}"`),
    // the thin outline closes hairline seams between the pieces
    `<g fill="${C.asphalt}" stroke="${C.asphalt}" stroke-width="0.2">${tarmac}</g>`,
    kerbs,
    goal,
    // lanes you may change between, and the stretches where you may not
    arms.map((a) => a.broken).join(""),
    `<path d="${arms.map((a) => a.solid).join(" ")}" ${white}/>`,
    // the roundabout's lanes, and a mark on its edge wherever a line meets it
    ring,
    `<path d="${arms.map((a) => a.ticks).join(" ")}" ${white}/>`,
    // the three-lane road's continuous yellow centre line, from the roundabout
    // to the frame on one side and to the stop line on the other
    `<path d="M${x0} 0 H${-RING_R} M${RING_R} 0 H${SIDE.x0 - R_BLOCK}" ${yellow}/>`,
    strips,
    // across the gaps in the central reserve
    gaps,
    `<circle r="${n(ISLAND_R - 0.25)}" fill="${C.island}" stroke="${C.yellow}" stroke-width="0.5"/>`,
    arms.map((a) => a.marks).join(""),

    // the two-way road: a yellow centre line, broken only across the mouth of
    // each road that joins it
    `<path d="M${SIDE.mid} ${z0} V${STREET.z0} M${SIDE.mid} ${STREET.z1} V${-NARROW} M${SIDE.mid} ${NARROW} V${z1}" ${yellow}/>`,
    brokenLine(
      SIDE.mid,
      STREET.z0 + DASH_OFF,
      SIDE.mid,
      STREET.z1 - DASH_OFF,
      yellow,
    ),
    brokenLine(
      SIDE.mid,
      -NARROW + DASH_OFF,
      SIDE.mid,
      NARROW - DASH_OFF,
      yellow,
    ),
    `<g fill="${C.white}">${CROSSINGS.map(crossing).join("")}</g>`,
    `<path d="${flush.join(" ")}" ${white}/>`,

    // the street: a yellow centre line from its give way line to its stop
    // line, broken opposite the parking aisle
    `<path d="M${WIDE + R_BLOCK} ${STREET.mid} H${AISLE.x0} M${AISLE.x1} ${STREET.mid} H${SIDE.x0 - R_BLOCK}" ${yellow}/>`,
    brokenLine(
      AISLE.x0 + DASH_OFF,
      STREET.mid,
      AISLE.x1 - DASH_OFF,
      STREET.mid,
      yellow,
    ),

    // stop where a road meets the two-way road: kerb to centre line
    `<path d="M${SIDE.x0 - R_BLOCK} ${-NARROW} V0 M${SIDE.x0 - R_BLOCK} ${n(STREET.z0 - 0.2)} V${STREET.mid}" ${stop}/>`,
    // give way where the street meets the dual carriageway, and at each end of
    // the parking aisle: centre line to kerb
    brokenLine(WIDE + R_BLOCK, STREET.mid, WIDE + R_BLOCK, STREET.z1, giveWay),
    brokenLine(
      aisleMid,
      -NARROW - R_AISLE,
      AISLE.x1,
      -NARROW - R_AISLE,
      giveWay,
    ),
    brokenLine(
      AISLE.x0,
      STREET.z1 + R_AISLE,
      aisleMid,
      STREET.z1 + R_AISLE,
      giveWay,
    ),

    // the controlled parking zone, with an arrow each way at both ends of the aisle
    `<path d="${bayLines().join(" ")}" fill="none" stroke="${C.white}" stroke-width="0.45"/>`,
    ...[(PARK.z1 - NARROW) / 2 - 0.9, (STREET.z1 + PARK.z0) / 2 + 0.9].flatMap(
      (z) => [
        at((AISLE.x0 + aisleMid) / 2, z, 0, arrow("straight")),
        at((aisleMid + AISLE.x1) / 2, z, Math.PI, arrow("straight")),
      ],
    ),

    (options.routes ?? [])
      .map((route) => {
        if (route.points.length < 2) return "";
        const width = route.width ?? 0.9;
        const a = route.points[route.points.length - 2];
        const b = route.points[route.points.length - 1];
        const tip = route.arrow
          ? `<g fill="${route.color}">${head(b.x, b.z, b.x - a.x, b.z - a.z, width * 1.5)}</g>`
          : "";
        return `<g opacity="${route.opacity ?? 1}"><path d="${polyline(route.points)}" fill="none" stroke="${route.color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${route.dashed ? ` stroke-dasharray="${n(width * 1.6)} ${n(width * 2)}"` : ""}/>${tip}</g>`;
      })
      .join(""),
    (options.cars ?? [])
      .map((car) =>
        at(
          car.x,
          car.z,
          car.heading,
          `<rect x="-1.1" y="-2.4" width="2.2" height="4.8" rx="0.8" fill="${car.color}" stroke="${C.kerbBlack}" stroke-width="0.3"/><rect x="-0.8" y="-0.9" width="1.6" height="2.1" rx="0.4" fill="${C.kerbBlack}" fill-opacity="0.7"/>`,
        ),
      )
      .join(""),
    marks,
    `</g>`,
    `</svg>`,
  ].join("");
}

/** Parking bays a car can be drawn in, for dressing the board. */
export function parkedSpots(): { x: number; z: number; heading: number }[] {
  const depth = AISLE.x0 - PARK.x0;
  // the middle of bay `k` in each row, between two leaning lines
  const left = (k: number) => ({
    x: AISLE.x0 - depth / 2,
    z: BAY_FIRST - (k + 0.5) * BAY_STEP - depth / 2,
    heading: -Math.PI / 4,
  });
  const right = (k: number) => ({
    x: AISLE.x1 + depth / 2,
    z: BAY_FIRST - (k + 0.5) * BAY_STEP + depth / 2,
    heading: (Math.PI * 3) / 4,
  });
  return [
    right(1),
    right(4),
    left(5),
    {
      x: (SIDE.x0 + FLUSH.x1) / 2,
      z: FLUSH.z1 - (FLUSH.z1 - FLUSH.z0) / FLUSH.bays / 2,
      heading: 0,
    },
  ];
}

export type OtherRoad = "two_way" | "street" | "parking";

/**
 * Which of the board's other roads a point is on: the two-way road down the
 * right, the street, or the parking zone and its aisle. Null on the four roads
 * into the roundabout, on the roundabout, and off the tarmac.
 */
export function otherRoad(x: number, z: number): OtherRoad | null {
  const inside = (x0: number, z0: number, x1: number, z1: number) =>
    x >= x0 && x <= x1 && z >= z0 && z <= z1;
  if (inside(SIDE.x0, BOUNDS.z0, SIDE.x1, BOUNDS.z1)) return "two_way";
  if (inside(WIDE, STREET.z0, SIDE.x0, STREET.z1)) return "street";
  if (
    inside(AISLE.x0, STREET.z1, AISLE.x1, -NARROW) ||
    inside(PARK.x0, PARK.z0, PARK.x1, PARK.z1)
  ) {
    return "parking";
  }
  return null;
}

/** Is this point on tarmac (or within `margin` metres of it)? */
export function onTarmac(x: number, z: number, margin = 0): boolean {
  const inside = (x0: number, z0: number, x1: number, z1: number) =>
    x >= x0 - margin &&
    x <= x1 + margin &&
    z >= z0 - margin &&
    z <= z1 + margin;
  const r = Math.hypot(x, z);
  if (r <= RING_R + margin) return r >= ISLAND_R - margin;
  // the sliver of road inside each rounded corner
  for (const c of CORNER_LIST) {
    const u = (x - c.x) * c.u[0] + (z - c.z) * c.u[1];
    const v = (x - c.x) * c.v[0] + (z - c.z) * c.v[1];
    if (u >= 0 && u <= c.r && v >= 0 && v <= c.r) {
      if (Math.hypot(u - c.r, v - c.r) >= c.r) return true;
    }
  }
  return (
    inside(-WIDE, BOUNDS.z0, WIDE, BOUNDS.z1) ||
    inside(BOUNDS.x0, -NARROW, SIDE.x0, NARROW) ||
    inside(SIDE.x0, BOUNDS.z0, SIDE.x1, BOUNDS.z1) ||
    inside(WIDE, STREET.z0, SIDE.x0, STREET.z1) ||
    inside(AISLE.x0, STREET.z1, AISLE.x1, -NARROW) ||
    inside(PARK.x0, PARK.z0, PARK.x1, PARK.z1)
  );
}
