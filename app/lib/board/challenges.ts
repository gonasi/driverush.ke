/**
 * What the examiner asks for. Every challenge starts on the four-lane road,
 * because that is the approach the handbook spells out lane by lane. The start
 * lane is often the wrong one for the turn, so choosing a lane is part of it.
 */
import {
  armForTurn,
  laneBearing,
  lanePoint,
  type ArmId,
  type Turn,
} from "./geometry";

export type OtherCar = {
  x: number;
  z: number;
  heading: number;
  color: "red";
};

export type BoardGoal = {
  arm: ArmId;
  /** Only this lane counts, when set. */
  lane?: number;
  alongMin: number;
  alongMax: number;
};

export type BoardChallenge = {
  id: string;
  title: string;
  /** Said to the learner, examiner style. */
  prompt: string;
  start: { arm: ArmId; lane: number; along: number };
  turn: Turn;
  goal: BoardGoal;
  otherCars: OtherCar[];
};

const START_ALONG = 50;
const BOX = { alongMin: 33, alongMax: 44 };

function turnChallenge(
  id: string,
  title: string,
  prompt: string,
  startLane: number,
  turn: Turn,
): BoardChallenge {
  return {
    id,
    title,
    prompt,
    start: { arm: "S", lane: startLane, along: START_ALONG },
    turn,
    goal: { arm: armForTurn("S", turn), ...BOX },
    otherCars: [],
  };
}

const RED_ALONG = 46;
const redArm = armForTurn("S", "left");
const redAt = lanePoint(redArm, "exit", 1, RED_ALONG);

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
];

export const BOARD_ROUND_SIZE = 5;

export function challengeById(id: string): BoardChallenge | undefined {
  return BOARD_CHALLENGES.find((c) => c.id === id);
}
