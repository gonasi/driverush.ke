/**
 * Decides what a mistake costs. Small ones (a refused lane change, stopping on
 * the roundabout) lose a star and the drive goes on. Serious ones (the wrong
 * exit, a crash) end the attempt, the way an examiner would stop you.
 *
 * The lane-keeping driver reports what happened; this says whether it broke a
 * rule from the handbook.
 */
import type { CarState } from "./car-sim";
import type { BoardChallenge } from "./challenges";
import { ARMS, allowedTurns, locate, type Turn } from "./geometry";
import type { GuideEvent, Refusal } from "./guide";

export type SmallFaultId = Refusal | "roundabout_stop";
export type SeriousFaultId =
  | "wrong_exit"
  | "wrong_destination"
  | "full_circle"
  | "collision"
  | "past_end";
export type FaultId = SmallFaultId | SeriousFaultId;

export type Fault = {
  id: FaultId;
  /** Serious faults end the attempt. Small ones only cost a star. */
  serious: boolean;
  /** The approach lane, for lane faults. */
  lane?: number;
  /** How many lanes that approach road has. */
  lanes?: number;
  /** The turn the car actually made. */
  turn?: Turn;
  /** The turn the challenge asked for. */
  asked?: Turn;
};

export function smallFault(id: SmallFaultId): Fault {
  return { id, serious: false };
}

export const COLLISION: Fault = { id: "collision", serious: true };

/** Was what the car just did against the rules, or against the task? */
export function judge(
  event: GuideEvent,
  challenge: BoardChallenge,
): Fault | null {
  switch (event.type) {
    case "stopped_on_roundabout":
      return smallFault("roundabout_stop");
    case "full_circle":
      return { id: "full_circle", serious: true, lane: event.lane };
    case "past_end":
      return { id: "past_end", serious: true };
    case "exited": {
      const lanes = ARMS[event.entryArm].lanes;
      if (!allowedTurns(lanes, event.entryLane).includes(event.turn)) {
        return {
          id: "wrong_exit",
          serious: true,
          lane: event.entryLane,
          lanes,
          turn: event.turn,
        };
      }
      if (event.arm !== challenge.goal.arm) {
        return {
          id: "wrong_destination",
          serious: true,
          turn: event.turn,
          asked: challenge.turn,
        };
      }
      return null;
    }
  }
}

/** Is the car inside the stopping box (wherever it is pointing)? */
export function inGoalBox(challenge: BoardChallenge, car: CarState): boolean {
  const loc = locate(car.x, car.z);
  const goal = challenge.goal;
  return (
    loc.kind === "arm" &&
    loc.side === "exit" &&
    loc.arm === goal.arm &&
    loc.along >= goal.alongMin &&
    loc.along <= goal.alongMax &&
    (goal.lane == null || loc.lane === goal.lane)
  );
}
