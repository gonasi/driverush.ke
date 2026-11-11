/**
 * The car, as numbers: its size, how it pulls and stops, and the state the
 * scene draws from. `physics.ts` moves it; this file only describes it.
 */

export const CAR = {
  length: 4.2,
  width: 1.8,
  wheelbase: 2.6,
  /** Metres a second. About 25 km/h: calm enough to place on a board. */
  maxSpeed: 7,
  /** Top speed in reverse: walking pace, for parking. */
  reverseSpeed: 2.2,
  accel: 3.6,
  brake: 9,
  /** Slowing with the joystick only lightly pushed. */
  coast: 1.2,
  /** Full lock at a crawl, in radians. */
  maxSteer: 0.6,
  /** How much of the lock is lost at top speed. */
  steerFade: 0.3,
  /** How fast the front wheels follow the joystick, radians a second. */
  steerRate: 3.2,
} as const;

export type CarState = {
  x: number;
  z: number;
  /** Compass bearing, radians. */
  heading: number;
  /** Speed along the car, metres a second. Negative when reversing. */
  speed: number;
  /** Front wheel angle. Positive steers right. */
  steer: number;
};

export type CarInput = {
  /** -1 full left to 1 full right. */
  steer: number;
  /** 0 to 1 going forward. Below 0 asks for reverse gear, down to -1. */
  throttle: number;
  /** 0 to 1. */
  brake: number;
};
