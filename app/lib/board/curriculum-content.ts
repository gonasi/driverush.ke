/**
 * What a "slides" level puts in front of the learner: each card's words, and
 * the part of the board the camera goes to. The words for painted things come
 * from `features.ts` and the route rules from `lessons.ts`, so a rule is
 * written in one place. Only the game loads this file.
 */
import { blockById } from "./blocks";
import type { Level, SlideRef } from "./curriculum";
import { BOARD_FEATURES, featurePin, type BoardFeature } from "./features";
import type { Box } from "./full-board";
import { ROUTE_RULES } from "./lessons";

export type Slide = {
  title: string;
  note: string;
  box: Box | null;
  sign?: BoardFeature["sign"];
  /** The upside-down car to stand on the board while this card is up. */
  block?: string;
};

/** How much board to show round an upside-down car, metres. */
const BLOCK_VIEW = 16;

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
  const block = ref.block ? blockById(ref.block) : undefined;
  if (block) {
    const xs = block.cars.map((car) => car.x);
    const zs = block.cars.map((car) => car.z);
    return {
      title: ref.title,
      note: ref.note,
      block: block.id,
      box: {
        x0: Math.min(...xs) - BLOCK_VIEW,
        x1: Math.max(...xs) + BLOCK_VIEW,
        z0: Math.min(...zs) - BLOCK_VIEW,
        z1: Math.max(...zs) + BLOCK_VIEW,
      },
    };
  }
  return { title: ref.title, note: ref.note, box };
}

/** One thing a learner can be asked to find on the table after a deck. */
export type FindSpot = { id: string; name: string; x: number; z: number };

/** Pins closer than this cannot be told apart by a thumb, metres. */
export const FIND_APART = 10;

/**
 * The things a deck can ask the learner to find: the painted features it
 * showed, each with a pin. Empty when the deck has fewer than two, or when two
 * of them sit too close together to tap one from the other.
 */
export function findSpots(level: Level): FindSpot[] {
  if (level.kind !== "slides") return [];
  const spots = level.slides.flatMap((ref) => {
    if (!("feature" in ref)) return [];
    const f = feature(ref.feature);
    return f ? [{ id: f.id, name: f.name, ...featurePin(f) }] : [];
  });
  if (spots.length < 2) return [];
  for (let a = 0; a < spots.length; a += 1) {
    for (let b = a + 1; b < spots.length; b += 1) {
      const gap = Math.hypot(spots[a].x - spots[b].x, spots[a].z - spots[b].z);
      if (gap < FIND_APART) return [];
    }
  }
  return spots;
}

export function levelSlides(level: Level): Slide[] {
  if (level.kind !== "slides") return [];
  return level.slides
    .map(resolveSlide)
    .filter((slide): slide is Slide => slide !== null);
}
