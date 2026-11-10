/**
 * What the learner reads when the referee stops them: the rule they broke, in
 * plain words, and what to do instead. The board's answer to `miss-tips.ts`.
 * Every rule here is in the NTSA Kenya Learner Driver Handbook, Unit 3.
 */
import { lanesForTurn, type Turn } from "./geometry";
import type { Fault, FaultId } from "./referee";

export const RULES_SOURCE = "Kenya Learner Driver Handbook, NTSA";

export type FaultTip = {
  id: FaultId;
  title: string;
  reason: string;
  /** The rule in one line, for the result card. */
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
  off_road: {
    title: "Off the road",
    rule: "Stay off the yellow kerb and the grass.",
  },
  wrong_way: {
    title: "Wrong way",
    rule: "Keep left, and go round the roundabout clockwise.",
  },
  centre_line: {
    title: "Over the centre line",
    rule: "A continuous yellow centre line means stay on your side.",
  },
  roundabout_lane_change: {
    title: "Lane change on the roundabout",
    rule: "No changing lanes on the roundabout.",
  },
  roundabout_stop: {
    title: "Stopped on the roundabout",
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
  collision: {
    title: "You hit the red car",
    rule: "Stop behind the car in front and leave a gap.",
  },
};

function reasonFor(fault: Fault): string {
  switch (fault.id) {
    case "off_road":
      if (fault.pastEnd) {
        return "You drove past the end of the board. Brake early and stop inside the green box.";
      }
      return "You drove onto the kerb or the grass. The yellow kerb protects the field, so there is no driving, stopping or parking on it.";
    case "wrong_way":
      return "You drove against the traffic. In Kenya you keep left, and you go round a roundabout clockwise.";
    case "centre_line":
      return "You crossed the yellow centre line into the lanes coming the other way. A continuous yellow line means stay on your side.";
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
      return `You were asked to ${TURN_VERB[asked]}, but you ${TURN_PAST[did]}. To ${TURN_VERB[asked]} from this road, approach in ${laneList(lanesForTurn(4, asked))}.`;
    }
    case "collision":
      return "You drove into the red car. Slow down early and stop behind it with a gap.";
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
