/**
 * What the table shows besides the drive: routes painted on it, a part of the
 * board lit up, a car playing a route back, and a camera the learner can move.
 * Learn mode and the driving tasks' hints both work through this.
 *
 * Like `runtime.ts`, the things that change every frame (how far the playback
 * has got, where the camera is) live at module scope and never re-render
 * React. The store holds only what the screen has to redraw for.
 */
import { create } from "zustand";

import { BOUNDS, type Box } from "./full-board";
import type { Vec } from "./geometry";
import { poseAt, type Pose, type Route } from "./network";

export type StageLine = {
  id: string;
  points: Vec[];
  color: string;
  /** Metres. */
  width?: number;
  opacity?: number;
};

const CX = (BOUNDS.x0 + BOUNDS.x1) / 2;
const CZ = (BOUNDS.z0 + BOUNDS.z1) / 2;

/**
 * The camera, when the learner has hold of it. `span` is how many metres of
 * table fit across the screen. The scene fills in `max`, which depends on the
 * screen's shape. The camera never turns: it slides and zooms.
 */
export const cam = {
  free: false,
  /** Keep the playing car in the middle. Any drag lets go of it. */
  follow: false,
  x: CX,
  z: CZ,
  span: 9999,
  /**
   * How far up the screen to hold what is being looked at, as a share of the
   * table in view. For when a panel covers the bottom of the screen.
   */
  lift: 0,
  /**
   * The same, sideways: how far to the right of the middle to hold it, as a
   * share of the screen's width. For a panel down the left of a wide screen.
   */
  side: 0,
  /** The screen's width over its height. The scene keeps it up to date. */
  aspect: 1,
  min: 16,
  max: 240,
  /**
   * How close the learner likes the view while the car is moving, kept from
   * one attempt to the next. Null leaves it to the drive. It only changes how
   * far the view closes in: the view still backs off when the car stops and
   * closes in when it moves.
   */
  driveSpan: null as number | null,
  /** The learner zoomed during this look, so the zoom is theirs to keep. */
  zoomed: false,
  /** The car is under way, or the stick is pushed. The scene fills it in. */
  underWay: false,
  /** How close the drive closes in when left alone. The scene fills it in. */
  inSpan: 23,
  /** How far the drive backs off when the car stops. The scene fills it in. */
  outSpan: 64,
  /** The view to go back to after a look at the finish. */
  back: null as { free: boolean; span: number } | null,
};

/**
 * Where the task's finish is on the screen, for the marker drawn over the
 * table. The scene fills it in every frame. `x` and `y` are shares of the
 * screen's width and height, and lie outside 0 to 1 when the finish is out of
 * view.
 */
export const finish = { on: false, x: 0.5, y: 0.5, metres: 0 };

/**
 * Where each car that can be picked from a line-up is on the screen, as
 * shares of its width and height. The scene fills it in every frame it draws.
 */
export const picks: { id: string; x: number; y: number }[] = [];

/** How far along its route the playback has got, in metres. */
export const play = { distance: 0 };

let wake: () => void = () => {};
/** The scene hands over its "draw a frame" call, for when nothing is animating. */
export function setWake(fn: () => void): void {
  wake = fn;
}

/** How much the slant of the view squashes depth on the table. */
const SLANT = 0.72;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Slide the view by a distance on the table. */
export function panBy(dx: number, dz: number): void {
  cam.free = true;
  cam.follow = false;
  cam.x = clamp(cam.x + dx, BOUNDS.x0, BOUNDS.x1);
  cam.z = clamp(cam.z + dz, BOUNDS.z0, BOUNDS.z1);
  wake();
}

/**
 * The widest the drive will hold the view while the car moves. Kept short of
 * the backed-off view, so pushing the stick always closes in.
 */
export function widestDriveSpan(): number {
  return Math.max(cam.min, cam.outSpan * 0.7);
}

/** The learner's zoom, as the drive can keep it. */
export function asDriveSpan(span: number): number {
  return clamp(span, cam.min, widestDriveSpan());
}

/** Zoom: under 1 closes in, over 1 backs off. */
export function zoomBy(factor: number): void {
  // With the car under way the view belongs to the drive. A zoom then sets
  // how close the drive holds it, and takes nothing over.
  if (cam.underWay && !cam.free) {
    cam.driveSpan = asDriveSpan((cam.driveSpan ?? cam.inSpan) * factor);
    wake();
    return;
  }
  cam.free = true;
  cam.zoomed = true;
  cam.back = null;
  cam.span = clamp(Math.min(cam.span, cam.max) * factor, cam.min, cam.max);
  wake();
}

/**
 * The car has moved off: a look round the table is over, and the view goes
 * back to the drive. Zooming in closer than the drive does is kept as how
 * close it closes in from now on. Backing off, or sliding, was only a look.
 */
export function endLook(): void {
  if (!cam.free) return;
  // A look at the finish is not the learner's zoom: theirs is the one before.
  const span = cam.back ? cam.back.span : cam.span;
  if (cam.zoomed && span < (cam.driveSpan ?? cam.inSpan)) {
    cam.driveSpan = asDriveSpan(span);
  }
  cam.free = false;
  cam.follow = false;
  cam.zoomed = false;
  cam.back = null;
}

/** Back off to the whole table. */
export function fitTable(): void {
  cam.free = true;
  cam.follow = false;
  cam.x = CX;
  cam.z = CZ;
  cam.span = cam.max;
  wake();
}

/** Look at one part of the board. `sideways` is true from the left or right seat. */
export function flyTo(box: Box, sideways = false): void {
  cam.free = true;
  cam.follow = false;
  cam.x = (box.x0 + box.x1) / 2;
  cam.z = (box.z0 + box.z1) / 2;
  const across = sideways ? box.z1 - box.z0 : box.x1 - box.x0;
  const deep = sideways ? box.x1 - box.x0 : box.z1 - box.z0;
  // It has to fit across the screen and up it, in the part no panel covers.
  // The table is seen at a slant, so what is deep on it is squashed.
  const wide = across / Math.max(0.3, 1 - 2 * cam.side);
  const tall = (deep * SLANT * cam.aspect) / Math.max(0.3, 1 - 2 * cam.lift);
  cam.span = clamp(Math.max(wide, tall) * 1.2, cam.min, cam.max);
  wake();
}

/**
 * A look at the car and the finish together, while driving. The scene goes
 * back to the view before it once the car moves off. Asked for again while
 * looking, it goes back at once.
 */
export function peekAt(box: Box, sideways = false): void {
  if (cam.back) {
    endPeek();
    return;
  }
  const back = { free: cam.free, span: cam.span };
  cam.free = true;
  cam.follow = false;
  cam.x = (box.x0 + box.x1) / 2;
  cam.z = (box.z0 + box.z1) / 2;
  const across = sideways ? box.z1 - box.z0 : box.x1 - box.x0;
  const deep = sideways ? box.x1 - box.x0 : box.z1 - box.z0;
  // The task card covers the top of the screen and the joystick the bottom,
  // so both ends have to fit in the middle third of it.
  const tall = (deep * SLANT * cam.aspect) / 0.34;
  cam.span = clamp(Math.max(across * 1.3, tall), cam.min, cam.max);
  cam.back = back;
  wake();
}

/** Go back to the view from before the look at the finish. */
export function endPeek(): void {
  if (!cam.back) return;
  cam.span = cam.back.span;
  cam.free = cam.back.free;
  cam.follow = true;
  cam.back = null;
  wake();
}

/** While driving: give the zoom back to the drive, which follows the car. */
export function followCar(): void {
  cam.free = false;
  cam.follow = false;
  cam.zoomed = false;
  cam.driveSpan = null;
  cam.back = null;
  wake();
}

/** Hand the camera back to the drive. The zoom chosen while driving is kept. */
export function releaseCamera(): void {
  cam.free = false;
  cam.follow = false;
  cam.zoomed = false;
  cam.back = null;
}

/** Leaving the drive: the next one starts with its own zoom. */
export function forgetDriveZoom(): void {
  cam.driveSpan = null;
}

/** Metres a second the playback car covers at normal speed. */
const PLAY_SPEED = 9;
const REVERSE_SPEED = 3;
const TURN_SPEED = 5.5;

export const PLAY_RATES = [0.5, 1, 2] as const;

type StageState = {
  lines: StageLine[];
  /** A part of the board to light up. */
  glow: Box | null;
  /** The route being played back, if any. */
  route: Route | null;
  playing: boolean;
  rate: number;
  /** The step of the route the car is in. */
  step: number;
  ended: boolean;
  /** Stop once, on reaching this step. */
  pauseAt: number | null;
  show: (lines: StageLine[], glow?: Box | null) => void;
  watch: (route: Route, options?: { pauseAt?: number; from?: number }) => void;
  setPlaying: (playing: boolean) => void;
  setRate: (rate: number) => void;
  seek: (distance: number) => void;
  toStep: (index: number) => void;
  clear: () => void;
};

export const useStage = create<StageState>()((set, get) => ({
  lines: [],
  glow: null,
  route: null,
  playing: false,
  rate: 1,
  step: 0,
  ended: false,
  pauseAt: null,

  show: (lines, glow = null) => {
    set({ lines, glow });
    wake();
  },

  watch: (route, options) => {
    play.distance = options?.from ?? 0;
    cam.free = true;
    cam.follow = true;
    cam.span = clamp(Math.min(cam.span, 62), cam.min, cam.max);
    set({
      route,
      playing: true,
      ended: false,
      step: poseAt(route, play.distance).step,
      pauseAt: options?.pauseAt ?? null,
    });
    wake();
  },

  setPlaying: (playing) => {
    const { route, ended } = get();
    if (!route) return;
    if (playing && ended) play.distance = 0;
    set({ playing, ended: playing ? false : ended, pauseAt: null });
    wake();
  },

  setRate: (rate) => set({ rate }),

  seek: (distance) => {
    const { route } = get();
    if (!route) return;
    play.distance = clamp(distance, 0, route.length);
    set({
      step: poseAt(route, play.distance).step,
      ended: play.distance >= route.length,
    });
    wake();
  },

  toStep: (index) => {
    const { route } = get();
    if (!route) return;
    const step = route.steps[clamp(index, 0, route.steps.length - 1)];
    get().seek(step.from + 0.01);
  },

  clear: () => {
    play.distance = 0;
    set({
      lines: [],
      glow: null,
      route: null,
      playing: false,
      ended: false,
      step: 0,
      pauseAt: null,
    });
    wake();
  },
}));

/**
 * Move the playback on by one frame and say where the car is. The scene calls
 * this; it returns null when there is no route to show.
 */
export function advance(dt: number): Pose | null {
  const state = useStage.getState();
  const { route } = state;
  if (!route) return null;
  if (state.playing) {
    const now = poseAt(route, play.distance);
    const maneuver = route.steps[now.step]?.maneuver ?? "follow";
    const pace = now.reversing
      ? REVERSE_SPEED
      : maneuver === "follow" || maneuver === "hold_lane"
        ? PLAY_SPEED
        : TURN_SPEED;
    play.distance = Math.min(
      route.length,
      play.distance + pace * state.rate * dt,
    );
  }
  const pose = poseAt(route, play.distance);
  if (state.playing) {
    if (play.distance >= route.length) {
      useStage.setState({ playing: false, ended: true, step: pose.step });
    } else if (pose.step !== state.step) {
      if (state.pauseAt === pose.step) {
        useStage.setState({ step: pose.step, playing: false, pauseAt: null });
      } else {
        useStage.setState({ step: pose.step });
      }
    }
  }
  return pose;
}
