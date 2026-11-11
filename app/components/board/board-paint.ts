/**
 * The board's paint, as shapes.
 *
 * The table used to wear the board's drawing as one picture, stretched over
 * its top. Closed in on a car, a lane line was four or five pixels of that
 * picture spread over thirty on the screen, so the paint went soft exactly
 * when the learner was looking at it. A picture big enough to stay sharp would
 * not fit in a phone's memory.
 *
 * So the same drawing (`fullBoardSvg`, still the one source) is read here and
 * turned into flat triangles: every field, road, line, dash and arrow is a
 * shape with a hard edge, sharp however close the view comes, and the whole
 * board costs less memory than one small picture. The lane numbers are the
 * only letters; they come from a small sheet of digits.
 */
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

import {
  COLORS,
  LANE_NUMBER,
  fullBoardSvg,
  laneNumbers,
} from "~/lib/board/full-board";

/** Points along a curve. A lane ring is 125 m round: this keeps it round. */
const CURVE_STEPS = 48;
/** Metres one tile of the grain covers before it repeats. */
const GRAIN_SPAN = 24;
const GRAIN_PX = 512;

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * The tooth of the board: fine grain like flock and tarmac, and broader
 * patches so no large area looks printed. One small tile, repeated, in place
 * of grain painted into a board-sized picture. It wraps without a seam.
 */
function grainTexture(): THREE.CanvasTexture {
  const size = GRAIN_PX;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;

  const rnd = seeded(7);
  const cells = 32;
  const cell = size / cells;
  const patches = new Float32Array(cells * cells);
  for (let i = 0; i < patches.length; i += 1) patches[i] = 196 + rnd() * 59;
  const patch = (cx: number, cy: number) =>
    patches[
      (((cy % cells) + cells) % cells) * cells +
        (((cx % cells) + cells) % cells)
    ];

  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    const fy = y / cell - 0.5;
    const y0 = Math.floor(fy);
    const ty = fy - y0;
    for (let x = 0; x < size; x += 1) {
      const fx = x / cell - 0.5;
      const x0 = Math.floor(fx);
      const tx = fx - x0;
      const broad =
        (patch(x0, y0) * (1 - tx) + patch(x0 + 1, y0) * tx) * (1 - ty) +
        (patch(x0, y0 + 1) * (1 - tx) + patch(x0 + 1, y0 + 1) * tx) * ty;
      const fine = 196 + rnd() * 59;
      // The fine grain, then the patches laid over it at a little over half
      // strength: the same two passes the painted picture had.
      const v = fine * (0.45 + (0.55 * broad) / 255);
      const i = (y * size + x) * 4;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return texture;
}

/** Triangles lying on the table, gathered in the order they are painted. */
class Flat {
  positions: number[] = [];
  colors: number[] = [];
  uvs: number[] = [];

  /** One triangle, turned to face up whichever way round it was given. */
  tri(
    ax: number,
    az: number,
    bx: number,
    bz: number,
    cx: number,
    cz: number,
    color: THREE.Color,
  ) {
    const cross = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
    if (Math.abs(cross) < 1e-9) return;
    const flip = cross > 0;
    this.point(ax, az, color);
    if (flip) {
      this.point(cx, cz, color);
      this.point(bx, bz, color);
    } else {
      this.point(bx, bz, color);
      this.point(cx, cz, color);
    }
  }

  private point(x: number, z: number, color: THREE.Color) {
    this.positions.push(x, 0, z);
    this.colors.push(color.r, color.g, color.b);
    this.uvs.push(x / GRAIN_SPAN, z / GRAIN_SPAN);
  }

  /** Every triangle of a geometry drawn in the drawing's own x and y. */
  add(geometry: THREE.BufferGeometry, color: THREE.Color) {
    const at = geometry.getAttribute("position");
    const index = geometry.getIndex();
    const count = index ? index.count : at.count;
    for (let i = 0; i + 2 < count; i += 3) {
      const a = index ? index.getX(i) : i;
      const b = index ? index.getX(i + 1) : i + 1;
      const c = index ? index.getX(i + 2) : i + 2;
      this.tri(
        at.getX(a),
        at.getY(a),
        at.getX(b),
        at.getY(b),
        at.getX(c),
        at.getY(c),
        color,
      );
    }
    geometry.dispose();
  }
}

/** Cut a line of points into its dashes: so long on, so long off, and again. */
export function dashes(
  points: THREE.Vector2[],
  pattern: number[],
): THREE.Vector2[][] {
  const out: THREE.Vector2[][] = [];
  if (points.length < 2 || pattern.length === 0) return out;
  // An odd list repeats itself to make an even one, as SVG has it.
  const steps = pattern.length % 2 ? [...pattern, ...pattern] : pattern;
  if (steps.some((v) => !(v > 0))) return [points];
  let step = 0;
  let left = steps[0];
  let dash: THREE.Vector2[] | null = [points[0].clone()];
  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1];
    const to = points[i];
    const length = from.distanceTo(to);
    let done = 0;
    while (length - done > left + 1e-9) {
      done += left;
      const cut = from.clone().lerp(to, done / length);
      if (dash) {
        dash.push(cut);
        if (dash.length > 1) out.push(dash);
        dash = null;
      } else {
        dash = [cut];
      }
      step = (step + 1) % steps.length;
      left = steps[step];
    }
    left -= length - done;
    if (dash) dash.push(to.clone());
  }
  if (dash && dash.length > 1) {
    const reach = dash[0].distanceTo(dash[dash.length - 1]);
    if (reach > 1e-4) out.push(dash);
  }
  return out;
}

function patternOf(node: Element | undefined): number[] | null {
  const raw = node?.getAttribute?.("stroke-dasharray");
  if (!raw || raw === "none") return null;
  const values = raw
    .split(/[\s,]+/)
    .map(Number)
    .filter((v) => Number.isFinite(v));
  return values.length > 0 ? values : null;
}

type Style = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLineJoin?: string;
  strokeLineCap?: string;
  strokeMiterLimit?: number;
};

const painted = (value: string | undefined) =>
  value !== undefined && value !== "none" && value !== "transparent";

/** The whole drawing as one flat mesh, its triangles in painting order. */
function paintGeometry(): THREE.BufferGeometry {
  const svg = fullBoardSvg({ noKerbs: true, numbers: false });
  const { paths } = new SVGLoader().parse(svg);
  const flat = new Flat();
  const tint = new Map<string, THREE.Color>();
  const colorOf = (value: string) => {
    let color = tint.get(value);
    if (!color) {
      color = new THREE.Color().setStyle(value);
      tint.set(value, color);
    }
    return color;
  };

  for (const path of paths) {
    const style = (path.userData?.style ?? {}) as Style;
    const node = path.userData?.node as Element | undefined;

    if (painted(style.fill)) {
      const shapes = SVGLoader.createShapes(path);
      if (shapes.length > 0) {
        flat.add(
          new THREE.ShapeGeometry(shapes, CURVE_STEPS),
          colorOf(style.fill as string),
        );
      }
    }

    if (painted(style.stroke) && (style.strokeWidth ?? 1) > 0) {
      const color = colorOf(style.stroke as string);
      const pattern = patternOf(node);
      for (const sub of path.subPaths) {
        const points = sub.getPoints(CURVE_STEPS);
        if (points.length < 2) continue;
        const runs = pattern ? dashes(points, pattern) : [points];
        for (const run of runs) {
          // A dash is cut square, whatever cap the line has.
          const stroke = SVGLoader.pointsToStroke(
            run,
            style as Parameters<typeof SVGLoader.pointsToStroke>[1],
            12,
            0.001,
          );
          if (stroke) flat.add(stroke, color);
        }
      }
    }
  }

  if (flat.positions.length === 0) {
    throw new Error("the board drawing gave no shapes");
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(flat.positions, 3),
  );
  geometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(flat.colors, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(flat.uvs, 2));
  const normals = new Float32Array(flat.positions.length);
  for (let i = 1; i < normals.length; i += 3) normals[i] = 1;
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  return geometry;
}

/** Pixels across one digit on the sheet: sharp to about 80 px a metre. */
const DIGIT_PX = 192;
/** Metres across the square a digit is lettered in. */
const DIGIT_BOX = 2.4;

/** The digits 1 to 4 side by side, white on nothing. */
function digitSheet(count: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = DIGIT_PX * count;
  canvas.height = DIGIT_PX;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const ctx = canvas.getContext("2d");
  if (!ctx) return texture;
  const scale = DIGIT_PX / DIGIT_BOX;
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${LANE_NUMBER.weight} ${LANE_NUMBER.size * scale}px ${LANE_NUMBER.family}`;
  for (let i = 0; i < count; i += 1) {
    ctx.fillText(
      String(i + 1),
      DIGIT_PX * (i + 0.5),
      (DIGIT_BOX / 2 + LANE_NUMBER.baseline) * scale,
    );
  }
  return texture;
}

/** A square for each painted lane number, turned to read along its lane. */
function numberGeometry(count: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  const half = DIGIT_BOX / 2;
  // The corners of the square on the page: x to the right, y down.
  const corners: [number, number][] = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ];
  for (const number of laneNumbers()) {
    if (number.lane > count) continue;
    const cos = Math.cos(number.bearing);
    const sin = Math.sin(number.bearing);
    const u0 = (number.lane - 1) / count;
    const u1 = number.lane / count;
    const placed = corners.map(([lx, lz]) => ({
      x: number.x + lx * cos - lz * sin,
      z: number.z + lx * sin + lz * cos,
      u: lx < 0 ? u0 : u1,
      v: lz < 0 ? 1 : 0,
    }));
    // Two triangles, wound to face up.
    for (const i of [0, 2, 1, 0, 3, 2]) {
      const p = placed[i];
      positions.push(p.x, 0, p.z);
      uvs.push(p.u, p.v);
      normals.push(0, 1, 0);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  return geometry;
}

export type BoardPaint = {
  group: THREE.Group;
  dispose: () => void;
};

/**
 * Build the board's top. Throws if the drawing can't be read, and the table
 * then falls back to wearing it as a picture.
 */
export function buildBoardPaint(options: {
  /** The paint takes the shadows of the cars and kerbs. */
  shadows: boolean;
  /** How far the grain may be sharpened at a slant; the chip's limit. */
  anisotropy: number;
}): BoardPaint {
  const group = new THREE.Group();

  const grain = grainTexture();
  grain.anisotropy = Math.max(1, options.anisotropy);
  // Everything is on one plane and painted in order, so nothing here writes
  // depth: a later shape simply covers an earlier one, as paint does. The
  // nudge keeps it clear of the table top just beneath it.
  const paint = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: grain,
    roughness: 0.95,
    envMapIntensity: 0.4,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const board = new THREE.Mesh(paintGeometry(), paint);
  board.receiveShadow = options.shadows;
  // After everything solid, so the cars and kerbs standing on it cover it.
  board.renderOrder = 1;
  group.add(board);

  const count = Math.max(1, ...laneNumbers().map((n) => n.lane));
  const sheet = digitSheet(count);
  sheet.anisotropy = Math.max(1, options.anisotropy);
  const letters = new THREE.MeshStandardMaterial({
    // The lines are white under the grain; the digits carry no grain, so
    // they are toned to the same white.
    color: "#d4d4d4",
    map: sheet,
    transparent: true,
    roughness: 0.95,
    envMapIntensity: 0.4,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -2,
  });
  const numbers = new THREE.Mesh(numberGeometry(count), letters);
  numbers.receiveShadow = options.shadows;
  // Before anything else see-through: a car's soft shadow lies over a number.
  numbers.renderOrder = -1;
  group.add(numbers);

  return {
    group,
    dispose() {
      board.geometry.dispose();
      numbers.geometry.dispose();
      paint.dispose();
      letters.dispose();
      grain.dispose();
      sheet.dispose();
    },
  };
}
