/**
 * The rules of the road, judged from where the car is and nothing else: no
 * task, no route. Both referees run this every step, so a car that has left
 * its task's route and is roaming the board is still held to every rule here.
 *
 * It ends the attempt for crossing or driving along a continuous line,
 * changing lanes on the roundabout, leaving it by an exit its lane cannot
 * take or in the wrong lane, going all the way round from an outer lane,
 * turning back through a gap from the wrong lane, driving against the
 * traffic, and running a stop line. It takes a star for bumping a kerb, the
 * reserve or the island, and for standing on the roundabout or on a
 * pedestrian crossing.
 *
 * Where the car goes is not judged here. That is the task's business.
 */
import type { CarState } from "./car";
import { ROADS } from "./full-board";
import {
  ARMS,
  EXIT_CLEAR,
  LANE_W,
  RING_LANES,
  RING_LANE_W,
  RING_OUTER_R,
  TAU,
  allowedTurns,
  dirOf,
  exitLanes,
  laneBearing,
  locate,
  turnBetween,
  wrapPi,
  type ArmId,
  type Location,
  type Turn,
} from "./geometry";
import { createLineState, lineStep, type LineState } from "./lines";
import { network } from "./network";
import type { Contact } from "./physics";
import type { Fault, SmallFaultId } from "./referee";

type RingVisit = {
  entryArm: ArmId;
  entryLane: number;
  total: number;
  lastBearing: number | null;
  /** The car has reached the ring lane with its approach lane's number. */
  joined: boolean;
  /** It has moved out of that lane again, toward an exit. */
  left: boolean;
  /** Radians travelled outside its own lane, on the way in and on the way out. */
  joinArc: number;
  leaveArc: number;
  /** The nearest the island it got while joining, or the furthest out while leaving. */
  reach: number;
  /** Seconds it has sat over the edge of its lane. */
  astray: number;
  /** The lane change has been reported. */
  told: boolean;
};

export type RoadState = {
  wrongWayTime: number;
  /** How long the car has driven up a lane that comes the other way. */
  wrongSideTime: number;
  /** How long the car has stood on a crossing or on the roundabout. */
  standing: number;
  /** Where it was told off for standing, so each place costs one star. */
  stoodAt: string[];
  lastApproach: { arm: ArmId; lane: number } | null;
  ring: RingVisit | null;
  /** Which side of each continuous line the car is on. */
  lines: LineState;
  /** Seconds until each kind of bump can cost a star again. */
  cooldown: Partial<Record<SmallFaultId, number>>;
  /** The lanes the car may leave the roundabout in, while that is being judged. */
  leaving: { lanes: number[]; from: number; drift: number } | null;
  /** The road lane the car is driving along, and for how long it has been. */
  lane: { arm: ArmId; side: string; lane: number; time: number } | null;
  /** The last road lane it was settled in. */
  settled: { arm: ArmId; lane: number } | null;
  /** Turning back through a gap in the reserve, until it is straight again. */
  turning: { told: boolean } | null;
  /** Stop lines the car is coming up to, by the line's place on the board. */
  stops: Record<string, "coming" | "stopped">;
};

export function createRoad(): RoadState {
  return {
    wrongWayTime: 0,
    wrongSideTime: 0,
    standing: 0,
    stoodAt: [],
    lastApproach: null,
    ring: null,
    lines: createLineState(),
    cooldown: {},
    leaving: null,
    lane: null,
    settled: null,
    turning: null,
    stops: {},
  };
}

export type RoadResult = {
  /** Small mistakes made this step. The drive goes on. */
  small: Fault[];
  /** A rule was broken. The attempt is over. */
  fault?: Fault;
  /** The car is against the frame of the board. */
  frame: boolean;
  loc: Location;
  /** The car has just left the roundabout, by an exit its lane may take. */
  exited?: { entryArm: ArmId; entryLane: number; arm: ArmId; turn: Turn };
};

export type RoadOptions = {
  /**
   * The task's route crosses the other lane here, to turn, turn back or park,
   * so keeping left is not judged this step.
   */
  crossing?: boolean;
  /**
   * Judge stop lines from where the car is. Off while a route task is on its
   * route, where the route's own stop lines are counted instead.
   */
  stopLines?: boolean;
};

const WRONG_WAY_GRACE = 0.8;
const WRONG_WAY_ANGLE = (115 * Math.PI) / 180;
const MOVING = 0.5;
const STOPPED = 0.2;
/** Standing this long where no car may stop costs a star. */
const STANDING_GRACE = 2.5;
/**
 * Crossing the outer lanes to reach your own, or to leave from it, takes this
 * much of the circle at most. Riding along in one of them takes more.
 */
const JOIN_ARC = (35 * Math.PI) / 180;
const LEAVE_ARC = (35 * Math.PI) / 180;
/** The middle of the car this far over a lane's edge is out of the lane. */
const LANE_OVER = 0.5;
/** On the way in or out, drifting back this far the other way is a weave. */
const TURNED_BACK = 1;
/** Driving along a road lane: within this of its direction, for this long. */
const ALONG_LANE = (30 * Math.PI) / 180;
const SETTLE = 0.5;
/** A lane change counts once the car has sat in the new lane this long. */
const LINE_GRACE = 0.3;
/** One bump, one star: leaning on a kerb doesn't keep costing. */
const BUMP_COOLDOWN = 1.5;
/** The lane a car leaves the roundabout in is judged over this many metres. */
const LEAVING_REACH = 9;
/** The middle of the car this near the middle of a crossing is on its bars. */
const ON_CROSSING = ROADS.CROSSING_HALF - 0.4;
/** The middle of the car this near the middle of a lane is in that lane. */
const IN_LANE = 1.6;
/** A stop counts from this far before the line to just over it. */
const STOP_BEFORE = 9;
const STOP_AFTER = 2;
/** Past the line by this much without having stopped: the line was run. */
const STOP_RUN = 4.5;
/** This far from a stop line, it is forgotten: next time is a new stop. */
const STOP_GONE = 25;

const BUMPS: Partial<Record<Contact, SmallFaultId>> = {
  kerb: "kerb",
  reserve: "central_reserve",
  island: "island",
};

function small(id: SmallFaultId): Fault {
  return { id, serious: false };
}

/**
 * Has the car changed lanes on the roundabout? It should cross the outer lanes
 * to the one with its approach lane's number, stay there, and cross them again
 * only to leave.
 */
function changedRingLane(
  visit: RingVisit,
  r: number,
  step: number,
  dt: number,
): boolean {
  const outer = RING_OUTER_R - (visit.entryLane - 1) * RING_LANE_W;
  const inner = outer - RING_LANE_W;
  if (!visit.joined) {
    if (r <= outer) {
      visit.joined = true;
      return false;
    }
    visit.joinArc += step;
    visit.reach = Math.min(visit.reach, r);
    return visit.joinArc > JOIN_ARC || r > visit.reach + TURNED_BACK;
  }
  if (!visit.left) {
    // Further in than its own lane is never part of joining or leaving.
    const inside = visit.entryLane < RING_LANES && r < inner - LANE_OVER;
    const outside = r > outer + LANE_OVER;
    visit.astray = inside || outside ? visit.astray + dt : 0;
    if (visit.astray <= LINE_GRACE) return false;
    if (inside) return true;
    visit.left = true;
    visit.reach = r;
    return false;
  }
  visit.leaveArc += step;
  visit.reach = Math.max(visit.reach, r);
  return visit.leaveArc > LEAVE_ARC || r < visit.reach - TURNED_BACK;
}

/** The place the car is in where it may not stop, if it is in one. */
function noStopping(car: CarState, loc: Location): string | null {
  if (car.x >= ROADS.SIDE.x0 && car.x <= ROADS.SIDE.x1) {
    for (const z of ROADS.CROSSINGS) {
      if (Math.abs(car.z - z) < ON_CROSSING) return `crossing:${z}`;
    }
  }
  return loc.kind === "ring" ? "ring" : null;
}

/**
 * The lane under the car on one of the board's other roads, and the way it
 * runs. Null between lanes, in a junction or in the parking zone.
 */
function roadLaneUnder(car: CarState): { heading: number } | null {
  for (const lane of network().roadLanes) {
    // The parking aisle is for getting in and out of bays, across both lanes.
    if (lane.road === "aisle") continue;
    const dx = car.x - lane.a.x;
    const dz = car.z - lane.a.z;
    const sin = Math.sin(lane.heading);
    const cos = Math.cos(lane.heading);
    const along = dx * sin - dz * cos;
    if (along < 0 || along > lane.length) continue;
    if (Math.abs(dx * cos + dz * sin) > IN_LANE) continue;
    return { heading: lane.heading };
  }
  return null;
}

type StopLine = { key: string; x: number; z: number; heading: number };
let stopLines: StopLine[] | null = null;

/** Every stop line on the board: where it is, and the way a car comes up to it. */
function allStopLines(): StopLine[] {
  if (stopLines) return stopLines;
  const net = network();
  const seen = new Map<string, StopLine>();
  for (const edge of net.edges) {
    if (edge.control !== "stop" || edge.maneuver === "u_turn") continue;
    const from = net.nodes.get(edge.from);
    if (!from || seen.has(edge.from)) continue;
    seen.set(edge.from, {
      key: edge.from,
      x: from.x,
      z: from.z,
      heading: from.heading,
    });
  }
  stopLines = [...seen.values()];
  return stopLines;
}

/** Has the car just run a stop line? A full stop before the line, every time. */
function ranStopLine(ref: RoadState, car: CarState): boolean {
  const speed = Math.abs(car.speed);
  for (const line of allStopLines()) {
    const dir = dirOf(line.heading);
    const ahead = (line.x - car.x) * dir.x + (line.z - car.z) * dir.z;
    const aside = Math.abs(
      (line.x - car.x) * -dir.z + (line.z - car.z) * dir.x,
    );
    const gap = Math.hypot(line.x - car.x, line.z - car.z);
    const state = ref.stops[line.key];
    if (gap > STOP_GONE) {
      if (state) delete ref.stops[line.key];
      continue;
    }
    const facing = Math.abs(wrapPi(car.heading - line.heading)) < Math.PI / 3;
    if (ahead > -STOP_AFTER && ahead < STOP_BEFORE && aside < 2.4 && facing) {
      if (speed < STOPPED) ref.stops[line.key] = "stopped";
      else if (!state) ref.stops[line.key] = "coming";
    } else if (state === "coming") {
      if (ahead < 0 && gap > STOP_RUN) {
        delete ref.stops[line.key];
        return true;
      }
      // Turned away before the line: it was never reached.
      if (ahead > STOP_BEFORE || (ahead > 0 && !facing)) {
        delete ref.stops[line.key];
      }
    }
  }
  return false;
}

export function roadStep(
  ref: RoadState,
  car: CarState,
  contacts: readonly Contact[],
  dt: number,
  options: RoadOptions = {},
): RoadResult {
  const loc = locate(car.x, car.z);
  const result: RoadResult = { small: [], frame: false, loc };

  for (const key of Object.keys(ref.cooldown) as SmallFaultId[]) {
    ref.cooldown[key] = Math.max(0, (ref.cooldown[key] ?? 0) - dt);
  }
  for (const contact of contacts) {
    if (contact === "end") {
      result.frame = true;
      continue;
    }
    const id = BUMPS[contact];
    if (id && !(ref.cooldown[id]! > 0)) {
      ref.cooldown[id] = BUMP_COOLDOWN;
      result.small.push(small(id));
    }
  }

  // Continuous lines, crossed or driven along: white or yellow, the attempt ends.
  for (const color of lineStep(ref.lines, car, dt)) {
    result.fault = {
      id: color === "yellow" ? "centre_line" : "solid_line",
      serious: true,
    };
    return result;
  }

  if (options.stopLines && ranStopLine(ref, car)) {
    result.fault = { id: "stop_line", serious: true };
    return result;
  }

  // Kerbs are solid, so this is only a car squeezed half onto one.
  if (loc.kind === "off") return result;

  // no stopping, parking or waiting on a crossing or on the roundabout
  const where = noStopping(car, loc);
  ref.standing = where && Math.abs(car.speed) < STOPPED ? ref.standing + dt : 0;
  if (where && ref.standing > STANDING_GRACE && !ref.stoodAt.includes(where)) {
    ref.stoodAt.push(where);
    result.small.push(
      small(where === "ring" ? "roundabout_stop" : "crossing_stop"),
    );
  }

  const moving = car.speed > MOVING;

  if (loc.kind === "road") {
    // Keep left: going forward up the lane that comes the other way.
    const under = options.crossing ? null : roadLaneUnder(car);
    const wrongSide =
      under != null &&
      moving &&
      Math.abs(wrapPi(car.heading - under.heading)) > WRONG_WAY_ANGLE;
    ref.wrongSideTime = wrongSide ? ref.wrongSideTime + dt : 0;
    if (ref.wrongSideTime > WRONG_WAY_GRACE) {
      // Only a painted line keeps these lanes apart.
      result.fault = { id: "centre_line", serious: true };
    }
    return result;
  }
  ref.wrongSideTime = 0;

  if (loc.kind === "ring") {
    if (!ref.ring && ref.lastApproach) {
      ref.ring = {
        entryArm: ref.lastApproach.arm,
        entryLane: ref.lastApproach.lane,
        total: 0,
        lastBearing: null,
        joined: false,
        left: false,
        joinArc: 0,
        leaveArc: 0,
        reach: Infinity,
        astray: 0,
        told: false,
      };
    }
    const visit = ref.ring;

    // Clockwise means the car's heading sits a quarter turn past its bearing.
    const against =
      Math.abs(wrapPi(car.heading - (loc.bearing + Math.PI / 2))) >
      WRONG_WAY_ANGLE;
    ref.wrongWayTime = against && moving ? ref.wrongWayTime + dt : 0;
    if (ref.wrongWayTime > WRONG_WAY_GRACE) {
      result.fault = { id: "wrong_way", serious: true };
      return result;
    }

    if (visit) {
      let step = 0;
      if (visit.lastBearing != null) {
        step = Math.max(0, wrapPi(loc.bearing - visit.lastBearing));
        visit.total += step;
      }
      visit.lastBearing = loc.bearing;

      if (!visit.told && changedRingLane(visit, loc.r, step, dt)) {
        visit.told = true;
        result.fault = {
          id: "roundabout_lane_change",
          serious: true,
          lane: visit.entryLane,
        };
        return result;
      }

      // Only the innermost lane may go all the way round.
      if (visit.entryLane < RING_LANES && visit.total > TAU + 0.12) {
        result.fault = {
          id: "full_circle",
          serious: true,
          lane: visit.entryLane,
        };
      }
    }
    return result;
  }

  // On an arm. Until the car is clear of the roundabout it still counts as on
  // it, so wobbling across the outer line isn't read as taking an exit.
  const visit = ref.ring;
  if (visit && loc.along < EXIT_CLEAR) {
    visit.lastBearing = null;
    return result;
  }

  if (visit) {
    ref.ring = null;
    ref.lastApproach = null;
    // Each time round, standing on the roundabout can cost its star again.
    ref.stoodAt = ref.stoodAt.filter((place) => place !== "ring");
    if (loc.side === "exit") {
      const turn = turnBetween(visit.entryArm, loc.arm);
      const lanes = ARMS[visit.entryArm].lanes;
      if (!allowedTurns(lanes, visit.entryLane).includes(turn)) {
        result.fault = {
          id: "wrong_exit",
          serious: true,
          lane: visit.entryLane,
          lanes,
          turn,
        };
        return result;
      }
      result.exited = {
        entryArm: visit.entryArm,
        entryLane: visit.entryLane,
        arm: loc.arm,
        turn,
      };
      // A lane change on the roundabout has been dealt with already.
      if (!visit.told) {
        ref.leaving = {
          lanes: exitLanes(lanes, visit.entryLane, turn, ARMS[loc.arm].lanes),
          from: visit.entryLane,
          drift: 0,
        };
      }
    }
  }

  // Leaving in the wrong lane is one of the common mistakes the handbook names.
  if (ref.leaving) {
    if (loc.side !== "exit" || loc.along > EXIT_CLEAR + LEAVING_REACH) {
      ref.leaving = null;
    } else if (ref.leaving.lanes.includes(loc.lane)) {
      ref.leaving.drift = 0;
    } else {
      ref.leaving.drift += dt;
      if (ref.leaving.drift > LINE_GRACE) {
        result.fault = {
          id: "exit_lane",
          serious: true,
          lane: ref.leaving.from,
        };
        ref.leaving = null;
        return result;
      }
    }
  }

  // Turning back through a gap in the reserve: from the lane beside it, into
  // the lane beside it on the other side.
  const road = ARMS[loc.arm];
  const off = Math.abs(wrapPi(car.heading - laneBearing(loc.arm, loc.side)));
  const fromAxis = Math.abs(car.x * road.out.z - car.z * road.out.x);
  const inGap = fromAxis < road.medianHalf;
  if (inGap) {
    if (!ref.turning) {
      ref.turning = { told: false };
      if (
        ref.settled &&
        ref.settled.arm === loc.arm &&
        ref.settled.lane !== road.lanes
      ) {
        ref.turning.told = true;
        result.fault = { id: "u_turn_lane", serious: true, lane: road.lanes };
        return result;
      }
    }
    ref.lane = null;
  } else {
    const same =
      ref.lane != null &&
      ref.lane.arm === loc.arm &&
      ref.lane.side === loc.side &&
      ref.lane.lane === loc.lane;
    if (off < ALONG_LANE) {
      ref.lane = {
        arm: loc.arm,
        side: loc.side,
        lane: loc.lane,
        time: same ? ref.lane!.time + dt : 0,
      };
      if (ref.lane.time > SETTLE) {
        ref.settled = { arm: loc.arm, lane: loc.lane };
        ref.turning = null;
      }
    } else {
      ref.lane = null;
    }
    // Still swinging round, and already past the lane beside the reserve.
    if (
      ref.turning &&
      !ref.turning.told &&
      fromAxis > road.medianHalf + LANE_W + LANE_OVER
    ) {
      ref.turning.told = true;
      result.fault = { id: "u_turn_lane", serious: true, lane: road.lanes };
      return result;
    }
  }

  const against = off > WRONG_WAY_ANGLE;
  ref.wrongWayTime = against && moving ? ref.wrongWayTime + dt : 0;
  if (ref.wrongWayTime > WRONG_WAY_GRACE) {
    // With no central reserve in the way, this is a crossed centre line.
    result.fault = {
      id: ARMS[loc.arm].medianHalf > 0 ? "wrong_way" : "centre_line",
      serious: true,
    };
    return result;
  }

  if (loc.side === "approach" && !against) {
    ref.lastApproach = { arm: loc.arm, lane: loc.lane };
  }

  return result;
}
