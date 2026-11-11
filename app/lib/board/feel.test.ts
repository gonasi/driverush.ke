/**
 * How the drive feels, as far as numbers can say: the engine eases onto its
 * speed, a car wedged on a kerb frees itself, the clock waits for the learner,
 * and the car is drawn between physics steps.
 */
import { beforeAll, describe, expect, it } from "vitest";

import { CAR, type CarInput, type CarState } from "./car";
import type { TurnChallenge } from "./challenges";
import { armForTurn, wrapPi } from "./geometry";
import { createAssist, stickToInput } from "./joystick";
import { createPhysics, physicsStep } from "./physics";
import {
  beginChallenge,
  car,
  drive,
  elapsedSeconds,
  hasMoved,
  loadPhysics,
  setPaused,
  shown,
  stick,
  stopDriving,
  tick,
  trail,
} from "./runtime";

const STEP = 1 / 60;
const DEG = Math.PI / 180;

const TASK: TurnChallenge = {
  id: "test",
  title: "test",
  prompt: "test",
  start: { arm: "S", lane: 2, along: 56 },
  turn: "straight",
  goal: { arm: armForTurn("S", "straight"), alongMin: 33, alongMax: 44 },
  otherCars: [],
};

const NOTHING = { onFault: () => {}, onSmall: () => {}, onGoal: () => {} };

/** Push the knob toward a compass bearing, as seen from the south seat. */
function point(bearing: number, push = 1): void {
  stick.x = Math.sin(bearing) * push;
  stick.y = -Math.cos(bearing) * push;
}

beforeAll(async () => {
  await loadPhysics();
  drive.seat = "south";
});

describe("the engine", () => {
  it("eases onto the speed asked for instead of switching on and off", () => {
    const state: CarState = { x: 0, z: 0, heading: 0, speed: 3, steer: 0 };
    const input: CarInput = { steer: 0, throttle: 0, brake: 0 };
    const options = { seat: "south" as const, assist: false };
    // Half a push asks for a little under half speed.
    const half = { x: 0, y: -0.59 };
    stickToInput(half, state, input, options, createAssist());
    const far = input.throttle;
    state.speed = 3.4;
    stickToInput(half, state, input, options, createAssist());
    const near = input.throttle;
    expect(far).toBeGreaterThan(near);
    expect(near).toBeGreaterThan(0);
    expect(near).toBeLessThan(1);
    // Already at the speed: nothing more from the engine.
    state.speed = 3.6;
    stickToInput(half, state, input, options, createAssist());
    expect(input.throttle).toBe(0);
  });

  it("still gives everything from a standstill", () => {
    const state: CarState = { x: 0, z: 0, heading: 0, speed: 0, steer: 0 };
    const input: CarInput = { steer: 0, throttle: 0, brake: 0 };
    stickToInput(
      { x: 0, y: -1 },
      state,
      input,
      { seat: "south", assist: false },
      createAssist(),
    );
    expect(input.throttle).toBe(1);
  });
});

describe("a car wedged on a kerb", () => {
  it("backs off and swings round, with the engine held on", () => {
    const state: CarState = { ...startOf(), heading: -70 * DEG };
    const physics = createPhysics(TASK, state);
    // Straight at the kerb on the left of the road, until it is hit.
    const input: CarInput = { steer: 0, throttle: 1, brake: 0 };
    let touched = false;
    for (let i = 0; i < 4 / STEP && !touched; i += 1) {
      physicsStep(physics, state, input);
      touched = physics.contacts.includes("kerb");
    }
    expect(touched).toBe(true);
    // Then the thumb asks for the road again, without ever letting go.
    input.steer = 1;
    let fastest = 0;
    for (let i = 0; i < 5 / STEP; i += 1) {
      physicsStep(physics, state, input);
      fastest = Math.max(fastest, state.speed);
    }
    // Within a few seconds it is pointing up the road again and rolling.
    expect(Math.abs(wrapPi(state.heading))).toBeLessThan(60 * DEG);
    expect(fastest).toBeGreaterThan(2);
  });

  it("is not thrown backwards when it is only pulling away gently", () => {
    const state: CarState = { ...startOf() };
    const physics = createPhysics(TASK, state);
    const from = state.z;
    // North is up the road, which is -z. A whisper of throttle for a second.
    for (let i = 0; i < 1 / STEP; i += 1) {
      physicsStep(physics, state, { steer: 0, throttle: 0.02, brake: 0 });
      expect(state.z).toBeLessThanOrEqual(from + 1e-6);
    }
  });
});

function startOf(): CarState {
  beginChallenge(TASK, NOTHING);
  const at = { x: car.x, z: car.z, heading: car.heading, speed: 0, steer: 0 };
  stopDriving();
  return at;
}

describe("leaning on a kerb", () => {
  it("costs one star, however long the thumb is held there", () => {
    drive.assist = false;
    const small: string[] = [];
    beginChallenge(TASK, {
      onFault: () => {},
      onSmall: (fault) => small.push(fault.id),
      onGoal: () => {},
    });
    // West, into the kerb on the left of the road, and held there.
    point(-90 * DEG);
    for (let i = 0; i < 10 / STEP; i += 1) tick(STEP);
    stopDriving();
    drive.assist = true;
    expect(small).toEqual(["kerb"]);
  });
});

describe("the clock", () => {
  it("waits for the first push of the joystick", () => {
    beginChallenge(TASK, NOTHING);
    for (let i = 0; i < 120; i += 1) tick(STEP);
    expect(hasMoved()).toBe(false);
    expect(elapsedSeconds()).toBe(0);
    point(0);
    for (let i = 0; i < 60; i += 1) tick(STEP);
    expect(hasMoved()).toBe(true);
    expect(elapsedSeconds()).toBeCloseTo(1, 1);
    stopDriving();
  });

  it("and the car hold still while something is over the table", () => {
    beginChallenge(TASK, NOTHING);
    point(0);
    for (let i = 0; i < 60; i += 1) tick(STEP);
    const at = { z: car.z, seconds: elapsedSeconds() };
    setPaused(true);
    for (let i = 0; i < 60; i += 1) tick(STEP);
    expect(car.z).toBe(at.z);
    expect(elapsedSeconds()).toBe(at.seconds);
    setPaused(false);
    point(0);
    for (let i = 0; i < 30; i += 1) tick(STEP);
    expect(car.z).toBeLessThan(at.z);
    stopDriving();
  });
});

describe("what the scene draws", () => {
  it("puts the car between two physics steps on a faster screen", () => {
    beginChallenge(TASK, NOTHING);
    point(0);
    for (let i = 0; i < 90; i += 1) tick(STEP);
    // Half a step of frame: one step has not run, so the car is drawn where
    // it was plus half the way to where it is.
    const before = car.z;
    tick(STEP * 1.5);
    const after = car.z;
    expect(after).toBeLessThan(before);
    expect(shown.z).toBeLessThan(before);
    expect(shown.z).toBeGreaterThan(after);
    stopDriving();
    expect(shown.z).toBe(car.z);
  });

  it("keeps the line the car drove, for the examiner's card", () => {
    beginChallenge(TASK, NOTHING);
    point(0);
    for (let i = 0; i < 180; i += 1) tick(STEP);
    expect(trail.length).toBeGreaterThan(5);
    expect(trail[0].z).toBeGreaterThan(trail[trail.length - 1].z);
    beginChallenge(TASK, NOTHING);
    expect(trail.length).toBe(1);
    stopDriving();
  });
});

// The car's top speed is what the tests above lean on.
it("the car's numbers are the ones these tests assume", () => {
  expect(CAR.maxSpeed).toBe(7);
});
