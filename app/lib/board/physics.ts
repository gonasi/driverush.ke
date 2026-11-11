/**
 * The table top as a physics world, by Matter.js. The learner's car is a real
 * body with weight and momentum: the engine pushes it along its heading, the
 * tyres stop it sliding sideways, and how sharply it turns depends on its
 * speed. Kerbs, the central reserves, the island and the ends of the roads are
 * solid, so the car bumps into them instead of driving over them. Other cars
 * can be shoved.
 *
 * The table is flat, so two dimensions are all the car needs. Matter runs
 * without a browser, so all of this is covered by the unit tests.
 */
import Matter from "matter-js";

import { CAR, type CarInput, type CarState } from "./car";
import type { BoardChallenge } from "./challenges";
import { BOUNDS, kerbSegments, onTarmac, reserves } from "./full-board";
import { ISLAND_R } from "./geometry";

const { Bodies, Body, Composite, Engine, Events } = Matter;

/** Matter's tolerances suit bodies tens of units across, so work in decimetres. */
const SCALE = 10;
const STEP_MS = 1000 / 60;
const DT = 1 / 60;
/** The share of sideways speed the tyres kill each step. No drifting. */
const GRIP = 0.9;
/** How long the cars slide after a hit before the attempt is called. */
const CRASH_TIME = 0.9;
/** Slower than this with the throttle on means the car is blocked. */
const STALL_SPEED = 0.3;
const STALL_TIME = 0.35;
/** How fast a blocked car turns, as if it were rolling at this speed. */
const PIVOT_SPEED = 1.2;
/** Kerbs are drawn thin but stop the car like a wall this thick. */
const KERB_DEPTH = 2;

/** What the learner's car has just touched. */
export type Contact = "kerb" | "reserve" | "island" | "end" | "car";

export type OtherPose = { x: number; z: number; heading: number };

export type Physics = {
  engine: Matter.Engine;
  player: Matter.Body;
  others: Matter.Body[];
  /** Where the other cars are now. Read by the scene. */
  poses: OtherPose[];
  /** New contacts made during the latest step. */
  contacts: Contact[];
  crashed: boolean;
  crashTime: number;
  /** How hard the latest hit was, 0 to 1, for the shake and the sound. */
  impact: number;
  steer: number;
  /** How long the car has been pushing against something without moving. */
  stalled: number;
};

function carBody(x: number, z: number, heading: number, label: string) {
  return Bodies.rectangle(
    x * SCALE,
    z * SCALE,
    CAR.width * SCALE,
    CAR.length * SCALE,
    {
      label,
      angle: heading,
      chamfer: { radius: 0.35 * SCALE },
      frictionAir: label === "car" ? 0.09 : 0,
      // The learner's car slides along a kerb rather than sticking to it.
      friction: label === "car" ? 0.2 : 0,
      restitution: 0.15,
    },
  );
}

/** A fixed box, given by two opposite corners in metres. */
function box(x0: number, z0: number, x1: number, z1: number, label: Contact) {
  return Bodies.rectangle(
    ((x0 + x1) / 2) * SCALE,
    ((z0 + z1) / 2) * SCALE,
    Math.abs(x1 - x0) * SCALE,
    Math.abs(z1 - z0) * SCALE,
    { isStatic: true, label },
  );
}

/**
 * Everything on the table that doesn't move: the island, a wall behind every
 * kerb on the board, the pieces of central reserve, and the frame, which is
 * where a road ends.
 */
function scenery(): Matter.Body[] {
  const bodies: Matter.Body[] = [
    Bodies.circle(0, 0, ISLAND_R * SCALE, { isStatic: true, label: "island" }),
  ];
  for (const kerb of kerbSegments()) {
    const dx = kerb.bx - kerb.ax;
    const dz = kerb.bz - kerb.az;
    const length = Math.hypot(dx, dz);
    if (length < 0.01) continue;
    const mx = (kerb.ax + kerb.bx) / 2;
    const mz = (kerb.az + kerb.bz) / 2;
    // The wall stands on the field side of the kerb line, never on the road.
    let nx = -dz / length;
    let nz = dx / length;
    if (onTarmac(mx + nx * 0.5, mz + nz * 0.5)) {
      nx = -nx;
      nz = -nz;
    }
    bodies.push(
      Bodies.rectangle(
        (mx + (nx * KERB_DEPTH) / 2) * SCALE,
        (mz + (nz * KERB_DEPTH) / 2) * SCALE,
        (length + 0.2) * SCALE,
        KERB_DEPTH * SCALE,
        { isStatic: true, label: "kerb", angle: Math.atan2(dz, dx) },
      ),
    );
  }
  for (const r of reserves()) {
    bodies.push(box(r.x0, r.z0, r.x1, r.z1, "reserve"));
  }
  const { x0, x1, z0, z1 } = BOUNDS;
  const frame = 4;
  bodies.push(
    box(x0 - frame, z0 - frame, x1 + frame, z0, "end"),
    box(x0 - frame, z1, x1 + frame, z1 + frame, "end"),
    box(x0 - frame, z0, x0, z1, "end"),
    box(x1, z0, x1 + frame, z1, "end"),
  );
  return bodies;
}

export function createPhysics(challenge: BoardChallenge, car: CarState) {
  const engine = Engine.create({ gravity: { x: 0, y: 0 } });
  const player = carBody(car.x, car.z, car.heading, "player");
  const others = challenge.otherCars.map((other) =>
    carBody(other.x, other.z, other.heading, "car"),
  );
  Composite.add(engine.world, [player, ...others, ...scenery()]);

  const physics: Physics = {
    engine,
    player,
    others,
    poses: challenge.otherCars.map(({ x, z, heading }) => ({ x, z, heading })),
    contacts: [],
    crashed: false,
    crashTime: 0,
    impact: 0,
    steer: 0,
    stalled: 0,
  };

  Events.on(engine, "collisionStart", (event) => {
    for (const pair of event.pairs) {
      const other =
        pair.bodyA === player
          ? pair.bodyB
          : pair.bodyB === player
            ? pair.bodyA
            : null;
      if (!other) continue;
      const kind = other.label as Contact;
      physics.contacts.push(kind);
      physics.impact = Math.min(
        1,
        Math.max(0.35, (Body.getSpeed(player) * 60) / SCALE / CAR.maxSpeed),
      );
      if (kind === "car" && !physics.crashed) {
        physics.crashed = true;
        // From here the bump plays out by itself.
        player.frictionAir = 0.07;
      }
    }
  });
  return physics;
}

/** Engine, brakes, tyres and steering for one step. */
function driveCar(physics: Physics, input: CarInput): void {
  const { player } = physics;
  const sin = Math.sin(player.angle);
  const cos = Math.cos(player.angle);
  // Metres a second, split into "along the car" and "across the car".
  const vx = (player.velocity.x * 60) / SCALE;
  const vz = (player.velocity.y * 60) / SCALE;
  let forward = vx * sin - vz * cos;
  let across = vx * cos + vz * sin;

  if (input.throttle < 0) {
    // Reverse gear: stop first, then back up at a walking pace.
    if (forward > 0.05) {
      forward = Math.max(0, forward - CAR.brake * DT);
    } else {
      const target = CAR.reverseSpeed * Math.min(1, -input.throttle);
      forward =
        forward < -target
          ? Math.min(-target, forward + CAR.brake * DT)
          : Math.max(-target, forward - CAR.accel * 0.7 * DT);
    }
  } else if (forward >= 0) {
    const fill = forward / CAR.maxSpeed;
    forward += input.throttle * CAR.accel * (1 - fill) * DT;
    forward -= input.brake * CAR.brake * DT;
    if (input.throttle <= 0) forward -= CAR.coast * DT;
    forward = Math.min(CAR.maxSpeed, Math.max(0, forward));
  } else {
    // Rolling backwards with reverse let go, or knocked back by a bump: the
    // brakes bring it to rest.
    forward = Math.min(0, forward + CAR.brake * DT);
  }
  across *= 1 - GRIP;

  const fill = Math.max(0, forward) / CAR.maxSpeed;
  const lock = CAR.maxSteer * (1 - CAR.steerFade * fill);
  const target = Math.max(-1, Math.min(1, input.steer)) * lock;
  const turn = CAR.steerRate * DT;
  physics.steer += Math.max(-turn, Math.min(turn, target - physics.steer));
  // Nose against a kerb with nowhere to go, and no reverse gear: let the car
  // swing round on the spot, slowly, so nobody gets stuck.
  const pushing = input.throttle > 0 && forward < STALL_SPEED;
  physics.stalled = pushing ? physics.stalled + DT : 0;
  const rolling =
    physics.stalled > STALL_TIME ? Math.max(forward, PIVOT_SPEED) : forward;
  const yaw = (rolling / CAR.wheelbase) * Math.tan(physics.steer);

  // Matter measures speed per step, not per second.
  Body.setVelocity(player, {
    x: ((sin * forward + cos * across) * SCALE) / 60,
    y: ((-cos * forward + sin * across) * SCALE) / 60,
  });
  Body.setAngularVelocity(player, yaw / 60);
}

/**
 * Advance the table one step and copy the car's new place into `car`. Returns
 * true once a crash into another car has played out.
 */
export function physicsStep(
  physics: Physics,
  car: CarState,
  input: CarInput,
): boolean {
  const { player } = physics;
  physics.contacts.length = 0;
  if (!physics.crashed) driveCar(physics, input);

  Engine.update(physics.engine, STEP_MS);

  physics.others.forEach((body, i) => {
    const pose = physics.poses[i];
    pose.x = body.position.x / SCALE;
    pose.z = body.position.y / SCALE;
    pose.heading = body.angle;
  });

  const sin = Math.sin(player.angle);
  const cos = Math.cos(player.angle);
  car.x = player.position.x / SCALE;
  car.z = player.position.y / SCALE;
  car.heading = player.angle;
  car.speed =
    ((player.velocity.x * sin - player.velocity.y * cos) * 60) / SCALE;
  // only a car in reverse gear counts as going backwards, not one bumped back
  if (input.throttle >= 0 && car.speed < 0) car.speed = 0;
  car.steer = physics.crashed ? 0 : physics.steer;

  if (!physics.crashed) return false;
  physics.crashTime += DT;
  return physics.crashTime >= CRASH_TIME;
}
