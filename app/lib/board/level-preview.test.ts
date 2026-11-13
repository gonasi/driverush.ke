import { describe, expect, it } from "vitest";

import { ALL_LEVELS } from "./curriculum";
import { BOUNDS, fullBoardSvg } from "./full-board";
import { PREVIEW_ASPECT, levelPreview } from "./level-preview";

describe("level pictures", () => {
  it("has a picture of the right shape for every level", () => {
    for (const level of ALL_LEVELS) {
      const { view } = levelPreview(level);
      expect(view, level.id).toBeDefined();
      if (!view) continue;
      const across = view.x1 - view.x0;
      const down = view.z1 - view.z0;
      expect(across, level.id).toBeGreaterThan(0);
      expect(across / down, level.id).toBeCloseTo(PREVIEW_ASPECT, 5);
      // it looks at the board, not at the grass beside it
      expect(view.x0, level.id).toBeLessThan(BOUNDS.x1);
      expect(view.x1, level.id).toBeGreaterThan(BOUNDS.x0);
      expect(view.z0, level.id).toBeLessThan(BOUNDS.z1);
      expect(view.z1, level.id).toBeGreaterThan(BOUNDS.z0);
    }
  });

  it("draws the line to follow on every level that drives or shows a route", () => {
    for (const level of ALL_LEVELS) {
      if (
        level.kind !== "drive" &&
        level.kind !== "watch" &&
        level.kind !== "warmup"
      ) {
        continue;
      }
      const { routes, cars } = levelPreview(level);
      expect(routes?.length, level.id).toBeGreaterThan(0);
      expect(routes?.at(-1)?.points.length, level.id).toBeGreaterThan(1);
      expect(cars?.length, level.id).toBeGreaterThan(0);
    }
  });

  it("draws as an SVG", () => {
    for (const level of ALL_LEVELS) {
      const svg = fullBoardSvg(levelPreview(level));
      expect(svg.startsWith("<svg"), level.id).toBe(true);
      expect(svg.includes("NaN"), level.id).toBe(false);
    }
  });
});
