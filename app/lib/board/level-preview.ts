/**
 * A level's picture: the flat board, zoomed to the part the level uses, with
 * what the level is about drawn on it. A drive shows its car, the line to
 * drive and the green box. A route to watch shows the route. A deck shows the
 * part of the board it teaches. Pure data for `fullBoardSvg`, no three.js.
 *
 * This file pulls in the lane network and the route finder, so it is only
 * imported by the server route that draws the pictures
 * (`routes/board-level-picture.ts`), never by a page.
 */
import { blockCars, challengeById, type BoardChallenge } from "./challenges";
import type { Level } from "./curriculum";
import { levelSlides } from "./curriculum-content";
import {
  BOUNDS,
  CAR_COLORS,
  goalBox,
  lanePoint,
  laneBearing,
  type Box,
  type FullBoardOptions,
  type Point,
} from "./full-board";
import { queueCars } from "./lane-queue";
import {
  challengeRoute,
  lessonById,
  lessonPlan,
  taskGoalBox,
  taskStart,
} from "./lessons";
import { FIRST_DRIVE } from "./warmup";

type Car = NonNullable<FullBoardOptions["cars"]>[number];
type Line = NonNullable<FullBoardOptions["routes"]>[number];

/** The picture's shape, width over height. The cards are square. */
export const PREVIEW_ASPECT = 1;
/** The least board a picture shows across, metres: a short task is not blown up. */
const MIN_ACROSS = 52;
/** Clear board round what is drawn, metres. */
const PAD = 9;

/** The line to drive, and a closed way that is not the answer. */
export const PREVIEW_COLORS = { route: "#4ade80", closed: "#f87171" } as const;

const WHOLE: Box = { ...BOUNDS };

function around(points: readonly Point[], boxes: readonly Box[]): Box | null {
  const xs = [...points.map((p) => p.x), ...boxes.flatMap((b) => [b.x0, b.x1])];
  const zs = [...points.map((p) => p.z), ...boxes.flatMap((b) => [b.z0, b.z1])];
  if (xs.length === 0) return null;
  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    z0: Math.min(...zs),
    z1: Math.max(...zs),
  };
}

/**
 * The part of the board to show: what is drawn with room round it, grown to
 * the picture's shape. It may reach past the edge of the board, where the
 * card's own green shows.
 */
export function previewView(content: Box | null): Box {
  const box = content ?? WHOLE;
  const cx = (box.x0 + box.x1) / 2;
  const cz = (box.z0 + box.z1) / 2;
  let across = Math.max(box.x1 - box.x0 + 2 * PAD, MIN_ACROSS);
  let down = Math.max(box.z1 - box.z0 + 2 * PAD, MIN_ACROSS / PREVIEW_ASPECT);
  if (across / down < PREVIEW_ASPECT) across = down * PREVIEW_ASPECT;
  else down = across / PREVIEW_ASPECT;
  const [x0, x1] = within(cx, across, BOUNDS.x0, BOUNDS.x1);
  const [z0, z1] = within(cz, down, BOUNDS.z0, BOUNDS.z1);
  return { x0, x1, z0, z1 };
}

/**
 * A span of `size` round `mid`, slid to stay on the board where it fits. Where
 * it is wider than the board, the board sits in the middle of it.
 */
function within(
  mid: number,
  size: number,
  low: number,
  high: number,
): [number, number] {
  if (size >= high - low) {
    const centre = (low + high) / 2;
    return [centre - size / 2, centre + size / 2];
  }
  const from = Math.min(Math.max(mid - size / 2, low), high - size);
  return [from, from + size];
}

/** Lines are drawn thicker the more board a picture shows, to stay readable small. */
function thicken(options: FullBoardOptions): FullBoardOptions {
  const view = options.view;
  if (!view || !options.routes) return options;
  const scale = Math.max(1, (view.x1 - view.x0) / MIN_ACROSS);
  return {
    ...options,
    routes: options.routes.map((route) => ({
      ...route,
      width: (route.width ?? 0.9) * scale,
    })),
  };
}

const player = (pose: { x: number; z: number; heading: number }): Car => ({
  x: pose.x,
  z: pose.z,
  heading: pose.heading,
  color: CAR_COLORS.player,
});

const others = (challenge: BoardChallenge): Car[] =>
  challenge.otherCars.map((car) => ({
    x: car.x,
    z: car.z,
    heading: car.heading,
    color: car.paint ?? CAR_COLORS.red,
    flipped: car.flipped,
  }));

const line = (points: Point[], extra: Partial<Line> = {}): Line => ({
  points,
  color: PREVIEW_COLORS.route,
  width: 1.5,
  arrow: true,
  ...extra,
});

function drive(challenge: BoardChallenge): FullBoardOptions {
  const route = challengeRoute(challenge);
  const box = taskGoalBox(challenge);
  const start = taskStart(challenge);
  // Parked cars stand all over the parking area: they are drawn, but only the
  // upside-down ones, which the task is about, pull the picture toward them.
  const cars = others(challenge);
  const blocking = cars.filter((car) => car.flipped);
  return {
    routes: route ? [line(route.points)] : [],
    box,
    cars: [...cars, player(start)],
    view: previewView(
      around([...(route?.points ?? []), start, ...blocking], [box]),
    ),
  };
}

function warmup(): FullBoardOptions {
  const { arm, lane, along } = FIRST_DRIVE.start;
  const start = lanePoint(arm, "approach", lane, along);
  const box = goalBox(FIRST_DRIVE.goal);
  const end = { x: start.x, z: (box.z0 + box.z1) / 2 };
  return {
    routes: [line([start, end])],
    box,
    cars: [player({ ...start, heading: laneBearing(arm, "approach") })],
    view: previewView(around([start], [box])),
  };
}

function watch(lessonId: string): FullBoardOptions {
  const lesson = lessonById(lessonId);
  const plan = lesson ? lessonPlan(lesson) : null;
  const route = plan?.route;
  if (!route) return { view: previewView(null) };
  const routes: Line[] = [];
  if (plan.closed) {
    routes.push(
      line(plan.closed.points, {
        color: PREVIEW_COLORS.closed,
        width: 1,
        dashed: true,
      }),
    );
  }
  routes.push(line(route.points));
  const cars: Car[] = lesson?.block
    ? blockCars(lesson.block).map((car) => ({
        x: car.x,
        z: car.z,
        heading: car.heading,
        color: CAR_COLORS.red,
        flipped: true,
      }))
    : [];
  const start = route.points[0];
  cars.push(player({ ...start, heading: route.headings[0] }));
  return {
    routes,
    cars,
    view: previewView(around([...route.points, ...cars], [])),
  };
}

function slides(level: Level): FullBoardOptions {
  const deck = levelSlides(level);
  const boxes = deck.flatMap((slide) => (slide.box ? [slide.box] : []));
  const cars: Car[] = deck.flatMap((slide) =>
    slide.block
      ? blockCars(slide.block).map((car) => ({
          x: car.x,
          z: car.z,
          heading: car.heading,
          color: CAR_COLORS.red,
          flipped: true,
        }))
      : [],
  );
  return { cars, view: previewView(around([], boxes)) };
}

function lanes(arm: Parameters<typeof queueCars>[0]): FullBoardOptions {
  const queue = queueCars(arm);
  const cars: Car[] = queue.map((car) => ({
    x: car.start.x,
    z: car.start.z,
    heading: car.start.heading,
    color: car.paint,
  }));
  // The cars and the roundabout they are waiting to enter.
  return {
    cars,
    numbers: true,
    view: previewView(around([...cars, { x: 0, z: 0 }], [])),
  };
}

/** What `fullBoardSvg` should draw for this level's picture. */
export function levelPreview(level: Level): FullBoardOptions {
  const base: FullBoardOptions = { numbers: false, cover: true };
  let own: FullBoardOptions;
  if (level.kind === "drive") {
    const challenge = challengeById(level.challenge);
    own = challenge ? drive(challenge) : { view: previewView(null) };
  } else if (level.kind === "warmup") own = warmup();
  else if (level.kind === "watch") own = watch(level.lesson);
  else if (level.kind === "slides") own = slides(level);
  else if (level.kind === "lanes") own = lanes(level.arm);
  else own = { view: previewView(null) };
  return thicken({ ...base, ...own });
}
