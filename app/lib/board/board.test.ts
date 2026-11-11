import Matter from "matter-js";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { faultTip } from "./board-rules";
import { CAR } from "./car";
import {
  BOARD_CHALLENGES,
  isRouteTask,
  type BoardChallenge,
  type TurnChallenge,
} from "./challenges";
import { BOUNDS, U_TURN_GAPS, onTarmac } from "./full-board";
import {
  ARMS,
  ISLAND_R,
  OPTION_CODES,
  SOLID_ZONE,
  allowedTurns,
  armForTurn,
  armHalfWidth,
  bearingOf,
  exitLanes,
  laneBearing,
  lanePoint,
  lanesForTurn,
  locate,
  ringRadius,
  turnBetween,
  wrapPi,
  type Turn,
  type Vec,
} from "./geometry";
import { SEATS, stickBearing, type Seat } from "./joystick";
import { lanePath, turnBackPath } from "./lane-paths";
import { challengeRoute, taskParks } from "./lessons";
import { distanceNear, poseAt, type Route } from "./network";
import {
  PARKING_LAYOUTS,
  parkedCars,
  parkingLayout,
  setParkingLayout,
  shuffleParkingLayout,
  targetBays,
} from "./parking-layouts";
import { createPhysics, physicsStep } from "./physics";
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
/** How hard the car slows once the knob is let go, m/s². */
const RELEASE_DECEL = 0.7 * CAR.brake + CAR.coast;
const DEG = Math.PI / 180;

function task(turn: Turn, startLane = 1): TurnChallenge {
  return {
    id: "test",
    title: "test",
    prompt: "test",
    start: { arm: "S", lane: startLane, along: 56 },
    turn,
    goal: { arm: armForTurn("S", turn), alongMin: 33, alongMax: 44 },
    otherCars: [],
  };
}

type Outcome = {
  fault?: Fault;
  small: Fault[];
  goal: boolean;
  /** The car's middle left the tarmac at some point. Kerbs should stop that. */
  offRoad: boolean;
  /** The furthest the car strayed from the line it was following, metres. */
  strayed: number;
};

/** Push the knob toward a compass bearing, as seen from the south seat. */
function point(bearing: number, push = 0.7): void {
  stick.x = Math.sin(bearing) * push;
  stick.y = -Math.cos(bearing) * push;
}

function letGo(): void {
  stick.x = 0;
  stick.y = 0;
}

/**
 * Play a task the way a learner does, by moving the knob. `each` is called
 * every step and sets the stick.
 */
function play(
  challenge: BoardChallenge,
  each: (seconds: number, outcome: Outcome) => void,
  seconds = 150,
): Outcome {
  const outcome: Outcome = {
    small: [],
    goal: false,
    offRoad: false,
    strayed: 0,
  };
  let over = false;
  beginChallenge(challenge, {
    onFault: (fault) => {
      outcome.fault = fault;
      over = true;
    },
    onSmall: (fault) => outcome.small.push(fault),
    onGoal: () => {
      outcome.goal = true;
      over = true;
    },
  });
  for (let i = 0; i < seconds / STEP && !over; i += 1) {
    each(i * STEP, outcome);
    tick(STEP);
    if (!over && locate(car.x, car.z).kind === "off") outcome.offRoad = true;
  }
  stopDriving();
  return outcome;
}

/** True once the car should let go to stop in the middle of the box. */
function atBox(challenge: TurnChallenge): boolean {
  const goal = challenge.goal;
  const side = goal.side ?? "exit";
  const loc = locate(car.x, car.z);
  if (loc.kind !== "arm" || loc.side !== side || loc.arm !== goal.arm) {
    return false;
  }
  const middle = (goal.alongMin + goal.alongMax) / 2;
  const stopping = car.speed ** 2 / (2 * RELEASE_DECEL);
  // Leaving the roundabout the car is driving out along the road; coming
  // back toward it, in.
  return side === "exit"
    ? loc.along + stopping >= middle
    : loc.along - stopping <= middle;
}

type Follow = {
  /** Degrees of thumb wobble either side of the true direction. */
  wobble?: number;
  push?: number;
  /** Keep going instead of stopping in the box. */
  through?: boolean;
};

/**
 * A learner who keeps the knob pointed along a route: a point a few metres down
 * the line from the car. If the route starts in another lane, they change to
 * it first.
 */
function follower(
  challenge: TurnChallenge,
  path: Vec[],
  options: Follow = {},
) {
  let nearest = 0;
  const first = locate(path[0].x, path[0].z);
  const wantLane = first.kind === "arm" ? first.lane : null;
  return (seconds: number, outcome: Outcome) => {
    const loc = locate(car.x, car.z);
    if (
      wantLane != null &&
      loc.kind === "arm" &&
      loc.arm === challenge.start.arm &&
      loc.side === "approach" &&
      loc.lane !== wantLane &&
      loc.along > SOLID_ZONE + 2
    ) {
      // A lane change is a firm push across. On the road north from the
      // south, lane 1 is to the left, the west.
      point(
        laneBearing(loc.arm, "approach") +
          (loc.lane > wantLane ? -45 : 45) * DEG,
        options.push,
      );
      return;
    }

    while (
      nearest < path.length - 1 &&
      Math.hypot(path[nearest + 1].x - car.x, path[nearest + 1].z - car.z) <=
        Math.hypot(path[nearest].x - car.x, path[nearest].z - car.z)
    ) {
      nearest += 1;
    }
    outcome.strayed = Math.max(
      outcome.strayed,
      Math.hypot(path[nearest].x - car.x, path[nearest].z - car.z),
    );
    if (!options.through && atBox(challenge)) {
      letGo();
      return;
    }

    let aim = nearest;
    let run = 0;
    while (aim < path.length - 1 && run < 4.5) {
      run += Math.hypot(
        path[aim + 1].x - path[aim].x,
        path[aim + 1].z - path[aim].z,
      );
      aim += 1;
    }
    const wobble =
      (options.wobble ?? 0) *
      DEG *
      Math.sin(seconds * 5.3) *
      Math.cos(seconds * 1.7 + 1);
    point(
      bearingOf(path[aim].x - car.x, path[aim].z - car.z) + wobble,
      options.push,
    );
  };
}

/**
 * Turning back, driven properly: a firm push over to the lane beside the
 * reserve where the lines are broken, then round through the gap from it.
 */
function turningBack(
  challenge: TurnChallenge,
  lane: number,
  options: Follow = {},
  endAlong = 40,
) {
  const follow = follower(challenge, turnBackPath(lane, 56, endAlong), options);
  return (seconds: number, outcome: Outcome) => {
    const loc = locate(car.x, car.z);
    if (
      loc.kind === "arm" &&
      loc.arm === "N" &&
      loc.side === "exit" &&
      loc.lane < ARMS.N.lanes &&
      loc.along > SOLID_ZONE + 2 &&
      loc.along < 60
    ) {
      // Driving north, the reserve is on the right, the east.
      point(laneBearing("N", "exit") + 45 * DEG, options.push);
      return;
    }
    follow(seconds, outcome);
  };
}

/** A route's line from where it has reached `lane`. */
function fromLane(points: Vec[], lane: number): Vec[] {
  const at = points.findIndex((p) => {
    const loc = locate(p.x, p.z);
    return loc.kind === "arm" && loc.lane === lane;
  });
  return points.slice(Math.max(0, at));
}

/** Drive a task properly, getting into `lane` first. */
function proper(
  challenge: TurnChallenge,
  lane: number,
  options: Follow = {},
): Outcome {
  // A task from the three-lane road is driven along its own route, which
  // has the lane change and the lane to leave in.
  if (challenge.id === "turn-back") {
    return play(challenge, turningBack(challenge, lane, options));
  }
  const path =
    challenge.start.arm === "S"
        ? lanePath("S", lane, challenge.turn)
        : fromLane(challengeRoute(challenge)?.points ?? [], lane);
  return play(challenge, follower(challenge, path, options));
}

const TURN_TASKS = BOARD_CHALLENGES.filter(
  (c): c is TurnChallenge => !isRouteTask(c),
);

const SHIPPED_LANES: Record<string, number> = {
  straight: 2,
  left: 1,
  right: 3,
  back: 4,
  "turn-back": 2,
  "behind-red": 1,
  "three-lane-right": 3,
  "three-lane-back": 3,
};

beforeAll(() => loadPhysics());
beforeEach(() => {
  stopDriving();
  drive.seat = "south";
  drive.assist = true;
});

describe("the board's geometry", () => {
  it("numbers lanes from the kerb in to the centre", () => {
    for (const lane of [1, 2, 3, 4]) {
      const p = lanePoint("S", "approach", lane, 40);
      expect(locate(p.x, p.z)).toMatchObject({
        kind: "arm",
        arm: "S",
        side: "approach",
        lane,
      });
    }
    // Kenya keeps left: heading north you sit on the west side.
    expect(lanePoint("S", "approach", 1, 40).x).toBeLessThan(
      lanePoint("S", "approach", 4, 40).x,
    );
    expect(lanePoint("S", "approach", 4, 40).x).toBeLessThan(0);
  });

  it("tells the two sides of the three-lane road apart", () => {
    const out = lanePoint("W", "exit", 1, 40);
    const back = lanePoint("W", "approach", 1, 40);
    expect(locate(out.x, out.z)).toMatchObject({ side: "exit", lane: 1 });
    expect(locate(back.x, back.z)).toMatchObject({ side: "approach", lane: 1 });
    // Leaving west you are on the south half, by the kerb.
    expect(out.z).toBeGreaterThan(0);
  });

  it("knows the board's other roads from the four into the roundabout", () => {
    // The two-way road down the right, the street, and the parking aisle.
    expect(locate(69, 30)).toEqual({ kind: "road", what: "two_way" });
    expect(locate(40, -99)).toEqual({ kind: "road", what: "street" });
    expect(locate(39.7, -50)).toEqual({ kind: "road", what: "parking" });
    // The field between them is not road.
    expect(locate(-40, -60)).toEqual({ kind: "off", what: "verge" });
    expect(locate(58, -50)).toEqual({ kind: "off", what: "verge" });
  });

  it("opens the central reserve at each U-turn gap, and nowhere else", () => {
    for (const gap of U_TURN_GAPS) {
      expect(locate(0, -(gap.from + gap.to) / 2)).toMatchObject({
        kind: "arm",
        arm: "N",
        lane: 4,
      });
      expect(locate(0, -(gap.from - 2))).toEqual({
        kind: "off",
        what: "median",
      });
      expect(locate(0, -(gap.to + 2))).toEqual({ kind: "off", what: "median" });
    }
    // It runs right up to the roundabout on both sides, with no gap below it.
    expect(locate(0, 30)).toEqual({ kind: "off", what: "median" });
    expect(locate(0, -30)).toEqual({ kind: "off", what: "median" });
  });

  it("puts ring lane 1 on the outside and lane 4 by the island", () => {
    expect(ringRadius(1)).toBeGreaterThan(ringRadius(4));
    for (const lane of [1, 2, 3, 4]) {
      expect(locate(0, ringRadius(lane))).toMatchObject({ kind: "ring", lane });
    }
  });

  it("knows the kerb, the island and the central reserve are off the road", () => {
    expect(locate(0, 0)).toMatchObject({ kind: "off", what: "island" });
    expect(locate(0, 40)).toMatchObject({ kind: "off", what: "median" });
    expect(locate(30, 30)).toMatchObject({ kind: "off", what: "verge" });
  });

  it("goes round clockwise: left is the first exit", () => {
    expect(turnBetween("S", "W")).toBe("left");
    expect(turnBetween("S", "N")).toBe("straight");
    expect(turnBetween("S", "E")).toBe("right");
    expect(turnBetween("S", "S")).toBe("back");
    expect(laneBearing("S", "approach")).toBeCloseTo(0);
  });

  it("follows the handbook's four-lane table", () => {
    expect(allowedTurns(4, 1)).toEqual(["straight", "left"]);
    expect(allowedTurns(4, 2)).toEqual(["straight"]);
    expect(allowedTurns(4, 3)).toEqual(["straight", "right"]);
    expect([...allowedTurns(4, 4)].sort()).toEqual(
      ["back", "left", "right", "straight"].sort(),
    );
    expect(lanesForTurn(4, "left")).toEqual([1, 4]);
    expect(lanesForTurn(4, "right")).toEqual([3, 4]);
    expect(lanesForTurn(4, "back")).toEqual([4]);
    expect(OPTION_CODES[4]).toBe("2124");
  });

  it("follows the three-lane table, 215", () => {
    expect(allowedTurns(3, 1)).toEqual(["straight", "left"]);
    expect(allowedTurns(3, 2)).toEqual(["straight"]);
    expect([...allowedTurns(3, 3)].sort()).toEqual(
      ["back", "left", "right", "straight"].sort(),
    );
    expect(OPTION_CODES[3]).toBe("215");
    // lane 3's five options: right may enter lane 3 or lane 4
    expect(exitLanes(3, 3, "right", 4)).toEqual([3, 4]);
    expect(exitLanes(3, 3, "back", 3)).toEqual([3]);
    expect(exitLanes(3, 3, "left", 4)).toEqual([3]);
    expect(exitLanes(4, 4, "right", 3)).toEqual([3]);
    expect(exitLanes(4, 2, "straight", 4)).toEqual([2]);
  });
});

describe("the joystick", () => {
  it("means 'away from me' at every seat", () => {
    const up = { x: 0, y: -1 };
    const away: Record<Seat, number> = {
      south: 0,
      west: 90,
      north: 180,
      east: -90,
    };
    for (const seat of SEATS) {
      expect(wrapPi(stickBearing(up, seat) - away[seat] * DEG)).toBeCloseTo(0);
      // And the knob's right is the learner's right.
      expect(
        wrapPi(stickBearing({ x: 1, y: 0 }, seat) - (away[seat] + 90) * DEG),
      ).toBeCloseTo(0);
    }
  });

  it("drives the same way on the table from any seat", () => {
    // From the north side the car on the south road comes toward you, so
    // "north" on the table is the knob pulled down.
    const knob: Record<Seat, [number, number]> = {
      south: [0, -1],
      west: [-1, 0],
      north: [0, 1],
      east: [1, 0],
    };
    for (const seat of SEATS) {
      drive.seat = seat;
      play(
        task("straight", 2),
        () => {
          [stick.x, stick.y] = knob[seat];
        },
        3,
      );
      expect(car.z, seat).toBeLessThan(50);
      expect(car.x, seat).toBeCloseTo(lanePoint("S", "approach", 2, 50).x, 0);
    }
  });

  it("stops the car when you let go", () => {
    play(
      task("straight", 2),
      (seconds) => {
        if (seconds < 3) point(0, 1);
        else letGo();
      },
      7,
    );
    expect(car.speed).toBe(0);
  });

  it("goes faster the further you push", () => {
    const speedAt = (push: number) => {
      let speed = 0;
      play(
        task("straight", 2),
        () => {
          point(0, push);
          speed = car.speed;
        },
        5,
      );
      return speed;
    };
    const gentle = speedAt(0.5);
    const full = speedAt(1);
    expect(gentle).toBeGreaterThan(1);
    expect(full).toBeGreaterThan(gentle + 2);
    expect(full).toBeLessThanOrEqual(CAR.maxSpeed);
  });

  it("brakes instead of spinning round when pulled straight back", () => {
    drive.assist = false;
    play(
      task("straight", 2),
      (seconds) => {
        point(seconds < 3 ? 0 : 180 * DEG, 1);
      },
      7,
    );
    expect(car.speed).toBe(0);
    expect(Math.abs(wrapPi(car.heading))).toBeLessThan(0.05);
  });
});

describe("driving properly", () => {
  const legal: [number, Turn][] = [
    [1, "left"],
    [1, "straight"],
    [2, "straight"],
    [3, "straight"],
    [3, "right"],
    [4, "right"],
    [4, "back"],
  ];
  for (const assist of [true, false]) {
    for (const [lane, turn] of legal) {
      it(`passes lane ${lane} going ${turn}, assist ${assist ? "on" : "off"}`, () => {
        drive.assist = assist;
        const result = proper(task(turn, lane), lane);
        expect(result.fault).toBeUndefined();
        expect(result.small).toEqual([]);
        expect(result.offRoad).toBe(false);
        expect(result.goal).toBe(true);
      });
    }

    it(`passes every shipped task, lane changes included, assist ${assist ? "on" : "off"}`, () => {
      drive.assist = assist;
      for (const challenge of TURN_TASKS) {
        const result = proper(challenge, SHIPPED_LANES[challenge.id]);
        expect(result.fault, challenge.id).toBeUndefined();
        expect(result.small, challenge.id).toEqual([]);
        expect(result.offRoad, challenge.id).toBe(false);
        expect(result.goal, challenge.id).toBe(true);
      }
    });
  }
});

describe("lane assist", () => {
  it("holds every lane, roundabout included, under a wobbly thumb", () => {
    const routes: [number, Turn][] = [
      [1, "straight"],
      [2, "straight"],
      [3, "right"],
      [4, "back"],
    ];
    for (const [lane, turn] of routes) {
      const challenge = task(turn, lane);
      const onward = follower(challenge, lanePath("S", lane, turn), {
        wobble: 20,
      });
      const laneX = lanePoint("S", "approach", lane, 40).x;
      let offRoadLane = 0;
      let offRingLane = 0;
      const result = play(challenge, (seconds, outcome) => {
        onward(seconds, outcome);
        const degrees = (bearingOf(car.x, car.z) / DEG + 360) % 360;
        const r = Math.hypot(car.x, car.z);
        // Coming up the road, and then round the west side of the roundabout,
        // between joining it and leaving it.
        if (car.z > 25 && car.z < 54 && car.x < 0) {
          offRoadLane = Math.max(offRoadLane, Math.abs(car.x - laneX));
        }
        if (r < 19 && degrees > 245 && degrees < 290) {
          offRingLane = Math.max(offRingLane, Math.abs(r - ringRadius(lane)));
        }
      });
      expect(result.fault, `lane ${lane}`).toBeUndefined();
      expect(result.small, `lane ${lane}`).toEqual([]);
      expect(result.goal, `lane ${lane}`).toBe(true);
      // A lane is 3.5 m wide and the car 1.8 m, so this keeps it inside.
      expect(offRoadLane, `lane ${lane} on the road`).toBeLessThan(0.5);
      expect(offRingLane, `lane ${lane} on the roundabout`).toBeLessThan(0.6);
    }
  });

  it("still holds every lane with the knob pushed all the way", () => {
    const routes: [number, Turn][] = [
      [1, "left"],
      [2, "straight"],
      [3, "right"],
      [4, "back"],
    ];
    for (const [lane, turn] of routes) {
      const result = proper(task(turn, lane), lane, { push: 1, wobble: 15 });
      expect(result.fault, `lane ${lane}`).toBeUndefined();
      expect(result.small, `lane ${lane}`).toEqual([]);
      expect(result.goal, `lane ${lane}`).toBe(true);
    }
  });

  it("joins the ring lane with the approach lane's number", () => {
    for (const lane of [1, 2, 3, 4]) {
      const challenge = task("back", lane);
      const onward = follower(challenge, lanePath("S", lane, "back"), {
        through: true,
      });
      let radius = 0;
      play(
        challenge,
        (seconds, outcome) => {
          onward(seconds, outcome);
          // A quarter of the way round, at the west side.
          if (radius === 0 && car.x < 0 && car.z < 0 && car.z > -3) {
            radius = Math.hypot(car.x, car.z);
          }
        },
        40,
      );
      expect(radius, `lane ${lane}`).toBeGreaterThan(ringRadius(lane) - 0.6);
      expect(radius, `lane ${lane}`).toBeLessThan(ringRadius(lane) + 0.6);
    }
  });

  it("lets go when the knob points at the next lane", () => {
    const result = proper(task("left", 3), 1);
    expect(result.small).toEqual([]);
    expect(result.goal).toBe(true);
  });
});

describe("solid things are solid", () => {
  it("the kerb stops the car and costs a star, and the drive goes on", () => {
    drive.assist = false;
    const challenge = task("straight", 1);
    const onward = follower(challenge, lanePath("S", 1, "straight"));
    let leftmost = 0;
    const result = play(challenge, (seconds, outcome) => {
      if (car.z > 25) leftmost = Math.min(leftmost, car.x);
      if (outcome.small.length === 0) point(-40 * DEG);
      else onward(seconds, outcome);
    });
    expect(result.small.map((f) => f.id)).toEqual(["kerb"]);
    expect(result.small[0].serious).toBe(false);
    expect(result.offRoad).toBe(false);
    // The middle of the car never gets past the edge of the tarmac.
    expect(leftmost).toBeGreaterThan(-armHalfWidth(ARMS.S));
    expect(result.goal).toBe(true);
  });

  it("no kerb wall stands on the road, anywhere on the board", () => {
    const physics = createPhysics(task("straight"), { ...car });
    const walls = Matter.Composite.allBodies(physics.engine.world).filter(
      (body) => body.isStatic && body.label === "kerb",
    );
    expect(walls.length).toBeGreaterThan(100);
    const blocked: string[] = [];
    for (let x = BOUNDS.x0 + 1; x < BOUNDS.x1; x += 1) {
      for (let z = BOUNDS.z0 + 1; z < BOUNDS.z1; z += 1) {
        // Well inside the tarmac, where a car's middle can be.
        if (!onTarmac(x, z, -0.9)) continue;
        if (Matter.Query.point(walls, { x: x * 10, y: z * 10 }).length > 0) {
          blocked.push(`${x},${z}`);
        }
      }
    }
    expect(blocked).toEqual([]);
  });

  it("the kerb behind a parking bay stops the car", () => {
    // In the aisle of the parking zone, pointed at the back of a bay.
    const state = { x: 39.7, z: -50, heading: 90 * DEG, speed: 0, steer: 0 };
    const physics = createPhysics(task("straight"), state);
    const touched = new Set<string>();
    let furthest = state.x;
    for (let i = 0; i < 60 * 8; i += 1) {
      physicsStep(physics, state, { steer: 0, throttle: 1, brake: 0 });
      for (const contact of physics.contacts) touched.add(contact);
      furthest = Math.max(furthest, state.x);
    }
    expect([...touched]).toEqual(["kerb"]);
    // The back of the bay is at 53.8 metres: the car's nose stops there.
    expect(furthest).toBeLessThan(53.8 - CAR.length / 2 + 0.3);
    expect(furthest).toBeGreaterThan(48);
  });

  it("the central reserve stops the car", () => {
    drive.assist = false;
    const challenge = task("right", 4);
    const onward = follower(challenge, lanePath("S", 4, "right"));
    let rightmost = -99;
    const result = play(challenge, (seconds, outcome) => {
      if (car.z > 25) rightmost = Math.max(rightmost, car.x);
      if (outcome.small.length === 0) point(40 * DEG);
      else onward(seconds, outcome);
    });
    expect(result.small.map((f) => f.id)).toEqual(["central_reserve"]);
    expect(result.offRoad).toBe(false);
    expect(rightmost).toBeLessThan(-ARMS.S.medianHalf);
    expect(result.goal).toBe(true);
  });

  it("the island stops the car", () => {
    drive.assist = false;
    let nearest = 99;
    const result = play(
      task("back", 4),
      (_, outcome) => {
        nearest = Math.min(nearest, Math.hypot(car.x, car.z));
        // Straight up the road, then into the middle of the roundabout.
        if (outcome.small.length > 0) letGo();
        else if (car.z > 21) point(0, 0.6);
        else point(bearingOf(-car.x, -car.z), 0.6);
      },
      30,
    );
    expect(result.small.map((f) => f.id)).toContain("island");
    expect(nearest).toBeGreaterThan(ISLAND_R);
  });

  it("the red car gets shoved, and that ends the attempt", () => {
    const challenge = TURN_TASKS.find((c) => c.id === "behind-red")!;
    const before = { ...challenge.otherCars[0] };
    const result = proper(challenge, 1, { through: true });
    expect(result.fault).toMatchObject({ id: "collision", serious: true });
    // It was parked facing west, and it has been pushed further west.
    expect(view.others[0].x).toBeLessThan(before.x - 0.3);
  });
});

describe("serious mistakes end the attempt", () => {
  it("lane 2 turning left, and says which lane to use", () => {
    const result = proper(task("left", 2), 2);
    expect(result.fault).toMatchObject({
      id: "wrong_exit",
      serious: true,
      lane: 2,
      turn: "left",
    });
    const tip = faultTip(result.fault!);
    expect(tip.reason).toContain("Lane 2 only goes straight");
    expect(tip.reason).toContain("approach in lane 1.");
    expect(tip.reason).toContain("Lane 4 can also do it, the long way round");
  });

  it("lane 1 turning right", () => {
    const result = proper(task("right", 1), 1);
    expect(result.fault).toMatchObject({ id: "wrong_exit", lane: 1 });
  });

  it("a legal turn that isn't the one asked for", () => {
    const challenge = task("left", 1);
    const result = play(
      challenge,
      follower(challenge, lanePath("S", 1, "straight")),
    );
    expect(result.fault).toMatchObject({
      id: "wrong_destination",
      turn: "straight",
      asked: "left",
    });
  });

  it("going all the way round outside lane 4", () => {
    const challenge = task("straight", 2);
    const result = play(
      challenge,
      follower(challenge, lanePath("S", 2, "straight", 56, 56, 1)),
    );
    expect(result.fault).toMatchObject({ id: "full_circle", lane: 2 });
  });

  it("but lane 4 may go round and round", () => {
    const challenge = task("back", 4);
    const result = play(
      challenge,
      follower(challenge, lanePath("S", 4, "back", 56, 56, 2)),
    );
    expect(result.fault).toBeUndefined();
    expect(result.goal).toBe(true);
  });

  it("driving against the traffic", () => {
    drive.assist = false;
    // Swings round to the left and comes back down its own side of the road.
    const result = play(
      task("straight", 4),
      () => {
        const turned = Math.abs(wrapPi(car.heading + 90 * DEG)) < 25 * DEG;
        const facingSouth =
          Math.abs(wrapPi(car.heading - 180 * DEG)) < 70 * DEG;
        point(turned || facingSouth ? 180 * DEG : -90 * DEG, 0.45);
      },
      30,
    );
    expect(result.fault).toMatchObject({ id: "wrong_way", serious: true });
  });

  it("leaving on the wrong side of the yellow centre line", () => {
    drive.assist = false;
    const challenge = task("left", 1);
    const path = [
      ...lanePath("S", 1, "left").filter((p) => p.x > 2 - ringRadius(1)),
      ...[20, 26, 32, 38, 44].map((along) =>
        lanePoint("W", "approach", 2, along),
      ),
    ];
    const result = play(challenge, follower(challenge, path));
    expect(result.fault).toMatchObject({ id: "centre_line", serious: true });
  });

  it("turning off into the parking zone, which no task uses", () => {
    drive.assist = false;
    const challenge = task("right", 3);
    // Round to the right, then left off the road into the parking aisle, once
    // past the continuous lines.
    const path = [
      ...lanePath("S", 3, "right", 56, 35),
      { x: 38.5, z: -9 },
      { x: 39.7, z: -16 },
      { x: 39.7, z: -30 },
      { x: 39.7, z: -45 },
    ];
    const result = play(
      challenge,
      follower(challenge, path, { through: true }),
    );
    expect(result.fault).toMatchObject({ id: "off_route", serious: true });
    expect(faultTip(result.fault!).reason).toContain("does not use");
  });

  it("turning back, then driving on past the box toward the roundabout", () => {
    const challenge = TURN_TASKS.find((c) => c.id === "turn-back")!;
    const result = play(
      challenge,
      turningBack(challenge, 2, { through: true }, 26),
    );
    expect(result.fault).toMatchObject({ id: "past_end" });
    expect(result.goal).toBe(false);
  });

  it("driving past the box to the end of the road", () => {
    const challenge = task("straight", 2);
    const result = play(
      challenge,
      follower(challenge, lanePath("S", 2, "straight", 56, 70), {
        through: true,
      }),
    );
    expect(result.fault).toMatchObject({ id: "past_end" });
    expect(result.goal).toBe(false);
  });
});

describe("lane discipline ends the attempt", () => {
  it("a lane change over the continuous lines before the roundabout", () => {
    const challenge = task("straight", 2);
    const onward = follower(challenge, lanePath("S", 3, "straight"));
    const result = play(challenge, (seconds, outcome) => {
      const loc = locate(car.x, car.z);
      const early = car.z > SOLID_ZONE - 2;
      const across = loc.kind === "arm" && loc.lane === 3;
      if (early) point(0);
      else if (!across && car.z > 20) point(45 * DEG);
      else onward(seconds, outcome);
    });
    expect(result.fault).toMatchObject({ id: "solid_line", serious: true });
    expect(result.goal).toBe(false);
  });

  it("the same lane change further back is fine", () => {
    const result = proper(task("straight", 2), 3);
    expect(result.small).toEqual([]);
    expect(result.goal).toBe(true);
  });

  it("settling into another lane on the roundabout", () => {
    drive.assist = false;
    const challenge = task("straight", 2);
    // Enters in lane 2, drifts in to ring lane 3, and still leaves north.
    const path = [
      ...lanePath("S", 2, "straight").filter((p) => p.z > 13),
      ...lanePath("S", 3, "straight").filter((p) => p.z <= 7),
    ];
    const result = play(challenge, follower(challenge, path));
    expect(result.fault).toMatchObject({
      id: "roundabout_lane_change",
      lane: 2,
      serious: true,
    });
    expect(result.goal).toBe(false);
  });

  it("leaving the roundabout in a different lane", () => {
    drive.assist = false;
    const challenge = task("straight", 2);
    // Comes round in lane 2 and steers out into lane 3 of the road north.
    const path = [
      ...lanePath("S", 2, "straight").filter((p) => p.z > -14),
      ...lanePath("S", 3, "straight").filter((p) => p.z <= -24),
    ];
    const result = play(challenge, follower(challenge, path));
    expect(result.fault).toMatchObject({
      id: "exit_lane",
      lane: 2,
      serious: true,
    });
    expect(faultTip(result.fault!).reason).toContain("lane 2");
    expect(result.goal).toBe(false);
  });
});

describe("small mistakes cost a star and the drive goes on", () => {

  it("stopping on the roundabout", () => {
    const challenge = task("straight", 2);
    const onward = follower(challenge, lanePath("S", 2, "straight"));
    let waited = 0;
    const result = play(challenge, (seconds, outcome) => {
      const degrees = (bearingOf(car.x, car.z) / DEG + 360) % 360;
      const onRing = Math.hypot(car.x, car.z) < 19;
      if (onRing && degrees > 250 && waited < 4.5) {
        letGo();
        waited += STEP;
      } else {
        onward(seconds, outcome);
      }
    });
    expect(result.small.map((f) => f.id)).toEqual(["roundabout_stop"]);
    expect(result.goal).toBe(true);
  });
});

// ---- tasks away from the roundabout: the street, the two-way road, parking ----

const ROUTE_TASKS = BOARD_CHALLENGES.filter(isRouteTask);

type RouteFollow = {
  /** Drive over stop lines without stopping. */
  runStopLines?: boolean;
  /** Metres to hold to the side of the route, to be in the wrong lane. */
  aside?: number;
  /**
   * Reversing, hold the knob this many degrees off the line the whole way,
   * the way a thumb does, instead of steering along it.
   */
  sloppyReverse?: number;
};

/**
 * A learner who knows the way: the knob points a few metres down the task's
 * route, they stop at each stop line, and they let go to stop at the end. On a
 * stretch in reverse the knob points where the tail has to go.
 */
function routeFollower(
  challenge: BoardChallenge,
  route: Route,
  options: RouteFollow = {},
) {
  const parks = taskParks(challenge);
  const waited = new Set<number>();
  let progress = 0;
  return () => {
    // near where it last was, so a route that crosses itself is not confused
    let best = Infinity;
    for (let d = Math.max(0, progress - 3); d <= progress + 8; d += 0.25) {
      const p = poseAt(route, d);
      const gap = Math.hypot(p.x - car.x, p.z - car.z);
      if (gap < best) {
        best = gap;
        progress = d;
      }
    }
    const speed = Math.abs(car.speed);
    const stopping = speed ** 2 / (2 * RELEASE_DECEL);

    if (!options.runStopLines) {
      for (let i = 0; i < route.steps.length; i += 1) {
        const step = route.steps[i];
        if (step.control !== "stop" || waited.has(i)) continue;
        const left = step.from - progress;
        if (left < 6 && left > -1.5 && left - stopping < 2.5) {
          letGo();
          if (speed < 0.05 && left < 6) waited.add(i);
          return;
        }
      }
    }

    // changing gear: come to a stop where the reverse begins
    const here0 = poseAt(route, progress);
    if (!here0.reversing && car.speed > 0.05) {
      const turnAround = route.steps.find(
        (step) => step.gear === "reverse" && step.from > progress,
      );
      if (turnAround && turnAround.from - progress - stopping < 0.4) {
        letGo();
        return;
      }
    }

    const end = route.length - (parks ? 0 : 6);
    if (progress + stopping >= end - (parks ? 0.15 : 0)) {
      letGo();
      return;
    }

    const here = poseAt(route, progress);
    const aim = poseAt(route, Math.min(route.length, progress + (here.reversing ? 3 : 4.5)));
    let bearing = bearingOf(aim.x - car.x, aim.z - car.z);
    if (options.aside) {
      const side = poseAt(route, Math.min(route.length, progress + 6));
      const left = side.heading - Math.PI / 2;
      bearing = bearingOf(
        side.x + Math.sin(left) * options.aside - car.x,
        side.z - Math.cos(left) * options.aside - car.z,
      );
    }
    if (here.reversing && options.sloppyReverse != null) {
      // roughly the way the reverse goes, and no better than that
      const step = route.steps[here.step];
      const middle = poseAt(route, (step.from + step.to) / 2);
      bearing = middle.heading + Math.PI + options.sloppyReverse * DEG;
    }
    point(bearing, here.reversing ? 0.6 : 0.7);
  };
}

describe("the parked cars move, and the bay to take with them", () => {
  const PARKING_TASKS = ROUTE_TASKS.filter((c) => c.otherCars.length > 0);
  afterEach(() => setParkingLayout(PARKING_LAYOUTS[0].id));

  it("always dresses the board with the same number of cars", () => {
    for (const layout of PARKING_LAYOUTS) {
      expect(layout.right.length + layout.left.length, layout.id).toBe(3);
      expect(layout.flush.length, layout.id).toBe(1);
      expect(parkedCars(layout).length).toBe(4);
    }
  });

  it("sends the learner to the farthest free bay", () => {
    const seen = new Set<number>();
    for (const layout of PARKING_LAYOUTS) {
      const target = targetBays(layout);
      seen.add(target.angleBay);
      expect(layout.right).not.toContain(target.angleBay);
      // every bay beyond it, toward the far end, is taken
      for (let n = 1; n < target.angleBay; n += 1) {
        expect(layout.right, layout.id).toContain(n);
      }
      expect(layout.flush).not.toContain(target.flushBay);
    }
    expect(seen.size).toBe(PARKING_LAYOUTS.length);
  });

  it("never deals the layout that is already showing", () => {
    for (let i = 0; i < 20; i += 1) {
      const before = parkingLayout().id;
      shuffleParkingLayout();
      expect(parkingLayout().id).not.toBe(before);
    }
  });

  for (const layout of PARKING_LAYOUTS.slice(1)) {
    for (const task of PARKING_TASKS) {
      it(`passes "${task.title}" with the cars laid out "${layout.id}"`, () => {
        setParkingLayout(layout.id);
        const route = challengeRoute(task)!;
        const end = route.points[route.points.length - 1];
        const start = route.points[0];
        // no parked car stands where the task starts or ends
        for (const other of task.otherCars) {
          expect(Math.hypot(other.x - end.x, other.z - end.z)).toBeGreaterThan(3);
          expect(Math.hypot(other.x - start.x, other.z - start.z)).toBeGreaterThan(3);
        }
        const result = play(task, routeFollower(task, route), 240);
        expect(result.fault, task.id).toBeUndefined();
        expect(result.small, task.id).toEqual([]);
        expect(result.goal, task.id).toBe(true);
      });
    }
  }
});

describe("no stopping on a pedestrian crossing", () => {
  const task = ROUTE_TASKS.find((c) => c.id === "park-flush")!;
  const CROSSING_Z = -22.1;

  /** Drive the task, waiting `seconds` once the car is `ahead` metres short of the crossing's middle. */
  function waitingAt(ahead: number, seconds: number) {
    const route = challengeRoute(task)!;
    const onward = routeFollower(task, route);
    let waited = 0;
    return play(
      task,
      () => {
        if (car.z - CROSSING_Z < ahead && waited < seconds) {
          letGo();
          if (Math.abs(car.speed) < 0.05) waited += STEP;
          return;
        }
        onward();
      },
      300,
    );
  }

  it("costs a star for standing on it", () => {
    const result = waitingAt(2.5, 4);
    expect(result.small.map((f) => f.id)).toEqual(["crossing_stop"]);
    expect(faultTip(result.small[0]).rule).toContain("pedestrian crossing");
    expect(result.goal).toBe(true);
  });

  it("costs nothing for stopping short of it", () => {
    const result = waitingAt(14, 4);
    expect(result.small).toEqual([]);
    expect(result.goal).toBe(true);
  });
});

describe("tasks away from the roundabout", () => {
  for (const assist of [true, false]) {
    for (const challenge of ROUTE_TASKS) {
      it(`passes "${challenge.title}", assist ${assist ? "on" : "off"}`, () => {
        drive.assist = assist;
        const route = challengeRoute(challenge)!;
        const result = play(challenge, routeFollower(challenge, route), 240);
        expect(result.fault, challenge.id).toBeUndefined();
        expect(result.small, challenge.id).toEqual([]);
        expect(result.goal, challenge.id).toBe(true);
      });
    }
  }

  for (const id of ["leave-angle", "park-flush"]) {
    for (const off of [-22, 22]) {
      it(`parking assist steers the reverse in "${id}" with the knob ${off} degrees out`, () => {
        const challenge = ROUTE_TASKS.find((c) => c.id === id)!;
        const route = challengeRoute(challenge)!;
        const result = play(
          challenge,
          routeFollower(challenge, route, { sloppyReverse: off }),
          240,
        );
        expect(result.fault, id).toBeUndefined();
        expect(result.small, id).toEqual([]);
        expect(result.goal, id).toBe(true);
      });
    }
  }

  it("running a stop line ends the attempt", () => {
    const challenge = ROUTE_TASKS.find((c) => c.id === "down-the-street")!;
    const route = challengeRoute(challenge)!;
    const result = play(
      challenge,
      routeFollower(challenge, route, { runStopLines: true }),
      240,
    );
    expect(result.fault).toMatchObject({ id: "stop_line", serious: true });
  });

  it("coming up to the roundabout a lane out ends the attempt", () => {
    const challenge = ROUTE_TASKS.find((c) => c.id === "from-two-way")!;
    const route = challengeRoute(challenge)!;
    const result = play(
      challenge,
      routeFollower(challenge, route, { aside: -3.6 }),
      240,
    );
    expect(result.fault?.id).toMatch(/wrong_lane|off_route|centre_line|wrong_way/);
  });

  it("turning into the street from the second lane ends the attempt", () => {
    const challenge = ROUTE_TASKS.find((c) => c.id === "down-the-street")!;
    const route = challengeRoute(challenge)!;
    // one lane to the right of the route: lane 2, where the route is in lane 1
    const result = play(
      challenge,
      routeFollower(challenge, route, { aside: -3.6 }),
      240,
    );
    expect(result.fault).toMatchObject({ id: "wrong_lane", serious: true });
  });

  it("driving off down another road ends the attempt", () => {
    const challenge = ROUTE_TASKS.find((c) => c.id === "down-the-street")!;
    // straight on down the dual carriageway, past the street
    // It never left lane 3 for the turn, and then it missed the turn.
    const result = play(challenge, () => point(Math.PI, 0.8), 120);
    expect(result.fault?.id).toMatch(/wrong_lane|off_route/);
    expect(result.fault?.serious).toBe(true);
  });

  it("the car only reverses in a task that has a reverse gear", () => {
    const parking = ROUTE_TASKS.find((c) => c.id === "leave-angle")!;
    let back = 0;
    play(
      parking,
      () => {
        point(car.heading + Math.PI, 0.7);
        back = Math.min(back, car.speed);
      },
      3,
    );
    expect(back).toBeLessThan(-0.5);

    let slowest = 0;
    play(
      TURN_TASKS[0],
      () => {
        point(car.heading + Math.PI, 0.7);
        slowest = Math.min(slowest, car.speed);
      },
      3,
    );
    expect(slowest).toBe(0);
  });

  it("starts every task on the road, clear of the frame, and ends in reach", () => {
    for (const challenge of ROUTE_TASKS) {
      const route = challengeRoute(challenge)!;
      expect(route.length).toBeGreaterThan(15);
      expect(distanceNear(route, poseAt(route, 0))).toBeLessThan(0.1);
    }
  });
});
