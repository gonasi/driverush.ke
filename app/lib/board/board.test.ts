import { describe, expect, it } from "vitest";

import { stepCar, type CarInput, type CarState } from "./car-sim";
import { BOARD_CHALLENGES, type BoardChallenge } from "./challenges";
import {
  ARMS,
  allowedTurns,
  armForTurn,
  bearingOf,
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
import { STICK_DEADZONE, stickToInput, type Stick } from "./joystick";
import { lanePath } from "./lane-paths";
import { faultTip } from "./board-rules";
import { createRef, refStep, type Fault } from "./referee";

const STEP = 1 / 60;

function challenge(turn: Turn, id = "test"): BoardChallenge {
  return {
    id,
    title: id,
    prompt: id,
    start: { arm: "S", lane: 1, along: 50 },
    turn,
    goal: { arm: armForTurn("S", turn), alongMin: 33, alongMax: 44 },
    otherCars: [],
  };
}

/** Drive a path with a simple follower, the way a careful learner would. */
function drive(
  path: Vec[],
  task: BoardChallenge,
  options: { stopAt?: Vec; cruise?: number; seconds?: number } = {},
): { fault?: Fault; goal: boolean; car: CarState } {
  const car: CarState = {
    x: path[0].x,
    z: path[0].z,
    heading: bearingOf(path[1].x - path[0].x, path[1].z - path[0].z),
    speed: 0,
    steer: 0,
  };
  const ref = createRef();
  const input: CarInput = { steer: 0, throttle: 0, brake: 0 };
  const cruise = options.cruise ?? 4.5;
  let nearest = 0;
  const steps = Math.round((options.seconds ?? 90) / STEP);
  for (let i = 0; i < steps; i += 1) {
    while (
      nearest < path.length - 1 &&
      Math.hypot(path[nearest + 1].x - car.x, path[nearest + 1].z - car.z) <
        Math.hypot(path[nearest].x - car.x, path[nearest].z - car.z)
    ) {
      nearest += 1;
    }
    const target = path[Math.min(path.length - 1, nearest + 2)];
    const want = bearingOf(target.x - car.x, target.z - car.z);
    input.steer = Math.max(-1, Math.min(1, wrapPi(want - car.heading) * 2.2));

    const stop = options.stopAt;
    const braking =
      stop != null && Math.hypot(stop.x - car.x, stop.z - car.z) < 2.5;
    input.throttle = !braking && car.speed < cruise ? 1 : 0;
    input.brake = braking ? 1 : 0;

    stepCar(car, input, STEP);
    const result = refStep(ref, task, car, STEP);
    if (result.fault) return { fault: result.fault, goal: false, car };
    if (result.goal) return { goal: true, car };
  }
  return { goal: false, car };
}

function boxCentre(task: BoardChallenge, lane: number): Vec {
  const goal = task.goal;
  return lanePoint(
    goal.arm,
    "exit",
    goal.lane ?? lane,
    (goal.alongMin + goal.alongMax) / 2,
  );
}

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
  });
});

describe("the referee, on correct drives", () => {
  const legal: [number, Turn][] = [
    [1, "left"],
    [1, "straight"],
    [2, "straight"],
    [3, "straight"],
    [3, "right"],
    [4, "right"],
    [4, "back"],
  ];
  for (const [lane, turn] of legal) {
    it(`passes lane ${lane} going ${turn}`, () => {
      const task = challenge(turn);
      const result = drive(lanePath("S", lane, turn), task, {
        stopAt: boxCentre(task, Math.min(lane, ARMS[task.goal.arm].lanes)),
      });
      expect(result.fault).toBeUndefined();
      expect(result.goal).toBe(true);
    });
  }

  it("passes every shipped challenge when driven properly", () => {
    const lanes: Record<string, number> = {
      straight: 2,
      left: 1,
      right: 3,
      back: 4,
      "behind-red": 1,
    };
    for (const task of BOARD_CHALLENGES) {
      const lane = lanes[task.id];
      const result = drive(lanePath("S", lane, task.turn), task, {
        stopAt: boxCentre(task, lane),
      });
      expect(result.fault, task.id).toBeUndefined();
      expect(result.goal, task.id).toBe(true);
    }
  });
});

describe("the referee, on faults", () => {
  it("faults lane 2 turning left, and says which lane to use", () => {
    const result = drive(lanePath("S", 2, "left"), challenge("left"));
    expect(result.fault).toMatchObject({
      id: "wrong_exit",
      lane: 2,
      turn: "left",
    });
    const tip = faultTip(result.fault!);
    expect(tip.reason).toContain("Lane 2 only goes straight");
    expect(tip.reason).toContain("lane 1 or 4");
  });

  it("faults lane 1 turning right", () => {
    const result = drive(lanePath("S", 1, "right"), challenge("right"));
    expect(result.fault).toMatchObject({ id: "wrong_exit", lane: 1 });
  });

  it("faults a legal turn that isn't the one asked for", () => {
    const result = drive(lanePath("S", 1, "straight"), challenge("left"));
    expect(result.fault).toMatchObject({
      id: "wrong_destination",
      turn: "straight",
      asked: "left",
    });
  });

  it("faults changing lanes on the roundabout", () => {
    // Enters in lane 2, then drifts in to ring lane 3 and stays there.
    const start = lanePath("S", 2, "straight").filter((p) => p.z > 12);
    const inner = lanePath("S", 3, "right").filter((p) => p.z <= 6 || p.x > 0);
    const result = drive([...start, ...inner], challenge("right"));
    expect(result.fault).toMatchObject({
      id: "roundabout_lane_change",
      lane: 2,
    });
  });

  it("faults stopping on the roundabout", () => {
    const path = lanePath("S", 2, "straight");
    const onRing = path.find((p) => Math.hypot(p.x, p.z) < 14.5 && p.x < -12)!;
    const result = drive(path, challenge("straight"), { stopAt: onRing });
    expect(result.fault).toMatchObject({ id: "roundabout_stop" });
  });

  it("faults driving onto the grass", () => {
    const result = drive(
      [
        { x: -13, z: 50 },
        { x: -13, z: 45 },
        { x: -30, z: 35 },
        { x: -40, z: 30 },
      ],
      challenge("left"),
    );
    expect(result.fault).toMatchObject({ id: "off_road" });
  });

  it("faults going round the wrong way", () => {
    const clockwise = lanePath("S", 2, "straight").filter((p) => p.z > 13);
    const result = drive(
      [
        ...clockwise,
        { x: -6, z: 12 },
        { x: 0, z: 13.5 },
        { x: 8, z: 11 },
        { x: 13, z: 4 },
      ],
      challenge("right"),
    );
    expect(result.fault).toMatchObject({ id: "wrong_way" });
  });

  it("faults leaving on the wrong side of the yellow centre line", () => {
    const path = lanePath("S", 1, "left").filter((p) => p.x > -15);
    const wrongSide = [20, 26, 32, 38, 44].map((along) =>
      lanePoint("W", "approach", 2, along),
    );
    const result = drive([...path, ...wrongSide], challenge("left"));
    expect(result.fault).toMatchObject({ id: "centre_line" });
  });

  it("faults running into the red car", () => {
    const task = BOARD_CHALLENGES.find((c) => c.id === "behind-red")!;
    const result = drive(lanePath("S", 1, "left"), task);
    expect(result.fault).toMatchObject({ id: "collision" });
  });

  it("doesn't pass a car that rolls through the box without stopping", () => {
    const task = challenge("straight");
    const result = drive(lanePath("S", 2, "straight", 50, 58), task);
    expect(result.goal).toBe(false);
  });
});

/** Drive a path the way a learner does: by pointing the knob at the road ahead. */
function driveByStick(
  path: Vec[],
  task: BoardChallenge,
  stopAt: Vec,
  push = 0.6,
): { fault?: Fault; goal: boolean } {
  const car: CarState = {
    x: path[0].x,
    z: path[0].z,
    heading: bearingOf(path[1].x - path[0].x, path[1].z - path[0].z),
    speed: 0,
    steer: 0,
  };
  const ref = createRef();
  const input: CarInput = { steer: 0, throttle: 0, brake: 0 };
  const stick: Stick = { x: 0, y: 0 };
  let nearest = 0;
  for (let i = 0; i < 120 / STEP; i += 1) {
    while (
      nearest < path.length - 1 &&
      Math.hypot(path[nearest + 1].x - car.x, path[nearest + 1].z - car.z) <
        Math.hypot(path[nearest].x - car.x, path[nearest].z - car.z)
    ) {
      nearest += 1;
    }
    const target = path[Math.min(path.length - 1, nearest + 3)];
    const dx = target.x - car.x;
    const dz = target.z - car.z;
    const reach = Math.hypot(dx, dz) || 1;
    const letGo = Math.hypot(stopAt.x - car.x, stopAt.z - car.z) < 2.5;
    // World x and z are the screen's x and y: the camera faces north.
    stick.x = letGo ? 0 : (dx / reach) * push;
    stick.y = letGo ? 0 : (dz / reach) * push;

    stickToInput(stick, car, input);
    stepCar(car, input, STEP);
    const result = refStep(ref, task, car, STEP);
    if (result.fault) return { fault: result.fault, goal: false };
    if (result.goal) return { goal: true };
  }
  return { goal: false };
}

describe("the joystick", () => {
  const fresh = (heading = 0, speed = 0): CarState => ({
    x: 0,
    z: 40,
    heading,
    speed,
    steer: 0,
  });
  const run = (car: CarState, stick: Stick, seconds: number) => {
    const input: CarInput = { steer: 0, throttle: 0, brake: 0 };
    for (let i = 0; i < seconds / STEP; i += 1) {
      stickToInput(stick, car, input);
      stepCar(car, input, STEP);
    }
    return car;
  };

  it("stops the car when you let go", () => {
    const car = run(fresh(0, 8), { x: 0, y: 0 }, 3);
    expect(car.speed).toBe(0);
    // A nudge inside the dead zone is still letting go.
    const nudged = run(fresh(0, 8), { x: 0, y: -STICK_DEADZONE / 2 }, 3);
    expect(nudged.speed).toBe(0);
  });

  it("drives straight north when pushed up", () => {
    const car = run(fresh(), { x: 0, y: -1 }, 3);
    expect(car.z).toBeLessThan(30);
    expect(car.x).toBeCloseTo(0, 5);
    expect(car.heading).toBeCloseTo(0, 5);
  });

  it("goes faster the further you push", () => {
    const gentle = run(fresh(), { x: 0, y: -0.5 }, 6);
    const full = run(fresh(), { x: 0, y: -1 }, 6);
    expect(gentle.speed).toBeGreaterThan(1);
    expect(full.speed).toBeGreaterThan(gentle.speed + 2);
  });

  it("turns toward where the knob points, whichever way the car faces", () => {
    // Heading south, knob pushed to the screen's left: the car ends up going west.
    const car = run(fresh(Math.PI, 3), { x: -1, y: 0 }, 4);
    expect(Math.abs(wrapPi(car.heading - -Math.PI / 2))).toBeLessThan(0.15);
    expect(car.x).toBeLessThan(-3);
  });

  it("brakes instead of spinning round when pulled straight back", () => {
    const car = run(fresh(0, 6), { x: 0, y: 1 }, 3);
    expect(car.speed).toBe(0);
    expect(car.heading).toBeCloseTo(0, 5);
    expect(car.x).toBeCloseTo(0, 5);
  });

  it("gets every shipped task right when pointed along the road", () => {
    const lanes: Record<string, number> = {
      straight: 2,
      left: 1,
      right: 3,
      back: 4,
      "behind-red": 1,
    };
    for (const task of BOARD_CHALLENGES) {
      const lane = lanes[task.id];
      const result = driveByStick(
        lanePath("S", lane, task.turn),
        task,
        boxCentre(task, lane),
      );
      expect(result.fault, task.id).toBeUndefined();
      expect(result.goal, task.id).toBe(true);
    }
  });

  it("holds the inner roundabout lane even at full push", () => {
    const task = BOARD_CHALLENGES.find((c) => c.id === "back")!;
    const result = driveByStick(
      lanePath("S", 4, "back"),
      task,
      boxCentre(task, 4),
      1,
    );
    expect(result.fault).toBeUndefined();
    expect(result.goal).toBe(true);
  });
});
