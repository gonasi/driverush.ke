/**
 * Blocked roads. An instructor closes a way on the board by turning a toy car
 * upside down on it: a lane, an exit of the roundabout, a gap in the reserve, a
 * whole road, the way into the parking. The learner then has to find the next
 * correct route.
 *
 * A block is a line across what is closed, with one or more upside-down cars
 * standing on it. Every piece of the lane network that crosses the line, or
 * that a car could not drive without touching one of those cars, is closed
 * (`closedEdges`), and the route finder plans round it by the same three route
 * rules as always. A block never makes crossing a continuous line legal, and it
 * never allows a lane change on the roundabout.
 *
 * Every block is placed from the board's own numbers, never typed in.
 *
 * Pure data, no three.js.
 */
import { CAR } from "./car";
import { ROADS, U_TURN_GAPS } from "./full-board";
import {
  ARMS,
  LANE_W,
  RING_LANES,
  SOLID_ZONE,
  bearingOf,
  dirOf,
  laneBearing,
  lanePoint,
  leftOf,
  ringRadius,
  wrapPi,
  type Vec,
} from "./geometry";
import { EXIT_FROM, network, type NetEdge } from "./network";

export type BlockCar = { x: number; z: number; heading: number };

export type Block = {
  id: string;
  /** What is closed, as the learner would say it: "the first gap". */
  what: string;
  /** The line across what is closed. */
  line: readonly [Vec, Vec];
  /** The upside-down cars standing on it. */
  cars: readonly BlockCar[];
};

/** A car cannot get through a space narrower than this. */
const SQUEEZE = CAR.width - 0.2;

/**
 * Close a width of road at `mid`, where traffic faces `heading`. A single lane
 * takes one car standing along it. Anything wider takes cars set across it,
 * as few as leave no room to squeeze past.
 */
function across(mid: Vec, heading: number, width: number) {
  const side = leftOf(dirOf(heading));
  const at = (t: number): Vec => ({
    x: mid.x + side.x * t,
    z: mid.z + side.z * t,
  });
  const line = [at(-width / 2), at(width / 2)] as const;
  if (width < CAR.length + 1) {
    return { line, cars: [{ ...mid, heading }] };
  }
  const count = Math.max(
    1,
    Math.ceil((width - SQUEEZE) / (CAR.length + SQUEEZE)),
  );
  const gap = (width - count * CAR.length) / (count + 1);
  const cars: BlockCar[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = -width / 2 + gap + CAR.length / 2 + i * (CAR.length + gap);
    cars.push({ ...at(t), heading: wrapPi(heading + Math.PI / 2) });
  }
  return { line, cars };
}

const { STREET } = ROADS;

function build(): Block[] {
  const blocks: Block[] = [];

  // One lane of the dual carriageway: lane 4, a little before its lines turn
  // continuous, so a car has to have left the lane by then.
  blocks.push({
    id: "lane",
    what: `lane ${ARMS.S.lanes}`,
    ...across(
      lanePoint("S", "approach", ARMS.S.lanes, SOLID_ZONE + 6),
      laneBearing("S", "approach"),
      LANE_W,
    ),
  });

  // The right-hand exit of the roundabout, seen from the bottom of the board:
  // all three lanes leaving for the two-way road.
  {
    const along = EXIT_FROM + 3;
    const a = lanePoint("E", "exit", 1, along);
    const b = lanePoint("E", "exit", ARMS.E.lanes, along);
    blocks.push({
      id: "exit",
      what: "the exit on the right",
      ...across(
        { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 },
        laneBearing("E", "exit"),
        ARMS.E.lanes * LANE_W,
      ),
    });
  }

  // The first gap in the central reserve. The car stands in the gap, along the
  // road, and the line runs the length of the gap.
  {
    const gap = U_TURN_GAPS[0];
    const mid = (gap.from + gap.to) / 2;
    const out = ARMS.N.out;
    const at = (along: number): Vec => ({ x: out.x * along, z: out.z * along });
    blocks.push({
      id: "gap",
      what: "the first gap in the central reserve",
      line: [at(gap.from), at(gap.to)],
      cars: [{ ...at(mid), heading: bearingOf(out.x, out.z) }],
    });
  }

  // One lane on the roundabout: lane 4, beside the island, between the
  // left-hand road and the top one. Nothing that came in from the bottom road
  // can go on round in that lane.
  {
    const bearing = -Math.PI / 4;
    const r = ringRadius(RING_LANES);
    const out = dirOf(bearing);
    blocks.push({
      id: "ring",
      what: `lane ${RING_LANES} on the roundabout`,
      ...across(
        { x: out.x * r, z: out.z * r },
        // traffic goes round clockwise
        wrapPi(bearing + Math.PI / 2),
        LANE_W,
      ),
    });
  }

  // The street, on the side that leaves the dual carriageway.
  {
    const half = (STREET.z1 - STREET.z0) / 2;
    blocks.push({
      id: "street",
      what: "the street",
      ...across({ x: 30, z: STREET.z0 + half / 2 }, bearingOf(1, 0), half),
    });
  }

  // The way into the parking for a car coming along the street from the dual
  // carriageway. The car stands on the turn itself, so the aisle can still be
  // reached from the other end of the street.
  {
    const turn = network().edges.find(
      (e) => e.from.startsWith("street:east@") && e.to === "aisle:south@0.00",
    );
    if (turn) {
      const i = Math.floor(turn.points.length * 0.45);
      const p = turn.points[i];
      const q = turn.points[i + 1] ?? turn.points[i - 1];
      const sign = turn.points[i + 1] ? 1 : -1;
      const heading = bearingOf((q.x - p.x) * sign, (q.z - p.z) * sign);
      blocks.push({
        id: "parking",
        what: "the turn into the parking",
        ...across(p, heading, LANE_W),
      });
    }
  }

  return blocks;
}

let built: Block[] | null = null;

export function blocks(): readonly Block[] {
  built ??= build();
  return built;
}

export function blockById(id: string): Block | undefined {
  return blocks().find((b) => b.id === id);
}

/** Do two stretches of line cross? */
function crosses(a: Vec, b: Vec, c: Vec, d: Vec): boolean {
  const side = (p: Vec, q: Vec, r: Vec) =>
    (q.x - p.x) * (r.z - p.z) - (q.z - p.z) * (r.x - p.x);
  const d1 = side(c, d, a);
  const d2 = side(c, d, b);
  const d3 = side(a, b, c);
  const d4 = side(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** A car driving here would be touching the upside-down car. */
const REACH_ALONG = CAR.length / 2 + CAR.width / 2 + 0.3;
const REACH_ACROSS = CAR.width + 0.3;

/** Is this point too near one of the block's cars to drive through? */
export function touchesBlock(block: Block, p: Vec): boolean {
  return block.cars.some((car) => {
    const dir = dirOf(car.heading);
    const dx = p.x - car.x;
    const dz = p.z - car.z;
    const along = dx * dir.x + dz * dir.z;
    const side = dx * dir.z - dz * dir.x;
    return Math.abs(along) < REACH_ALONG && Math.abs(side) < REACH_ACROSS;
  });
}

const closedCache = new Map<string, ReadonlySet<NetEdge>>();

/** Every piece of the lane network this block closes. */
export function closedEdges(block: Block): ReadonlySet<NetEdge> {
  const kept = closedCache.get(block.id);
  if (kept) return kept;
  const closed = new Set<NetEdge>();
  const [a, b] = block.line;
  for (const e of network().edges) {
    for (let i = 1; i < e.points.length; i += 1) {
      const p = e.points[i - 1];
      const q = e.points[i];
      let hit = crosses(p, q, a, b);
      // walk the piece half a metre at a time
      const steps = Math.max(
        1,
        Math.ceil(Math.hypot(q.x - p.x, q.z - p.z) * 2),
      );
      for (let s = 0; s <= steps && !hit; s += 1) {
        const t = s / steps;
        hit = touchesBlock(block, {
          x: p.x + (q.x - p.x) * t,
          z: p.z + (q.z - p.z) * t,
        });
      }
      if (hit) {
        closed.add(e);
        break;
      }
    }
  }
  closedCache.set(block.id, closed);
  return closed;
}
