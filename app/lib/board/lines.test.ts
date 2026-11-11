/**
 * The continuous lines: what counts as crossing one, that both referees call
 * it, and that no route the board teaches or asks for goes over one.
 */
import { describe, expect, it } from "vitest";

import type { CarState } from "./car";
import {
  BOARD_CHALLENGES,
  isRouteTask,
  type TurnChallenge,
} from "./challenges";
import { ROADS, continuousLines } from "./full-board";
import { armForTurn, lanePoint } from "./geometry";
import { LESSONS, challengeRoute, lessonRoute } from "./lessons";
import { createLineState, lineStep } from "./lines";
import type { Route } from "./network";
import { createRef, refStep } from "./referee";
import { createRouteRef, routeRefStep } from "./route-referee";

const { SIDE, STREET, AISLE, NARROW } = ROADS;

const at = (x: number, z: number): CarState => ({
  x,
  z,
  heading: 0,
  speed: 0,
  steer: 0,
});

/** Slide a car from one point to another in small steps, and say what it crossed. */
function slide(from: { x: number; z: number }, to: { x: number; z: number }) {
  const state = createLineState();
  const crossed: string[] = [];
  for (let i = 0; i <= 60; i += 1) {
    const t = i / 60;
    crossed.push(
      ...lineStep(
        state,
        at(from.x + (to.x - from.x) * t, from.z + (to.z - from.z) * t),
      ),
    );
  }
  return crossed;
}

/** Drive a route's own line, a quarter of a metre at a time. */
function along(route: Route): string[] {
  const state = createLineState();
  const crossed: string[] = [];
  for (let i = 0; i < route.points.length - 1; i += 1) {
    const a = route.points[i];
    const b = route.points[i + 1];
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.25),
    );
    for (let k = 0; k <= steps; k += 1) {
      const t = k / steps;
      crossed.push(
        ...lineStep(state, at(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)),
      );
    }
  }
  return crossed;
}

describe("the paint, as data", () => {
  it("has every continuous line on the board", () => {
    const lines = continuousLines();
    // Three lines between four lanes, two between three, on both sides of
    // each of the four roads.
    expect(lines.filter((l) => l.color === "white")).toHaveLength(20);
    // The three-lane road twice, the two-way road in three pieces, the
    // street in two.
    expect(lines.filter((l) => l.color === "yellow")).toHaveLength(7);
    for (const line of lines) {
      expect(Math.hypot(line.bx - line.ax, line.bz - line.az)).toBeGreaterThan(
        5,
      );
    }
  });
});

describe("crossing a continuous line", () => {
  it("is called on the two-way road's yellow centre line", () => {
    const z = (STREET.z1 + -NARROW) / 2;
    expect(slide({ x: SIDE.mid - 3, z }, { x: SIDE.mid + 3, z })).toEqual([
      "yellow",
    ]);
  });

  it("is not called where that line is broken, across a road's mouth", () => {
    expect(slide({ x: SIDE.mid - 3, z: 0 }, { x: SIDE.mid + 3, z: 0 })).toEqual(
      [],
    );
    expect(
      slide(
        { x: SIDE.mid - 3, z: STREET.mid },
        { x: SIDE.mid + 3, z: STREET.mid },
      ),
    ).toEqual([]);
  });

  it("is called on the street's yellow line, but not opposite the aisle", () => {
    const x = (ROADS.WIDE + AISLE.x0) / 2;
    expect(slide({ x, z: STREET.mid - 3 }, { x, z: STREET.mid + 3 })).toEqual([
      "yellow",
    ]);
    const gap = (AISLE.x0 + AISLE.x1) / 2;
    expect(
      slide({ x: gap, z: STREET.mid - 3 }, { x: gap, z: STREET.mid + 3 }),
    ).toEqual([]);
  });

  it("forgives a wheel on the paint", () => {
    const z = (STREET.z1 + -NARROW) / 2;
    const state = createLineState();
    const crossed = [
      ...lineStep(state, at(SIDE.mid - 2, z)),
      ...lineStep(state, at(SIDE.mid - 0.2, z)),
      ...lineStep(state, at(SIDE.mid + 0.3, z)),
      ...lineStep(state, at(SIDE.mid - 2, z)),
    ];
    expect(crossed).toEqual([]);
  });

  it("is called on a white lane line leaving the roundabout, both ways over", () => {
    const from = lanePoint("N", "exit", 2, 30);
    const to = lanePoint("N", "exit", 3, 30);
    expect(slide(from, to)).toEqual(["white"]);
    expect(slide(to, from)).toEqual(["white"]);
  });

  it("is not called further out, where the lane lines are broken", () => {
    expect(
      slide(lanePoint("N", "exit", 2, 60), lanePoint("N", "exit", 3, 60)),
    ).toEqual([]);
  });
});

describe("the routes the board teaches and asks for", () => {
  it("cross no continuous line, any of them", () => {
    for (const lesson of LESSONS) {
      const route = lessonRoute(lesson);
      if (route) expect(along(route), `lesson ${lesson.id}`).toEqual([]);
    }
    for (const challenge of BOARD_CHALLENGES) {
      const route = challengeRoute(challenge);
      if (route) expect(along(route), `task ${challenge.id}`).toEqual([]);
    }
  });
});

describe("the referees", () => {
  it("a route task: over the yellow line ends the attempt", () => {
    const task = BOARD_CHALLENGES.filter(isRouteTask).find((c) =>
      challengeRoute(c),
    );
    const route = task && challengeRoute(task);
    expect(route).toBeTruthy();
    if (!route) return;
    const ref = createRouteRef();
    const z = (STREET.z1 + -NARROW) / 2;
    const step = (x: number) =>
      routeRefStep(ref, route, false, at(x, z), [], 1 / 60);
    // The first look only notes which side the car is on.
    expect(step(SIDE.mid - 2).fault?.id).not.toBe("centre_line");
    expect(step(SIDE.mid + 2).fault).toEqual({
      id: "centre_line",
      serious: true,
    });
  });

  it("a turn task: a lane change after the roundabout costs a star", () => {
    const task: TurnChallenge = {
      id: "test",
      title: "test",
      prompt: "test",
      start: { arm: "S", lane: 2, along: 56 },
      turn: "straight",
      goal: { arm: armForTurn("S", "straight"), alongMin: 33, alongMax: 44 },
      otherCars: [],
    };
    const ref = createRef();
    const a = lanePoint("N", "exit", 2, 30);
    const b = lanePoint("N", "exit", 3, 30);
    expect(refStep(ref, task, at(a.x, a.z), [], 1 / 60).small).toEqual([]);
    const after = refStep(ref, task, at(b.x, b.z), [], 1 / 60);
    expect(after.fault).toBeUndefined();
    expect(after.small.map((f) => f.id)).toEqual(["solid_line"]);
    expect(after.small[0].serious).toBe(false);
  });
});
