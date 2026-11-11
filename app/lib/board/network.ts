/**
 * Every lane on the board and every way from one lane to the next, as a
 * network a route can be found through. `geometry.ts` only knows the roundabout
 * and its four roads. This adds the two-way road, the street, the parking aisle
 * and every parking bay, so a lesson can show the way from anywhere to
 * anywhere, including parking and reversing.
 *
 * A node is a place a car can be, facing one way. An edge is one piece of
 * driving between two nodes: following a lane, changing lane, going round the
 * roundabout, turning at a junction, turning back through a gap, or going into
 * or out of a bay. An edge driven in reverse moves the car tail first.
 *
 * Some connections rest on rules a driving school still has to confirm (see
 * `confirmed`). They are in the network so they can be looked at, and lessons
 * must say so wherever they use one.
 *
 * Pure data, no three.js. Top view, metres, the same axes as `geometry.ts`.
 */
import { laneRule } from "./board-rules";
import {
  BOUNDS,
  ROADS,
  SOLID_TO,
  U_TURN_GAPS,
  parkedSpots,
  type Box,
} from "./full-board";
import {
  ARMS,
  ARM_ORDER,
  allowedTurns,
  armForTurn,
  bearingOf,
  dirOf,
  lanePoint,
  locate,
  wrapPi,
  type ArmId,
  type Side,
  type Turn,
  type Vec,
} from "./geometry";
import { lanePath } from "./lane-paths";

export type Gear = "forward" | "reverse";

export type Road =
  | "dual"
  | "three_lane"
  | "roundabout"
  | "two_way"
  | "street"
  | "aisle"
  | "angle_bay"
  | "flush_bay";

export type Maneuver =
  | "follow"
  | "lane_change"
  | "hold_lane"
  | "ring"
  | "exit"
  | "turn_left"
  | "turn_right"
  | "u_turn"
  | "park_forward"
  | "park_reverse"
  | "leave_forward"
  | "leave_reverse";

/** Paint the driver has to obey on the way through an edge. */
export type Control = "stop" | "give_way" | "crossing";

export type NetNode = {
  id: string;
  x: number;
  z: number;
  /** The way the car faces here, a compass bearing. */
  heading: number;
};

export type NetEdge = {
  id: string;
  from: string;
  to: string;
  /** The line the middle of the car follows, in the order it is driven. */
  points: Vec[];
  length: number;
  gear: Gear;
  maneuver: Maneuver;
  road: Road;
  lane?: number;
  /** What to do, and why, in the learner's words. */
  title: string;
  why: string;
  /** False where a driving school still has to confirm the rule. */
  confirmed: boolean;
  control?: Control;
  /** Inside the parking area, which a route avoids unless it has to. */
  parking: boolean;
  /** The bay this edge goes into or out of. */
  bay?: string;
};

/** Somewhere a lesson can start or end. */
export type Place = {
  /** The node's id. */
  id: string;
  label: string;
  group: "road" | "angle_bay" | "flush_bay";
  starts: boolean;
  ends: boolean;
  /** A bay the board dresses with a parked car. */
  occupied?: boolean;
};

/** A straight lane away from the roundabout, for lane assist to hold. */
export type RoadLane = {
  a: Vec;
  /** The way traffic faces along it. */
  heading: number;
  length: number;
  road: Road;
};

export type Network = {
  /** The lanes of the two-way road, the street and the parking aisle. */
  roadLanes: RoadLane[];
  nodes: Map<string, NetNode>;
  edges: NetEdge[];
  out: Map<string, NetEdge[]>;
  places: Place[];
};

// ---- the numbers ---------------------------------------------------------------

const { SIDE, STREET, AISLE, PARK, FLUSH, CROSSINGS } = ROADS;

/** The roundabout hands a car back to its road this far out. */
export const EXIT_FROM = 26;
/** How far a lane change takes, and how often one may start. */
const CHANGE_LENGTH = 8;
const CHANGE_EVERY = 9;
/** The radius of a turn at a junction, where there is room to choose. */
const TURN_R = 6;
/** Where the road to the right stops at its stop line. */
const STOP_X = SIDE.x0 - ROADS.R_BLOCK;
const GIVE_WAY = ROADS.R_AISLE;

/** Lane middles on the roads that are not arms. Kenya keeps left. */
const X_NORTHBOUND = (SIDE.x0 + SIDE.mid) / 2;
const X_SOUTHBOUND = (SIDE.mid + SIDE.x1) / 2;
const Z_EASTBOUND = (STREET.z0 + STREET.mid) / 2;
const Z_WESTBOUND = (STREET.mid + STREET.z1) / 2;
const AISLE_MID = (AISLE.x0 + AISLE.x1) / 2;
const X_AISLE_NORTH = (AISLE.x0 + AISLE_MID) / 2;
const X_AISLE_SOUTH = (AISLE_MID + AISLE.x1) / 2;
const AISLE_TOP = STREET.z1 + GIVE_WAY;
const AISLE_FOOT = -ROADS.NARROW - GIVE_WAY - 3;

const NORTH = 0;
const SOUTH = Math.PI;

// ---- words -----------------------------------------------------------------------

const ROAD_NAME: Record<Road, string> = {
  dual: "the dual carriageway",
  three_lane: "the three-lane road",
  roundabout: "the roundabout",
  two_way: "the two-way road",
  street: "the street",
  aisle: "the parking aisle",
  angle_bay: "an angle parking bay",
  flush_bay: "a flush parking bay",
};

export function roadName(road: Road): string {
  return ROAD_NAME[road];
}

const KEEP_LEFT =
  "Keep left of the yellow centre line. Traffic comes toward you on the other side.";

const FOLLOW: Record<Road, (lane?: number) => { title: string; why: string }> =
  {
    dual: (lane) => ({
      title: `Stay in lane ${lane} on the dual carriageway`,
      why: "Keep to your lane. Lane 1 is by the kerb and lane 4 is beside the central reserve.",
    }),
    three_lane: (lane) => ({
      title: `Stay in lane ${lane} on the three-lane road`,
      why: "Keep to your lane, left of the continuous yellow centre line.",
    }),
    two_way: () => ({ title: "Drive along the two-way road", why: KEEP_LEFT }),
    street: () => ({ title: "Drive along the street", why: KEEP_LEFT }),
    aisle: () => ({
      title: "Drive slowly through the parking aisle",
      why: "Keep left. A car may pull out of a bay on either side.",
    }),
    roundabout: () => ({ title: "Go round the roundabout", why: "" }),
    angle_bay: () => ({ title: "", why: "" }),
    flush_bay: () => ({ title: "", why: "" }),
  };

const CONTROL_WHY: Record<Control, string> = {
  stop: "Stop at the stop line first, even when the road is clear. Go when it is safe.",
  give_way:
    "Give way at the broken line. Traffic on the road you are joining goes first.",
  crossing: "Slow down and be ready to stop. People on the crossing go first.",
};

const EXIT_TITLE: Record<Turn, string> = {
  left: "Take the first exit, to the left",
  straight: "Take the second exit, straight on",
  right: "Take the third exit, to the right",
  back: "Go right round and come back the way you came",
};

// ---- small maths -----------------------------------------------------------------

function lengthOf(points: Vec[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].z - points[i - 1].z,
    );
  }
  return total;
}

/**
 * A smooth line from one place and heading to another: a turn at a junction, a
 * lane change, the swing into a bay.
 */
function curve(a: Vec, ha: number, b: Vec, hb: number, steps = 16): Vec[] {
  const reach = Math.hypot(b.x - a.x, b.z - a.z) * 0.39;
  const da = dirOf(ha);
  const db = dirOf(hb);
  const c1 = { x: a.x + da.x * reach, z: a.z + da.z * reach };
  const c2 = { x: b.x - db.x * reach, z: b.z - db.z * reach };
  const out: Vec[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    out.push({
      x:
        u * u * u * a.x +
        3 * u * u * t * c1.x +
        3 * u * t * t * c2.x +
        t * t * t * b.x,
      z:
        u * u * u * a.z +
        3 * u * u * t * c1.z +
        3 * u * t * t * c2.z +
        t * t * t * b.z,
    });
  }
  return out;
}

/**
 * Round off the corners of a line, keeping its two ends where they are. A lane
 * meets the roundabout's inner lanes at quite an angle, and a car cannot turn
 * on the spot.
 */
function soften(points: Vec[], passes = 3): Vec[] {
  // Laid out again in three-metre pieces first, so a corner is rounded over a
  // few metres and not a few centimetres.
  const total = lengthOf(points);
  const pieces = Math.max(2, Math.round(total / 3));
  let out: Vec[] = [points[0]];
  let walked = 0;
  let next = total / pieces;
  for (let i = 1; i < points.length && out.length < pieces; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const span = Math.hypot(b.x - a.x, b.z - a.z);
    while (walked + span >= next && out.length < pieces) {
      const t = (next - walked) / span;
      out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
      next += total / pieces;
    }
    walked += span;
  }
  out.push(points[points.length - 1]);
  for (let pass = 0; pass < passes; pass += 1) {
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

/** Half a circle from `a` round to `b`, turning right. */
function halfTurn(a: Vec, b: Vec, steps = 14): Vec[] {
  const cx = (a.x + b.x) / 2;
  const cz = (a.z + b.z) / 2;
  const ux = a.x - cx;
  const uz = a.z - cz;
  const out: Vec[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = (Math.PI * i) / steps;
    out.push({
      x: cx + ux * Math.cos(t) - uz * Math.sin(t),
      z: cz + ux * Math.sin(t) + uz * Math.cos(t),
    });
  }
  return out;
}

// ---- building ----------------------------------------------------------------------

type LaneDef = {
  id: string;
  a: Vec;
  heading: number;
  length: number;
  road: Road;
  lane?: number;
  parking: boolean;
  stations: Map<string, number>;
  /** A stretch with paint to obey, starting at a station. */
  marks: Map<string, Control>;
};

type EdgeMeta = Pick<NetEdge, "maneuver" | "road" | "title" | "why"> &
  Partial<
    Pick<NetEdge, "lane" | "gear" | "confirmed" | "control" | "parking" | "bay">
  >;

function build(): Network {
  const nodes = new Map<string, NetNode>();
  const edges: NetEdge[] = [];
  const lanes = new Map<string, LaneDef>();
  const places: Place[] = [];

  const node = (id: string, p: Vec, heading: number): string => {
    if (!nodes.has(id)) nodes.set(id, { id, x: p.x, z: p.z, heading });
    return id;
  };

  const edge = (from: string, to: string, points: Vec[], meta: EdgeMeta) => {
    edges.push({
      id: `${from}>${to}:${meta.maneuver}`,
      from,
      to,
      points,
      length: lengthOf(points),
      gear: meta.gear ?? "forward",
      maneuver: meta.maneuver,
      road: meta.road,
      lane: meta.lane,
      title: meta.title,
      why: meta.why,
      confirmed: meta.confirmed ?? true,
      control: meta.control,
      parking: meta.parking ?? false,
      bay: meta.bay,
    });
  };

  const key = (d: number) => d.toFixed(2);

  const lane = (
    id: string,
    a: Vec,
    b: Vec,
    meta: { road: Road; lane?: number; parking?: boolean },
  ) => {
    const def: LaneDef = {
      id,
      a,
      heading: bearingOf(b.x - a.x, b.z - a.z),
      length: Math.hypot(b.x - a.x, b.z - a.z),
      road: meta.road,
      lane: meta.lane,
      parking: meta.parking ?? false,
      stations: new Map(),
      marks: new Map(),
    };
    lanes.set(id, def);
    station(id, 0);
    station(id, def.length);
  };

  /** A node on a lane, `d` metres from its start. */
  function station(laneId: string, d: number): string {
    const def = lanes.get(laneId);
    if (!def) throw new Error(`no lane ${laneId}`);
    if (d < -0.01 || d > def.length + 0.01) {
      throw new Error(`${laneId} has no point at ${d.toFixed(2)}`);
    }
    const at = Math.min(def.length, Math.max(0, d));
    const dir = dirOf(def.heading);
    def.stations.set(key(at), at);
    return node(
      `${laneId}@${key(at)}`,
      { x: def.a.x + dir.x * at, z: def.a.z + dir.z * at },
      def.heading,
    );
  }

  /** The node on a lane nearest to a point on the board. */
  const near = (laneId: string, p: Vec): string => {
    const def = lanes.get(laneId);
    if (!def) throw new Error(`no lane ${laneId}`);
    const dir = dirOf(def.heading);
    return station(laneId, (p.x - def.a.x) * dir.x + (p.z - def.a.z) * dir.z);
  };

  const last = (laneId: string) =>
    station(laneId, lanes.get(laneId)?.length ?? 0);

  /** A smooth turn from one node to another. */
  const turn = (from: string, to: string, meta: EdgeMeta) => {
    const a = nodes.get(from);
    const b = nodes.get(to);
    if (!a || !b) throw new Error(`no node for ${from} to ${to}`);
    edge(from, to, curve(a, a.heading, b, b.heading), meta);
  };

  // ---- the four roads into the roundabout ----

  const armRoad = (id: ArmId): Road =>
    ARMS[id].lanes === 4 ? "dual" : "three_lane";
  /** Where a road starts or ends: the frame, or the stop line on the right. */
  const armEnd = (id: ArmId) => (id === "E" ? STOP_X : ARMS[id].length);
  const laneId = (arm: ArmId, side: Side, n: number) =>
    `${arm}:${side === "approach" ? "in" : "out"}:${n}`;
  /** A node on an arm's lane, `along` metres from the roundabout's centre. */
  const onArm = (arm: ArmId, side: Side, n: number, along: number) =>
    station(
      laneId(arm, side, n),
      side === "approach" ? armEnd(arm) - along : along - EXIT_FROM,
    );

  for (const id of ARM_ORDER) {
    const road = armRoad(id);
    for (let n = 1; n <= ARMS[id].lanes; n += 1) {
      lane(
        laneId(id, "approach", n),
        lanePoint(id, "approach", n, armEnd(id)),
        lanePoint(id, "approach", n, SOLID_TO),
        { road, lane: n },
      );
      lane(
        laneId(id, "exit", n),
        lanePoint(id, "exit", n, EXIT_FROM),
        lanePoint(id, "exit", n, armEnd(id)),
        { road, lane: n },
      );
    }
  }

  // lane changes, only where the lane lines are broken
  for (const id of ARM_ORDER) {
    const road = armRoad(id);
    for (const side of ["approach", "exit"] as const) {
      const length = lanes.get(laneId(id, side, 1))?.length ?? 0;
      const first =
        side === "approach" ? 1 : Math.max(1, SOLID_TO + 2 - EXIT_FROM);
      for (
        let d = first;
        d + CHANGE_LENGTH <= length - 0.5;
        d += CHANGE_EVERY
      ) {
        for (let n = 1; n <= ARMS[id].lanes; n += 1) {
          for (const to of [n - 1, n + 1]) {
            if (to < 1 || to > ARMS[id].lanes) continue;
            turn(
              station(laneId(id, side, n), d),
              station(laneId(id, side, to), d + CHANGE_LENGTH),
              {
                maneuver: "lane_change",
                road,
                lane: to,
                title: `Move from lane ${n} to lane ${to}`,
                why: "The lane lines are broken here, so you may change lanes. Do it before they turn continuous near the roundabout.",
              },
            );
          }
        }
      }
    }
  }

  // the roundabout: one way through for each turn a lane may make
  for (const entry of ARM_ORDER) {
    const arm = ARMS[entry];
    for (let n = 1; n <= arm.lanes; n += 1) {
      for (const way of allowedTurns(arm.lanes, n)) {
        const exit = armForTurn(entry, way);
        const exitLane = Math.min(n, ARMS[exit].lanes);
        // softened once more, so the car comes onto the roundabout and off
        // it in a curve and not at a corner
        const path = soften([
          ...lanePath(entry, n, way, SOLID_TO, EXIT_FROM),
          lanePoint(exit, "exit", exitLane, EXIT_FROM),
        ]);
        const onRing = path.map((p) => locate(p.x, p.z).kind === "ring");
        const i1 = onRing.indexOf(true);
        const i2 = onRing.lastIndexOf(true);
        const confirmed = !(arm.lanes === 3 && n === 3);
        const name = `rb:${entry}${n}:${way}`;
        const joined = node(
          `${name}:on`,
          path[i1],
          bearingOf(path[i1].x - path[i1 - 1].x, path[i1].z - path[i1 - 1].z),
        );
        const left = node(
          `${name}:off`,
          path[i2],
          bearingOf(path[i2 + 1].x - path[i2].x, path[i2 + 1].z - path[i2].z),
        );
        edge(
          last(laneId(entry, "approach", n)),
          joined,
          path.slice(0, i1 + 1),
          {
            maneuver: "hold_lane",
            road: armRoad(entry),
            lane: n,
            confirmed,
            title: `Hold lane ${n} into the roundabout`,
            why: `The lane lines are continuous now, so no changing lanes. ${laneRule(arm.lanes, n)}`,
          },
        );
        edge(joined, left, path.slice(i1, i2 + 1), {
          maneuver: "ring",
          road: "roundabout",
          lane: n,
          confirmed,
          title: `Go round clockwise in lane ${n}`,
          why: `No stopping and no changing lanes on the roundabout. Lane ${n} on the road is lane ${n} on the roundabout, counting from the outside.`,
        });
        edge(left, onArm(exit, "exit", exitLane, EXIT_FROM), path.slice(i2), {
          maneuver: "exit",
          road: armRoad(exit),
          lane: exitLane,
          confirmed,
          title: EXIT_TITLE[way],
          why:
            way === "back"
              ? `Only the innermost lane may go all the way round. Leave in lane ${exitLane}.`
              : `Left is the first exit, straight on the second, right the third. Leave in lane ${exitLane}.`,
        });
      }
    }
  }

  // turning back through the gaps in the central reserve, either way
  const inner = ARMS.N.lanes;
  for (const gap of U_TURN_GAPS) {
    const meta: EdgeMeta = {
      maneuver: "u_turn",
      road: "dual",
      lane: inner,
      confirmed: false,
      control: "give_way",
      title: "Turn back through the gap in the central reserve",
      why: `Be in lane ${inner}, beside the reserve, before the gap. Give way to traffic on the other side, then come round into the lane beside the reserve.`,
    };
    for (const [from, to, along] of [
      ["exit", "approach", gap.from + 0.4],
      ["approach", "exit", gap.to - 0.4],
    ] as const) {
      const a = onArm("N", from, inner, along);
      const b = onArm("N", to, inner, along);
      const pa = nodes.get(a) as NetNode;
      const pb = nodes.get(b) as NetNode;
      edge(a, b, halfTurn(pa, pb), meta);
    }
  }

  // ---- the two-way road, the street and the parking aisle ----

  lane(
    "side:north",
    { x: X_NORTHBOUND, z: BOUNDS.z1 },
    { x: X_NORTHBOUND, z: BOUNDS.z0 },
    { road: "two_way" },
  );
  lane(
    "side:south",
    { x: X_SOUTHBOUND, z: BOUNDS.z0 },
    { x: X_SOUTHBOUND, z: BOUNDS.z1 },
    { road: "two_way" },
  );
  const streetWest = lanePoint("N", "approach", 1, 0).x + TURN_R;
  lane(
    "street:east",
    { x: streetWest, z: Z_EASTBOUND },
    { x: STOP_X, z: Z_EASTBOUND },
    { road: "street" },
  );
  lane(
    "street:west",
    { x: STOP_X, z: Z_WESTBOUND },
    { x: streetWest, z: Z_WESTBOUND },
    { road: "street" },
  );
  lane(
    "aisle:north",
    { x: X_AISLE_NORTH, z: AISLE_FOOT },
    { x: X_AISLE_NORTH, z: AISLE_TOP },
    { road: "aisle", parking: true },
  );
  lane(
    "aisle:south",
    { x: X_AISLE_SOUTH, z: AISLE_TOP },
    { x: X_AISLE_SOUTH, z: AISLE_FOOT },
    { road: "aisle", parking: true },
  );

  // the two pedestrian crossings, on both sides of the two-way road
  for (const z of CROSSINGS) {
    for (const [id, before] of [
      ["side:north", z + 6],
      ["side:south", z - 6],
    ] as const) {
      const def = lanes.get(id) as LaneDef;
      const x = id === "side:north" ? X_NORTHBOUND : X_SOUTHBOUND;
      near(id, { x, z: before });
      near(id, { x, z: 2 * z - before });
      const d = Math.abs(before - def.a.z);
      def.marks.set(key(d), "crossing");
    }
  }

  const left = (
    into: Road,
    control?: Control,
    confirmed = true,
    parking = false,
  ): EdgeMeta => ({
    maneuver: "turn_left",
    road: into,
    control,
    confirmed,
    parking,
    title: `Turn left into ${ROAD_NAME[into]}`,
    why: `${control ? `${CONTROL_WHY[control]} ` : ""}Keep left as you turn, and finish in the lane nearest the kerb.`,
  });
  const right = (
    into: Road,
    control?: Control,
    confirmed = true,
    parking = false,
  ): EdgeMeta => ({
    maneuver: "turn_right",
    road: into,
    control,
    confirmed,
    parking,
    title: `Turn right into ${ROAD_NAME[into]}`,
    why: `${control ? `${CONTROL_WHY[control]} ` : ""}You cross the other side of the road, so traffic coming toward you goes first. The centre line is broken here, which is what lets you turn across it.`,
  });

  // the street and the dual carriageway: the street joins the side going south
  turn(
    onArm("N", "approach", 1, -Z_EASTBOUND + TURN_R),
    station("street:east", 0),
    left("street"),
  );
  turn(last("street:west"), onArm("N", "approach", 1, -Z_WESTBOUND - TURN_R), {
    ...left("dual", "give_way"),
    lane: 1,
  });

  // the street and the two-way road
  const tight = X_NORTHBOUND - STOP_X;
  const wide = X_SOUTHBOUND - STOP_X;
  turn(
    last("street:east"),
    near("side:north", { x: X_NORTHBOUND, z: Z_EASTBOUND - tight }),
    left("two_way", "stop"),
  );
  turn(
    last("street:east"),
    near("side:south", { x: X_SOUTHBOUND, z: Z_EASTBOUND + wide }),
    right("two_way", "stop"),
  );
  turn(
    near("side:north", { x: X_NORTHBOUND, z: Z_WESTBOUND + tight }),
    station("street:west", 0),
    left("street"),
  );
  turn(
    near("side:south", { x: X_SOUTHBOUND, z: Z_WESTBOUND - wide }),
    station("street:west", 0),
    right("street"),
  );

  // the top of the parking aisle and the street
  const upLeft = AISLE_TOP - Z_WESTBOUND;
  const upRight = AISLE_TOP - Z_EASTBOUND;
  turn(
    last("aisle:north"),
    near("street:west", { x: X_AISLE_NORTH - upLeft, z: Z_WESTBOUND }),
    left("street", "give_way", true, true),
  );
  turn(
    last("aisle:north"),
    near("street:east", { x: X_AISLE_NORTH + upRight, z: Z_EASTBOUND }),
    right("street", "give_way", true, true),
  );
  turn(
    near("street:west", { x: X_AISLE_SOUTH + upLeft, z: Z_WESTBOUND }),
    station("aisle:south", 0),
    left("aisle", undefined, true, true),
  );
  turn(
    near("street:east", { x: X_AISLE_SOUTH - upRight, z: Z_EASTBOUND }),
    station("aisle:south", 0),
    right("aisle", undefined, true, true),
  );

  // the foot of the parking aisle and the three-lane road. The yellow centre
  // line there is continuous, so there is no turning right in or out.
  const eastLane1 = lanePoint("E", "exit", 1, 0).z;
  const footTurn = eastLane1 - AISLE_FOOT;
  turn(last("aisle:south"), onArm("E", "exit", 1, X_AISLE_SOUTH + footTurn), {
    ...left("three_lane", "give_way", true, true),
    lane: 1,
  });
  turn(
    onArm("E", "exit", 1, X_AISLE_NORTH - footTurn),
    station("aisle:north", 0),
    left("aisle", undefined, true, true),
  );

  // the three-lane road and the two-way road
  for (let n = 1; n <= ARMS.E.lanes; n += 1) {
    const z = lanePoint("E", "exit", n, 0).z;
    const zIn = lanePoint("E", "approach", n, 0).z;
    // the kerb lane turns left and the lane by the centre line turns right;
    // which way the middle lane may go is for a driving school to say
    if (n !== ARMS.E.lanes) {
      turn(
        last(laneId("E", "exit", n)),
        near("side:north", { x: X_NORTHBOUND, z: z - tight }),
        left("two_way", "stop", n === 1),
      );
      turn(
        near("side:north", { x: X_NORTHBOUND, z: zIn + tight }),
        station(laneId("E", "approach", n), 0),
        { ...left("three_lane", undefined, n === 1), lane: n },
      );
    }
    if (n !== 1) {
      turn(
        last(laneId("E", "exit", n)),
        near("side:south", { x: X_SOUTHBOUND, z: z + wide }),
        right("two_way", "stop", n === ARMS.E.lanes),
      );
      turn(
        near("side:south", { x: X_SOUTHBOUND, z: zIn - wide }),
        station(laneId("E", "approach", n), 0),
        { ...right("three_lane", undefined, n === ARMS.E.lanes), lane: n },
      );
    }
  }

  // ---- parking ----

  const dressed = parkedSpots();
  const isDressed = (p: Vec) =>
    dressed.some((spot) => Math.hypot(spot.x - p.x, spot.z - p.z) < 1.5);

  // Angle bays, as they are examined: park nose in, and to leave, reverse out
  // and then drive forward. The lines lean so that the row on the left suits a
  // car driving up the aisle and the row on the right suits a car driving down
  // it.
  const depth = AISLE.x0 - PARK.x0;
  const rows = [
    {
      name: "L",
      label: "left",
      x: AISLE.x0 - depth / 2,
      shift: -depth / 2,
      nose: -Math.PI / 4,
      lane: "aisle:north",
      laneX: X_AISLE_NORTH,
      heading: NORTH,
      // a car driving up the aisle meets the bay from the south
      sign: 1,
    },
    {
      name: "R",
      label: "right",
      x: AISLE.x1 + depth / 2,
      shift: depth / 2,
      nose: (Math.PI * 3) / 4,
      lane: "aisle:south",
      laneX: X_AISLE_SOUTH,
      heading: SOUTH,
      sign: -1,
    },
  ] as const;

  for (const row of rows) {
    for (let k = 0; k < ROADS.BAY_COUNT - 1; k += 1) {
      const centre = {
        x: row.x,
        z: ROADS.BAY_FIRST - (k + 0.5) * ROADS.BAY_STEP + row.shift,
      };
      const bay = `bay:${row.name}${k + 1}`;
      const parked = node(`${bay}:nose`, centre, row.nose);
      places.push({
        id: parked,
        label: `Angle bay ${k + 1}, ${row.label} row`,
        group: "angle_bay",
        starts: true,
        ends: true,
        occupied: isDressed(centre),
      });

      // where the bay's own line, carried back, crosses the lane beside it
      const laneZ = centre.z + row.sign * (Math.abs(row.laneX - centre.x) + 5);
      const meta = { road: "angle_bay", parking: true, bay } as const;
      const swingIn = curve(
        { x: row.laneX, z: laneZ },
        row.heading,
        centre,
        row.nose,
      );
      const from = near(row.lane, { x: row.laneX, z: laneZ });
      edge(from, parked, swingIn, {
        ...meta,
        maneuver: "park_forward",
        title: "Drive forward into the bay",
        why: "An angle bay is parked in nose first. The lines lean your way, so steer in early and stop with the whole car inside them.",
      });
      edge(parked, from, [...swingIn].reverse(), {
        ...meta,
        maneuver: "leave_reverse",
        gear: "reverse",
        title: "Reverse out of the bay",
        why: "You leave an angle bay in reverse. Look both ways down the aisle, reverse slowly until the car is straight in your lane, then stop and drive forward.",
      });
    }
  }

  // Flush parking, as it is examined: boxes painted at the kerb of the two-way
  // road, on the side going north. Drive forward past the box, then reverse
  // into it. Pull out forward.
  const box = (FLUSH.z1 - FLUSH.z0) / FLUSH.bays;
  for (let k = 0; k < FLUSH.bays; k += 1) {
    const centre = {
      x: (SIDE.x0 + FLUSH.x1) / 2,
      z: FLUSH.z0 + (k + 0.5) * box,
    };
    const bay = `flush:${k + 1}`;
    const parked = node(`${bay}:nose`, centre, NORTH);
    places.push({
      id: parked,
      label: `Flush parking bay ${k + 1}`,
      group: "flush_bay",
      starts: true,
      ends: true,
      occupied: isDressed(centre),
    });
    const meta = { road: "flush_bay", bay } as const;
    // far enough past the box that the car has room to come in straight
    const after = near("side:north", { x: X_NORTHBOUND, z: centre.z - 13 });
    const pullOut = curve(centre, NORTH, nodes.get(after) as NetNode, NORTH);
    edge(after, parked, [...pullOut].reverse(), {
      ...meta,
      maneuver: "park_reverse",
      gear: "reverse",
      title: "Reverse into the flush parking bay",
      why: "Flush parking is reversed into. Drive just past the box and stop. Check behind you, then reverse slowly back in to the kerb until the car is inside the box.",
    });
    edge(parked, after, pullOut, {
      ...meta,
      maneuver: "leave_forward",
      title: "Pull out of the flush parking bay",
      why: "Check behind you for traffic, then pull out forward into your lane.",
    });
  }

  // ---- join each lane's nodes up, start to end ----

  for (const def of lanes.values()) {
    const stops = [...def.stations.values()].sort((a, b) => a - b);
    for (let i = 0; i < stops.length - 1; i += 1) {
      const from = nodes.get(`${def.id}@${key(stops[i])}`) as NetNode;
      const to = nodes.get(`${def.id}@${key(stops[i + 1])}`) as NetNode;
      const control = def.marks.get(key(stops[i]));
      const words = FOLLOW[def.road](def.lane);
      edge(
        from.id,
        to.id,
        [from, to].map(({ x, z }) => ({ x, z })),
        {
          maneuver: "follow",
          road: def.road,
          lane: def.lane,
          parking: def.parking,
          control,
          title: control === "crossing" ? "Pedestrian crossing" : words.title,
          why: control ? CONTROL_WHY[control] : words.why,
        },
      );
    }
  }

  // ---- where a lesson can start and end: the ends of the roads at the frame ----

  const compass: Record<ArmId, string> = {
    S: "bottom",
    N: "top",
    W: "left",
    E: "right",
  };
  for (const id of ["S", "W", "N"] as const) {
    for (let n = 1; n <= ARMS[id].lanes; n += 1) {
      const name = `${ROAD_NAME[armRoad(id)]}, ${compass[id]} end, lane ${n}`;
      places.push(
        {
          id: station(laneId(id, "approach", n), 0),
          label: `From ${name}`,
          group: "road",
          starts: true,
          ends: false,
        },
        {
          id: last(laneId(id, "exit", n)),
          label: `To ${name}`,
          group: "road",
          starts: false,
          ends: true,
        },
      );
    }
  }
  places.push(
    {
      id: station("side:north", 0),
      label: "From the two-way road, bottom end",
      group: "road",
      starts: true,
      ends: false,
    },
    {
      id: last("side:north"),
      label: "To the two-way road, top end",
      group: "road",
      starts: false,
      ends: true,
    },
    {
      id: station("side:south", 0),
      label: "From the two-way road, top end",
      group: "road",
      starts: true,
      ends: false,
    },
    {
      id: last("side:south"),
      label: "To the two-way road, bottom end",
      group: "road",
      starts: false,
      ends: true,
    },
  );

  const out = new Map<string, NetEdge[]>();
  for (const id of nodes.keys()) out.set(id, []);
  for (const e of edges) out.get(e.from)?.push(e);
  const roadLanes: RoadLane[] = [...lanes.values()]
    .filter(
      (def) =>
        def.road === "two_way" || def.road === "street" || def.road === "aisle",
    )
    .map(({ a, heading, length, road }) => ({ a, heading, length, road }));
  return { roadLanes, nodes, edges, out, places };
}

let built: Network | null = null;

/** The whole board's lanes. Built once, the first time it is asked for. */
export function network(): Network {
  built ??= build();
  return built;
}

/** The node where a road's lane starts at the frame, for a task's start line. */
export function laneStart(arm: ArmId, lane: number): string {
  return `${arm}:in:${lane}@0.00`;
}

// ---- finding the way ---------------------------------------------------------------

export type RouteStep = {
  /** Metres along the route. */
  from: number;
  to: number;
  title: string;
  why: string;
  maneuver: Maneuver;
  road: Road;
  gear: Gear;
  control?: Control;
  confirmed: boolean;
  /** The part of the board to look at. */
  focus: Box;
};

export type Route = {
  edges: NetEdge[];
  points: Vec[];
  /** How far along the route each point is. */
  at: number[];
  /** The way the car faces at each point. */
  headings: number[];
  length: number;
  steps: RouteStep[];
  /** True when the route drives through the parking area. */
  throughParking: boolean;
  confirmed: boolean;
};

/** A lane change costs a little, so a route does not weave about. */
const CHANGE_COST = 4;
/** An unconfirmed connection is only used when it clearly helps. */
const UNSURE_COST = 6;

function bayOf(id: string): string | null {
  const m = /^(bay:[LR]\d+|flush:\d+):/.exec(id);
  return m ? m[1] : null;
}

function shortest(
  from: string,
  to: string,
  parking: boolean,
  arrive?: Maneuver,
): NetEdge[] | null {
  const net = network();
  if (!net.nodes.has(from) || !net.nodes.has(to)) return null;
  const bays = new Set([bayOf(from), bayOf(to)]);
  const cost = new Map<string, number>([[from, 0]]);
  const via = new Map<string, NetEdge>();
  const done = new Set<string>();
  for (;;) {
    let here: string | null = null;
    let best = Infinity;
    for (const [id, c] of cost) {
      if (!done.has(id) && c < best) {
        best = c;
        here = id;
      }
    }
    if (here === null) return null;
    if (here === to) break;
    done.add(here);
    for (const e of net.out.get(here) ?? []) {
      // a bay is somewhere to park, never a way through
      if (e.bay ? !bays.has(e.bay) : e.parking && !parking) continue;
      if (arrive && e.to === to && e.maneuver !== arrive) continue;
      const next =
        best +
        e.length +
        (e.maneuver === "lane_change" ? CHANGE_COST : 0) +
        (e.confirmed ? 0 : UNSURE_COST);
      if (next < (cost.get(e.to) ?? Infinity)) {
        cost.set(e.to, next);
        via.set(e.to, e);
      }
    }
  }
  const path: NetEdge[] = [];
  for (let id = to; id !== from; ) {
    const e = via.get(id);
    if (!e) return null;
    path.unshift(e);
    id = e.from;
  }
  return path;
}

function boxOf(points: Vec[], pad = 7): Box {
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const p of points) {
    x0 = Math.min(x0, p.x);
    x1 = Math.max(x1, p.x);
    z0 = Math.min(z0, p.z);
    z1 = Math.max(z1, p.z);
  }
  return { x0: x0 - pad, x1: x1 + pad, z0: z0 - pad, z1: z1 + pad };
}

/** A stretch of plain driving this short is not worth a step of its own. */
const STUB = 3;

/** Turn a run of edges into one line and the steps a learner reads. */
export function routeOf(edges: NetEdge[]): Route {
  const points: Vec[] = [];
  const at: number[] = [];
  /** The way the car faces on the piece of line after each point. */
  const facing: number[] = [];
  type Draft = RouteStep & { points: Vec[]; fromLane?: number };
  const steps: Draft[] = [];
  let length = 0;
  for (const e of edges) {
    const start = length;
    e.points.forEach((p, i) => {
      if (i === 0 && points.length > 0) return;
      if (points.length > 0) {
        const q = points[points.length - 1];
        length += Math.hypot(p.x - q.x, p.z - q.z);
        const travel = bearingOf(p.x - q.x, p.z - q.z);
        facing.push(e.gear === "reverse" ? wrapPi(travel + Math.PI) : travel);
      }
      points.push(p);
      at.push(length);
    });
    const prev = steps[steps.length - 1];
    const plain = e.maneuver === "follow" && !e.control;
    if (plain && prev && length - start < STUB) {
      // a few metres between two moves: part of the move before
      prev.to = length;
      prev.points.push(...e.points);
    } else if (
      plain &&
      prev?.maneuver === "follow" &&
      !prev.control &&
      prev.title === e.title
    ) {
      prev.to = length;
      prev.points.push(...e.points);
    } else if (
      e.maneuver === "lane_change" &&
      prev?.maneuver === "lane_change" &&
      prev.road === e.road
    ) {
      // one lane after another is one move across
      prev.to = length;
      prev.points.push(...e.points);
      prev.title = `Move across from lane ${prev.fromLane} to lane ${e.lane}`;
    } else {
      const fromLane =
        e.maneuver === "lane_change"
          ? Number(/lane (\d+) to/.exec(e.title)?.[1])
          : undefined;
      // a few metres before the first move: part of that move
      const lead =
        steps.length === 1 &&
        steps[0].maneuver === "follow" &&
        !steps[0].control &&
        steps[0].to - steps[0].from < STUB
          ? steps.pop()
          : undefined;
      steps.push({
        from: lead ? lead.from : start,
        to: length,
        title: e.title,
        why: e.why,
        maneuver: e.maneuver,
        road: e.road,
        gear: e.gear,
        control: e.control,
        confirmed: e.confirmed,
        focus: { x0: 0, x1: 0, z0: 0, z1: 0 },
        points: [...(lead?.points ?? []), ...e.points],
        fromLane,
      });
    }
  }
  // The car faces, at each point, halfway between the pieces either side of
  // it, so it turns steadily round a bend drawn in straight pieces.
  const headings = points.map((_, i) => {
    const before = facing[Math.max(0, i - 1)] ?? 0;
    const after = facing[Math.min(facing.length - 1, i)] ?? before;
    return wrapPi(before + wrapPi(after - before) / 2);
  });
  return {
    edges,
    points,
    at,
    headings,
    length,
    steps: steps.map(({ points: own, fromLane: _from, ...step }) => ({
      ...step,
      focus: boxOf(own),
    })),
    throughParking: edges.some((e) => e.parking && !e.bay),
    confirmed: edges.every((e) => e.confirmed),
  };
}

export type Plan = {
  /** The route to take, or null when there is no way there. */
  route: Route | null;
  /**
   * Which of the handbook's route rules picked it: the shortest correct route
   * that avoids the parking area, or the parking area as a last resort. A
   * route that starts or ends in the parking area has to use it.
   */
  rule: "shortest" | "last_resort" | "parking";
  /**
   * A shorter way that cuts through the parking area, when there is one. It is
   * the wrong answer, and worth showing as such.
   */
  shortcut: Route | null;
};

const inParking = (id: string) =>
  id.startsWith("bay:") || id.startsWith("aisle:");

/**
 * The way from one place to another, by the handbook's route rules: the
 * shortest correct route avoiding the parking area, and the parking area only
 * when nothing else gets there.
 */
export function planRoute(
  from: string,
  to: string,
  /** Insist on how the route ends, such as reversing into a bay. */
  arrive?: Maneuver,
): Plan {
  if (inParking(from) || inParking(to)) {
    const edges = shortest(from, to, true, arrive);
    return {
      route: edges ? routeOf(edges) : null,
      rule: "parking",
      shortcut: null,
    };
  }
  const clear = shortest(from, to, false, arrive);
  const through = shortest(from, to, true, arrive);
  if (!clear) {
    return {
      route: through ? routeOf(through) : null,
      rule: "last_resort",
      shortcut: null,
    };
  }
  const route = routeOf(clear);
  const cut = through ? routeOf(through) : null;
  return {
    route,
    rule: "shortest",
    shortcut:
      cut && cut.throughParking && cut.length < route.length - 1 ? cut : null,
  };
}

export type Pose = {
  x: number;
  z: number;
  /** The way the car faces, which is against its travel when reversing. */
  heading: number;
  reversing: boolean;
  /** The step of the route this point is in. */
  step: number;
};

/** Where the car is, `distance` metres along a route. */
export function poseAt(route: Route, distance: number): Pose {
  const d = Math.min(route.length, Math.max(0, distance));
  let lo = 0;
  let hi = route.at.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (route.at[mid] <= d) lo = mid;
    else hi = mid;
  }
  const a = route.points[lo];
  const b = route.points[hi];
  const span = route.at[hi] - route.at[lo];
  const t = span > 0 ? (d - route.at[lo]) / span : 0;
  let step = route.steps.findIndex((s) => d < s.to);
  if (step < 0) step = route.steps.length - 1;
  const reversing = route.steps[step]?.gear === "reverse";
  const turn = wrapPi(route.headings[hi] - route.headings[lo]);
  return {
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
    heading: wrapPi(route.headings[lo] + turn * t),
    reversing,
    step,
  };
}

/** The piece of a route's line that one of its steps covers. */
export function stepPoints(route: Route, index: number): Vec[] {
  const step = route.steps[index];
  if (!step) return [];
  const first = poseAt(route, step.from);
  const last = poseAt(route, step.to);
  const inside = route.points.filter(
    (_, i) => route.at[i] > step.from && route.at[i] < step.to,
  );
  return [{ x: first.x, z: first.z }, ...inside, { x: last.x, z: last.z }];
}

/** The node at the start or the end of one of a road's lanes. */
export function laneNode(
  arm: ArmId,
  side: Side,
  lane: number,
  end: "start" | "end",
): string {
  const prefix = `${arm}:${side === "approach" ? "in" : "out"}:${lane}@`;
  let best: string | null = null;
  let bestD = end === "start" ? Infinity : -Infinity;
  for (const id of network().nodes.keys()) {
    if (!id.startsWith(prefix)) continue;
    const d = Number(id.slice(prefix.length));
    if (end === "start" ? d < bestD : d > bestD) {
      bestD = d;
      best = id;
    }
  }
  if (!best) throw new Error(`no lane ${prefix}`);
  return best;
}

/** How far along a route its nearest point to `p` is. */
export function distanceNear(route: Route, p: Vec): number {
  let best = 0;
  let gap = Infinity;
  for (let i = 0; i < route.points.length - 1; i += 1) {
    const a = route.points[i];
    const b = route.points[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const span = dx * dx + dz * dz;
    const t =
      span > 0
        ? Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.z - a.z) * dz) / span))
        : 0;
    const d = Math.hypot(a.x + dx * t - p.x, a.z + dz * t - p.z);
    if (d < gap) {
      gap = d;
      best = route.at[i] + (route.at[i + 1] - route.at[i]) * t;
    }
  }
  return best;
}

/** Part of a route, from one distance along it to another. */
export function trimRoute(route: Route, from: number, to: number): Route {
  const a = Math.max(0, Math.min(from, route.length));
  const b = Math.max(a, Math.min(to, route.length));
  const first = poseAt(route, a);
  const last = poseAt(route, b);
  const points: Vec[] = [{ x: first.x, z: first.z }];
  const at = [0];
  const headings = [first.heading];
  route.points.forEach((p, i) => {
    if (route.at[i] <= a + 0.01 || route.at[i] >= b - 0.01) return;
    points.push(p);
    at.push(route.at[i] - a);
    headings.push(route.headings[i]);
  });
  points.push({ x: last.x, z: last.z });
  at.push(b - a);
  headings.push(last.heading);
  return {
    ...route,
    points,
    at,
    headings,
    length: b - a,
    steps: route.steps
      .filter((step) => step.to > a + 0.5 && step.from < b - 0.5)
      .map((step) => ({
        ...step,
        from: Math.max(0, step.from - a),
        to: Math.min(b, step.to) - a,
      })),
  };
}

/** The plain driving that leads on from a node, lane after lane, up to `reach` metres. */
export function followFrom(node: string, reach = Infinity): NetEdge[] {
  const net = network();
  const out: NetEdge[] = [];
  let here = node;
  let gone = 0;
  for (;;) {
    const next = (net.out.get(here) ?? []).find((e) => e.maneuver === "follow");
    if (!next || gone >= reach) return out;
    out.push(next);
    gone += next.length;
    here = next.to;
  }
}

/** A sign shows from this far before its paint, in metres. */
const CONTROL_AHEAD = 18;

let controlled: NetEdge[] | null = null;

/**
 * The give way line, stop line or pedestrian crossing a car at this spot is
 * coming up to, or is on, if there is one. It goes by where the car is and the
 * way it faces, so it works anywhere on the board, in any task.
 */
export function controlAhead(
  x: number,
  z: number,
  heading: number,
): Control | null {
  controlled ??= network().edges.filter((e) => e.control);
  const net = network();
  let best: { control: Control; gap: number } | null = null;
  for (const e of controlled) {
    const from = net.nodes.get(e.from);
    if (!from || !e.control) continue;
    // on the stretch itself: in the turn, or on the crossing
    // A turn's last stretch lies along the lane it joins, where other cars
    // drive by that are not turning at all, so that part does not count.
    const upTo =
      e.maneuver === "follow"
        ? e.points.length
        : Math.ceil(e.points.length * 0.55);
    let on = Infinity;
    for (let i = 1; i < upTo; i += 1) {
      const p = e.points[i];
      const q = e.points[i - 1];
      // only a car going the way the turn goes is making the turn
      const way = bearingOf(p.x - q.x, p.z - q.z);
      if (Math.abs(wrapPi(heading - way)) > (40 * Math.PI) / 180) continue;
      on = Math.min(on, Math.hypot(p.x - x, p.z - z));
    }
    // a crossing is two points a few metres apart: measure to the line between
    if (e.maneuver === "follow") {
      const a = e.points[0];
      const b = e.points[e.points.length - 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const t = Math.min(
        1,
        Math.max(0, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)),
      );
      on = Math.hypot(a.x + dx * t - x, a.z + dz * t - z);
    }
    let gap = on < 2 ? 0 : Infinity;
    // coming up to it along its own lane, facing the right way. Turning back
    // through the reserve only counts once the car is in the gap.
    if (gap > 0 && e.maneuver !== "u_turn") {
      const dir = dirOf(from.heading);
      const ahead = (from.x - x) * dir.x + (from.z - z) * dir.z;
      const aside = Math.abs((from.x - x) * -dir.z + (from.z - z) * dir.x);
      if (
        ahead >= 0 &&
        ahead < CONTROL_AHEAD &&
        aside < 2.4 &&
        Math.abs(wrapPi(heading - from.heading)) < Math.PI / 3
      ) {
        gap = ahead;
      }
    }
    if (gap < (best?.gap ?? Infinity)) best = { control: e.control, gap };
  }
  return best?.control ?? null;
}
