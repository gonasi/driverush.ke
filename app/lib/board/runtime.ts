/**
 * The live drive: one car, the joystick, the table's physics and the referee,
 * stepped at a fixed rate. It sits in module scope on purpose. The scene reads
 * `car` and `view` every frame and the controls write `stick`, and none of it
 * goes through React.
 */
import type { CarInput, CarState } from "./car";
import { isRouteTask, type BoardChallenge } from "./challenges";
import { challengeRoute, taskParks, taskStart } from "./lessons";
import { bearingOf, wrapPi } from "./geometry";
import { poseAt, type Route } from "./network";
import {
  STICK_DEADZONE,
  createAssist,
  stickToInput,
  type AssistState,
  type DriveOptions,
  type Stick,
} from "./joystick";
import type { OtherPose, Physics } from "./physics";
import {
  COLLISION,
  LANE_FAULTS,
  createRef,
  refStep,
  type Fault,
  type RefState,
} from "./referee";
import {
  createRouteRef,
  routeRefStep,
  type RouteRefState,
} from "./route-referee";

const STEP = 1 / 60;
/** A stalled tab mustn't fast-forward the car when it wakes. */
const MAX_FRAME = 0.1;

export const car: CarState = { x: 0, z: 0, heading: 0, speed: 0, steer: 0 };
/** Where the learner is holding the knob. The controls write this. */
export const stick: Stick = { x: 0, y: 0 };
/** Where the learner stands, and whether lane assist is on. Set by the store. */
export const drive: DriveOptions = { seat: "south", assist: true };

/**
 * How the drive is judged. On the no-fail first drive a breach of lane
 * discipline is only said, as a small mistake, and the drive carries on.
 */
export const judging = { forgiveLanes: false };

/** What the scene needs to know about the drive, beyond `car`. */
export const view = {
  others: [] as OtherPose[],
  braking: false,
  /** Backing up, for the lamps. */
  reversing: false,
  /** Set for a moment when something is hit, 0 to 1. */
  jolt: 0,
  /** Lane assist: 0 when the learner has the wheel, 1 when the lane is held. */
  hold: 0,
  /** Where on the held lane the assist is aiming, and which way the lane runs. */
  aimX: 0,
  aimZ: 0,
  along: 0,
  /** Holding back for reverse gear: 0 to 1 as it comes in. */
  backing: 0,
};

/**
 * The car as it is drawn: between the last two physics steps, so it moves
 * smoothly on a screen that is faster or slower than the physics.
 */
export const shown = { x: 0, z: 0, heading: 0 };

/** Where the car has been this attempt, a point about every metre. */
export const trail: { x: number; z: number }[] = [];
const TRAIL_GAP = 1;
const TRAIL_MAX = 900;

/**
 * A car leaning on a kerb backs off and touches it again. That is one bump,
 * not several: the next one only counts once the car has moved on this far.
 */
const BUMP_APART = 5;
const BUMPS = new Set(["kerb", "central_reserve", "island"]);
let lastBump: { x: number; z: number } | null = null;

type Callbacks = {
  /** A serious mistake: the attempt is over. */
  onFault: (fault: Fault) => void;
  /** A small mistake: a star is lost and the drive goes on. */
  onSmall: (fault: Fault) => void;
  onGoal: () => void;
};

// Matter.js lives behind `physics.ts`. It is fetched the first time someone
// starts a drive, so a visitor who only reads the guide never downloads it.
let engine: typeof import("./physics") | null = null;
let loading: Promise<void> | null = null;

let challenge: BoardChallenge | null = null;
let physics: Physics | null = null;
let ref: RefState = createRef();
/** A route task's own referee, and the line it checks the drive against. */
let routeRef: RouteRefState = createRouteRef();
let taskRoute: Route | null = null;
let taskParking = false;
let assist: AssistState = createAssist();
let callbacks: Callbacks | null = null;
let driving = false;
/** A sheet or a question is over the table: the drive holds still. */
let paused = false;
/** The learner has pushed the stick. The clock starts then, not before. */
let moved = false;
let carry = 0;
let elapsed = 0;

/**
 * The drive as it stood a little while ago, kept every couple of metres, so a
 * gentle level can put the car back before a mistake instead of ending.
 */
type Snap = {
  at: number;
  trail: number;
  car: CarState;
  ref: RefState;
  routeRef: RouteRefState;
  assist: AssistState;
};
const snaps: Snap[] = [];
const SNAP_GAP = 2;
const SNAP_MAX = 48;
/** Metres driven this attempt. */
let driven = 0;
/** After a set back the stick is ignored until it has been let go once. */
let letGo = false;
const REST: Stick = { x: 0, y: 0 };

function snapshot(): void {
  if (snaps.length >= SNAP_MAX) snaps.shift();
  snaps.push({
    at: driven,
    trail: trail.length,
    car: { ...car },
    ref: structuredClone(ref),
    routeRef: structuredClone(routeRef),
    assist: { ...assist },
  });
}
const before = { x: 0, z: 0, heading: 0 };
const input: CarInput = { steer: 0, throttle: 0, brake: 0 };

/** Fetch the physics. The car waits on its start line until it's in. */
export function loadPhysics(): Promise<void> {
  loading ??= import("./physics").then((mod) => {
    engine = mod;
    if (driving && challenge && !physics) {
      physics = mod.createPhysics(challenge, car);
      view.others = physics.poses;
    }
  });
  return loading;
}

export function resetInput(): void {
  stick.x = 0;
  stick.y = 0;
  input.steer = 0;
  input.throttle = 0;
  input.brake = 0;
}

/** Put the car on its start line and hand control to the learner. */
export function beginChallenge(next: BoardChallenge, cb: Callbacks): void {
  const start = taskStart(next);
  car.x = start.x;
  car.z = start.z;
  car.heading = start.heading;
  routeRef = createRouteRef();
  taskRoute = isRouteTask(next) ? challengeRoute(next) : null;
  taskParking = taskParks(next);
  drive.reverse = isRouteTask(next) && next.reverse;
  car.speed = 0;
  car.steer = 0;
  challenge = next;
  callbacks = cb;
  ref = createRef();
  assist = createAssist();
  physics = engine ? engine.createPhysics(next, car) : null;
  view.others = physics
    ? physics.poses
    : next.otherCars.map(({ x, z, heading }) => ({ x, z, heading }));
  view.braking = false;
  view.reversing = false;
  view.jolt = 0;
  view.hold = 0;
  view.backing = 0;
  carry = 0;
  elapsed = 0;
  moved = false;
  paused = false;
  trail.length = 0;
  trail.push({ x: car.x, z: car.z });
  lastBump = null;
  driven = 0;
  letGo = false;
  snaps.length = 0;
  snapshot();
  settle();
  driving = true;
  resetInput();
  if (!engine) void loadPhysics();
}

/**
 * Put the car back where it was about this many metres ago, at rest, and carry
 * on with the same attempt. False when there is nothing to go back to.
 */
export function setBack(metres: number): boolean {
  if (!challenge || !callbacks || !engine || snaps.length === 0) return false;
  const want = driven - metres;
  let i = snaps.length - 1;
  while (i > 0 && snaps[i].at > want) i -= 1;
  const snap = snaps[i];
  snaps.length = i + 1;
  Object.assign(car, snap.car);
  car.speed = 0;
  car.steer = 0;
  ref = structuredClone(snap.ref);
  routeRef = structuredClone(snap.routeRef);
  assist = { ...snap.assist };
  physics = engine.createPhysics(challenge, car);
  view.others = physics.poses;
  view.braking = false;
  view.reversing = false;
  view.jolt = 0;
  view.hold = 0;
  view.backing = 0;
  trail.length = Math.max(1, snap.trail);
  driven = snap.at;
  lastBump = null;
  carry = 0;
  paused = false;
  settle();
  resetInput();
  letGo = true;
  driving = true;
  return true;
}

/** Metres driven this attempt. */
export function drivenMetres(): number {
  return driven;
}

/** Draw the car exactly where it is. */
function settle(): void {
  before.x = shown.x = car.x;
  before.z = shown.z = car.z;
  before.heading = shown.heading = car.heading;
}

export function stopDriving(): void {
  driving = false;
  car.speed = 0;
  view.braking = false;
  view.reversing = false;
  view.hold = 0;
  view.backing = 0;
  settle();
  resetInput();
}

/** Hold the drive still, clock and all, while something is over the table. */
export function setPaused(value: boolean): void {
  paused = value;
  if (value) resetInput();
}

/** Has the learner set off yet? */
export function hasMoved(): boolean {
  return moved;
}

export function isDriving(): boolean {
  return driving;
}

/** Seconds spent driving this attempt. */
export function elapsedSeconds(): number {
  return elapsed;
}

/** The drive's options with lane assist off, for getting into or out of a bay. */
const HANDS_ON: DriveOptions = { seat: "south", assist: false };

/**
 * Is the car at a parking bay, going in or coming out? Lane assist lets go
 * there: holding the lane is the opposite of what the learner is trying to do.
 */
function manoeuvring(): boolean {
  if (!taskRoute) return false;
  const at = routeRef.progress;
  const near = taskRoute.steps.some(
    (step) =>
      (step.road === "angle_bay" || step.road === "flush_bay") &&
      at > step.from - 7 &&
      at < step.to + 2,
  );
  if (!near) return false;
  HANDS_ON.seat = drive.seat;
  HANDS_ON.reverse = drive.reverse;
  // Lane assist lets go, and parking assist takes over for the reversing.
  HANDS_ON.guide = drive.assist ? reverseLine : undefined;
  return true;
}

/**
 * The line a reversing car should follow, from where it is: the stretch of the
 * task's route that is driven in reverse.
 */
function reverseLine(at: CarState): { heading: number; along: number } | null {
  if (!taskRoute) return null;
  const progress = routeRef.progress;
  const step = taskRoute.steps.find(
    (s) => s.gear === "reverse" && progress > s.from - 6 && progress < s.to,
  );
  if (!step) return null;
  const from = Math.max(step.from, progress);
  const aim = poseAt(taskRoute, Math.min(step.to, from + 2.6));
  // reversing, the car travels the opposite way to the way it faces
  const along = wrapPi(aim.heading + Math.PI);
  const gap = Math.hypot(aim.x - at.x, aim.z - at.z);
  return {
    along,
    heading: gap > 0.6 ? bearingOf(aim.x - at.x, aim.z - at.z) : along,
  };
}

/** Advance the drive by one rendered frame. */
export function tick(frameSeconds: number): void {
  if (!driving || paused || !challenge || !callbacks || !physics || !engine) {
    return;
  }
  const { physicsStep } = engine;
  carry += Math.min(frameSeconds, MAX_FRAME);
  while (carry >= STEP) {
    carry -= STEP;
    before.x = car.x;
    before.z = car.z;
    before.heading = car.heading;
    const pushed = Math.hypot(stick.x, stick.y) > STICK_DEADZONE;
    if (letGo && !pushed) letGo = false;
    if (!moved && pushed && !letGo) moved = true;
    if (moved) elapsed += STEP;
    view.jolt = Math.max(0, view.jolt - STEP * 2.5);

    if (physics.crashed) {
      // The bump plays out, then the examiner calls it.
      if (physicsStep(physics, car, input)) {
        stopDriving();
        callbacks.onFault(COLLISION);
        return;
      }
      continue;
    }

    stickToInput(
      letGo ? REST : stick,
      car,
      input,
      manoeuvring() ? HANDS_ON : drive,
      assist,
    );
    view.braking = input.brake > 0 && car.speed > 0.05;
    view.hold = assist.hold;
    view.aimX = assist.aimX;
    view.aimZ = assist.aimZ;
    view.along = assist.along;
    view.backing = assist.backing;
    physicsStep(physics, car, input);
    view.reversing = car.speed < -0.05;
    driven += Math.abs(car.speed) * STEP;
    if (driven - snaps[snaps.length - 1].at > SNAP_GAP) snapshot();
    const last = trail[trail.length - 1];
    if (
      trail.length < TRAIL_MAX &&
      Math.hypot(car.x - last.x, car.z - last.z) > TRAIL_GAP
    ) {
      trail.push({ x: car.x, z: car.z });
    }

    if (physics.crashed) {
      view.jolt = Math.max(0.5, physics.impact);
      view.braking = false;
      continue;
    }

    const result = isRouteTask(challenge)
      ? taskRoute
        ? routeRefStep(
            routeRef,
            taskRoute,
            taskParking,
            car,
            physics.contacts,
            STEP,
          )
        : { small: [] }
      : refStep(ref, challenge, car, physics.contacts, STEP);
    for (const fault of result.small) {
      view.jolt = Math.max(view.jolt, 0.6 * Math.max(0.5, physics.impact));
      if (BUMPS.has(fault.id)) {
        const again =
          lastBump !== null &&
          Math.hypot(car.x - lastBump.x, car.z - lastBump.z) < BUMP_APART;
        lastBump = { x: car.x, z: car.z };
        if (again) continue;
      }
      callbacks.onSmall(fault);
    }
    if (
      result.fault &&
      judging.forgiveLanes &&
      LANE_FAULTS.has(result.fault.id)
    ) {
      callbacks.onSmall(result.fault);
    } else if (result.fault) {
      stopDriving();
      callbacks.onFault(result.fault);
      return;
    }
    if (result.goal) {
      stopDriving();
      callbacks.onGoal();
      return;
    }
  }
  // What is left of the frame is a share of the next step: draw the car that
  // far on from where it was a step ago.
  const part = carry / STEP;
  shown.x = before.x + (car.x - before.x) * part;
  shown.z = before.z + (car.z - before.z) * part;
  shown.heading = before.heading + wrapPi(car.heading - before.heading) * part;
}
