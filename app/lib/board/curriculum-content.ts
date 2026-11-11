/**
 * What a "slides" level puts in front of the learner: each card's words, and
 * the part of the board the camera goes to. The words for painted things come
 * from `features.ts` and the route rules from `lessons.ts`, so a rule is
 * written in one place. Only the game loads this file.
 */
import type { Level, SlideRef } from "./curriculum";
import { BOARD_FEATURES, type BoardFeature } from "./features";
import type { Box } from "./full-board";
import { ROUTE_RULES } from "./lessons";

export type Slide = {
  title: string;
  note: string;
  box: Box | null;
  sign?: BoardFeature["sign"];
};

const feature = (id: string) => BOARD_FEATURES.find((f) => f.id === id);

export function resolveSlide(ref: SlideRef): Slide | null {
  if ("feature" in ref) {
    const f = feature(ref.feature);
    return f ? { title: f.name, note: f.note, box: f.box, sign: f.sign } : null;
  }
  const box = feature(ref.at)?.box ?? null;
  if ("rule" in ref) {
    const rule = ROUTE_RULES[ref.rule];
    return { title: rule.name, note: rule.says, box };
  }
  return { title: ref.title, note: ref.note, box };
}

export function levelSlides(level: Level): Slide[] {
  if (level.kind !== "slides") return [];
  return level.slides
    .map(resolveSlide)
    .filter((slide): slide is Slide => slide !== null);
}
