import { describe, expect, it } from "vitest";

import { ALL_LEVELS, levelById } from "./curriculum";
import { FIND_APART, findSpots } from "./curriculum-content";

describe("find it on the board", () => {
  it("asks after the decks of the first unit, with pins a thumb can tell apart", () => {
    const asked = ALL_LEVELS.filter((level) => findSpots(level).length > 0);
    expect(asked.map((level) => level.id)).toEqual([
      "roads",
      "roundabout-parts",
      "lines",
      "kerbs",
      "stops",
      "parking-zone",
    ]);
    for (const level of asked) {
      const spots = findSpots(level);
      for (const a of spots) {
        for (const b of spots) {
          if (a === b) continue;
          expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(
            FIND_APART,
          );
        }
      }
    }
  });

  it("puts the roundabout's pin on its lanes, not on the island", () => {
    const [ring, island] = findSpots(levelById("roundabout-parts")!);
    expect(Math.hypot(island.x, island.z)).toBeLessThan(1);
    expect(Math.hypot(ring.x, ring.z)).toBeGreaterThan(13);
  });

  it("asks nothing where two things sit on top of each other", () => {
    // the lane numbers and the lane arrows are painted side by side
    expect(findSpots(levelById("lane-numbers")!)).toEqual([]);
  });
});
