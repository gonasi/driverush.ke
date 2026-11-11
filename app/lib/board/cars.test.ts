import { describe, expect, it } from "vitest";

import { BOARD_CARS, carsBeside, resolveCar } from "./cars";

describe("board cars", () => {
  it("gives the car the learner chose, whatever the roll", () => {
    for (const car of BOARD_CARS) {
      expect(resolveCar(car.id, 0)).toBe(car.id);
      expect(resolveCar(car.id, 0.99)).toBe(car.id);
    }
  });

  it("spreads a random choice over every car", () => {
    const seen = new Set(
      [0, 0.2, 0.4, 0.6, 0.8, 0.999].map((roll) => resolveCar("random", roll)),
    );
    expect(seen.size).toBe(BOARD_CARS.length);
    expect(resolveCar(undefined, 0)).toBe(BOARD_CARS[0].id);
  });

  it("survives a roll at the edges and a setting it does not know", () => {
    expect(resolveCar("random", 1)).toBe(BOARD_CARS[BOARD_CARS.length - 1].id);
    expect(resolveCar("lorry" as never, 0)).toBe(BOARD_CARS[0].id);
  });

  it("lists the cars beside the one driven", () => {
    expect(carsBeside("suv")).toEqual(["saloon", "pickup"]);
  });
});
