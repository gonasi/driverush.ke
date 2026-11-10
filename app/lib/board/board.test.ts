import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { faultTip } from "./board-rules";
import { BOARD_CHALLENGES, type BoardChallenge } from "./challenges";
import {
  ARMS,
  SOLID_ZONE,
  allowedTurns,
  armForTurn,
  bearingOf,
  laneBearing,
  lanePoint,
  lanesForTurn,
  locate,
  ringRadius,
  turnBetween,
  type Turn,
} from "./geometry";
import type { Fault } from "./referee";
import {
  beginChallenge,
  car,
  controls,
  loadPhysics,
  pressLeft,
  pressRight,
  stopDriving,
  tick,
  view,
} from "./runtime";

const STEP = 1 / 60;
/** How hard the car slows once Go is released, m/s². */
const RELEASE_DECEL = 7.4;

function task(turn: Turn, startLane = 1): BoardChallenge {
  return {
    id: "test",
    title: "test",
    prompt: "test",
    start: { arm: "S", lane: startLane, along: 56 },
    turn,
    goal: { arm: armForTurn("S", turn), alongMin: 33, alongMax: 44 },
    otherCars: [],
  };
}

type Outcome = {
  fault?: Fault;
  small: Fault[];
  goal: boolean;
  /** The car left the tarmac at some point. It never should. */
  offRoad: boolean;
};

/**
 * Play a task the way a learner does: hold Go, tap the two buttons, let go.
 * `each` is called every step and may press things.
 */
function play(
  challenge: BoardChallenge,
  each: (seconds: number) => void,
  seconds = 120,
): Outcome {
  const outcome: Outcome = { small: [], goal: false, offRoad: false };
  let over = false;
  beginChallenge(challenge, {
    onFault: (fault) => {
      outcome.fault = fault;
      over = true;
    },
    onSmall: (fault) => outcome.small.push(fault),
    onGoal: () => {
      outcome.goal = true;
      over = true;
    },
  });
  for (let i = 0; i < seconds / STEP && !over; i += 1) {
    each(i * STEP);
    tick(STEP);
    if (!over && locate(car.x, car.z).kind === "off") outcome.offRoad = true;
  }
  stopDriving();
  return outcome;
}

const degrees = () => ((bearingOf(car.x, car.z) * 180) / Math.PI + 360) % 360;
const onRoundabout = () => Math.hypot(car.x, car.z) < 19;

/** Where on the roundabout to tap Exit for each turn: after the exit before it. */
const TAP_EXIT: Record<Turn, () => boolean> = {
  // Signalled on the way in, so the first exit is taken.
  left: () => view.leftIsExit,
  straight: () => onRoundabout() && degrees() > 285 && degrees() < 330,
  right: () => onRoundabout() && degrees() > 15 && degrees() < 60,
  back: () => onRoundabout() && degrees() > 105 && degrees() < 150,
};

/** Hold Go, and let go in time to stop in the middle of the box. */
function goUntilBox(challenge: BoardChallenge): void {
  const goal = challenge.goal;
  const loc = locate(car.x, car.z);
  const middle = (goal.alongMin + goal.alongMax) / 2;
  const there =
    loc.kind === "arm" &&
    loc.side === "exit" &&
    loc.arm === goal.arm &&
    loc.along + car.speed ** 2 / (2 * RELEASE_DECEL) >= middle;
  controls.go = !there;
}

/** Drive a task properly: get into `lane`, signal at the right moment, stop. */
function proper(challenge: BoardChallenge, lane: number): Outcome {
  let tapped = false;
  return play(challenge, (seconds) => {
    if (seconds === 0) {
      for (let n = challenge.start.lane; n > lane; n -= 1) pressLeft();
      for (let n = challenge.start.lane; n < lane; n += 1) pressRight();
    }
    if (!tapped && TAP_EXIT[challenge.turn]()) {
      pressLeft();
      tapped = true;
    }
    goUntilBox(challenge);
  });
}

beforeAll(() => loadPhysics());
beforeEach(() => stopDriving());

describe("the board's geometry", () => {
  it("numbers lanes from the kerb in to the centre", () => {
    for (const lane of [1, 2, 3, 4]) {
      const p = lanePoint("S", "approach", lane, 40);
      expect(locate(p.x, p.z)).toMatchObject({
        kind: "arm",
        arm: "S",
        side: "approach",
        lane,
      });
    }
    // Kenya keeps left: heading north you sit on the west side.
    expect(lanePoint("S", "approach", 1, 40).x).toBeLessThan(
      lanePoint("S", "approach", 4, 40).x,
    );
    expect(lanePoint("S", "approach", 4, 40).x).toBeLessThan(0);
  });

  it("tells the two sides of the three-lane road apart", () => {
    const out = lanePoint("W", "exit", 1, 40);
    const back = lanePoint("W", "approach", 1, 40);
    expect(locate(out.x, out.z)).toMatchObject({ side: "exit", lane: 1 });
    expect(locate(back.x, back.z)).toMatchObject({ side: "approach", lane: 1 });
    // Leaving west you are on the south half, by the kerb.
    expect(out.z).toBeGreaterThan(0);
  });

  it("puts ring lane 1 on the outside and lane 4 by the island", () => {
    expect(ringRadius(1)).toBeGreaterThan(ringRadius(4));
    for (const lane of [1, 2, 3, 4]) {
      expect(locate(0, ringRadius(lane))).toMatchObject({ kind: "ring", lane });
    }
  });

  it("knows the kerb, the island and the central reserve are off the road", () => {
    expect(locate(0, 0)).toMatchObject({ kind: "off", what: "island" });
    expect(locate(0, 40)).toMatchObject({ kind: "off", what: "median" });
    expect(locate(30, 30)).toMatchObject({ kind: "off", what: "verge" });
  });

  it("goes round clockwise: left is the first exit", () => {
    expect(turnBetween("S", "W")).toBe("left");
    expect(turnBetween("S", "N")).toBe("straight");
    expect(turnBetween("S", "E")).toBe("right");
    expect(turnBetween("S", "S")).toBe("back");
    expect(laneBearing("S", "approach")).toBeCloseTo(0);
  });

  it("follows the handbook's four-lane table", () => {
    expect(allowedTurns(4, 1)).toEqual(["straight", "left"]);
    expect(allowedTurns(4, 2)).toEqual(["straight"]);
    expect(allowedTurns(4, 3)).toEqual(["straight", "right"]);
    expect([...allowedTurns(4, 4)].sort()).toEqual(
      ["back", "left", "right", "straight"].sort(),
    );
    expect(lanesForTurn(4, "left")).toEqual([1, 4]);
    expect(lanesForTurn(4, "right")).toEqual([3, 4]);
    expect(lanesForTurn(4, "back")).toEqual([4]);
  });
});

describe("guided driving, done properly", () => {
  const legal: [number, Turn][] = [
    [1, "left"],
    [1, "straight"],
    [2, "straight"],
    [3, "straight"],
    [3, "right"],
    [4, "right"],
    [4, "back"],
  ];
  for (const [lane, turn] of legal) {
    it(`passes lane ${lane} going ${turn}, and never leaves the road`, () => {
      const result = proper(task(turn, lane), lane);
      expect(result.fault).toBeUndefined();
      expect(result.small).toEqual([]);
      expect(result.offRoad).toBe(false);
      expect(result.goal).toBe(true);
    });
  }

  it("passes every shipped task, lane changes included", () => {
    const lanes: Record<string, number> = {
      straight: 2,
      left: 1,
      right: 3,
      back: 4,
      "behind-red": 1,
    };
    for (const challenge of BOARD_CHALLENGES) {
      const result = proper(challenge, lanes[challenge.id]);
      expect(result.fault, challenge.id).toBeUndefined();
      expect(result.small, challenge.id).toEqual([]);
      expect(result.offRoad, challenge.id).toBe(false);
      expect(result.goal, challenge.id).toBe(true);
    }
  });

  it("keeps the car in the lane it was put in", () => {
    let entered: number | null = null;
    play(
      task("straight", 2),
      (seconds) => {
        if (seconds === 0) pressRight();
        controls.go = true;
        const loc = locate(car.x, car.z);
        if (loc.kind === "arm" && loc.side === "approach" && loc.along < 26) {
          entered = loc.lane;
        }
        if (onRoundabout() && degrees() > 285) stopDriving();
      },
      40,
    );
    expect(entered).toBe(3);
    // Lane 3 on the road is ring lane 3 on the roundabout.
    expect(Math.hypot(car.x, car.z)).toBeCloseTo(ringRadius(3), 0);
  });

  it("slows down for the roundabout by itself", () => {
    let fastest = 0;
    let onRing = 0;
    play(
      task("back", 4),
      () => {
        controls.go = true;
        fastest = Math.max(fastest, car.speed);
        // Once it is circling the island in the tight inner lane.
        if (Math.hypot(car.x, car.z) < ringRadius(4) + 1) {
          onRing = Math.max(onRing, car.speed);
        }
        if (onRoundabout() && degrees() > 300) stopDriving();
      },
      40,
    );
    expect(fastest).toBeGreaterThan(7);
    expect(onRing).toBeLessThan(5.5);
  });

  it("stops when Go is released", () => {
    play(
      task("straight", 2),
      (seconds) => {
        controls.go = seconds < 3;
      },
      8,
    );
    expect(car.speed).toBe(0);
  });

  it("turns the left button into Exit close to the roundabout", () => {
    const seen: [number, boolean][] = [];
    play(
      task("straight", 2),
      () => {
        controls.go = true;
        if (car.z > 20) seen.push([car.z, view.leftIsExit]);
        if (car.z < 20) stopDriving();
      },
      30,
    );
    expect(
      seen.filter(([z]) => z > SOLID_ZONE + 0.5).every(([, e]) => !e),
    ).toBe(true);
    expect(seen.filter(([z]) => z < SOLID_ZONE - 0.5).every(([, e]) => e)).toBe(
      true,
    );
  });
});

describe("serious mistakes end the attempt", () => {
  it("lane 2 turning left, and says which lane to use", () => {
    const result = proper(task("left", 2), 2);
    expect(result.fault).toMatchObject({
      id: "wrong_exit",
      serious: true,
      lane: 2,
      turn: "left",
    });
    const tip = faultTip(result.fault!);
    expect(tip.reason).toContain("Lane 2 only goes straight");
    expect(tip.reason).toContain("lane 1 or 4");
  });

  it("lane 1 turning right", () => {
    const result = proper(task("right", 1), 1);
    expect(result.fault).toMatchObject({ id: "wrong_exit", lane: 1 });
  });

  it("a legal turn that isn't the one asked for", () => {
    // Asked to turn left, but only signals after the first exit has gone by.
    let tapped = false;
    const result = play(task("left", 1), () => {
      controls.go = true;
      if (!tapped && TAP_EXIT.straight()) {
        pressLeft();
        tapped = true;
      }
    });
    expect(result.fault).toMatchObject({
      id: "wrong_destination",
      turn: "straight",
      asked: "left",
    });
  });

  it("going all the way round outside lane 4", () => {
    const result = play(task("straight", 2), () => {
      controls.go = true;
    });
    expect(result.fault).toMatchObject({ id: "full_circle", lane: 2 });
  });

  it("but lane 4 may go round as often as it likes", () => {
    let turns = 0;
    let last = 0;
    const result = play(
      task("back", 4),
      () => {
        controls.go = true;
        if (onRoundabout()) {
          if (degrees() < last - 180) turns += 1;
          last = degrees();
        }
      },
      60,
    );
    expect(turns).toBeGreaterThanOrEqual(2);
    expect(result.fault).toBeUndefined();
  });

  it("driving past the box to the end of the board", () => {
    let tapped = false;
    const result = play(task("straight", 2), () => {
      controls.go = true;
      if (!tapped && TAP_EXIT.straight()) {
        pressLeft();
        tapped = true;
      }
    });
    expect(result.fault).toMatchObject({ id: "past_end" });
  });

  it("running into the red car, which gets shoved", () => {
    const challenge = BOARD_CHALLENGES.find((c) => c.id === "behind-red")!;
    const before = { ...challenge.otherCars[0] };
    let tapped = false;
    const result = play(challenge, (seconds) => {
      if (seconds === 0) {
        pressLeft();
        pressLeft();
      }
      controls.go = true;
      if (!tapped && view.leftIsExit) {
        pressLeft();
        tapped = true;
      }
    });
    expect(result.fault).toMatchObject({ id: "collision", serious: true });
    // It was parked facing west, and it has been pushed further west.
    expect(view.others[0].x).toBeLessThan(before.x - 0.3);
  });
});

describe("small mistakes cost a star and the drive goes on", () => {
  function refused(
    challenge: BoardChallenge,
    when: () => boolean,
    which: "left" | "right",
  ): Outcome {
    let pressed = false;
    let tapped = false;
    return play(challenge, () => {
      if (!pressed && when()) {
        if (which === "left") pressLeft();
        else pressRight();
        pressed = true;
      }
      if (!tapped && TAP_EXIT[challenge.turn]()) {
        pressLeft();
        tapped = true;
      }
      goUntilBox(challenge);
    });
  }

  it("lane left from lane 1 is the kerb", () => {
    const result = refused(task("straight", 1), () => car.z < 50, "left");
    expect(result.small.map((f) => f.id)).toEqual(["kerb"]);
    expect(result.goal).toBe(true);
  });

  it("lane right from lane 4 is the central reserve", () => {
    const result = refused(task("right", 4), () => car.z < 50, "right");
    expect(result.small.map((f) => f.id)).toEqual(["central_reserve"]);
    expect(result.goal).toBe(true);
  });

  it("lane right across the yellow centre line is refused", () => {
    // Leaves west in lane 3 of the three-lane road, beside the centre line.
    const result = refused(task("left", 4), () => car.x < -26, "right");
    expect(result.small.map((f) => f.id)).toEqual(["centre_line"]);
    expect(result.goal).toBe(true);
  });

  it("no lane change over the continuous lines before the roundabout", () => {
    const result = refused(
      task("straight", 2),
      () => car.z < SOLID_ZONE - 2 && car.z > 20,
      "right",
    );
    expect(result.small.map((f) => f.id)).toEqual(["solid_line"]);
    expect(result.small[0].serious).toBe(false);
    expect(result.goal).toBe(true);
  });

  it("no lane change on the roundabout", () => {
    const result = refused(
      task("straight", 2),
      () => onRoundabout() && degrees() > 240,
      "right",
    );
    expect(result.small.map((f) => f.id)).toEqual(["roundabout_lane_change"]);
    expect(result.goal).toBe(true);
  });

  it("no stopping on the roundabout", () => {
    let waited = 0;
    let tapped = false;
    const challenge = task("straight", 2);
    const result = play(challenge, () => {
      goUntilBox(challenge);
      if (onRoundabout() && degrees() > 250 && waited < 4) {
        controls.go = false;
        waited += STEP;
      }
      if (!tapped && TAP_EXIT.straight()) {
        pressLeft();
        tapped = true;
      }
    });
    expect(result.small.map((f) => f.id)).toEqual(["roundabout_stop"]);
    expect(result.goal).toBe(true);
  });

  it("a lane change on the open road is fine", () => {
    const result = proper(task("left", 3), 1);
    expect(result.small).toEqual([]);
    expect(result.goal).toBe(true);
  });
});
