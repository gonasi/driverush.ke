/**
 * The result picture's wording: every score reads sensibly, and none of it
 * breaks the copy rules (no em dashes).
 */
import { describe, expect, it } from "vitest";

import { sharePictureSpec } from "./share-picture";

describe("the result picture", () => {
  it("shows a board round as clean tasks out of the total", () => {
    const spec = sharePictureSpec({ kind: "board", total: 5, firstTry: 4 });
    expect(spec.score).toBe("4/5");
    expect(spec.label).toBe("Board tasks clean on the first try");
    expect(spec.stamp).toBe("Model Town Board");
  });

  it("does not print 1/1 or 0/5", () => {
    expect(
      sharePictureSpec({ kind: "board", total: 1, firstTry: 1 }).score,
    ).toBe("Clean");
    const none = sharePictureSpec({ kind: "board", total: 5, firstTry: 0 });
    expect(none.score).toBe("5");
    expect(none.label).toBe("Board tasks driven");
  });

  it("names the trainer on a sign run", () => {
    const pelican = sharePictureSpec({
      kind: "pelican",
      total: 10,
      firstTry: 9,
    });
    expect(pelican.score).toBe("9/10");
    expect(pelican.stamp).toBe("Pelican chart");
    expect(
      sharePictureSpec({ kind: "signs3d", total: 10, firstTry: 9 }).stamp,
    ).toBe("3D signs");
  });

  it("keeps em dashes out and always has artwork", () => {
    for (const kind of ["board", "pelican", "signs3d"] as const) {
      const spec = sharePictureSpec({ kind, total: 8, firstTry: 6 });
      expect(Object.values(spec).join(" ")).not.toContain("—");
      expect(spec.art.tiles.length).toBeGreaterThan(0);
    }
  });
});
