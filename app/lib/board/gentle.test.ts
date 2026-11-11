import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { useBoardStore } from "../board-store";
import { ALL_LEVELS, levelById, levelDone, nextLevel } from "./curriculum";
import { car, loadPhysics, stick, tick } from "./runtime";
import { FIRST_DRIVE, WARMUP_LEVEL_ID } from "./warmup";

/** Hold the stick for a while, at sixty frames a second. */
function hold(x: number, y: number, seconds: number) {
  for (let i = 0; i < seconds * 60; i += 1) {
    stick.x = x;
    stick.y = y;
    tick(1 / 60);
    if (useBoardStore.getState().phase !== "driving") return;
  }
}

beforeAll(() => loadPhysics());
beforeEach(() => {
  useBoardStore.getState().exit();
  useBoardStore.getState().resetProgress();
});

describe("the first drive", () => {
  it("is level 1, and anyone who has passed a task has had it", () => {
    expect(ALL_LEVELS[0].id).toBe(WARMUP_LEVEL_ID);
    expect(nextLevel({ learned: [], bestStars: {} }).id).toBe(WARMUP_LEVEL_ID);
    expect(
      levelDone(ALL_LEVELS[0], { learned: [], bestStars: { straight: 2 } }),
    ).toBe(true);
  });

  it("is passed by driving up the road and letting go in the box", () => {
    const store = useBoardStore.getState();
    store.startLevel(WARMUP_LEVEL_ID);
    expect(useBoardStore.getState().queue[0]).toBe(FIRST_DRIVE);
    const from = car.z;
    // from the bottom of the table, up the stick is up the road
    for (
      let i = 0;
      i < 40 && useBoardStore.getState().phase === "driving";
      i += 1
    ) {
      hold(0, -0.5, 0.5);
      hold(0, 0, 1);
    }
    const after = useBoardStore.getState();
    expect(car.z).not.toBe(from);
    expect(after.phase).toBe("passed");
    expect(levelDone(levelById(WARMUP_LEVEL_ID)!, after)).toBe(true);
    // nothing graded
    expect(after.bestStars).toEqual({});
  });

  it("never ends: driven past the box, the car is put back", () => {
    useBoardStore.getState().startLevel(WARMUP_LEVEL_ID);
    hold(0, -1, 12);
    const after = useBoardStore.getState();
    expect(after.phase).toBe("driving");
    expect(after.notice?.back).toBe(true);
    expect(after.faults).toBe(0);
  });
});

describe("an Easy level", () => {
  it("puts the car back for the first two serious mistakes, then stops", () => {
    useBoardStore.getState().startLevel("drive-straight");
    // straight on, never stopping, runs past the box on the far side
    for (let n = 1; n <= 2; n += 1) {
      for (
        let i = 0;
        i < 60 && (useBoardStore.getState().notice?.n ?? 0) < n;
        i += 1
      ) {
        hold(0, -1, 1);
      }
      // the stick must be let go before the car answers again
      hold(0, 0, 0.2);
      const s = useBoardStore.getState();
      expect(s.phase).toBe("driving");
      expect(s.notice?.back).toBe(true);
      expect(s.faults).toBe(n);
    }
    for (
      let i = 0;
      i < 60 && useBoardStore.getState().phase === "driving";
      i += 1
    ) {
      hold(0, -1, 1);
    }
    expect(useBoardStore.getState().phase).toBe("fault");
  });
});
