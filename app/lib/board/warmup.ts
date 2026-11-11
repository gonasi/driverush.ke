/**
 * The first drive: one car, one straight road, a green box a short way ahead.
 * It opens the course so a learner's first minute is spent moving the car, not
 * reading. Nothing here is graded and nothing ends the attempt: a mistake puts
 * the car back a little and says the rule.
 *
 * It is a turn task the referee can judge, but it is not in `BOARD_CHALLENGES`,
 * so it never turns up in a mock round.
 */
import type { TurnChallenge } from "./challenges";

export const WARMUP_LEVEL_ID = "first-drive";

export const FIRST_DRIVE: TurnChallenge = {
  id: "warmup:first-drive",
  title: "Your first drive",
  prompt:
    "Push the joystick the way the car is facing to drive. Let go to stop. Stop in the green box.",
  start: { arm: "S", lane: 2, along: 62 },
  turn: "straight",
  // On the way up to the roundabout, back where the lane lines are broken.
  goal: { arm: "S", side: "approach", alongMin: 36, alongMax: 47 },
  otherCars: [],
};

export function isWarmupTask(id: string): boolean {
  return id.startsWith("warmup:");
}
