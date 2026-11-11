import { beforeEach, describe, expect, it } from "vitest";

import { cam, endLook, followCar, panBy, peekAt, zoomBy } from "./stage";

/** A phone, with the car standing still and the view backed off. */
beforeEach(() => {
  followCar();
  cam.min = 16;
  cam.max = 240;
  cam.inSpan = 23;
  cam.outSpan = 64;
  cam.span = 64;
  cam.underWay = false;
});

describe("the camera in a drive", () => {
  it("gives a slid view back to the drive, and keeps no zoom from it", () => {
    panBy(5, 5);
    expect(cam.free).toBe(true);
    endLook();
    expect(cam.free).toBe(false);
    expect(cam.driveSpan).toBeNull();
  });

  it("treats backing off for a look as only a look", () => {
    zoomBy(1.4);
    zoomBy(1.4);
    endLook();
    expect(cam.free).toBe(false);
    expect(cam.driveSpan).toBeNull();
  });

  it("keeps a zoom closer than the drive's own", () => {
    for (let i = 0; i < 4; i += 1) zoomBy(0.7);
    const chosen = cam.span;
    expect(chosen).toBeLessThan(cam.inSpan);
    endLook();
    expect(cam.free).toBe(false);
    expect(cam.driveSpan).toBe(chosen);
  });

  it("sets how close the drive holds, when zoomed with the car under way", () => {
    cam.underWay = true;
    zoomBy(1.4);
    expect(cam.free).toBe(false);
    expect(cam.driveSpan).toBeCloseTo(23 * 1.4);
    // Never as wide as the backed-off view: the stick still closes in.
    for (let i = 0; i < 10; i += 1) zoomBy(1.4);
    expect(cam.driveSpan).toBeLessThan(cam.outSpan);
  });

  it("does not take a look at the finish for the learner's zoom", () => {
    peekAt({ x0: 0, x1: 10, z0: 0, z1: 10 });
    endLook();
    expect(cam.free).toBe(false);
    expect(cam.driveSpan).toBeNull();
  });
});
