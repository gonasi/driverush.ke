/**
 * The board drawn as SVG markup, from the same numbers the referee uses. One
 * drawing, three jobs: the picture in the page's HTML (so crawlers and slow
 * phones get the board straight away), the minimap, and the ground of the 3D
 * scene, which paints this onto its road surface.
 *
 * A plain string rather than JSX so the 3D scene can rasterise it without
 * pulling a server renderer into the browser.
 */
import {
  ARMS,
  ARM_ORDER,
  BOARD_HALF,
  ISLAND_R,
  LANE_W,
  MEDIAN_START,
  RING_LANES,
  RING_OUTER_R,
  armHalfWidth,
  laneBearing,
  lanePoint,
  type Arm,
  type ArmId,
  type Vec,
} from "./geometry";
import type { BoardGoal } from "./challenges";

export const BOARD_COLORS = {
  grass: "#4d9a3c",
  asphalt: "#2a2b30",
  white: "#f4f4ee",
  yellow: "#f6c416",
  kerbBlack: "#1c1c1f",
  island: "#58a646",
  goal: "#3ddc72",
  player: "#f4c20d",
  red: "#d92b2b",
} as const;

const C = BOARD_COLORS;
const LINE = 0.24;
const DASH = "2.6 2.6";
/** Arrows sit this far from the centre, numbers a little further back. */
const ARROW_ALONG = 30;
const NUMBER_ALONG = 37.5;

const n = (value: number) => Number(value.toFixed(2));
const deg = (rad: number) => n((rad * 180) / Math.PI);

type ArrowKind = "straight" | "straight-left" | "straight-right" | "right";

/** What the paint on each approach lane shows. Lane 4's arrow curls right. */
function arrowFor(arm: Arm, lane: number): ArrowKind {
  if (lane === 1) return "straight-left";
  if (lane === 2) return "straight";
  if (arm.lanes === 4 && lane === 4) return "right";
  return "straight-right";
}

function head(x: number, y: number, dx: number, dy: number, k = 1): string {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const size = 1.5 * k;
  const half = 0.72 * k;
  const points = [
    [x - uy * half, y + ux * half],
    [x + ux * size, y + uy * size],
    [x + uy * half, y - ux * half],
  ];
  return `<polygon points="${points.map(([px, py]) => `${n(px)},${n(py)}`).join(" ")}"/>`;
}

/** Drawn pointing up the page, then turned to face along the lane. */
function arrowGlyph(kind: ArrowKind): string {
  const stroke = `fill="none" stroke="${C.white}" stroke-width="0.44" stroke-linecap="round"`;
  const parts: string[] = [];
  if (kind === "right") {
    parts.push(`<path ${stroke} d="M0 2.8 V0.6 Q0 -0.8 0.95 -1.3"/>`);
    parts.push(head(0.95, -1.3, 0.87, -0.46));
    return parts.join("");
  }
  parts.push(`<path ${stroke} d="M0 2.8 V-1.3"/>`);
  parts.push(head(0, -1.3, 0, -1));
  if (kind === "straight-left") {
    parts.push(`<path ${stroke} d="M0 2 Q0 0.9 -1 0.45"/>`);
    parts.push(head(-1, 0.45, -0.9, -0.4, 0.8));
  }
  if (kind === "straight-right") {
    parts.push(`<path ${stroke} d="M0 2 Q0 0.9 1 0.45"/>`);
    parts.push(head(1, 0.45, 0.9, -0.4, 0.8));
  }
  return parts.join("");
}

function at(p: Vec, bearing: number, body: string): string {
  return `<g transform="translate(${n(p.x)} ${n(p.z)}) rotate(${deg(bearing)})">${body}</g>`;
}

function armRect(arm: Arm): string {
  const half = armHalfWidth(arm);
  const x0 = arm.out.x === 0 ? -half : Math.min(0, arm.out.x * BOARD_HALF);
  const z0 = arm.out.z === 0 ? -half : Math.min(0, arm.out.z * BOARD_HALF);
  const w = arm.out.x === 0 ? half * 2 : BOARD_HALF;
  const h = arm.out.z === 0 ? half * 2 : BOARD_HALF;
  return `<rect x="${n(x0)}" y="${n(z0)}" width="${n(w)}" height="${n(h)}"/>`;
}

/** A line along an arm, `offset` metres left of its centre line. */
function armLine(arm: Arm, offset: number, from: number, to: number): string {
  // Left of the outward direction, so a positive offset is the exit side.
  const lx = arm.out.z;
  const lz = -arm.out.x;
  const a = {
    x: arm.out.x * from + lx * offset,
    z: arm.out.z * from + lz * offset,
  };
  const b = {
    x: arm.out.x * to + lx * offset,
    z: arm.out.z * to + lz * offset,
  };
  return `M${n(a.x)} ${n(a.z)} L${n(b.x)} ${n(b.z)}`;
}

function laneLines(arm: Arm): string {
  const paths: string[] = [];
  for (const side of [-1, 1]) {
    for (let k = 1; k < arm.lanes; k += 1) {
      const offset = side * (arm.medianHalf + k * LANE_W);
      const from = Math.sqrt(RING_OUTER_R ** 2 - offset ** 2);
      paths.push(armLine(arm, offset, from, BOARD_HALF));
    }
  }
  return paths.join(" ");
}

function edgeLines(arm: Arm): string {
  const half = armHalfWidth(arm);
  const from = Math.sqrt(RING_OUTER_R ** 2 - half ** 2);
  return [-1, 1].map((s) => armLine(arm, s * half, from, BOARD_HALF)).join(" ");
}

function centreMarking(arm: Arm): string {
  if (arm.medianHalf > 0) {
    // The raised central reserve, rounded at the roundabout end.
    // It runs past the board's edge so only the near end shows its curve.
    const w = arm.medianHalf * 2;
    const len = BOARD_HALF - MEDIAN_START + w * 2;
    const bearing = Math.atan2(arm.out.x, -arm.out.z);
    return at(
      { x: arm.out.x * MEDIAN_START, z: arm.out.z * MEDIAN_START },
      bearing,
      `<rect x="${n(-arm.medianHalf)}" y="${n(-len)}" width="${n(w)}" height="${n(len)}" rx="${n(arm.medianHalf)}" fill="${C.island}" stroke="${C.yellow}" stroke-width="0.3"/>`,
    );
  }
  // A double continuous yellow line: stay on your side.
  const d = [-0.22, 0.22]
    .map((offset) => armLine(arm, offset, RING_OUTER_R, BOARD_HALF))
    .join(" ");
  return `<path d="${d}" fill="none" stroke="${C.yellow}" stroke-width="${LINE}"/>`;
}

function approachPaint(armId: ArmId): string {
  const arm = ARMS[armId];
  const bearing = laneBearing(armId, "approach");
  const parts: string[] = [];
  for (let lane = 1; lane <= arm.lanes; lane += 1) {
    parts.push(
      at(
        lanePoint(armId, "approach", lane, ARROW_ALONG),
        bearing,
        `<g fill="${C.white}">${arrowGlyph(arrowFor(arm, lane))}</g>`,
      ),
    );
    parts.push(
      at(
        lanePoint(armId, "approach", lane, NUMBER_ALONG),
        bearing,
        `<text y="0.9" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="2.6" fill="${C.white}">${lane}</text>`,
      ),
    );
  }
  return parts.join("");
}

function goalBox(goal: BoardGoal): string {
  const arm = ARMS[goal.arm];
  const lanes =
    goal.lane != null
      ? [goal.lane]
      : Array.from({ length: arm.lanes }, (_, i) => i + 1);
  const mid = (goal.alongMin + goal.alongMax) / 2;
  const first = lanePoint(goal.arm, "exit", lanes[0], mid);
  const last = lanePoint(goal.arm, "exit", lanes[lanes.length - 1], mid);
  const centre = { x: (first.x + last.x) / 2, z: (first.z + last.z) / 2 };
  const w = lanes.length * LANE_W - 0.5;
  const h = goal.alongMax - goal.alongMin;
  return at(
    centre,
    laneBearing(goal.arm, "exit"),
    `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="0.6" fill="${C.goal}" fill-opacity="0.35" stroke="${C.goal}" stroke-width="0.5"/>`,
  );
}

function carShape(x: number, z: number, heading: number, fill: string): string {
  return at(
    { x, z },
    heading,
    `<rect x="-1.1" y="-2.4" width="2.2" height="4.8" rx="0.8" fill="${fill}" stroke="${C.kerbBlack}" stroke-width="0.3"/><rect x="-0.8" y="-0.9" width="1.6" height="2.1" rx="0.4" fill="${C.kerbBlack}" fill-opacity="0.7"/>`,
  );
}

export type BoardSvgOptions = {
  /** Cars to draw on a still picture. The 3D scene draws its own. */
  cars?: { x: number; z: number; heading: number; color: string }[];
  goal?: BoardGoal;
  /** Pixel size for a standalone image. Left out, the SVG fills its box. */
  size?: number;
  /** Fill a box of another shape by cropping, rather than letterboxing. */
  cover?: boolean;
};

export function boardSvg(options: BoardSvgOptions = {}): string {
  const arms = ARM_ORDER.map((id) => ARMS[id]);
  const view = `${-BOARD_HALF} ${-BOARD_HALF} ${BOARD_HALF * 2} ${BOARD_HALF * 2}`;
  const size = options.size
    ? ` width="${options.size}" height="${options.size}"`
    : options.cover
      ? ` preserveAspectRatio="xMidYMid slice"`
      : "";

  const ringLines = Array.from({ length: RING_LANES - 1 }, (_, i) => {
    const r = RING_OUTER_R - (i + 1) * LANE_W;
    return `<circle r="${n(r)}"/>`;
  }).join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}"${size}>`,
    `<rect x="${-BOARD_HALF}" y="${-BOARD_HALF}" width="${BOARD_HALF * 2}" height="${BOARD_HALF * 2}" fill="${C.grass}"/>`,
    `<g fill="${C.asphalt}">${arms.map(armRect).join("")}<circle r="${RING_OUTER_R}"/></g>`,
    // Yellow kerb along every road edge.
    `<path d="${arms.map(edgeLines).join(" ")}" fill="none" stroke="${C.yellow}" stroke-width="0.5"/>`,
    // Broken white lines: lanes you may change between when it is clear.
    `<path d="${arms.map(laneLines).join(" ")}" fill="none" stroke="${C.white}" stroke-width="${LINE}" stroke-dasharray="${DASH}"/>`,
    `<g fill="none" stroke="${C.white}" stroke-width="${LINE}" stroke-dasharray="${DASH}">${ringLines}<circle r="${n(RING_OUTER_R - 0.15)}"/></g>`,
    arms.map(centreMarking).join(""),
    `<circle r="${ISLAND_R}" fill="${C.island}" stroke="${C.yellow}" stroke-width="0.5"/>`,
    ARM_ORDER.map(approachPaint).join(""),
    options.goal ? goalBox(options.goal) : "",
    (options.cars ?? [])
      .map((car) => carShape(car.x, car.z, car.heading, car.color))
      .join(""),
    `</svg>`,
  ].join("");
}
