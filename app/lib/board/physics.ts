/**
 * Collisions, by Matter.js. The learner's car is driven by the lane-keeping
 * driver and placed here each step, so Matter can tell when it touches another
 * car and shove that car out of the way. Once that happens the learner's car is
 * handed over to Matter too, and the two slide to a stop like a real bump.
 *
 * Matter runs without a browser, so this is covered by the unit tests.
 */
import Matter from "matter-js";

import { CAR, type CarState } from "./car-sim";
import type { BoardChallenge } from "./challenges";
import { ISLAND_R, dirOf } from "./geometry";

const { Bodies, Body, Composite, Engine, Events } = Matter;

/** Matter's tolerances suit bodies tens of units across, so work in decimetres. */
const SCALE = 10;
const STEP_MS = 1000 / 60;
/** How long the cars slide after a hit before the attempt is called. */
const CRASH_TIME = 0.9;

export type OtherPose = { x: number; z: number; heading: number };

export type Physics = {
  engine: Matter.Engine;
  player: Matter.Body;
  others: Matter.Body[];
  /** Where the other cars are now. Read by the renderer. */
  poses: OtherPose[];
  crashed: boolean;
  crashTime: number;
  /** How hard the hit was, 0 to 1, for the shake and the sound. */
  impact: number;
};

function carBody(x: number, z: number, heading: number, air: number) {
  return Bodies.rectangle(
    x * SCALE,
    z * SCALE,
    CAR.width * SCALE,
    CAR.length * SCALE,
    {
      angle: heading,
      chamfer: { radius: 0.35 * SCALE },
      frictionAir: air,
      friction: 0.4,
      restitution: 0.25,
    },
  );
}

export function createPhysics(challenge: BoardChallenge, car: CarState) {
  const engine = Engine.create({ gravity: { x: 0, y: 0 } });
  const player = carBody(car.x, car.z, car.heading, 0.07);
  const others = challenge.otherCars.map((other) =>
    carBody(other.x, other.z, other.heading, 0.09),
  );
  const island = Bodies.circle(0, 0, ISLAND_R * SCALE, { isStatic: true });
  Composite.add(engine.world, [player, ...others, island]);

  const physics: Physics = {
    engine,
    player,
    others,
    poses: challenge.otherCars.map(({ x, z, heading }) => ({ x, z, heading })),
    crashed: false,
    crashTime: 0,
    impact: 0,
  };

  Events.on(engine, "collisionStart", (event) => {
    if (physics.crashed) return;
    for (const pair of event.pairs) {
      const other =
        pair.bodyA === player
          ? pair.bodyB
          : pair.bodyB === player
            ? pair.bodyA
            : null;
      if (other && others.includes(other)) {
        physics.crashed = true;
        physics.impact = Math.min(1, Body.getSpeed(player) / (0.8 * SCALE));
      }
    }
  });
  return physics;
}

/**
 * Advance the world one step. Before a crash the learner's car goes where the
 * driver put it; after one, the car goes where the crash sends it. Returns true
 * once a crash has played out.
 */
export function physicsStep(physics: Physics, car: CarState): boolean {
  const { player } = physics;
  if (!physics.crashed) {
    const dir = dirOf(car.heading);
    // Matter measures speed per step, not per second.
    const perStep = (car.speed * SCALE) / 60;
    Body.setPosition(player, { x: car.x * SCALE, y: car.z * SCALE });
    Body.setAngle(player, car.heading);
    Body.setVelocity(player, { x: dir.x * perStep, y: dir.z * perStep });
    Body.setAngularVelocity(player, 0);
  }

  Engine.update(physics.engine, STEP_MS);

  physics.others.forEach((body, i) => {
    const pose = physics.poses[i];
    pose.x = body.position.x / SCALE;
    pose.z = body.position.y / SCALE;
    pose.heading = body.angle;
  });

  if (!physics.crashed) return false;
  car.x = player.position.x / SCALE;
  car.z = player.position.y / SCALE;
  car.heading = player.angle;
  car.speed = (Body.getSpeed(player) * 60) / SCALE;
  car.steer = 0;
  physics.crashTime += 1 / 60;
  return physics.crashTime >= CRASH_TIME;
}
