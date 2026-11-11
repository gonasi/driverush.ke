/**
 * Which parking bays have a car standing in them. The handbook says to park
 * from the farthest end, so the bay to take depends on which are full, and the
 * board is dressed differently from one attempt to the next to make the
 * learner look for it.
 *
 * Every layout has the same number of cars, three in the angle bays and one in
 * the flush parking, so the table always draws the same cars and only moves
 * them. The right-hand row is reached driving down the aisle from the street,
 * which makes bay 1 its far end. It is filled from that end with no gaps, so
 * "the farthest free bay" has one answer.
 *
 * Pure data, no three.js and no React.
 */
import { parkedSpots, type ParkedBays } from "./full-board";

export type ParkingLayout = ParkedBays & { id: string };

export const PARKING_LAYOUTS: readonly ParkingLayout[] = [
  { id: "two-in", right: [1, 2], left: [6], flush: [2] },
  { id: "empty-row", right: [], left: [2, 4, 6], flush: [2] },
  { id: "one-in", right: [1], left: [3, 6], flush: [2] },
  { id: "three-in", right: [1, 2, 3], left: [], flush: [2] },
];

let current: ParkingLayout = PARKING_LAYOUTS[0];
const listeners = new Set<() => void>();

export function parkingLayout(): ParkingLayout {
  return current;
}

export function setParkingLayout(id: string): void {
  const next = PARKING_LAYOUTS.find((layout) => layout.id === id);
  if (!next || next === current) return;
  current = next;
  for (const listener of listeners) listener();
}

/** Move the parked cars: another layout, never the one already showing. */
export function shuffleParkingLayout(random: () => number = Math.random): void {
  const others = PARKING_LAYOUTS.filter((layout) => layout !== current);
  const pick = others[Math.min(others.length - 1, Math.floor(random() * others.length))];
  setParkingLayout(pick.id);
}

export function onParkingLayout(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Where the parked cars stand, in the layout showing or in another. */
export function parkedCars(layout: ParkingLayout = current) {
  return parkedSpots(layout);
}

const firstFree = (taken: readonly number[], count: number): number => {
  for (let n = 1; n <= count; n += 1) if (!taken.includes(n)) return n;
  return count;
};

/**
 * The bay to park in, by the handbook's rule: the farthest free one. The names
 * are the ones the lane network gives its places.
 */
export function targetBays(layout: ParkingLayout = current): {
  angle: string;
  angleBay: number;
  flush: string;
  flushBay: number;
} {
  const angleBay = firstFree(layout.right, 7);
  const flushBay = firstFree(layout.flush, 2);
  return {
    angle: `Angle bay ${angleBay}, right row`,
    angleBay,
    flush: `Flush parking bay ${flushBay}`,
    flushBay,
  };
}
