import { describe, expect, it } from "vitest";

import { fullBoardSvg, laneNumbers } from "./full-board";
import {
  LADDER,
  PIXEL_BUDGET,
  SLOW_FRAME,
  isWeakGpu,
  newPace,
  paceFrame,
  parseRung,
  pixelRatio,
  rungAt,
  stepDown,
  tierFor,
} from "./quality";

describe("the picture a device starts on", () => {
  it("is the full one on an ordinary phone", () => {
    // A mid-range Android: four cores were enough to be sent to "low" before.
    expect(tierFor("auto", { memory: 4, cores: 4 })).toBe("high");
    expect(tierFor("auto", { memory: 4, cores: 8 })).toBe("high");
    // Safari says nothing about memory, and little about the chip.
    expect(tierFor("auto", { cores: 6, renderer: "Apple GPU" })).toBe("high");
    expect(tierFor("auto", {})).toBe("high");
  });

  it("is the lighter one only where the device is plainly short", () => {
    expect(tierFor("auto", { memory: 2, cores: 8 })).toBe("low");
    expect(tierFor("auto", { memory: 8, cores: 2 })).toBe("low");
    expect(tierFor("auto", { maxTexture: 2048 })).toBe("low");
    expect(tierFor("auto", { renderer: "Mali-400 MP" })).toBe("low");
    expect(
      tierFor("auto", {
        renderer: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))",
      }),
    ).toBe("low");
  });

  it("is whatever the learner asked for", () => {
    expect(tierFor("high", { memory: 1, cores: 1 })).toBe("high");
    expect(tierFor("low", { memory: 16, cores: 12 })).toBe("low");
  });

  it("does not mistake a current chip for an old one", () => {
    expect(isWeakGpu("Adreno (TM) 308")).toBe(true);
    expect(isWeakGpu("Adreno (TM) 610")).toBe(false);
    expect(isWeakGpu("Mali-G52 MC2")).toBe(false);
    expect(isWeakGpu("Mali-T720")).toBe(true);
    expect(isWeakGpu("Mali-T880")).toBe(false);
    expect(isWeakGpu("PowerVR SGX 544MP")).toBe(true);
    expect(isWeakGpu("PowerVR Rogue GE8320")).toBe(false);
    expect(isWeakGpu(undefined)).toBe(false);
  });
});

describe("how sharp the scene is drawn", () => {
  const phone = { native: 3, width: 390, height: 844 };

  it("draws a 3x phone at its own resolution", () => {
    expect(pixelRatio(rungAt("high", 0), phone)).toBe(3);
  });

  it("never asks for more than the screen has", () => {
    expect(
      pixelRatio(rungAt("high", 0), { native: 2, width: 390, height: 844 }),
    ).toBe(2);
    expect(
      pixelRatio(rungAt("high", 0), { native: 1, width: 1280, height: 720 }),
    ).toBe(1);
  });

  it("holds a huge screen to the budget", () => {
    const big = { native: 2, width: 1920, height: 1080 };
    const ratio = pixelRatio(rungAt("high", 0), big);
    expect(ratio).toBeLessThan(2);
    expect(ratio).toBeGreaterThanOrEqual(1);
    expect(big.width * big.height * ratio * ratio).toBeLessThanOrEqual(
      PIXEL_BUDGET * 1.02,
    );
  });

  it("draws the lighter picture sharper than one pixel per pixel", () => {
    expect(pixelRatio(rungAt("low", 0), phone)).toBe(1.5);
  });
});

describe("the ladder", () => {
  it("gives up shadows before any sharpness", () => {
    const steps = LADDER.high;
    const firstSofter = steps.findIndex((s) => s.dpr < steps[0].dpr);
    const lastShadow = steps.map((s) => s.shadow > 0).lastIndexOf(true);
    expect(lastShadow).toBeLessThan(firstSofter);
    for (let i = 1; i < steps.length; i += 1) {
      expect(steps[i].shadow).toBeLessThanOrEqual(steps[i - 1].shadow);
      expect(steps[i].dpr).toBeLessThanOrEqual(steps[i - 1].dpr);
    }
  });

  it("never blurs the full picture down to one pixel per pixel", () => {
    expect(Math.min(...LADDER.high.map((s) => s.dpr))).toBeGreaterThan(1);
  });

  it("passes over a step that changes nothing on this screen", () => {
    const twoX = { native: 2, width: 390, height: 844 };
    // 0 to 1 halves the shadow picture, 1 to 2 drops it.
    expect(stepDown("high", 0, twoX)).toBe(1);
    expect(stepDown("high", 1, twoX)).toBe(2);
    // Capping at 2 does nothing for a 2x screen: straight to 1.5.
    expect(stepDown("high", 2, twoX)).toBe(4);
    expect(stepDown("high", 4, twoX)).toBe(5);
  });

  it("stops at the bottom", () => {
    const screen = { native: 3, width: 390, height: 844 };
    expect(stepDown("high", LADDER.high.length - 1, screen)).toBe(
      LADDER.high.length - 1,
    );
    expect(stepDown("low", 2, screen)).toBe(2);
    // A 1x screen has no sharpness left to give on the lighter picture.
    expect(stepDown("low", 0, { native: 1, width: 800, height: 600 })).toBe(0);
  });
});

describe("noticing a slow device", () => {
  const run = (seconds: number, frames: number, pace = newPace()) => {
    let stepped = 0;
    for (let i = 0; i < frames; i += 1) {
      if (paceFrame(pace, seconds)) stepped += 1;
    }
    return stepped;
  };

  it("leaves a smooth drive alone", () => {
    expect(run(1 / 60, 2000)).toBe(0);
    expect(run(1 / 30, 2000)).toBe(0);
  });

  it("steps down when the drive stays slow", () => {
    expect(run(SLOW_FRAME * 1.3, 45 + 120)).toBe(1);
  });

  it("forgives the scene settling and one bad stretch", () => {
    const pace = newPace();
    // Slow while it settles, and for one stretch after: no step.
    expect(run(0.08, 45 + 60, pace)).toBe(0);
    expect(run(1 / 60, 60, pace)).toBe(0);
    expect(run(0.08, 60, pace)).toBe(0);
  });

  it("does not count the tab being away", () => {
    expect(run(2, 500)).toBe(0);
  });

  it("keeps stepping while it stays slow, with a pause between", () => {
    expect(run(0.06, 45 + 120 + 45 + 120)).toBe(2);
  });
});

describe("remembering where a device settled", () => {
  const now = 1_800_000_000_000;
  const saved = (over: object) =>
    JSON.stringify({ tier: "high", rung: 3, at: now - 1000, ...over });

  it("starts there next time", () => {
    expect(parseRung(saved({}), "high", now)).toBe(3);
  });

  it("starts from the top when there is nothing, or nonsense", () => {
    expect(parseRung(null, "high", now)).toBe(0);
    expect(parseRung("{", "high", now)).toBe(0);
    expect(parseRung(saved({ rung: "3" }), "high", now)).toBe(0);
  });

  it("forgets after two weeks, and across pictures", () => {
    const old = now - 15 * 24 * 60 * 60 * 1000;
    expect(parseRung(saved({ at: old }), "high", now)).toBe(0);
    expect(parseRung(saved({}), "low", now)).toBe(0);
  });

  it("never starts below the bottom step", () => {
    expect(parseRung(saved({ rung: 99 }), "high", now)).toBe(
      LADDER.high.length - 1,
    );
  });
});

describe("lane numbers", () => {
  it("are the ones the drawing letters, in the same places", () => {
    const numbers = laneNumbers();
    const svg = fullBoardSvg();
    const texts = [
      ...svg.matchAll(
        /<g transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)"><text[^>]*>(\d)<\/text>/g,
      ),
    ];
    expect(texts.length).toBe(numbers.length);
    expect(numbers.length).toBeGreaterThan(0);
    texts.forEach((match, i) => {
      const number = numbers[i];
      expect(Number(match[1])).toBeCloseTo(number.x, 1);
      expect(Number(match[2])).toBeCloseTo(number.z, 1);
      expect(Number(match[3])).toBeCloseTo((number.bearing * 180) / Math.PI, 1);
      expect(Number(match[4])).toBe(number.lane);
    });
  });
});
