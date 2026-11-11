/**
 * What Learn mode teaches, worked out from the lane network: where each lane of
 * each road into the roundabout can take you, routes across the whole board,
 * parking, and the right way through each driving task.
 */
import { isRouteTask, type BoardChallenge } from "./challenges";
import { goalBox, type Box } from "./full-board";
import {
  ARMS,
  allowedTurns,
  armForTurn,
  laneBearing,
  lanePoint,
  lanesForTurn,
  type ArmId,
  type Turn,
} from "./geometry";
import {
  distanceNear,
  followFrom,
  laneNode,
  network,
  planRoute,
  poseAt,
  routeOf,
  trimRoute,
  type Maneuver,
  type Route,
} from "./network";

// ---- where each lane can take you ---------------------------------------------------

export const TURN_LABEL: Record<Turn, string> = {
  left: "Turn left",
  straight: "Go straight",
  right: "Turn right",
  back: "Come back",
};

/** One colour per way out, the same everywhere a route is drawn. */
export const TURN_COLOR: Record<Turn, string> = {
  left: "#38bdf8",
  straight: "#fde047",
  right: "#fb923c",
  back: "#e879f9",
};
export const ROUTE_COLOR = "#fde047";
export const REVERSE_COLOR = "#f87171";

export const APPROACHES: readonly { arm: ArmId; label: string; road: string }[] =
  [
    { arm: "S", label: "Bottom", road: "Dual carriageway" },
    { arm: "N", label: "Top", road: "Dual carriageway" },
    { arm: "W", label: "Left", road: "Three-lane road" },
    { arm: "E", label: "Right", road: "Three-lane road" },
  ];

export type LaneOption = {
  turn: Turn;
  label: string;
  color: string;
  route: Route;
  confirmed: boolean;
};

const optionCache = new Map<string, LaneOption[]>();

/** Every turn one approach lane may make, each with the line a car follows. */
export function laneOptions(arm: ArmId, lane: number): LaneOption[] {
  const key = `${arm}${lane}`;
  const cached = optionCache.get(key);
  if (cached) return cached;
  const net = network();
  const lead = followFrom(laneNode(arm, "approach", lane, "start"));
  const options: LaneOption[] = [];
  for (const turn of allowedTurns(ARMS[arm].lanes, lane)) {
    const name = `rb:${arm}${lane}:${turn}`;
    const through = ["hold_lane", "ring", "exit"].map((maneuver) =>
      net.edges.find(
        (e) =>
          e.maneuver === maneuver &&
          (e.to === `${name}:on` ||
            e.from === `${name}:on` ||
            e.from === `${name}:off`) &&
          (maneuver !== "ring" || e.to === `${name}:off`),
      ),
    );
    if (through.some((e) => !e)) continue;
    const last = through[2];
    if (!last) continue;
    const route = routeOf([
      ...lead,
      ...(through as NonNullable<(typeof through)[number]>[]),
      ...followFrom(last.to, 26),
    ]);
    options.push({
      turn,
      label: TURN_LABEL[turn],
      color: TURN_COLOR[turn],
      route,
      confirmed: route.confirmed,
    });
  }
  // left first, then straight, right, back: the order of the exits
  const order: Turn[] = ["left", "straight", "right", "back"];
  options.sort((a, b) => order.indexOf(a.turn) - order.indexOf(b.turn));
  optionCache.set(key, options);
  return options;
}

// ---- routes across the board, and parking --------------------------------------------

export type LessonLevel = "Easy" | "Medium" | "Hard";

export type Lesson = {
  id: string;
  group: "routes" | "parking";
  level: LessonLevel;
  title: string;
  /** What the examiner might say. */
  ask: string;
  from: string;
  to: string;
  /** How the route has to end, where there is more than one way. */
  arrive?: Maneuver;
};

const DUAL_BOTTOM = "the dual carriageway, bottom end";
const DUAL_TOP = "the dual carriageway, top end";
const THREE_LEFT = "the three-lane road, left end";
const TWO_WAY_TOP = "the two-way road, top end";
const TWO_WAY_BOTTOM = "the two-way road, bottom end";

export const LESSONS: readonly Lesson[] = [
  {
    id: "straight-over",
    group: "routes",
    level: "Easy",
    title: "Straight over the roundabout",
    ask: "From the bottom of the dual carriageway, go straight on.",
    from: `From ${DUAL_BOTTOM}, lane 2`,
    to: `To ${DUAL_TOP}, lane 2`,
  },
  {
    id: "first-exit",
    group: "routes",
    level: "Easy",
    title: "Left at the roundabout",
    ask: "From the bottom of the dual carriageway, turn left.",
    from: `From ${DUAL_BOTTOM}, lane 1`,
    to: `To ${THREE_LEFT}, lane 1`,
  },
  {
    id: "wrong-lane",
    group: "routes",
    level: "Easy",
    title: "In the wrong lane for the turn",
    ask: "You are in lane 2 and you are asked to turn left.",
    from: `From ${DUAL_BOTTOM}, lane 2`,
    to: `To ${THREE_LEFT}, lane 1`,
  },
  {
    id: "come-back",
    group: "routes",
    level: "Medium",
    title: "Right round and back",
    ask: "From the bottom of the dual carriageway, come back the way you came.",
    from: `From ${DUAL_BOTTOM}, lane 3`,
    to: `To ${DUAL_BOTTOM}, lane 4`,
  },
  {
    id: "right-to-two-way",
    group: "routes",
    level: "Medium",
    title: "Right, then onto the two-way road",
    ask: "From the bottom of the dual carriageway, reach the bottom of the two-way road.",
    from: `From ${DUAL_BOTTOM}, lane 2`,
    to: `To ${TWO_WAY_BOTTOM}`,
  },
  {
    id: "street",
    group: "routes",
    level: "Medium",
    title: "Down the street to the two-way road",
    ask: "From the top of the dual carriageway, reach the top of the two-way road.",
    from: `From ${DUAL_TOP}, lane 3`,
    to: `To ${TWO_WAY_TOP}`,
  },
  {
    id: "two-way-to-dual",
    group: "routes",
    level: "Medium",
    title: "From the two-way road to the dual carriageway",
    ask: "From the bottom of the two-way road, reach the bottom of the dual carriageway.",
    from: `From ${TWO_WAY_BOTTOM}`,
    to: `To ${DUAL_BOTTOM}, lane 1`,
  },
  {
    id: "across-town",
    group: "routes",
    level: "Hard",
    title: "Across the board",
    ask: "From the left end of the three-lane road, reach the top of the two-way road.",
    from: `From ${THREE_LEFT}, lane 1`,
    to: `To ${TWO_WAY_TOP}`,
  },
  {
    id: "round-the-block",
    group: "routes",
    level: "Hard",
    title: "Round the block and back north",
    ask: "From the top of the two-way road, reach the top of the dual carriageway.",
    from: `From ${TWO_WAY_TOP}`,
    to: `To ${DUAL_TOP}, lane 1`,
  },
  {
    id: "park-angle",
    group: "parking",
    level: "Easy",
    title: "Drive into an angle bay",
    ask: "From the top of the dual carriageway, park in the angle parking, nose in.",
    from: `From ${DUAL_TOP}, lane 1`,
    to: "Angle bay 3, right row, nose in",
  },
  {
    id: "leave-angle-reverse",
    group: "parking",
    level: "Medium",
    title: "Reverse out of an angle bay",
    ask: "You are parked nose in. Leave the parking area for the two-way road.",
    from: "Angle bay 3, right row, nose in",
    to: `To ${TWO_WAY_TOP}`,
  },
  {
    id: "park-angle-reverse",
    group: "parking",
    level: "Hard",
    title: "Reverse into an angle bay",
    ask: "From the top of the dual carriageway, reverse into the angle parking.",
    from: `From ${DUAL_TOP}, lane 1`,
    to: "Angle bay 3, left row, reversed in",
  },
  {
    id: "leave-angle-forward",
    group: "parking",
    level: "Easy",
    title: "Drive out of a bay you reversed into",
    ask: "You reversed in. Leave the parking area for the two-way road.",
    from: "Angle bay 3, left row, reversed in",
    to: `To ${TWO_WAY_TOP}`,
  },
  {
    id: "park-flush",
    group: "parking",
    level: "Easy",
    title: "Drive into flush parking",
    ask: "From the bottom of the two-way road, park in the flush parking.",
    from: `From ${TWO_WAY_BOTTOM}`,
    to: "Flush parking bay 1",
    arrive: "park_forward",
  },
  {
    id: "park-flush-reverse",
    group: "parking",
    level: "Medium",
    title: "Reverse into flush parking",
    ask: "From the bottom of the two-way road, reverse into the flush parking.",
    from: `From ${TWO_WAY_BOTTOM}`,
    to: "Flush parking bay 1",
    arrive: "park_reverse",
  },
  {
    id: "leave-flush",
    group: "parking",
    level: "Easy",
    title: "Pull out of flush parking",
    ask: "You are in the flush parking. Carry on up the two-way road.",
    from: "Flush parking bay 1",
    to: `To ${TWO_WAY_TOP}`,
  },
];

const lessonCache = new Map<string, Route | null>();

export function lessonRoute(lesson: Lesson): Route | null {
  if (lessonCache.has(lesson.id)) return lessonCache.get(lesson.id) ?? null;
  const places = network().places;
  const from = places.find((p) => p.label === lesson.from);
  const to = places.find((p) => p.label === lesson.to);
  const route =
    from && to ? planRoute(from.id, to.id, lesson.arrive).route : null;
  lessonCache.set(lesson.id, route);
  return route;
}

// ---- the right way through a driving task ---------------------------------------------

const taskCache = new Map<string, Route | null>();
const START_IN = 6;
const STOP_SHORT = 8;
/** A route task that ends on a road is passed by stopping in its last stretch. */
export const ROAD_BOX = 12;

/** The line a task should be driven along, from its start line to its green box. */
export function challengeRoute(challenge: BoardChallenge): Route | null {
  if (taskCache.has(challenge.id)) return taskCache.get(challenge.id) ?? null;
  if (isRouteTask(challenge)) {
    const lesson = LESSONS.find((l) => l.id === challenge.lesson);
    const whole = lesson ? lessonRoute(lesson) : null;
    // A road's end is the frame of the board: start a car's length in from
    // it, and stop short of it.
    const route =
      lesson && whole
        ? trimRoute(
            whole,
            lesson.from.startsWith("From ") ? START_IN : 0,
            lesson.to.startsWith("To ") ? whole.length - STOP_SHORT : whole.length,
          )
        : null;
    taskCache.set(challenge.id, route);
    return route;
  }
  const { start, goal, turn } = challenge;
  const from = laneNode(start.arm, "approach", start.lane, "start");
  let to: string;
  if (goal.side === "approach") {
    // back through a gap in the reserve, into the lane beside it
    to = laneNode(goal.arm, "approach", ARMS[goal.arm].lanes, "end");
  } else {
    const exit = armForTurn(start.arm, turn);
    const lanes = lanesForTurn(ARMS[start.arm].lanes, turn);
    const best = lanes.reduce((a, b) =>
      Math.abs(b - start.lane) < Math.abs(a - start.lane) ? b : a,
    );
    to = laneNode(
      exit,
      "exit",
      goal.lane ?? Math.min(best, ARMS[exit].lanes),
      "end",
    );
  }
  const whole = planRoute(from, to).route;
  let route: Route | null = null;
  if (whole) {
    const box = goalBox(goal);
    const begin = distanceNear(
      whole,
      lanePoint(start.arm, "approach", start.lane, start.along),
    );
    const end = distanceNear(whole, {
      x: (box.x0 + box.x1) / 2,
      z: (box.z0 + box.z1) / 2,
    });
    route = trimRoute(whole, begin, end);
  }
  taskCache.set(challenge.id, route);
  return route;
}

/** True when a task ends in a parking bay and not on a road. */
export function taskParks(challenge: BoardChallenge): boolean {
  if (!isRouteTask(challenge)) return false;
  const lesson = LESSONS.find((l) => l.id === challenge.lesson);
  return Boolean(lesson && !lesson.to.startsWith("To "));
}

/** Where a task's car starts, and the way it faces. */
export function taskStart(challenge: BoardChallenge): {
  x: number;
  z: number;
  heading: number;
} {
  if (isRouteTask(challenge)) {
    const route = challengeRoute(challenge);
    if (route) {
      const { x, z, heading } = poseAt(route, 0);
      return { x, z, heading };
    }
    return { x: 0, z: 40, heading: 0 };
  }
  const { arm, lane, along } = challenge.start;
  return {
    ...lanePoint(arm, "approach", lane, along),
    heading: laneBearing(arm, "approach"),
  };
}

/** The green box a task ends in, for drawing flat or on the table. */
export function taskGoalBox(challenge: BoardChallenge): Box {
  if (!isRouteTask(challenge)) return goalBox(challenge.goal);
  const route = challengeRoute(challenge);
  if (!route) return { x0: -2, x1: 2, z0: -2, z1: 2 };
  const end = route.points[route.points.length - 1];
  if (taskParks(challenge)) {
    return { x0: end.x - 2.4, x1: end.x + 2.4, z0: end.z - 2.4, z1: end.z + 2.4 };
  }
  const tail = route.points.filter(
    (_, i) => route.at[i] >= route.length - ROAD_BOX,
  );
  const xs = tail.map((p) => p.x);
  const zs = tail.map((p) => p.z);
  const pad = 1.7;
  return {
    x0: Math.min(...xs) - pad,
    x1: Math.max(...xs) + pad,
    z0: Math.min(...zs) - pad,
    z1: Math.max(...zs) + pad,
  };
}
