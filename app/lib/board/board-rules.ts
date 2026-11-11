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

export function laneRule(lanes: number, lane: number): string {
  if (lane <= 1) return "Lane 1 goes straight or left.";
  if (lane === 2) return "Lane 2 only goes straight.";
  if (lanes === 4 && lane === 3) return "Lane 3 goes straight or right.";
  return `Lane ${lane} is the lane for going round.`;
}

const RULES: Record<FaultId, { title: string; rule: string }> = {
  kerb: {
    title: "You hit the kerb",
    rule: "Stay off the kerb. No driving or stopping on it.",
  },
  central_reserve: {
    title: "You hit the central reserve",
    rule: "The central reserve keeps the two directions apart.",
  },
  island: {
    title: "You hit the island",
    rule: "Go round the island, clockwise, in your lane.",
  },
  solid_line: {
    title: "Over a continuous white line",
    rule: "A continuous white line means no changing lanes. Pick your lane earlier.",
  },
  roundabout_lane_change: {
    title: "Lane change on the roundabout",
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
  wrong_way: {
    title: "Wrong way",
    rule: "Keep left, and go round the roundabout clockwise.",
  },
  centre_line: {
    title: "Over the centre line",
    rule: "A continuous yellow centre line means stay on your side.",
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
    rule: "Slow down early and stop inside the green box.",
  },
  off_route: {
    title: "Not that road",
    rule: "Follow the road the examiner asked for.",
  },
  wrong_lane: {
    title: "Wrong lane at the roundabout",
    rule: "Be in the lane for your turn before the lines turn continuous, and hold it.",
  },
  stop_line: {
    title: "You did not stop at the stop line",
    rule: "At a stop line you stop every time, even when the road is clear.",
  },
  bay_line: {
    title: "Not straight in the bay",
    rule: "Park with the whole car inside the lines, straight in the bay.",
  },
};

function reasonFor(fault: Fault): string {
  switch (fault.id) {
    case "kerb":
      return "You drove into the kerb at the edge of the road. No driving, stopping or parking on it.";
    case "central_reserve":
      return "You drove into the central reserve. It separates you from the traffic coming the other way, so keep to your own lanes.";
    case "island":
      return "You drove into the island in the middle of the roundabout. Turn with the road and go round it clockwise, staying in your lane.";
    case "solid_line":
      return "You changed lanes over a continuous white line. Close to the roundabout the lane lines are continuous, which means no changing lanes. Choose your lane further back, where the lines are broken.";
    case "roundabout_lane_change":
      return `You moved to a different lane inside the roundabout. Choose your lane before you enter and stay in it until your exit. Lane ${fault.lane ?? 1} on the road is lane ${fault.lane ?? 1} on the roundabout, counting from the outside.`;
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
    case "wrong_way":
      return "You drove against the traffic. In Kenya you keep left, and you go round a roundabout clockwise.";
    case "centre_line":
      return "You crossed the yellow centre line into the lanes coming the other way. A continuous yellow line means stay on your side.";
    case "full_circle":
      return `You went all the way round after entering in lane ${fault.lane ?? 1}. Only the innermost lane, lane 4, may make a full circle. In the other lanes, take your exit the first time you reach it.`;
    case "collision":
      return "You drove into the red car. Ease off early and stop behind it with a gap.";
    case "off_route":
      return "You turned onto a road this task does not use. Stay on the road you were asked to take, and stop in the green box.";
    case "wrong_lane":
      return "You came up to the roundabout, or went round it, in a lane that does not make this turn. Choose the lane further back, where the lines are broken, and stay in it until your exit.";
    case "stop_line":
      return "You drove over the stop line without stopping. A stop line means stop every time, look both ways, and go only when the road is clear.";
    case "bay_line":
      return "The car is in the bay but over a line or at an angle. Straighten up so the whole car sits inside the lines. You can reverse a little to line it up.";
    case "past_end":
      return "You drove on past the green box. Ease off as you reach the box, then let go and the car brakes to a stop.";
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
