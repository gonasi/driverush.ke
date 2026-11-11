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
  exitLanes,
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
  roundaboutWay,
  routeOf,
  trimRoute,
  type Maneuver,
  type Plan,
  type Route,
} from "./network";
import { parkingLayout, targetBays } from "./parking-layouts";

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

/**
 * The handbook's angle for each turn. Left and right are both 90°. The
 * innermost lane reaches the left exit and the straight-on exit the long way
 * round, which the handbook counts as 270° and 360°.
 */
export const TURN_DEGREES: Record<Turn, number> = {
  straight: 0,
  right: 90,
  back: 180,
  left: 90,
};
const LONG_WAY_DEGREES: Partial<Record<Turn, number>> = {
  left: 270,
  straight: 360,
};

export type LaneOption = {
  /** One per way through, for a list key. */
  id: string;
  turn: Turn;
  /** The lane of the road out that this way through ends in. */
  exitLane: number;
  label: string;
  /** The handbook's angle for it, such as "90°". */
  degrees: string;
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
  const lanes = ARMS[arm].lanes;
  for (const turn of allowedTurns(lanes, lane)) {
    const outs = exitLanes(lanes, lane, turn, ARMS[armForTurn(arm, turn)].lanes);
    for (const exitLane of outs) {
      const name = roundaboutWay(arm, lane, turn, exitLane);
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
      // The innermost lane reaches the left and straight-on exits the long
      // way round, which the handbook counts as 270° and 360°.
      const inner = lane === lanes && lane > 2;
      const longWay =
        inner && (turn === "left" || (turn === "straight" && lanes === 4));
      const degrees =
        (longWay ? LONG_WAY_DEGREES[turn] : undefined) ?? TURN_DEGREES[turn];
      options.push({
        id: name,
        turn,
        exitLane,
        label:
          outs.length > 1
            ? `${TURN_LABEL[turn]}, into lane ${exitLane}`
            : longWay
              ? `${TURN_LABEL[turn]}, the long way round`
              : TURN_LABEL[turn],
        degrees: `${degrees}°`,
        color: TURN_COLOR[turn],
        route,
        confirmed: route.confirmed,
      });
    }
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

/**
 * A parking lesson ends or starts in the farthest free bay, which depends on
 * where the parked cars are standing.
 */
const ANGLE_BAY = "@angle";
const FLUSH_BAY = "@flush";

function placeLabel(label: string): string {
  if (label === ANGLE_BAY) return targetBays().angle;
  if (label === FLUSH_BAY) return targetBays().flush;
  return label;
}

/** Routes that depend on the parked cars are kept per layout. */
const layoutKey = (id: string, parking: boolean) =>
  parking ? `${id}|${parkingLayout().id}` : id;

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
    title: "In the wrong lane, with room to move",
    ask: "You are in lane 2, back where the lines are broken, and you are asked to turn left.",
    from: `From ${DUAL_BOTTOM}, lane 2`,
    to: `To ${THREE_LEFT}, lane 1`,
  },
  {
    id: "long-way-round",
    group: "routes",
    level: "Hard",
    title: "Rule 2: the long way round",
    ask: "You are in lane 2 at the continuous lines and you are asked to turn left. Lane 2 only goes straight, so the short way is blocked.",
    from: `At the continuous lines on ${DUAL_BOTTOM}, lane 2`,
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
    ask: "From the top of the dual carriageway, park in the angle parking, nose first, in the farthest free bay.",
    from: `From ${DUAL_TOP}, lane 1`,
    to: ANGLE_BAY,
  },
  {
    id: "leave-angle-reverse",
    group: "parking",
    level: "Medium",
    title: "Reverse out of an angle bay",
    ask: "You are parked nose in. Leave the parking area for the two-way road.",
    from: ANGLE_BAY,
    to: `To ${TWO_WAY_TOP}`,
  },
  {
    id: "park-flush-reverse",
    group: "parking",
    level: "Medium",
    title: "Reverse into flush parking",
    ask: "From the bottom of the two-way road, drive past the farthest free flush parking box and reverse into it.",
    from: `From ${TWO_WAY_BOTTOM}`,
    to: FLUSH_BAY,
  },
  {
    id: "leave-flush",
    group: "parking",
    level: "Easy",
    title: "Pull out of flush parking",
    ask: "You are in the flush parking. Carry on up the two-way road.",
    from: FLUSH_BAY,
    to: `To ${TWO_WAY_TOP}`,
  },
];

const lessonCache = new Map<string, Plan | null>();

/** The route for a lesson, with the route rule that picked it. */
export function lessonPlan(lesson: Lesson): Plan | null {
  const key = layoutKey(lesson.id, lesson.group === "parking");
  if (lessonCache.has(key)) return lessonCache.get(key) ?? null;
  const places = network().places;
  const from = places.find((p) => p.label === placeLabel(lesson.from));
  const to = places.find((p) => p.label === placeLabel(lesson.to));
  const plan = from && to ? planRoute(from.id, to.id, lesson.arrive) : null;
  lessonCache.set(key, plan);
  return plan;
}

export function lessonRoute(lesson: Lesson): Route | null {
  return lessonPlan(lesson)?.route ?? null;
}

/** The handbook's three route rules, in the order they are tried. */
export const ROUTE_RULES: Record<Plan["rule"], { name: string; says: string }> =
  {
    shortest: {
      name: "Rule 1",
      says: "The shortest correct route, without using the parking area.",
    },
    longest: {
      name: "Rule 2",
      says: "The longest correct route. A continuous line blocks the short way from this lane, so you go the long way round, still without using the parking area.",
    },
    last_resort: {
      name: "Rule 3",
      says: "The parking area, only because there is no other route.",
    },
    parking: {
      name: "Parking",
      says: "This route starts or ends in the parking area, so it has to use it.",
    },
  };

// ---- the right way through a driving task ---------------------------------------------

const taskCache = new Map<string, Route | null>();
const START_IN = 6;
const STOP_SHORT = 8;
/** A route task that ends on a road is passed by stopping in its last stretch. */
export const ROAD_BOX = 12;

/** The line a task should be driven along, from its start line to its green box. */
export function challengeRoute(challenge: BoardChallenge): Route | null {
  if (isRouteTask(challenge)) {
    const lesson = LESSONS.find((l) => l.id === challenge.lesson);
    const key = layoutKey(challenge.id, lesson?.group === "parking");
    if (taskCache.has(key)) return taskCache.get(key) ?? null;
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
    taskCache.set(key, route);
    return route;
  }
  if (taskCache.has(challenge.id)) return taskCache.get(challenge.id) ?? null;
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
