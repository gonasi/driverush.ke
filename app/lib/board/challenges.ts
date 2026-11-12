/**
 * What the examiner asks for. There are two kinds of task.
 *
 * A turn task starts on a road into the roundabout: the four-lane road (option
 * code 2124) or the three-lane road (215). The start lane is often the wrong
 * one for the turn, so choosing a lane is part of it.
 *
 * A route task goes somewhere else on the board: down the street, onto the
 * two-way road, into a parking bay or out of one. It is one of the lessons in
 * `lessons.ts`, driven by the learner instead of watched, and the referee
 * checks the drive against that lesson's route.
 */
import {
  ARMS,
  armForTurn,
  laneBearing,
  lanePoint,
  type ArmId,
  type Side,
  type Turn,
} from "./geometry";
import { blockById } from "./blocks";
import type { BoardCarId } from "./cars";
import { parkedCars } from "./parking-layouts";

export type OtherCar = {
  x: number;
  z: number;
  heading: number;
  color: "red";
  /** Its own paint, model and plate, where the cars on the table differ. */
  paint?: string;
  car?: BoardCarId;
  plate?: string;
  /**
   * Turned upside down by the instructor to close a way (`blocks.ts`). It
   * cannot be pushed aside.
   */
  flipped?: boolean;
};

export type BoardGoal = {
  arm: ArmId;
  /**
   * Which side of the road the box is on. Left out, it is the side leaving the
   * roundabout. The U-turn task ends on the side driving back toward it.
   */
  side?: Side;
  /** Only this lane counts, when set. */
  lane?: number;
  alongMin: number;
  alongMax: number;
};

type TaskBase = {
  id: string;
  title: string;
  /** Said to the learner, examiner style. */
  prompt: string;
  otherCars: OtherCar[];
};

export type TurnChallenge = TaskBase & {
  start: { arm: ArmId; lane: number; along: number };
  turn: Turn;
  goal: BoardGoal;
};

export type RouteChallenge = TaskBase & {
  /** The id of the lesson in `lessons.ts` whose route this task drives. */
  lesson: string;
  /** The car has a reverse gear in this task. */
  reverse: boolean;
  /** The way an upside-down car has closed, in a blocked-road task. */
  block?: string;
};

export type BoardChallenge = TurnChallenge | RouteChallenge;

export function isRouteTask(
  challenge: BoardChallenge,
): challenge is RouteChallenge {
  return "lesson" in challenge;
}

/** Far enough back that there is room to change lanes before the continuous lines. */
const START_ALONG = 60;
const BOX = { alongMin: 33, alongMax: 44 };

function turnChallenge(
  id: string,
  title: string,
  prompt: string,
  startLane: number,
  turn: Turn,
  /** The road it starts on, and the one lane it must end in, when that matters. */
  from: ArmId = "S",
  endLane?: number,
): TurnChallenge {
  return {
    id,
    title,
    prompt,
    // the three-lane road is shorter: start a little in from the frame
    start: {
      arm: from,
      lane: startLane,
      along: Math.min(START_ALONG, ARMS[from].length - 8),
    },
    turn,
    goal: { arm: armForTurn(from, turn), lane: endLane, ...BOX },
    otherCars: [],
  };
}

const RED_ALONG = 46;
const redArm = armForTurn("S", "left");
const redAt = lanePoint(redArm, "exit", 1, RED_ALONG);

/**
 * The cars standing in the parking bays. Solid, in the tasks that go there.
 * They are read each time, because the bays they stand in change from one
 * attempt to the next (`parking-layouts.ts`).
 */
const parked = {
  get otherCars(): OtherCar[] {
    return parkedCars().map((spot) => ({ ...spot, color: "red" as const }));
  },
};

/** A parking task: its cars follow the layout, and it has a reverse gear. */
function parkingTask(
  task: Omit<RouteChallenge, "otherCars" | "reverse">,
): RouteChallenge {
  return Object.defineProperty({ ...task, reverse: true }, "otherCars", {
    enumerable: true,
    get: () => parked.otherCars,
  }) as RouteChallenge;
}

/** What the upside-down cars are painted, so they read as one thing. */
const BLOCK_PAINT = "#b8141b";

/** The upside-down cars of a block, as cars on the table. */
export function blockCars(id: string): OtherCar[] {
  return (blockById(id)?.cars ?? []).map((car) => ({
    ...car,
    color: "red" as const,
    paint: BLOCK_PAINT,
    flipped: true,
  }));
}

/**
 * A blocked-road task. Its lesson is one of `BLOCKED_ROUTES`, and the cars are
 * read when asked for: the block's, and the parked ones where the task parks.
 */
function blockedTask(
  task: Omit<RouteChallenge, "otherCars" | "reverse" | "lesson" | "block"> & {
    block: string;
    parks?: boolean;
  },
): RouteChallenge {
  const { parks = false, ...rest } = task;
  return Object.defineProperty(
    { ...rest, lesson: task.id, reverse: parks },
    "otherCars",
    {
      enumerable: true,
      get: () => [...(parks ? parked.otherCars : []), ...blockCars(task.block)],
    },
  ) as RouteChallenge;
}

/** Said at the end of every blocked-road task. */
const FIND_IT = "Find the next correct route. Stop in the green box.";

const BLOCKED_TASKS: readonly RouteChallenge[] = [
  blockedTask({
    id: "blocked-lane",
    block: "lane",
    title: "A lane is blocked",
    prompt: `You are in lane 4. Turn right at the roundabout, then right onto the two-way road. The upside-down car means lane 4 is blocked. ${FIND_IT}`,
  }),
  blockedTask({
    id: "blocked-ring",
    block: "ring",
    title: "A lane on the roundabout is blocked",
    prompt: `You are in lane 4. Come back down this road. The upside-down car means lane 4 on the roundabout is blocked, and no other lane may go all the way round. ${FIND_IT}`,
  }),
  blockedTask({
    id: "blocked-exit",
    block: "exit",
    title: "An exit is blocked",
    prompt: `Reach the bottom of the two-way road. The upside-down cars mean the roundabout's exit to it is blocked. ${FIND_IT}`,
  }),
  blockedTask({
    id: "blocked-gap",
    block: "gap",
    title: "The gap is blocked",
    prompt: `You are in lane 2 at the continuous lines, and you are asked to turn left. Lane 2 only goes straight, and the upside-down car means the first gap in the central reserve is blocked. ${FIND_IT}`,
  }),
  blockedTask({
    id: "blocked-street",
    block: "street",
    title: "The street is blocked",
    prompt: `Reach the top of the two-way road. The upside-down car means the street is blocked. ${FIND_IT}`,
  }),
  blockedTask({
    id: "blocked-parking",
    block: "parking",
    parks: true,
    title: "The way into the parking is blocked",
    prompt:
      "Park nose first in the farthest free angle bay. It has the green box. The upside-down car means the turn into the parking is blocked. Find the next correct route.",
  }),
];

const ROUTE_TASKS: readonly RouteChallenge[] = [
  {
    id: "to-two-way",
    lesson: "right-to-two-way",
    title: "Right, then the two-way road",
    prompt:
      "Turn right at the roundabout. At the stop line, stop, then turn right onto the two-way road. Stop in the green box.",
    reverse: false,
    otherCars: [],
  },
  {
    id: "down-the-street",
    lesson: "street",
    title: "Down the street",
    prompt:
      "Take the street on your left. Stop at the stop line, then turn left onto the two-way road. Stop in the green box.",
    reverse: false,
    otherCars: [],
  },
  {
    id: "from-two-way",
    lesson: "two-way-to-dual",
    title: "Back to the dual carriageway",
    prompt:
      "Turn left into the three-lane road, then left at the roundabout. Stop in the green box.",
    reverse: false,
    otherCars: [],
  },
  {
    id: "long-way-round",
    lesson: "long-way-round",
    title: "The long way round",
    prompt:
      "You are in lane 2 at the continuous lines, and you are asked to turn left. Lane 2 only goes straight. Take the longest correct route: go straight, turn back through the gap in the central reserve, then turn right at the roundabout. Stop in the green box.",
    reverse: false,
    otherCars: [],
  },
  parkingTask({
    id: "park-flush",
    lesson: "park-flush-reverse",
    title: "Flush parking",
    prompt:
      "Drive up the two-way road, past the farthest free flush parking box. Stop, then reverse into it, inside the box.",
  }),
  parkingTask({
    id: "leave-flush",
    lesson: "leave-flush",
    title: "Pull out of flush parking",
    prompt:
      "You are parked in the flush parking. Pull out forward and carry on up the two-way road. Stop in the green box.",
  }),
  parkingTask({
    id: "park-angle",
    lesson: "park-angle",
    title: "Angle parking",
    prompt:
      "Take the street, turn into the parking aisle, and park nose first in the farthest free bay on your left. It has the green box.",
  }),
  parkingTask({
    id: "leave-angle",
    lesson: "leave-angle-reverse",
    title: "Reverse out of the bay",
    prompt:
      "Reverse out of the bay: stop, pull the joystick back and hold it. Then leave by the three-lane road, stop at the stop line and turn left. Stop in the green box.",
  }),
];

export const BOARD_CHALLENGES: readonly BoardChallenge[] = [
  turnChallenge(
    "straight",
    "Go straight",
    "Go straight across the roundabout. Stop in the green box.",
    2,
    "straight",
  ),
  turnChallenge(
    "left",
    "Turn left",
    "Turn left at the roundabout. Stop in the green box.",
    2,
    "left",
  ),
  turnChallenge(
    "right",
    "Turn right",
    "Turn right at the roundabout. Stop in the green box.",
    2,
    "right",
  ),
  turnChallenge(
    "back",
    "Come back",
    "Go round the roundabout and come back down this road. Stop in the green box.",
    3,
    "back",
  ),
  {
    id: "turn-back",
    title: "Turn back",
    prompt:
      "Go straight across the roundabout. Turn back through the first gap in the central reserve and stop in the green box.",
    start: { arm: "S", lane: 2, along: START_ALONG },
    turn: "straight",
    // On the side driving back toward the roundabout, short of the continuous lines.
    goal: { arm: "N", side: "approach", alongMin: 46, alongMax: 58 },
    otherCars: [],
  },
  {
    id: "behind-red",
    title: "Behind the red car",
    prompt:
      "Turn left at the roundabout and stop the yellow car behind the red car.",
    start: { arm: "S", lane: 3, along: START_ALONG },
    turn: "left",
    goal: {
      arm: redArm,
      lane: 1,
      alongMin: RED_ALONG - 12,
      alongMax: RED_ALONG - 5,
    },
    otherCars: [
      {
        x: redAt.x,
        z: redAt.z,
        heading: laneBearing(redArm, "exit"),
        color: "red",
      },
    ],
  },
  turnChallenge(
    "three-lane-right",
    "Right from the three-lane road",
    "You are on the three-lane road. Turn right at the roundabout and stop in the green box, in lane 4.",
    2,
    "right",
    "W",
    4,
  ),
  turnChallenge(
    "three-lane-back",
    "Come back on the three-lane road",
    "You are on the three-lane road. Go round the roundabout and come back down this road. Stop in the green box, in lane 3.",
    2,
    "back",
    "W",
    3,
  ),
  ...ROUTE_TASKS,
  ...BLOCKED_TASKS,
];

export const BOARD_ROUND_SIZE = 5;

export function challengeById(id: string): BoardChallenge | undefined {
  return BOARD_CHALLENGES.find((c) => c.id === id);
}
