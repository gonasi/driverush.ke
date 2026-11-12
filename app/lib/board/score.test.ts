import { describe, expect, it } from "vitest";

import { BOARD_CHALLENGES } from "./challenges";
import { challengeRoute, taskParks } from "./lessons";
import {
  OFF_ROUTE_SCORE,
  SCORE_MAX,
  SCORE_VERSION,
  beats,
  parSeconds,
  scoreFor,
  type BestScore,
} from "./score";

const clean = { faults: 0, hinted: false, seconds: 20, par: 30 };

describe("the score for a passed drive", () => {
  it("is full marks for a clean drive inside par", () => {
    expect(scoreFor(clean)).toBe(SCORE_MAX);
  });

  it("gives nothing extra for beating par", () => {
    expect(scoreFor({ ...clean, seconds: 5 })).toBe(SCORE_MAX);
  });

  it("takes 150 for each mistake and 100 for a hint", () => {
    expect(scoreFor({ ...clean, faults: 1 })).toBe(850);
    expect(scoreFor({ ...clean, faults: 2 })).toBe(700);
    expect(scoreFor({ ...clean, hinted: true })).toBe(900);
  });

  it("takes up to 400 for time over par, and no more", () => {
    expect(scoreFor({ ...clean, seconds: 45 })).toBe(800);
    expect(scoreFor({ ...clean, seconds: 60 })).toBe(600);
    expect(scoreFor({ ...clean, seconds: 600 })).toBe(600);
  });

  it("is always well above a drive that left its route", () => {
    const worst = scoreFor({ faults: 2, hinted: true, seconds: 999, par: 30 });
    expect(worst).toBe(200);
    expect(worst).toBeGreaterThan(OFF_ROUTE_SCORE);
  });
});

describe("par", () => {
  it("is worked out for every task, from its own route", () => {
    for (const challenge of BOARD_CHALLENGES) {
      const route = challengeRoute(challenge);
      expect(route, challenge.id).not.toBeNull();
      const par = parSeconds(route!, taskParks(challenge));
      // a drive at top speed all the way is quicker than par, and par is not
      // so slack that a crawl still makes it
      expect(par, challenge.id).toBeGreaterThan(route!.length / 7);
      expect(par, challenge.id).toBeLessThan(route!.length);
    }
  });
});

describe("a personal best", () => {
  const best: BestScore = {
    v: SCORE_VERSION,
    score: 850,
    ms: 30_000,
    par: 30,
    faults: 1,
    hinted: false,
  };

  it("is beaten by a higher score, or the same score driven quicker", () => {
    expect(beats(best, undefined)).toBe(true);
    expect(beats({ ...best, score: 1000 }, best)).toBe(true);
    expect(beats({ ...best, ms: 25_000 }, best)).toBe(true);
    expect(beats({ ...best, ms: 35_000 }, best)).toBe(false);
    expect(beats({ ...best, score: 700, ms: 10_000 }, best)).toBe(false);
  });

  it("from an older way of scoring is replaced", () => {
    expect(beats({ ...best, score: 100 }, { ...best, v: 0 })).toBe(true);
  });
});
