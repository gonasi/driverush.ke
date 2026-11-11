/**
 * The continuous lines, refereed. A continuous white line between two lanes
 * means no changing lanes over it. A continuous yellow centre line means stay
 * on your side of the road. Both are in the NTSA learner handbook, and both
 * are painted all over the board: this is what notices a car going over one.
 *
 * It watches which side of each nearby line the middle of the car is on, and
 * reports the line once the car has gone clearly over it. A wheel on the paint
 * is forgiven. So is going round the end of a line, where it turns broken or
 * stops: that is where a lane change or a turn across is allowed.
 */
import type { CarState } from "./car";
import { continuousLines, type ContinuousLine } from "./full-board";

/** The middle of the car has to be this far over a line to have crossed it. */
const OVER = 0.5;
/** A line's last stretch is forgiven, where a car is turning in or out. */
const END_SLACK = 1.5;
/** Further than this from a line, the car has nothing to do with it. */
const NEAR = 9;

type Measured = ContinuousLine & {
  length: number;
  /** Unit vector along the line. */
  ux: number;
  uz: number;
};

let measured: Measured[] | null = null;
function lines(): Measured[] {
  measured ??= continuousLines().map((line) => {
    const dx = line.bx - line.ax;
    const dz = line.bz - line.az;
    const length = Math.hypot(dx, dz);
    return { ...line, length, ux: dx / length, uz: dz / length };
  });
  return measured;
}

/** Which side of each line the car was last clearly on. */
export type LineState = { side: (number | undefined)[] };

export function createLineState(): LineState {
  return { side: [] };
}

/**
 * Look at the car for one step. Returns the colour of every continuous line
 * it has just crossed, usually none.
 */
export function lineStep(
  state: LineState,
  car: CarState,
): ContinuousLine["color"][] {
  const crossed: ContinuousLine["color"][] = [];
  lines().forEach((line, i) => {
    const px = car.x - line.ax;
    const pz = car.z - line.az;
    const along = px * line.ux + pz * line.uz;
    const off = pz * line.ux - px * line.uz;
    if (
      along < END_SLACK ||
      along > line.length - END_SLACK ||
      Math.abs(off) > NEAR
    ) {
      // Beside none of it: round the end, or somewhere else on the board.
      state.side[i] = undefined;
      return;
    }
    if (Math.abs(off) < OVER) return;
    const side = off > 0 ? 1 : -1;
    const before = state.side[i];
    state.side[i] = side;
    if (before !== undefined && before !== side) crossed.push(line.color);
  });
  return crossed;
}
