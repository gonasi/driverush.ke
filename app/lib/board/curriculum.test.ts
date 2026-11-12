import { describe, expect, it } from "vitest";

import { BOARD_CHALLENGES, challengeById, isRouteTask } from "./challenges";
import {
  ALL_LEVELS,
  COURSE_LEVELS,
  UNITS,
  doneCount,
  learnedKey,
  levelAfter,
  levelById,
  levelDone,
  nextLevel,
} from "./curriculum";
import { levelSlides } from "./curriculum-content";
import { BOARD_FEATURES } from "./features";
import { LESSONS } from "./lessons";

const EMPTY = { learned: [], bestStars: {} };

describe("the course", () => {
  it("numbers the levels straight through, with ids that are all different", () => {
    expect(ALL_LEVELS.map((l) => l.n)).toEqual(ALL_LEVELS.map((_, i) => i + 1));
    expect(new Set(ALL_LEVELS.map((l) => l.id)).size).toBe(ALL_LEVELS.length);
  });

  it("drives every task exactly once, under the task's own title", () => {
    const driven = ALL_LEVELS.flatMap((l) =>
      l.kind === "drive" ? [l.challenge] : [],
    );
    expect([...driven].sort()).toEqual(
      BOARD_CHALLENGES.map((c) => c.id).sort(),
    );
    for (const level of ALL_LEVELS) {
      if (level.kind !== "drive") continue;
      expect(challengeById(level.challenge)?.title).toBe(level.title);
    }
  });

  it("plays every lesson exactly once, under the lesson's own title and level", () => {
    const watched = ALL_LEVELS.flatMap((l) =>
      l.kind === "watch" ? [l.lesson] : [],
    );
    expect([...watched].sort()).toEqual(LESSONS.map((l) => l.id).sort());
    for (const level of ALL_LEVELS) {
      if (level.kind !== "watch") continue;
      const lesson = LESSONS.find((l) => l.id === level.lesson);
      expect(lesson?.title).toBe(level.title);
      expect(lesson?.level).toBe(level.difficulty);
    }
  });

  it("shows every painted thing on the board exactly once", () => {
    const shown = ALL_LEVELS.flatMap((l) =>
      l.kind === "slides"
        ? l.slides.flatMap((s) => ("feature" in s ? [s.feature] : []))
        : [],
    );
    expect([...shown].sort()).toEqual(BOARD_FEATURES.map((f) => f.id).sort());
  });

  it("has words and a place to look for every card", () => {
    for (const level of ALL_LEVELS) {
      if (level.kind !== "slides") continue;
      const cards = levelSlides(level);
      expect(cards.length).toBe(level.slides.length);
      for (const card of cards) {
        expect(card.title.length).toBeGreaterThan(0);
        expect(card.note.length).toBeGreaterThan(0);
        expect(card.box).not.toBeNull();
        // House rule: no em dashes in anything a learner reads.
        expect(card.title + card.note).not.toContain("—");
      }
    }
  });

  it("teaches before it asks: no unit drives before it has taught", () => {
    for (const unit of UNITS) {
      if (unit.id === "mock") continue;
      expect(unit.levels[0].kind).not.toBe("drive");
    }
    // The board and the lanes come before any driving at all.
    const firstDrive = ALL_LEVELS.findIndex((l) => l.kind === "drive");
    const before = ALL_LEVELS.slice(0, firstDrive).map((l) => l.unit);
    expect(before).toContain("board");
    expect(before).toContain("lanes");
  });

  it("shows a route driven before the learner drives it", () => {
    for (const level of ALL_LEVELS) {
      if (level.kind !== "drive") continue;
      const task = challengeById(level.challenge);
      if (!task || !isRouteTask(task)) continue;
      if (task.block) {
        // A blocked road is worked out, not watched: the rule comes first.
        const rule = ALL_LEVELS.find((l) => l.id === "blocked-roads");
        expect(rule, level.id).toBeDefined();
        expect(rule!.n).toBeLessThan(level.n);
        continue;
      }
      const shown = ALL_LEVELS.find(
        (l) => l.kind === "watch" && l.lesson === task.lesson,
      );
      expect(shown, level.id).toBeDefined();
      expect(shown!.n).toBeLessThan(level.n);
    }
  });
});

describe("progress through the course", () => {
  it("starts at level 1 and ends at the mock test", () => {
    expect(nextLevel(EMPTY).n).toBe(1);
    const all = {
      learned: [
        ...LESSONS.map((l) => l.id),
        ...COURSE_LEVELS.map((l) => learnedKey(l)),
      ],
      bestStars: Object.fromEntries(BOARD_CHALLENGES.map((c) => [c.id, 1])),
    };
    expect(doneCount(all)).toBe(COURSE_LEVELS.length);
    expect(nextLevel(all).kind).toBe("mock");
  });

  it("counts lessons watched and tasks passed before there were levels", () => {
    const saved = { learned: ["straight-over"], bestStars: { straight: 2 } };
    expect(levelDone(levelById("watch-straight-over")!, saved)).toBe(true);
    expect(levelDone(levelById("drive-straight")!, saved)).toBe(true);
    expect(levelDone(levelById("roads")!, saved)).toBe(false);
    // Having passed a task, the first drive counts as had. Continue goes to
    // the first thing not done, which is the first reading level.
    expect(nextLevel(saved).id).toBe("roads");
  });

  it("skips what is done when finding where to continue", () => {
    const first = ALL_LEVELS[0];
    const saved = { learned: [learnedKey(first)], bestStars: {} };
    expect(nextLevel(saved).n).toBe(2);
    expect(levelAfter(first)?.n).toBe(2);
    expect(levelAfter(ALL_LEVELS[ALL_LEVELS.length - 1])).toBeUndefined();
  });
});
