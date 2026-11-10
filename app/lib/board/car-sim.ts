/**
 * How the car moves: a bicycle model small enough to run on any phone. The state
 * is plain numbers that the render loop reads each frame, so driving never goes
 * through React.
 */
import { dirOf } from "./geometry";

export const CAR = {
  length: 4.2,
  width: 1.8,
  wheelbase: 2.6,
  /** Metres a second. About 32 km/h, quick enough on a board this size. */
  maxSpeed: 9,
  accel: 4.5,
  brake: 11,
  /** Slowing with both pedals up. */
  coast: 1.4,
  /** Full lock at a crawl, in radians. */
  maxSteer: 0.6,
  /** How much of the lock is lost at top speed, so a thumb can hold a lane. */
  steerFade: 0.35,
  /** How fast the wheels follow the steering wheel, radians a second. */
  steerRate: 3,
} as const;

export type CarState = {
  x: number;
  z: number;
  /** Compass bearing, radians. */
  heading: number;
  speed: number;
  /** Front wheel angle. Positive steers right. */
  steer: number;
};

export type CarInput = {
  /** -1 full left to 1 full right. */
  steer: number;
  /** 0 to 1. */
  throttle: number;
  /** 0 to 1. */
  brake: number;
};

export function stepCar(car: CarState, input: CarInput, dt: number): void {
  const fill = car.speed / CAR.maxSpeed;
  let speed = car.speed;
  speed += input.throttle * CAR.accel * (1 - fill) * dt;
  speed -= input.brake * CAR.brake * dt;
  if (input.throttle <= 0) speed -= CAR.coast * dt;
  car.speed = Math.min(CAR.maxSpeed, Math.max(0, speed));

  const lock = CAR.maxSteer * (1 - CAR.steerFade * fill);
  const target = Math.max(-1, Math.min(1, input.steer)) * lock;
  const maxTurn = CAR.steerRate * dt;
  car.steer += Math.max(-maxTurn, Math.min(maxTurn, target - car.steer));

  car.heading += (car.speed / CAR.wheelbase) * Math.tan(car.steer) * dt;
  const dir = dirOf(car.heading);
  car.x += dir.x * car.speed * dt;
  car.z += dir.z * car.speed * dt;
}
