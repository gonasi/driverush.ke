import { describe, expect, it } from "vitest";

import { BOARD_CHALLENGES, isRouteTask } from "./challenges";
import { BOARD_FEATURES } from "./features";
import { BOUNDS, goalBox, onTarmac } from "./full-board";
import {
  ARMS,
  allowedTurns,
  lanePoint,
  lanesForTurn,
  locate,
  wrapPi,
} from "./geometry";
import {
  APPROACHES,
  LESSONS,
  challengeRoute,
  laneOptions,
  lessonRoute,
} from "./lessons";
import {
  laneStart,
  network,
  planRoute,
  poseAt,
  type Place,
  type Route,
} from "./network";

const net = network();
const place = (label: string): Place => {
  const found = net.places.find((p) => p.label === label);
  if (!found) throw new Error(`no place called ${label}`);
  return found;
};
const roadStarts = net.places.filter((p) => p.group === "road" && p.starts);
const roadEnds = net.places.filter((p) => p.group === "road" && p.ends);

function routeTo(from: string, to: string): Route {
  const plan = planRoute(from, to);
  if (!plan.route) throw new Error(`no way from ${from} to ${to}`);
  return plan.route;
}

describe("the lane network", () => {
  it("keeps every line on the tarmac and off the central reserve", () => {
    for (const edge of net.edges) {
      for (const p of edge.points) {
        expect(onTarmac(p.x, p.z, 0.05), `${edge.id} leaves the road`).toBe(
          true,
        );
        const where = locate(p.x, p.z);
        expect(
          where.kind === "off" && where.what !== "verge",
          `${edge.id} crosses the ${where.kind === "off" ? where.what : ""}`,
        ).toBe(false);
      }
    }
  });

  it("joins every edge to its nodes", () => {
    for (const edge of net.edges) {
      const a = net.nodes.get(edge.from);
      const b = net.nodes.get(edge.to);
      const first = edge.points[0];
      const last = edge.points[edge.points.length - 1];
      expect(Math.hypot(first.x - a!.x, first.z - a!.z)).toBeLessThan(0.02);
      expect(Math.hypot(last.x - b!.x, last.z - b!.z)).toBeLessThan(0.02);
    }
  });

  it("can reach every node from somewhere a lesson can start", () => {
    const seen = new Set<string>();
    const queue = net.places.filter((p) => p.starts).map((p) => p.id);
    while (queue.length > 0) {
      const id = queue.pop() as string;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const edge of net.out.get(id) ?? []) queue.push(edge.to);
    }
    const missed = [...net.nodes.keys()].filter((id) => !seen.has(id));
    expect(missed).toEqual([]);
  });

  it("has a bay for every space in both rows, and the flush bays", () => {
    const bays = new Set(net.edges.map((e) => e.bay).filter(Boolean));
    expect(bays.size).toBe(7 + 7 + 2);
  });
});

describe("finding the way", () => {
  it("gets from every road to every other road without the parking area", () => {
    for (const from of roadStarts) {
      for (const to of roadEnds) {
        const plan = planRoute(from.id, to.id);
        expect(plan.route, `${from.label} ${to.label}`).not.toBeNull();
        expect(plan.rule).toBe("shortest");
        expect(plan.route?.throughParking).toBe(false);
        expect(plan.route?.edges.some((e) => e.bay)).toBe(false);
      }
    }
  });

  it("goes straight over the roundabout in one lane", () => {
    const route = routeTo(
      laneStart("S", 1),
      place("To the dual carriageway, top end, lane 1").id,
    );
    expect(route.edges.some((e) => e.maneuver === "lane_change")).toBe(false);
    for (const p of route.points) {
      const where = locate(p.x, p.z);
      expect(where.kind === "arm" || where.kind === "ring").toBe(true);
      if (where.kind === "arm" || where.kind === "ring") {
        expect(where.lane).toBe(1);
      }
    }
  });

  it("changes lane before the continuous lines when the lane cannot make the turn", () => {
    // lane 2 only goes straight, so turning right from the bottom needs lane 3 or 4
    const route = routeTo(
      laneStart("S", 2),
      place("To the two-way road, top end").id,
    );
    const moves = route.edges.map((e) => e.maneuver);
    expect(moves.indexOf("lane_change")).toBeGreaterThanOrEqual(0);
    expect(moves.indexOf("lane_change")).toBeLessThan(
      moves.indexOf("hold_lane"),
    );
    const held = route.edges.find((e) => e.maneuver === "hold_lane");
    expect([3, 4]).toContain(held?.lane);
  });

  it("offers the parking area as a shortcut, never as the answer", () => {
    const cuts = roadStarts.flatMap((from) =>
      roadEnds.map((to) => planRoute(from.id, to.id)),
    );
    for (const plan of cuts) {
      if (!plan.shortcut || !plan.route) continue;
      expect(plan.shortcut.throughParking).toBe(true);
      expect(plan.shortcut.length).toBeLessThan(plan.route.length);
    }
  });

  it("stops at the stop line and gives way where the paint says", () => {
    const route = routeTo(
      laneStart("N", 1),
      place("To the two-way road, bottom end").id,
    );
    const controls = route.steps.map((s) => s.control).filter(Boolean);
    expect(controls).toContain("stop");
    expect(controls).toContain("crossing");
  });
});

describe("parking", () => {
  const free = net.places.filter((p) => p.group !== "road" && !p.occupied);

  it("can drive to every free bay and away again", () => {
    for (const bay of free) {
      const into = planRoute(laneStart("S", 1), bay.id);
      expect(into.route, `into ${bay.label}`).not.toBeNull();
      expect(into.rule).toBe(bay.group === "angle_bay" ? "parking" : "shortest");
      const out = planRoute(
        bay.id,
        place("To the dual carriageway, bottom end, lane 1").id,
      );
      expect(out.route, `out of ${bay.label}`).not.toBeNull();
    }
  });

  it("reverses out of an angle bay it drove into", () => {
    const route = routeTo(
      place("Angle bay 3, left row, nose in").id,
      place("To the two-way road, top end").id,
    );
    expect(route.steps[0].gear).toBe("reverse");
    expect(route.steps[0].maneuver).toBe("leave_reverse");
    expect(route.steps[1].gear).toBe("forward");
  });

  it("reverses into a bay from the far side of the aisle", () => {
    const route = routeTo(
      laneStart("N", 1),
      place("Angle bay 3, left row, reversed in").id,
    );
    const lastStep = route.steps[route.steps.length - 1];
    expect(lastStep.maneuver).toBe("park_reverse");
    expect(lastStep.gear).toBe("reverse");
  });

  it("can reverse into flush parking", () => {
    const bay = place("Flush parking bay 1");
    const reverseIn = net.edges.filter(
      (e) => e.to === bay.id && e.gear === "reverse",
    );
    expect(reverseIn).toHaveLength(1);
  });

  it("never throws the car about: it moves and turns smoothly, also in reverse", () => {
    const routes = [
      routeTo(
        place("Angle bay 3, left row, nose in").id,
        place("Angle bay 2, right row, reversed in").id,
      ),
      routeTo(laneStart("S", 4), place("Flush parking bay 1").id),
      routeTo(
        place("Flush parking bay 1").id,
        place("To the dual carriageway, top end, lane 1").id,
      ),
    ];
    for (const route of routes) {
      let prev = poseAt(route, 0);
      for (let d = 0.2; d <= route.length; d += 0.2) {
        const pose = poseAt(route, d);
        expect(Math.hypot(pose.x - prev.x, pose.z - prev.z)).toBeLessThan(0.25);
        expect(
          Math.abs(wrapPi(pose.heading - prev.heading)),
          `turning at ${d.toFixed(1)} m`,
        ).toBeLessThan(0.3);
        prev = pose;
      }
      const end = poseAt(route, route.length);
      const node = net.nodes.get(route.edges[route.edges.length - 1].to);
      expect(Math.abs(wrapPi(end.heading - node!.heading))).toBeLessThan(0.15);
    }
  });
});

describe("what Learn mode teaches", () => {
  it("has a line for every turn each lane may make", () => {
    for (const { arm } of APPROACHES) {
      for (let lane = 1; lane <= ARMS[arm].lanes; lane += 1) {
        const options = laneOptions(arm, lane);
        expect(options.map((o) => o.turn).sort()).toEqual(
          [...allowedTurns(ARMS[arm].lanes, lane)].sort(),
        );
        for (const option of options) {
          expect(option.route.edges.some((e) => e.maneuver === "lane_change"))
            .toBe(false);
          expect(option.route.steps.map((s) => s.maneuver)).toEqual(
            expect.arrayContaining(["hold_lane", "ring", "exit"]),
          );
        }
      }
    }
  });

  it("can drive every lesson", () => {
    for (const lesson of LESSONS) {
      const route = lessonRoute(lesson);
      expect(route, lesson.id).not.toBeNull();
      expect(route!.steps.length).toBeGreaterThan(0);
      if (lesson.group === "routes") {
        expect(route!.throughParking, lesson.id).toBe(false);
      }
    }
  });

  it("reverses in the lessons that say so", () => {
    const reversing = (id: string) =>
      lessonRoute(LESSONS.find((l) => l.id === id)!)!
        .steps.filter((s) => s.gear === "reverse")
        .map((s) => s.maneuver);
    expect(reversing("leave-angle-reverse")).toEqual(["leave_reverse"]);
    expect(reversing("park-angle-reverse")).toEqual(["park_reverse"]);
    expect(reversing("park-flush-reverse")).toEqual(["park_reverse"]);
    expect(reversing("park-flush")).toEqual([]);
    expect(reversing("park-angle")).toEqual([]);
  });

  it("knows the right way through every driving task, start line to green box", () => {
    for (const challenge of BOARD_CHALLENGES) {
      if (isRouteTask(challenge)) continue;
      const route = challengeRoute(challenge);
      expect(route, challenge.id).not.toBeNull();
      const start = lanePoint(
        challenge.start.arm,
        "approach",
        challenge.start.lane,
        challenge.start.along,
      );
      const first = poseAt(route!, 0);
      expect(Math.hypot(first.x - start.x, first.z - start.z)).toBeLessThan(0.5);
      const end = poseAt(route!, route!.length);
      const box = goalBox(challenge.goal);
      expect(end.x, challenge.id).toBeGreaterThan(box.x0);
      expect(end.x, challenge.id).toBeLessThan(box.x1);
      expect(end.z, challenge.id).toBeGreaterThan(box.z0);
      expect(end.z, challenge.id).toBeLessThan(box.z1);
      // the lane it holds into the roundabout is one that may make the turn
      const held = route!.edges.find((e) => e.maneuver === "hold_lane");
      expect(
        lanesForTurn(ARMS[challenge.start.arm].lanes, challenge.turn),
      ).toContain(held?.lane);
    }
  });

  it("points at a real part of the board for every feature", () => {
    const ids = new Set(BOARD_FEATURES.map((f) => f.id));
    expect(ids.size).toBe(BOARD_FEATURES.length);
    for (const feature of BOARD_FEATURES) {
      const { box } = feature;
      expect(box.x1 - box.x0, feature.id).toBeGreaterThan(8);
      expect(box.z1 - box.z0, feature.id).toBeGreaterThan(8);
      expect(box.x1).toBeGreaterThan(BOUNDS.x0);
      expect(box.x0).toBeLessThan(BOUNDS.x1);
      expect(box.z1).toBeGreaterThan(BOUNDS.z0);
      expect(box.z0).toBeLessThan(BOUNDS.z1);
      expect(feature.note).not.toMatch(/—/);
    }
  });
});
