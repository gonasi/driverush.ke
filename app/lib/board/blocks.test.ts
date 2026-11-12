/**
 * Blocked roads: an upside-down car closes a way, the route finder plans round
 * it by the same route rules, and a learner who drives the closed way anyway
 * hits a car that does not move.
 *
 * That an autopilot passes every blocked task, with lane assist on and off and
 * with the parked cars in every layout, is proved with the other route tasks
 * in `board.test.ts`.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { blockById, blocks, closedEdges, touchesBlock } from "./blocks";
import { faultTip } from "./board-rules";
import type { CarState } from "./car";
import {
  BOARD_CHALLENGES,
  isRouteTask,
  type RouteChallenge,
} from "./challenges";
import { ALL_LEVELS } from "./curriculum";
import { levelSlides } from "./curriculum-content";
import { onTarmac } from "./full-board";
import { bearingOf } from "./geometry";
import {
  BLOCKED_ROUTES,
  LESSONS,
  challengeRoute,
  lessonById,
  lessonPlan,
} from "./lessons";
import { createLineState, lineStep } from "./lines";
import { planRoute, poseAt, type Route } from "./network";
import { PARKING_LAYOUTS, setParkingLayout } from "./parking-layouts";
import type { Fault } from "./referee";
import {
  beginChallenge,
  car,
  drive,
  loadPhysics,
  stick,
  stopDriving,
  tick,
  view,
} from "./runtime";

const STEP = 1 / 60;

const BLOCKED = BOARD_CHALLENGES.filter(
  (c): c is RouteChallenge => isRouteTask(c) && c.block !== undefined,
);

const at = (x: number, z: number): CarState => ({
  x,
  z,
  heading: 0,
  speed: 0,
  steer: 0,
});

/** Walk a route's own line, a quarter of a metre at a time. */
function walk(route: Route, each: (x: number, z: number) => void): void {
  for (let i = 0; i < route.points.length - 1; i += 1) {
    const a = route.points[i];
    const b = route.points[i + 1];
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.25),
    );
    for (let k = 0; k <= steps; k += 1) {
      const t = k / steps;
      each(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
    }
  }
}

beforeAll(() => loadPhysics());
beforeEach(() => {
  stopDriving();
  drive.seat = "south";
  drive.assist = true;
});
afterEach(() => setParkingLayout(PARKING_LAYOUTS[0].id));

describe("the blocks", () => {
  it("stand on the road, and each closes some of the lane network", () => {
    expect(blocks().length).toBeGreaterThanOrEqual(6);
    for (const block of blocks()) {
      expect(block.cars.length, block.id).toBeGreaterThan(0);
      for (const c of block.cars) {
        expect(onTarmac(c.x, c.z), block.id).toBe(true);
      }
      expect(closedEdges(block).size, block.id).toBeGreaterThan(0);
    }
  });

  it("have ids that are all different, and words a learner can read", () => {
    const ids = blocks().map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const block of blocks()) {
      expect(block.what.length).toBeGreaterThan(0);
      expect(block.what).not.toContain("—");
    }
  });

  it("leave every lesson's route as it was: none is closed by default", () => {
    for (const lesson of LESSONS) {
      expect(lesson.block, lesson.id).toBeUndefined();
      expect(lessonPlan(lesson)?.closed ?? null, lesson.id).toBeNull();
    }
  });
});

describe("the route finder, with a way closed", () => {
  it("plans the same route when nothing it uses is closed", () => {
    const street = blockById("street")!;
    const from = "S:in:2@0.00";
    const to = "N:out:2@125.60";
    const open = planRoute(from, to);
    const plan = planRoute(from, to, undefined, closedEdges(street));
    expect(plan.route?.length).toBe(open.route?.length);
    expect(plan.closed).toBeNull();
  });

  it("says there is no way when the only way is closed", () => {
    // The left-hand exit is the only road to the three-lane road's left end.
    const exit = blockById("exit")!;
    const plan = planRoute(
      "N:in:1@116.70",
      "side:south@215.90",
      undefined,
      closedEdges(exit),
    );
    expect(plan.route).toBeNull();
  });
});

describe("the blocked-road tasks", () => {
  it("are one for each kind of block the owner asked for", () => {
    expect(BLOCKED.map((c) => c.block).sort()).toEqual(
      ["exit", "gap", "lane", "parking", "ring", "street"].sort(),
    );
    for (const task of BLOCKED) {
      expect(blockById(task.block!), task.id).toBeDefined();
      const lesson = lessonById(task.lesson);
      expect(lesson, task.id).toBeDefined();
      expect(lesson!.block).toBe(task.block);
      expect(BLOCKED_ROUTES).toContain(lesson);
      expect(task.prompt).not.toContain("—");
      expect(task.prompt.toLowerCase()).toContain("upside-down car");
    }
  });

  it("stand the upside-down cars on the table, turned over", () => {
    for (const task of BLOCKED) {
      const flipped = task.otherCars.filter((c) => c.flipped);
      expect(flipped.length, task.id).toBe(blockById(task.block!)!.cars.length);
    }
  });

  for (const layout of PARKING_LAYOUTS) {
    for (const task of BLOCKED) {
      it(`"${task.title}" has a correct way round, cars laid out "${layout.id}"`, () => {
        setParkingLayout(layout.id);
        const block = blockById(task.block!)!;
        const plan = lessonPlan(lessonById(task.lesson)!)!;
        // there is a way, and the block is what changed it
        expect(plan.route, task.id).not.toBeNull();
        expect(plan.closed, task.id).not.toBeNull();
        const route = plan.route!;
        // it rests on no rule a driving school still has to confirm
        expect(route.confirmed, task.id).toBe(true);
        // a lane is never changed on the roundabout to get past a block
        expect(
          route.edges.some(
            (e) => e.road === "roundabout" && e.maneuver === "lane_change",
          ),
        ).toBe(false);
        // it keeps clear of the upside-down car, and crosses no continuous line
        const lines = createLineState();
        const crossed: string[] = [];
        let touched = false;
        walk(route, (x, z) => {
          if (touchesBlock(block, { x, z })) touched = true;
          crossed.push(...lineStep(lines, at(x, z)));
        });
        expect(touched, task.id).toBe(false);
        expect(crossed, task.id).toEqual([]);
        // and the way it would have gone runs into the car
        let closedWayHits = false;
        walk(plan.closed!, (x, z) => {
          if (touchesBlock(block, { x, z })) closedWayHits = true;
        });
        expect(closedWayHits, task.id).toBe(true);
      });
    }
  }

  for (const task of BLOCKED) {
    it(`"${task.title}": driving the closed way hits a car that does not move`, () => {
      const closed = lessonPlan(lessonById(task.lesson)!)!.closed!;
      const start = challengeRoute(task)!.points[0];
      let fault: Fault | undefined;
      let over = false;
      beginChallenge(task, {
        onFault: (f) => {
          fault = f;
          over = true;
        },
        onSmall: () => {},
        onDeviation: () => {},
        onGoal: () => {
          over = true;
        },
      });
      expect(Math.hypot(car.x - start.x, car.z - start.z)).toBeLessThan(0.5);
      const stood = view.others.map((o) => ({ ...o }));
      let progress = 0;
      for (let i = 0; i < 200 / STEP && !over; i += 1) {
        let best = Infinity;
        for (let d = Math.max(0, progress - 3); d <= progress + 8; d += 0.25) {
          const p = poseAt(closed, Math.min(closed.length, d));
          const gap = Math.hypot(p.x - car.x, p.z - car.z);
          if (gap < best) {
            best = gap;
            progress = d;
          }
        }
        const aim = poseAt(closed, Math.min(closed.length, progress + 4.5));
        const bearing = bearingOf(aim.x - car.x, aim.z - car.z);
        stick.x = Math.sin(bearing) * 0.7;
        stick.y = -Math.cos(bearing) * 0.7;
        tick(STEP);
      }
      const after = view.others.map((o) => ({ ...o }));
      stopDriving();
      expect(fault, task.id).toMatchObject({
        id: "collision",
        serious: true,
        block: true,
      });
      // the upside-down cars are where the instructor put them
      task.otherCars.forEach((other, i) => {
        if (!other.flipped) return;
        expect(after[i].x).toBeCloseTo(stood[i].x, 5);
        expect(after[i].z).toBeCloseTo(stood[i].z, 5);
        expect(after[i].heading).toBeCloseTo(stood[i].heading, 5);
      });
    });
  }

  it("says what was hit, in its own words", () => {
    const tip = faultTip({ id: "collision", serious: true, block: true });
    expect(tip.title).toBe("You hit the upside-down car");
    expect(tip.title + tip.rule + tip.reason).not.toContain("—");
    expect(faultTip({ id: "collision", serious: true }).title).toBe(
      "You hit the red car",
    );
  });
});

describe("blocked roads in the course", () => {
  it("says the rule once, before any blocked road is driven", () => {
    const rule = ALL_LEVELS.find((l) => l.id === "blocked-roads")!;
    expect(rule.kind).toBe("slides");
    const cards = levelSlides(rule);
    expect(cards.length).toBe(3);
    for (const card of cards) {
      expect(card.block && blockById(card.block), card.title).toBeTruthy();
      expect(card.box).not.toBeNull();
    }
    for (const task of BLOCKED) {
      const level = ALL_LEVELS.find(
        (l) => l.kind === "drive" && l.challenge === task.id,
      )!;
      expect(level, task.id).toBeDefined();
      expect(level.n).toBeGreaterThan(rule.n);
      // a blocked road is never set back: it is Medium or Hard
      expect(level.difficulty).not.toBe("Easy");
    }
  });

  it("keeps the parking one in the Parking unit, after parking is taught", () => {
    const level = ALL_LEVELS.find((l) => l.id === "drive-blocked-parking")!;
    expect(level.unit).toBe("parking");
    const taught = ALL_LEVELS.find((l) => l.id === "drive-park-angle")!;
    expect(level.n).toBeGreaterThan(taught.n);
  });
});
