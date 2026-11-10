/**
 * What the learner reads when they make a mistake: the rule, in plain words,
 * and what to do instead. The board's answer to `miss-tips.ts`. Every rule here
 * is in the NTSA Kenya Learner Driver Handbook, Unit 3.
 */
import { lanesForTurn, type Turn } from "./geometry";
import type { Fault, FaultId } from "./referee";

export const RULES_SOURCE = "Kenya Learner Driver Handbook, NTSA";

export type FaultTip = {
  id: FaultId;
  title: string;
  reason: string;
  /** The rule in one line, for the toast and the result card. */
  rule: string;
};

const TURN_VERB: Record<Turn, string> = {
  left: "turn left",
  straight: "go straight",
  right: "turn right",
  back: "come back",
};

const TURN_PAST: Record<Turn, string> = {
  left: "turned left",
  straight: "went straight",
  right: "turned right",
  back: "came back",
};

function laneList(lanes: number[]): string {
  if (lanes.length <= 1) return `lane ${lanes[0]}`;
  return `lane ${lanes.slice(0, -1).join(", ")} or ${lanes[lanes.length - 1]}`;
}

function laneRule(lanes: number, lane: number): string {
  if (lane <= 1) return "Lane 1 goes straight or left.";
  if (lane === 2) return "Lane 2 only goes straight.";
  if (lanes === 4 && lane === 3) return "Lane 3 goes straight or right.";
  return `Lane ${lane} is the lane for going round.`;
}

const RULES: Record<FaultId, { title: string; rule: string }> = {
  kerb: {
    title: "That's the kerb",
    rule: "The yellow kerb is not a lane. No driving or stopping on it.",
  },
  central_reserve: {
    title: "That's the central reserve",
    rule: "The central reserve keeps the two directions apart.",
  },
  centre_line: {
    title: "Continuous yellow line",
    rule: "A continuous yellow centre line means stay on your side.",
  },
  solid_line: {
    title: "Continuous white line",
    rule: "A continuous white line means no changing lanes. Pick your lane earlier.",
  },
  roundabout_lane_change: {
    title: "No lane changes here",
    rule: "No changing lanes on the roundabout.",
  },
  roundabout_stop: {
    title: "Keep moving",
    rule: "No stopping or waiting on the roundabout.",
  },
  wrong_exit: {
    title: "Wrong lane for that turn",
    rule: "Pick the lane for your turn before the roundabout.",
  },
  wrong_destination: {
    title: "Not the turn you were asked for",
    rule: "Take the turn the examiner asked for.",
  },
  full_circle: {
    title: "All the way round",
    rule: "Only lane 4, the innermost lane, may make a full circle.",
  },
  collision: {
    title: "You hit the red car",
    rule: "Stop behind the car in front and leave a gap.",
  },
  past_end: {
    title: "Past the green box",
    rule: "Let go early enough to stop inside the green box.",
  },
};

function reasonFor(fault: Fault): string {
  switch (fault.id) {
    case "kerb":
      return "There is no lane on that side, only the yellow kerb. It protects the field: no driving, stopping or parking on it.";
    case "central_reserve":
      return "There is no lane on that side. The central reserve separates you from the traffic coming the other way.";
    case "centre_line":
      return "You are in the lane beside the centre. A continuous yellow line means stay on your side of it.";
    case "solid_line":
      return "The lane lines are continuous close to the roundabout, which means no changing lanes. Choose your lane further back, where the lines are broken.";
    case "roundabout_lane_change":
      return "You stay in one lane all the way round. The lane you approach in is the lane you keep on the roundabout, counting from the outside.";
    case "roundabout_stop":
      return "There is no stopping or waiting on the roundabout. Keep moving until you've taken your exit.";
    case "wrong_exit": {
      const lanes = fault.lanes ?? 4;
      const turn = fault.turn ?? "straight";
      return `${laneRule(lanes, fault.lane ?? 1)} To ${TURN_VERB[turn]}, approach in ${laneList(lanesForTurn(lanes, turn))}.`;
    }
    case "wrong_destination": {
      const asked = fault.asked ?? "straight";
      const did = fault.turn ?? "straight";
      return `You were asked to ${TURN_VERB[asked]}, but you ${TURN_PAST[did]}. To ${TURN_VERB[asked]} from this road, approach in ${laneList(lanesForTurn(4, asked))} and count the exits: left is the first, straight the second, right the third.`;
    }
    case "full_circle":
      return `You went all the way round in lane ${fault.lane ?? 1}. Only the innermost lane, lane 4, may make a full circle. In the other lanes, take your exit the first time you reach it.`;
    case "collision":
      return "You drove into the red car. Let go of Go early and stop behind it with a gap.";
    case "past_end":
      return "You drove past the green box and ran out of road. Let go of Go as you reach the box, and the car brakes to a stop.";
  }
}

export function faultTip(fault: Fault): FaultTip {
  return { id: fault.id, ...RULES[fault.id], reason: reasonFor(fault) };
}

export function faultRule(id: FaultId): string {
  return RULES[id].rule;
}

/** The handbook's lane table, for the guide and the briefing. */
export const FOUR_LANE_TABLE: readonly { lane: number; does: string }[] = [
  { lane: 1, does: "Go straight or turn left." },
  { lane: 2, does: "Go straight only." },
  { lane: 3, does: "Go straight or turn right." },
  {
    lane: 4,
    does: "Turn right, come back, or go round. It is the only lane that may make a full circle.",
  },
];
