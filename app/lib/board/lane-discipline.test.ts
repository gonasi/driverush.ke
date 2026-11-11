/**
 * Lane discipline, the way instructors asked for it: a continuous line is
 * never crossed or driven along, the roundabout is gone round in one lane,
 * turning back is from the lane beside the reserve into the lane beside it,
 * and a two-way road is driven on the left. Each of these used to be cheap or
 * free. Each now ends the attempt.
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { useBoardStore } from "../board-store";
import type { CarState } from "./car";
import { challengeById, type TurnChallenge } from "./challenges";
import { U_TURN_GAPS } from "./full-board";
import {
  ARMS,
  SOLID_ZONE,
  dirOf,
  laneOffset,
  lanePoint,
  ringRadius,
} from "./geometry";
import { challengeRoute } from "./lessons";
import { poseAt } from "./network";
import { createRef, refStep, type Fault, type RefState } from "./referee";
import { createRouteRef, routeRefStep } from "./route-referee";
import { car, loadPhysics, stick, tick } from "./runtime";
import { WARMUP_LEVEL_ID } from "./warmup";

const STEP = 1 / 60;
const DEG = Math.PI / 180;
const SPEED = 4;

const TASK: TurnChallenge = {
  id: "test",
  title: "test",
  prompt: "test",
  start: { arm: "S", lane: 2, along: 56 },
  turn: "straight",
  goal: { arm: "N", alongMin: 33, alongMax: 44 },
  otherCars: [],
};

function at(x: number, z: number, heading: number): CarState {
  return { x, z, heading, speed: SPEED, steer: 0 };
}

/** Drive a straight line at a steady speed. The first fault, if there is one. */
function line(
  ref: RefState,
  from: { x: number; z: number },
  to: { x: number; z: number },
  heading: number,
  task = TASK,
): Fault | undefined {
  const length = Math.hypot(to.x - from.x, to.z - from.z);
  const steps = Math.max(1, Math.round(length / (SPEED * STEP)));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const result = refStep(
      ref,
      task,
      at(from.x + (to.x - from.x) * t, from.z + (to.z - from.z) * t, heading),
      [],
      STEP,
    );
    if (result.fault) return result.fault;
  }
  return undefined;
}

/** A referee that has seen the car come up the road from the south in `lane`. */
function approached(lane: number): RefState {
  const ref = createRef();
  line(
    ref,
    lanePoint("S", "approach", lane, 40),
    lanePoint("S", "approach", lane, 26),
    0,
  );
  return ref;
}

/**
 * Go round the roundabout clockwise from one bearing to another, the distance
 * from the middle changing evenly on the way. Degrees are on from due south.
 */
function round(
  ref: RefState,
  fromDeg: number,
  toDeg: number,
  rFrom: number,
  rTo = rFrom,
): Fault | undefined {
  let deg = fromDeg;
  while (deg < toDeg) {
    const t = (deg - fromDeg) / (toDeg - fromDeg);
    const r = rFrom + (rTo - rFrom) * t;
    const bearing = Math.PI + deg * DEG;
    const dir = dirOf(bearing);
    const result = refStep(
      ref,
      TASK,
      at(dir.x * r, dir.z * r, bearing + Math.PI / 2),
      [],
      STEP,
    );
    if (result.fault) return result.fault;
    deg += (SPEED * STEP) / r / DEG;
  }
  return undefined;
}

describe("a continuous white line", () => {
  // between lanes 2 and 3 on the way up to the roundabout from the south
  const x = -(laneOffset(ARMS.S, 2) + laneOffset(ARMS.S, 3)) / 2;

  it("ends the attempt when it is driven along", () => {
    const fault = line(
      createRef(),
      { x, z: SOLID_ZONE - 3 },
      { x, z: SOLID_ZONE - 9 },
      0,
    );
    expect(fault).toMatchObject({ id: "solid_line", serious: true });
  });

  it("forgives a wheel on the paint for a moment", () => {
    const ref = createRef();
    const inLane = lanePoint("S", "approach", 2, SOLID_ZONE - 2);
    expect(
      line(ref, inLane, { x: x - 0.3, z: SOLID_ZONE - 4 }, 0),
    ).toBeUndefined();
    expect(
      line(
        ref,
        { x: x - 0.3, z: SOLID_ZONE - 4 },
        { x: inLane.x, z: SOLID_ZONE - 7 },
        0,
      ),
    ).toBeUndefined();
  });

  it("is not there where the lines are broken", () => {
    const fault = line(
      createRef(),
      { x, z: SOLID_ZONE + 16 },
      { x, z: SOLID_ZONE + 4 },
      0,
    );
    expect(fault).toBeUndefined();
  });
});

/** Where a car coming up from the south in `lane` meets the roundabout, degrees. */
function entry(lane: number): number {
  return Math.asin(laneOffset(ARMS.S, lane) / 22) / DEG + 1;
}

describe("the roundabout is gone round in one lane", () => {
  it("lets a car cross the outer lanes to join its own, and again to leave", () => {
    const ref = approached(3);
    const a = entry(3);
    // out by the road north, where its lane 3 leaves the roundabout
    const out = 180 - entry(3);
    expect(round(ref, a, a + 15, 22, ringRadius(3))).toBeUndefined();
    expect(round(ref, a + 15, out - 20, ringRadius(3))).toBeUndefined();
    expect(round(ref, out - 20, out, ringRadius(3), 22)).toBeUndefined();
  });

  it("ends the attempt for moving in a lane", () => {
    const ref = approached(2);
    const a = entry(2);
    expect(round(ref, a, a + 10, 22, ringRadius(2))).toBeUndefined();
    const fault = round(ref, a + 10, a + 50, ringRadius(3));
    expect(fault).toMatchObject({
      id: "roundabout_lane_change",
      lane: 2,
      serious: true,
    });
  });

  it("ends the attempt for riding round in an outer lane", () => {
    const ref = approached(3);
    const a = entry(3);
    // lane 1 all the way: under the old rule 40 degrees of this was free
    expect(round(ref, a, a + 25, ringRadius(1))).toBeUndefined();
    expect(round(ref, a + 25, a + 60, ringRadius(1))).toMatchObject({
      id: "roundabout_lane_change",
    });
  });

  it("ends the attempt for a weave out of the lane and back", () => {
    const ref = approached(2);
    const a = entry(2);
    expect(round(ref, a, a + 10, 22, ringRadius(2))).toBeUndefined();
    expect(round(ref, a + 10, a + 25, ringRadius(2))).toBeUndefined();
    // out into lane 1 for a moment, short of any exit
    expect(
      round(ref, a + 25, a + 30, ringRadius(2), ringRadius(1)),
    ).toBeUndefined();
    expect(round(ref, a + 30, a + 40, ringRadius(1))).toBeUndefined();
    const fault = round(ref, a + 40, a + 50, ringRadius(1), ringRadius(2));
    expect(fault).toMatchObject({ id: "roundabout_lane_change", lane: 2 });
  });

  it("forgives a wobble onto the edge of the lane", () => {
    const ref = approached(2);
    const a = entry(2);
    expect(round(ref, a, a + 10, 22, ringRadius(2))).toBeUndefined();
    const edge = ringRadius(2) + 2.5;
    expect(round(ref, a + 10, a + 20, ringRadius(2), edge)).toBeUndefined();
    expect(round(ref, a + 20, a + 30, edge, ringRadius(2))).toBeUndefined();
    expect(round(ref, a + 30, a + 70, ringRadius(2))).toBeUndefined();
  });
});

describe("turning back through a gap in the reserve", () => {
  const gap = U_TURN_GAPS[0];
  const middle = (gap.from + gap.to) / 2;
  const inGap = { x: -1.5, z: -middle };
  const back: TurnChallenge = {
    ...TASK,
    goal: { arm: "N", side: "approach", alongMin: 46, alongMax: 58 },
  };
  const drive = (
    ref: RefState,
    from: { x: number; z: number },
    to: { x: number; z: number },
    heading: number,
  ) => line(ref, from, to, heading, back);

  it("ends the attempt from any lane but the one beside the reserve", () => {
    const ref = createRef();
    const from = lanePoint("N", "exit", 3, 56);
    const to = lanePoint("N", "exit", 3, gap.from);
    expect(drive(ref, from, to, 0)).toBeUndefined();
    expect(drive(ref, inGap, { x: 0, z: -middle }, 60 * DEG)).toMatchObject({
      id: "u_turn_lane",
      serious: true,
    });
  });

  it("is allowed from the lane beside the reserve, into the lane beside it", () => {
    const ref = createRef();
    const lanes = ARMS.N.lanes;
    expect(
      drive(
        ref,
        lanePoint("N", "exit", lanes, 56),
        lanePoint("N", "exit", lanes, gap.from),
        0,
      ),
    ).toBeUndefined();
    expect(drive(ref, inGap, { x: 1.5, z: -middle }, 90 * DEG)).toBeUndefined();
    // straight again in the lane beside the reserve, then a lane change
    expect(
      drive(
        ref,
        lanePoint("N", "approach", lanes, middle - 1),
        lanePoint("N", "approach", lanes, middle - 8),
        180 * DEG,
      ),
    ).toBeUndefined();
    expect(
      drive(
        ref,
        lanePoint("N", "approach", lanes, middle - 8),
        lanePoint("N", "approach", lanes - 1, middle - 14),
        180 * DEG,
      ),
    ).toBeUndefined();
  });

  it("ends the attempt for swinging out past the lane beside the reserve", () => {
    const ref = createRef();
    const lanes = ARMS.N.lanes;
    drive(
      ref,
      lanePoint("N", "exit", lanes, 56),
      lanePoint("N", "exit", lanes, gap.from),
      0,
    );
    drive(ref, inGap, { x: 1.5, z: -middle }, 90 * DEG);
    // still facing across the road, and already in the next lane over
    const wide = lanePoint("N", "approach", lanes - 1, middle);
    expect(
      drive(ref, { x: 4, z: -middle }, { x: wide.x + 1, z: wide.z }, 90 * DEG),
    ).toMatchObject({ id: "u_turn_lane" });
  });
});

describe("a route task keeps to the left of a two-way road", () => {
  it("ends the attempt for driving up the lane that comes the other way", () => {
    const task = challengeById("down-the-street")!;
    const route = challengeRoute(task)!;
    const step = [...route.steps]
      .reverse()
      .find((s) => s.road === "two_way" && s.maneuver === "follow")!;
    // on the two-way road, round the end of the yellow line and up the far
    // lane, facing the way the route goes: no line is crossed on the way
    const ref = createRouteRef();
    // the stop line on the way here has been stopped at
    route.steps.forEach((_, i) => ref.stopped.add(i));
    let fault: Fault | undefined;
    const from = step.from + 2;
    ref.progress = from;
    for (let d = from; d < step.to - 1 && !fault; d += SPEED * STEP) {
      const pose = poseAt(route, d);
      // the other lane is on the right of a car that keeps left
      const right = dirOf(pose.heading + Math.PI / 2);
      fault = routeRefStep(
        ref,
        route,
        false,
        at(pose.x + right.x * 3.6, pose.z + right.z * 3.6, pose.heading),
        [],
        STEP,
      ).fault;
    }
    expect(fault).toMatchObject({ id: "centre_line", serious: true });
  });
});

describe("what a lane mistake costs, by level", () => {
  /** Hold the stick for a while, at sixty frames a second. */
  function hold(x: number, y: number, seconds: number, until?: () => boolean) {
    for (let i = 0; i < seconds * 60; i += 1) {
      stick.x = x;
      stick.y = y;
      tick(STEP);
      if (useBoardStore.getState().phase !== "driving") return;
      if (until?.()) return;
    }
  }

  /** Up the road to the continuous lines, then hard across them. */
  function cutAcross() {
    hold(0, -0.6, 30, () => car.z < SOLID_ZONE - 1);
    const before = useBoardStore.getState().noticeCount;
    hold(0.7, -0.5, 6, () => useBoardStore.getState().noticeCount > before);
  }

  beforeAll(() => loadPhysics());
  beforeEach(() => {
    useBoardStore.getState().exit();
    useBoardStore.getState().resetProgress();
  });

  it("an Easy level puts the car back and takes a star", () => {
    useBoardStore.getState().startLevel("drive-straight");
    cutAcross();
    const s = useBoardStore.getState();
    expect(s.phase).toBe("driving");
    expect(s.notice?.fault.id).toBe("solid_line");
    expect(s.notice?.back).toBe(true);
    expect(s.faults).toBe(1);
  });

  it("the first drive only says the rule", () => {
    useBoardStore.getState().startLevel(WARMUP_LEVEL_ID);
    cutAcross();
    const s = useBoardStore.getState();
    expect(s.phase).toBe("driving");
    expect(s.notice?.fault.id).toBe("solid_line");
    expect(s.notice?.back).toBeFalsy();
    expect(s.faults).toBe(0);
  });

  it("a task outside the gentle levels ends the attempt", () => {
    useBoardStore.getState().start(["straight"]);
    cutAcross();
    const s = useBoardStore.getState();
    expect(s.phase).toBe("fault");
    expect(s.fault?.id).toBe("solid_line");
  });
});
