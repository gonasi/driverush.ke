/**
 * The two question banks: the Model Town Board's and the NTSA theory set.
 * Every answer must say where it comes from, and every link a topic makes into
 * the course must land on a real level.
 */
import { describe, expect, it } from "vitest";

import { levelById } from "~/lib/board/curriculum";

import {
  BOARD_QUESTIONS,
  BOARD_TOPICS,
  boardQuestionsIn,
} from "./board-questions";
import {
  ALL_PRACTICE_QUESTIONS,
  PRACTICE_QUESTIONS,
  PRACTICE_TOPICS,
} from "./ntsa-practice-questions";

describe("the Model Town Board question bank", () => {
  it("has 60 or more questions, as its title says", () => {
    expect(BOARD_QUESTIONS.length).toBeGreaterThanOrEqual(60);
  });

  it("names a source for every answer", () => {
    for (const question of BOARD_QUESTIONS) {
      expect(question.source.trim(), question.q).not.toBe("");
      expect(question.a.trim(), question.q).not.toBe("");
    }
  });

  it("asks each question once", () => {
    const asked = BOARD_QUESTIONS.map((question) => question.q);
    expect(new Set(asked).size).toBe(asked.length);
  });

  it("files every question under a topic, and each topic under a real level", () => {
    const shown = BOARD_TOPICS.flatMap((topic) => boardQuestionsIn(topic.id));
    expect(shown.length).toBe(BOARD_QUESTIONS.length);
    for (const topic of BOARD_TOPICS) {
      expect(boardQuestionsIn(topic.id).length, topic.id).toBeGreaterThan(0);
      expect(levelById(topic.level), topic.level).toBeDefined();
    }
  });
});

describe("the NTSA practice questions", () => {
  it("keeps the short set first", () => {
    expect(ALL_PRACTICE_QUESTIONS.slice(0, PRACTICE_QUESTIONS.length)).toEqual(
      PRACTICE_QUESTIONS,
    );
  });

  it("names a source for every answer, and points at one of its choices", () => {
    for (const question of ALL_PRACTICE_QUESTIONS) {
      expect(question.source.trim(), question.prompt).not.toBe("");
      expect(question.answer, question.prompt).toBeGreaterThanOrEqual(0);
      expect(question.answer, question.prompt).toBeLessThan(
        question.choices.length,
      );
      expect(new Set(question.choices).size, question.prompt).toBe(
        question.choices.length,
      );
    }
  });

  it("asks each question once, and shows every one under a topic", () => {
    const asked = ALL_PRACTICE_QUESTIONS.map((question) => question.prompt);
    expect(new Set(asked).size).toBe(asked.length);
    const topics = new Set(PRACTICE_TOPICS.map((topic) => topic.id));
    for (const question of ALL_PRACTICE_QUESTIONS) {
      expect(topics.has(question.topic), question.prompt).toBe(true);
    }
  });
});
