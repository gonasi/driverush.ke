/**
 * The cars the learner can drive on the board. They differ in looks only:
 * every one is scaled to the same footprint, so the rules treat them alike.
 *
 * The models are built by `scripts/build-board-cars.mjs`.
 */
export const BOARD_CARS = [
  { id: "saloon", label: "Saloon", src: "/assets/board/cars/saloon.glb" },
  { id: "suv", label: "SUV", src: "/assets/board/cars/suv.glb" },
  { id: "pickup", label: "Pickup", src: "/assets/board/cars/pickup.glb" },
] as const;

export type BoardCarId = (typeof BOARD_CARS)[number]["id"];
/** What the learner asked for. "random" is a different car each visit. */
export type BoardCarSetting = BoardCarId | "random";

const IDS: readonly BoardCarId[] = BOARD_CARS.map((car) => car.id);

/**
 * The car for this visit. `roll` is a number from 0 up to (not including) 1,
 * drawn once per visit, so the car does not change between tasks.
 */
export function resolveCar(
  setting: BoardCarSetting | undefined,
  roll: number,
): BoardCarId {
  if (setting && setting !== "random" && IDS.includes(setting)) return setting;
  const at = Math.min(
    IDS.length - 1,
    Math.max(0, Math.floor(roll * IDS.length)),
  );
  return IDS[at];
}

/** The cars the learner is not driving, for the others on the board. */
export function carsBeside(driven: BoardCarId): BoardCarId[] {
  return IDS.filter((id) => id !== driven);
}
