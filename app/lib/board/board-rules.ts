/**
 * What the learner reads when they make a mistake: the rule, in plain words,
 * and what to do instead. The board's answer to `miss-tips.ts`. Every rule here
 * is in the NTSA Kenya Learner Driver Handbook, Unit 3.
 */
import { lanesForTurn, type Turn } from "./geometry";
import type { Fault, FaultId } from "./referee";

export const RULES_SOURCE = "Kenya Learner Driver Handbook, NTSA";
/**
 * Where the blocked-road rule comes from. It is how instructors set the board
 * up, not a line of the handbook, so it is never credited to the handbook.
 */
export const BLOCK_SOURCE = "How driving instructors set the board";

export type FaultTip = {
  id: FaultId;
  title: string;
  reason: string;
  /** The rule in one line, for the toast and the result card. */
  rule: string;
  /** Where the rule comes from, when it is not the handbook. */
  source?: string;
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

/**
 * The lanes to approach in for a turn, the usual ones first. The innermost
 * lane can make every turn, but for left and straight on it is the long way
 * round, so it is not the lane to send a learner to.
 */
function approachAdvice(lanes: number, turn: Turn): string {
  const all = lanesForTurn(lanes, turn);
  const longWay = turn === "left" || (turn === "straight" && lanes === 4);
  const usual = longWay && all.length > 1 ? all.filter((n) => n !== lanes) : all;
  const extra =
    usual.length < all.length
      ? ` Lane ${lanes} can also do it, the long way round.`
      : "";
  return `approach in ${laneList(usual)}.${extra}`;
}

export function laneRule(lanes: number, lane: number): string {
  if (lane <= 1) return "Lane 1 goes straight or left.";
  if (lane === 2) return "Lane 2 only goes straight.";
  if (lanes === 4 && lane === 3) return "Lane 3 goes straight or right.";
  if (lanes === 4) {
    return "Lane 4 turns right, comes back, turns left the long way round, or goes straight after going round.";
  }
  return "Lane 3 goes straight, turns right into lane 3 or lane 4, comes back into lane 3, or turns left the long way round.";
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
    rule: "A continuous white line means no changing lanes, and no driving on it. Change where the lines are broken.",
  },
  roundabout_lane_change: {
    title: "Lane change on the roundabout",
    rule: "No changing lanes on the roundabout. Go round in the lane you came in.",
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
    rule: "A continuous yellow centre line means stay on your side. Cross only where it is broken.",
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
    title: "Not the way you were asked",
    rule: "Follow the road the examiner asked for.",
  },
  wrong_lane: {
    title: "Wrong lane for the turn",
    rule: "Be in the lane for your turn before you reach it, and hold it.",
  },
  stop_line: {
    title: "You did not stop at the stop line",
    rule: "At a stop line you stop every time, even when the road is clear.",
  },
  exit_lane: {
    title: "Wrong lane leaving the roundabout",
    rule: "Leave the roundabout in the lane you came round in.",
  },
  u_turn_lane: {
    title: "Wrong lane to turn back",
    rule: "Turn back from the lane beside the central reserve, into the lane beside it.",
  },
  crossing_stop: {
    title: "Stopped on the crossing",
    rule: "No stopping, parking or waiting on a pedestrian crossing.",
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
      return "You crossed a continuous white line between two lanes, or drove along on top of it. Near the roundabout the lane lines are continuous, on the way in and on the way out. That means stay in your lane there. Change lanes further from the roundabout, where the lines are broken.";
    case "roundabout_lane_change":
      return `You moved out of your lane inside the roundabout. Choose your lane before you enter, go round in it, and leave it only at your exit. Lane ${fault.lane ?? 1} on the road is lane ${fault.lane ?? 1} on the roundabout, counting from the outside.`;
    case "roundabout_stop":
      return "There is no stopping or waiting on the roundabout. Keep moving until you've taken your exit.";
    case "wrong_exit": {
      const lanes = fault.lanes ?? 4;
      const turn = fault.turn ?? "straight";
      return `${laneRule(lanes, fault.lane ?? 1)} To ${TURN_VERB[turn]}, ${approachAdvice(lanes, turn)}`;
    }
    case "wrong_destination": {
      const asked = fault.asked ?? "straight";
      const did = fault.turn ?? "straight";
      return `You were asked to ${TURN_VERB[asked]}, but you ${TURN_PAST[did]}. Your lane may take that exit, so no rule was broken and nobody stops you, but only the turn you were asked for is a pass. To ${TURN_VERB[asked]} from this road, ${approachAdvice(fault.lanes ?? 4, asked)} Count the exits as you go round: left is the first, straight the second, right the third.`;
    }
    case "wrong_way":
      return "You drove against the traffic. In Kenya you keep left, and you go round a roundabout clockwise.";
    case "centre_line":
      return "You crossed the continuous yellow centre line into the lane coming the other way. A continuous yellow line means stay on your side: no overtaking and no turning across it. You may cross only where the yellow line is broken.";
    case "full_circle":
      return `You went all the way round after entering in lane ${fault.lane ?? 1}. Only the innermost lane, lane 4, may make a full circle. In the other lanes, take your exit the first time you reach it.`;
    case "collision":
      return fault.block
        ? "You drove into the upside-down car. An instructor turns a car over to close that way, so you may not touch it or squeeze past it. Look for it before you set off, then take the next correct route: the shortest one that is still open, without using the parking area unless nothing else is left."
        : "You drove into the red car. Ease off early and stop behind it with a gap.";
    case "off_route":
      return "You left the way you were asked to go, for a road or a part of the road this task does not use. No rule was broken, so nobody stops you, but only the route you were asked for is a pass. Stay on the road you were asked to take, and stop in the green box.";
    case "wrong_lane":
      return "You made the turn from a lane that does not make it. At a junction, turn left from the lane by the kerb. Be in that lane before you reach the turn, and hold it.";
    case "stop_line":
      return "You drove over the stop line without stopping. A stop line means stop every time, look both ways, and go only when the road is clear.";
    case "exit_lane":
      return `You came round in lane ${fault.lane ?? 1} but left the roundabout in a different lane. Leaving in the wrong lane is one of the common mistakes the handbook names. Hold your lane off the roundabout, then change lanes further on, where the lines are broken.`;
    case "u_turn_lane":
      return `To turn back through a gap in the central reserve, be in lane ${fault.lane ?? 4}, the lane beside the reserve, before you reach the gap. Finish the turn in the lane beside the reserve on the other side, then change lanes where the lines are broken.`;
    case "crossing_stop":
      return "You stopped on the white bars of the pedestrian crossing. Stop before it when someone is crossing, and never on it. The same goes for the roundabout, the yellow kerb and junctions: no stopping, parking or waiting there.";
    case "bay_line":
      return "The car is in the bay but over a line or at an angle. Straighten up so the whole car sits inside the lines. You can reverse a little to line it up.";
    case "past_end":
      return "You drove on past the green box. No rule was broken, so nobody stops you, but the drive is only a pass if you stop in the box when you reach it. Ease off as you reach the box, then let go and the car brakes to a stop.";
  }
}

/** Hitting an upside-down car is a collision with its own words. */
const BLOCK_HIT = {
  title: "You hit the upside-down car",
  rule: "An upside-down car means that way is blocked. Find the next correct route.",
};

export function faultTip(fault: Fault): FaultTip {
  const words =
    fault.id === "collision" && fault.block ? BLOCK_HIT : RULES[fault.id];
  return {
    id: fault.id,
    ...words,
    reason: reasonFor(fault),
    ...(words === BLOCK_HIT ? { source: BLOCK_SOURCE } : {}),
  };
}

export function faultRule(id: FaultId): string {
  return RULES[id].rule;
}

/** The handbook's lane tables, for the guide and the briefing. */
export const FOUR_LANE_TABLE: readonly { lane: number; does: string }[] = [
  { lane: 1, does: "Two options: go straight (0°) or turn left (90°)." },
  { lane: 2, does: "One option: go straight (0°)." },
  { lane: 3, does: "Two options: go straight (0°) or turn right (90°)." },
  {
    lane: 4,
    does: "Four options: turn right (90°), come back (180°), turn left the long way round (270°), or go straight after going round (360°).",
  },
];

export const THREE_LANE_TABLE: readonly { lane: number; does: string }[] = [
  { lane: 1, does: "Two options: go straight (0°) or turn left (90°)." },
  { lane: 2, does: "One option: go straight (0°)." },
  {
    lane: 3,
    does: "Five options: go straight (0°), turn right into lane 3 (90°), turn right into lane 4 (90°), come back into lane 3 (180°), or turn left into lane 3 and move to lane 4 where the line is broken (270°).",
  },
];
