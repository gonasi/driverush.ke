/**
 * The Model Town Board as it is in a driving school: painted on a table, with
 * the learner standing at one side of it.
 *
 * The board's surface is the same drawing the page shows (`full-board.ts`),
 * laid on the table top, with the kerbs, the central reserve and the island
 * raised from it. The view is fixed to the side the learner stands at and never
 * turns. It closes in on the car while it moves and backs off when it stops:
 * right out to the whole table on a wide screen, part of the way on a phone.
 *
 * three.js only loads with this file, which the viewer fetches after Start.
 * The table is built once, by hand; only the cars and the camera move.
 */
import * as React from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { BOARD_CARS, carsBeside, type BoardCarId } from "~/lib/board/cars";
import { isRouteTask, type BoardChallenge } from "~/lib/board/challenges";
import {
  BOUNDS,
  CAR_COLORS,
  COLORS,
  ISLAND_R,
  fullBoardSvg,
  kerbHighlights,
  reserves,
  type Box,
} from "~/lib/board/full-board";
import { dirOf } from "~/lib/board/geometry";
import { STICK_DEADZONE, type Seat } from "~/lib/board/joystick";
import { taskGoalBox } from "~/lib/board/lessons";
import { parkedCars } from "~/lib/board/parking-layouts";
import {
  car,
  hasMoved,
  shown,
  stick,
  tick,
  view,
} from "~/lib/board/runtime";
import {
  advance,
  asDriveSpan,
  cam,
  endLook,
  blockSpots,
  finish,
  marks,
  picks,
  setWake,
  useStage,
} from "~/lib/board/stage";

import {
  newPace,
  paceFrame,
  pixelRatio as pixelRatioAt,
  rungAt,
  saveRung,
  stepDown,
  type BoardTier,
} from "~/lib/board/quality";

import { buildBoardPaint, type BoardPaint } from "~/components/board/board-paint";
import {
  buildRibbon,
  chevronTexture,
  disposeRibbons,
} from "~/components/board/route-ribbon";
import { SHARED, carFromGltf } from "~/components/board/car-glb";
import { useParkingLayout } from "~/components/board/use-parking-layout";
import {
  WHEEL_RADIUS,
  buildCar,
  type CarModel,
} from "~/components/board/car-model";

export type { BoardTier };

export type BoardTableProps = {
  challenge: BoardChallenge | null;
  /** The learner has control. Otherwise the scene shows where things stand. */
  driving: boolean;
  /** Changes on every fresh attempt, so the view snaps back to the start. */
  attempt: number;
  tier: BoardTier;
  /**
   * The step of the quality ladder to start on (`LADDER` in `quality.ts`):
   * where this device settled last time. Left out, the top.
   */
  startRung?: number;
  /**
   * Draw at exactly this many pixels per CSS pixel. Only the still in
   * `/tools/og` sets it, to capture a sharp picture; the game leaves it out.
   */
  pixelRatio?: number;
  seat: Seat;
  /** The car the learner drives. */
  car: BoardCarId;
  /** Its paint, when it is not the usual one: a car picked from a line-up. */
  paint?: string;
  /** Learning, with no task on: the car only shows while a route plays. */
  learning?: boolean;
  /**
   * Stopped by the examiner: stay closed in on the car, held clear of the card
   * over the bottom of the screen, so the learner sees where it went wrong.
   */
  focus?: boolean;
  /**
   * Open this attempt with a look at the finish, then slide back to the car,
   * so the learner has seen where the task ends before setting off.
   */
  sweep?: boolean;
  /** The board is painted and on screen. */
  onReady?: () => void;
  /**
   * More cars standing on the roads, each one of the pack's models: the cars
   * shown off in the still in `/tools/og`, and the line-up of a lane options
   * level while none of its cars is being driven.
   */
  extraCars?: readonly ExtraCar[];
};

export type ExtraCar = {
  car: BoardCarId;
  paint: string;
  plate: string;
  x: number;
  z: number;
  heading: number;
  /** It can be picked: the scene says where it is on the screen (`picks`). */
  pick?: string;
  /** Turned upside down to close a way (`blocks.ts`). */
  flipped?: boolean;
};

const BOARD_W = BOUNDS.x1 - BOUNDS.x0;
const BOARD_H = BOUNDS.z1 - BOUNDS.z0;
const CX = (BOUNDS.x0 + BOUNDS.x1) / 2;
const CZ = (BOUNDS.z0 + BOUNDS.z1) / 2;
/** The wooden frame round the board, and the table top showing beyond it. */
const FRAME = 3.6;
const MARGIN = 6;

const ROOM = "#4f4c47";
const VFOV = 32;
const DEG = Math.PI / 180;

/** Where the sun stands from the spot it is aimed at: over the left shoulder. */
const SUN_OFFSET = new THREE.Vector3(-150, 210, 120);
/** The light's own left-to-right and bottom-to-top, for lining its shadows up. */
const SUN_RIGHT = new THREE.Vector3()
  .crossVectors(new THREE.Vector3(0, 1, 0), SUN_OFFSET)
  .normalize();
const SUN_UP = new THREE.Vector3()
  .crossVectors(SUN_OFFSET, SUN_RIGHT)
  .normalize();
/** Half the width of the shadow picture when it covers the whole table. */
const SHADOW_REACH = Math.max(BOARD_W, BOARD_H) / 2 + 40;
/**
 * The sizes the shadow picture is fitted to, in metres from its middle. The
 * closer the view, the less ground the same picture covers and the sharper a
 * car's shadow is. Fixed steps, so the shadows don't crawl as the view zooms.
 */
const SHADOW_STEPS = [28, 40, 56, 80, 112];
/** How much of the sun's slant the painted floor shadow is shifted by. */
const FLOOR_SHADOW_SHIFT = (62 / SUN_OFFSET.y) * 0.6;

// ---- small drawing helpers ------------------------------------------------------

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function textureOf(
  canvas: HTMLCanvasElement,
  repeat?: [number, number],
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  if (repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  return texture;
}

/** Planked wood: a base colour, darker seams, and grain running along it. */
function woodTexture(base: string, dark: string, planks: number, seed: number) {
  const size = 512;
  const canvas = canvasOf(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) return textureOf(canvas);
  const rnd = seeded(seed);
  const width = size / planks;
  for (let p = 0; p < planks; p += 1) {
    ctx.fillStyle = base;
    ctx.fillRect(p * width, 0, width, size);
    ctx.fillStyle = rnd() > 0.5 ? "rgba(255,235,200,0.08)" : "rgba(0,0,0,0.07)";
    ctx.fillRect(p * width, 0, width, size);
    ctx.save();
    ctx.beginPath();
    ctx.rect(p * width, 0, width, size);
    ctx.clip();
    const sway = (rnd() - 0.5) * 18;
    ctx.strokeStyle = dark;
    for (let i = 0; i < 36; i += 1) {
      ctx.globalAlpha = 0.05 + rnd() * 0.15;
      ctx.lineWidth = 0.5 + rnd() * 2;
      const x = p * width + rnd() * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(
        x + sway * rnd(),
        size * 0.33,
        x - sway * rnd(),
        size * 0.66,
        x + (rnd() - 0.5) * 8,
        size,
      );
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = dark;
    ctx.fillRect(p * width, 0, 1.2, size);
    ctx.globalAlpha = 1;
  }
  return textureOf(canvas);
}

/** A classroom floor: big speckled tiles with dark joints. */
function floorTexture() {
  const size = 256;
  const canvas = canvasOf(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) return textureOf(canvas);
  const rnd = seeded(41);
  ctx.fillStyle = "#807d78";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.12)";
    ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  ctx.fillStyle = "#44423f";
  ctx.fillRect(0, 0, size, 2);
  ctx.fillRect(0, 0, 2, size);
  return textureOf(canvas, [30, 30]);
}

function plateTexture() {
  const canvas = canvasOf(512, 96);
  const ctx = canvas.getContext("2d");
  if (!ctx) return textureOf(canvas);
  const shine = ctx.createLinearGradient(0, 0, 0, 96);
  shine.addColorStop(0, "#e9cf86");
  shine.addColorStop(0.5, "#b8923c");
  shine.addColorStop(1, "#d8bb6a");
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, 512, 96);
  ctx.strokeStyle = "#6b5220";
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 500, 84);
  ctx.fillStyle = "#3d2f12";
  ctx.font = "bold 40px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MODEL TOWN BOARD", 256, 50);
  return textureOf(canvas);
}

/** A soft dark patch for under a car. */
function blobTexture() {
  const canvas = canvasOf(64, 128);
  const ctx = canvas.getContext("2d");
  if (!ctx) return textureOf(canvas);
  ctx.scale(1, 2);
  const fade = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
  fade.addColorStop(0, "rgba(0,0,0,0.55)");
  fade.addColorStop(0.6, "rgba(0,0,0,0.34)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, 64, 64);
  return textureOf(canvas);
}

/**
 * The table's shadow on the floor: dark under the table, fading out well
 * beyond it. Painted once, so the sun's own shadows can be spent on the board.
 */
function floorShadowTexture() {
  const size = 96;
  const canvas = canvasOf(size, size);
  const ctx = canvas.getContext("2d");
  if (!ctx) return textureOf(canvas);
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = Math.abs(((x + 0.5) / size) * 2 - 1);
      const pz = Math.abs(((y + 0.5) / size) * 2 - 1);
      const d = Math.hypot(
        Math.max(0, px - FLOOR_SHADOW_CORE),
        Math.max(0, pz - FLOOR_SHADOW_CORE),
      );
      const t = Math.min(1, d / (1 - FLOOR_SHADOW_CORE));
      const fade = 1 - t * t * (3 - 2 * t);
      image.data[(y * size + x) * 4 + 3] = Math.round(255 * fade);
    }
  }
  ctx.putImageData(image, 0, 0);
  return textureOf(canvas);
}
/** How much of the floor shadow, from its middle, is fully dark. */
const FLOOR_SHADOW_CORE = 0.5;

/**
 * Give the flat drawing some tooth: fine grain like flock and tarmac, and
 * broader patches so no large area looks printed.
 */
function roughen(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const tile = canvasOf(256, 256);
  const t = tile.getContext("2d");
  if (!t) return;
  const image = t.createImageData(256, 256);
  const rnd = seeded(7);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 196 + rnd() * 59;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  t.putImageData(image, 0, 0);
  const pattern = ctx.createPattern(tile, "repeat");
  if (!pattern) return;
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 0.55;
  ctx.scale(11, 11);
  ctx.fillRect(0, 0, width / 11 + 1, height / 11 + 1);
  ctx.restore();
}

/** Paint the board's top from its drawing. Resolves once it can be used. */
function paintBoard(width: number): Promise<THREE.CanvasTexture> {
  return new Promise((resolve, reject) => {
    const svg = fullBoardSvg({ width, noKerbs: true });
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const image = new Image();
    image.onload = () => {
      const height = Math.round((width * BOARD_H) / BOARD_W);
      const canvas = canvasOf(width, height);
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) {
        reject(new Error("no 2d canvas"));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      roughen(ctx, width, height);
      resolve(textureOf(canvas));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("the board drawing did not load"));
    };
    image.src = url;
  });
}

// ---- the table, built once ------------------------------------------------------

type Pair = [number, number];

/** A raised strip following a line of points on the board. Corners are mitred. */
function stripGeometry(points: Pair[], width: number, height: number) {
  const half = width / 2;
  const left: Pair[] = [];
  const right: Pair[] = [];
  points.forEach(([x, z], i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const before: Pair = [x - a[0], z - a[1]];
    const after: Pair = [b[0] - x, b[1] - z];
    const l1 = Math.hypot(before[0], before[1]) || 1;
    const l2 = Math.hypot(after[0], after[1]) || 1;
    const n1: Pair | null = i === 0 ? null : [-before[1] / l1, before[0] / l1];
    const n2: Pair | null =
      i === points.length - 1 ? null : [-after[1] / l2, after[0] / l2];
    const first = n1 ?? n2 ?? [0, 1];
    const second = n2 ?? n1 ?? [0, 1];
    let mx = first[0] + second[0];
    let mz = first[1] + second[1];
    const length = Math.hypot(mx, mz) || 1;
    mx /= length;
    mz /= length;
    const reach = half / Math.max(0.5, mx * first[0] + mz * first[1]);
    left.push([x + mx * reach, z + mz * reach]);
    right.push([x - mx * reach, z - mz * reach]);
  });
  const shape = new THREE.Shape();
  shape.moveTo(left[0][0], left[0][1]);
  for (const p of left.slice(1)) shape.lineTo(p[0], p[1]);
  for (const p of right.slice().reverse()) shape.lineTo(p[0], p[1]);
  shape.closePath();
  return raise(shape, height);
}

/** Stand a flat outline up from the board, with a softened top edge. */
function raise(shape: THREE.Shape, height: number) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height - 0.06,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
    curveSegments: 10,
  });
  // The outline is drawn in board space (x, z); turn it to lie on the table.
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, height, 0);
  return geometry;
}

function roundedRect(r: Box, inset: number, radius: number) {
  const x0 = r.x0 + inset;
  const x1 = r.x1 - inset;
  const z0 = r.z0 + inset;
  const z1 = r.z1 - inset;
  const shape = new THREE.Shape();
  shape.moveTo(x0 + radius, z0);
  shape.lineTo(x1 - radius, z0);
  shape.absarc(x1 - radius, z0 + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(x1, z1 - radius);
  shape.absarc(x1 - radius, z1 - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(x0 + radius, z1);
  shape.absarc(x0 + radius, z1 - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(x0, z0 + radius);
  shape.absarc(x0 + radius, z0 + radius, radius, Math.PI, Math.PI * 1.5, false);
  return shape;
}

function disc(radius: number) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  return shape;
}

type Table = {
  group: THREE.Group;
  /**
   * The board's top as one plain sheet. It is hidden once the paint is laid
   * over it as shapes, and wears the drawing as a picture if that fails.
   */
  top: THREE.Mesh;
  surface: THREE.MeshStandardMaterial;
};

function buildTable(tier: BoardTier): Table {
  const group = new THREE.Group();
  const shadows = tier === "high";
  const put = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
    group.add(mesh);
    return mesh;
  };

  // The classroom floor, far below.
  const floor = put(
    new THREE.PlaneGeometry(2400, 2400),
    new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.85 }),
    CX,
    -62,
    CZ,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;
  // The sun's shadow picture is fitted to the part of the board in view, which
  // the floor is mostly outside. The table's shadow on it is painted instead.
  floor.receiveShadow = false;

  // The table: a varnished top, an apron under it and four tapered legs.
  const hx = BOARD_W / 2 + FRAME + MARGIN;
  const hz = BOARD_H / 2 + FRAME + MARGIN;
  const oak = woodTexture("#8f5a2c", "#3a1f0b", 7, 11);
  oak.wrapS = oak.wrapT = THREE.RepeatWrapping;
  oak.repeat.set(1.5, 1.7);
  const varnished = new THREE.MeshStandardMaterial({
    map: oak,
    roughness: 0.42,
    envMapIntensity: 0.8,
  });
  // Nothing under the board's frame throws a shadow on anything but the
  // floor, so none of it is drawn into the shadow picture.
  put(
    new RoundedBoxGeometry(hx * 2, 5, hz * 2, 3, 1.3),
    varnished,
    CX,
    -2.52,
    CZ,
  ).castShadow = false;
  const under = new THREE.Mesh(
    new THREE.PlaneGeometry(
      (hx * 2) / FLOOR_SHADOW_CORE,
      (hz * 2) / FLOOR_SHADOW_CORE,
    ),
    new THREE.MeshBasicMaterial({
      color: "#000000",
      map: floorShadowTexture(),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );
  under.rotation.x = -Math.PI / 2;
  // Thrown a little way off by the sun, as the cars' shadows are.
  under.position.set(
    CX - SUN_OFFSET.x * FLOOR_SHADOW_SHIFT,
    -61.8,
    CZ - SUN_OFFSET.z * FLOOR_SHADOW_SHIFT,
  );
  group.add(under);
  const legWood = new THREE.MeshStandardMaterial({
    map: woodTexture("#8f5a2c", "#3a1f0b", 5, 23),
    roughness: 0.5,
  });
  const aprons: [number, number, number, number][] = [
    [0, hz - 11, hx * 2 - 26, 2.6],
    [0, -(hz - 11), hx * 2 - 26, 2.6],
    [hx - 11, 0, 2.6, hz * 2 - 26],
    [-(hx - 11), 0, 2.6, hz * 2 - 26],
  ];
  for (const [x, z, w, d] of aprons) {
    put(
      new THREE.BoxGeometry(w, 11, d),
      legWood,
      CX + x,
      -10.5,
      CZ + z,
    ).castShadow = false;
  }
  const leg = new THREE.CylinderGeometry(4.4, 3, 57, 4, 1);
  leg.rotateY(Math.PI / 4);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      put(
        leg,
        legWood,
        CX + sx * (hx - 11),
        -33.5,
        CZ + sz * (hz - 11),
      ).castShadow = false;
    }
  }

  // The pale frame round the board, with a brass plate on the near edge.
  const beech = new THREE.MeshStandardMaterial({
    map: woodTexture("#c9a06a", "#7a4c20", 3, 29),
    roughness: 0.4,
    envMapIntensity: 0.8,
  });
  const bars: [number, number, number, boolean][] = [
    [CX, BOUNDS.z0 - FRAME / 2, BOARD_W + FRAME * 2, false],
    [CX, BOUNDS.z1 + FRAME / 2, BOARD_W + FRAME * 2, false],
    [BOUNDS.x0 - FRAME / 2, CZ, BOARD_H, true],
    [BOUNDS.x1 + FRAME / 2, CZ, BOARD_H, true],
  ];
  for (const [x, z, length, turned] of bars) {
    const bar = put(
      new RoundedBoxGeometry(length, 2.2, FRAME, 2, 0.5),
      beech,
      x,
      1,
      z,
    );
    if (turned) bar.rotation.y = Math.PI / 2;
  }
  const plate = put(
    new THREE.PlaneGeometry(15, 2.7),
    new THREE.MeshStandardMaterial({
      map: plateTexture(),
      metalness: 0.85,
      roughness: 0.32,
    }),
    CX,
    2.13,
    BOUNDS.z1 + FRAME / 2,
  );
  plate.rotation.x = -Math.PI / 2;
  plate.castShadow = false;

  // The board's top.
  const surface = new THREE.MeshStandardMaterial({
    color: COLORS.asphalt,
    roughness: 0.95,
    envMapIntensity: 0.4,
  });
  const top = put(
    new THREE.PlaneGeometry(BOARD_W, BOARD_H),
    surface,
    CX,
    0,
    CZ,
  );
  top.rotation.x = -Math.PI / 2;
  top.castShadow = false;

  // Raised from it: yellow kerbs at the junctions, the green central reserve
  // with a yellow cap at each end, and the island.
  const kerb = new THREE.MeshStandardMaterial({
    color: COLORS.yellow,
    roughness: 0.42,
  });
  const green = new THREE.MeshStandardMaterial({
    color: "#15752b",
    roughness: 0.95,
  });
  for (const line of kerbHighlights()) {
    put(
      stripGeometry(
        line.map((p): Pair => [p.x, p.z]),
        0.5,
        0.3,
      ),
      kerb,
    );
  }
  for (const r of reserves()) {
    put(raise(roundedRect(r, 0.08, 0.5), 0.26), green);
    const xa = r.x0 + 0.3;
    const xb = r.x1 - 0.3;
    if (r.z0 > BOUNDS.z0 + 0.1) {
      const cap: Pair[] = [
        [xa, r.z0 + 3],
        [xa, r.z0 + 0.3],
        [xb, r.z0 + 0.3],
        [xb, r.z0 + 3],
      ];
      put(stripGeometry(cap, 0.55, 0.34), kerb);
    }
    if (r.z1 < BOUNDS.z1 - 0.1) {
      const cap: Pair[] = [
        [xa, r.z1 - 3],
        [xa, r.z1 - 0.3],
        [xb, r.z1 - 0.3],
        [xb, r.z1 - 3],
      ];
      put(stripGeometry(cap, 0.55, 0.34), kerb);
    }
  }
  put(raise(disc(ISLAND_R), 0.3), kerb);
  put(raise(disc(ISLAND_R - 0.5), 0.34), green);

  return { group, top, surface };
}

/** Free everything a built object holds on the graphics card. */
function dispose(root: THREE.Object3D) {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    // A downloaded car's shapes belong to the loader, which keeps them.
    if (!mesh.geometry.userData[SHARED]) mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      const map = (material as THREE.MeshStandardMaterial).map;
      map?.dispose();
      material.dispose();
    }
  });
}

// ---- cars -----------------------------------------------------------------------

let blob: THREE.CanvasTexture | null = null;

/** The downloaded car models, by id. `null` when they could not be fetched. */
type CarSources = Record<BoardCarId, THREE.Object3D> | null;

const CAR_URLS = BOARD_CARS.map((entry) => entry.src);
const withMeshopt = (loader: GLTFLoader) => {
  loader.setMeshoptDecoder(MeshoptDecoder);
};

/**
 * A car with a soft shadow under it, ready to be placed on the table. With a
 * downloaded model it is that car; with none it is the one built in code.
 */
function carOnTable(
  paint: string,
  plate: string,
  tier: BoardTier,
  source?: THREE.Object3D,
  /** Lying on its roof, as an instructor turns a car over to close a way. */
  flipped = false,
) {
  const holder = new THREE.Group();
  const options = {
    paint: new THREE.Color(paint).getHex(),
    simple: tier === "low",
  };
  const model = source
    ? carFromGltf(source, options)
    : buildCar({ ...options, plate });
  if (tier === "low") {
    model.traverse((node) => {
      node.castShadow = false;
      node.receiveShadow = false;
    });
  }
  if (flipped) {
    // Turned over about its length, then lifted so the roof rests on the road.
    const size = new THREE.Box3().setFromObject(model);
    model.rotation.z = Math.PI;
    model.position.y = size.max.y + size.min.y;
  }
  holder.userData.flipped = flipped;
  holder.add(model);
  blob ??= blobTexture();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 5.5),
    new THREE.MeshBasicMaterial({
      map: blob,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      opacity: tier === "low" ? 1 : 0.6,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.1, 0.03, 0.06);
  holder.add(shadow);
  holder.userData.model = model;
  return holder;
}

/** How high the light round the finish stands, in metres. */
const FENCE_H = 4.2;

/** Bright at the foot and gone at the top, for the light round the finish. */
function fadeTexture() {
  const canvas = canvasOf(4, 64);
  const ctx = canvas.getContext("2d");
  if (!ctx) return textureOf(canvas);
  const fade = ctx.createLinearGradient(0, 64, 0, 0);
  fade.addColorStop(0, "#ffffff");
  fade.addColorStop(0.5, "#5a5a5a");
  fade.addColorStop(1, "#000000");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, 4, 64);
  return textureOf(canvas);
}

/**
 * A low wall of light round the finish box, so it stands up off the table and
 * shows from the far end of it. It has no top and no floor.
 */
function finishFence(width: number, depth: number) {
  const light = new THREE.MeshBasicMaterial({
    color: COLORS.goal,
    alphaMap: fadeTexture(),
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const none = new THREE.MeshBasicMaterial({ visible: false });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, FENCE_H, depth), [
    light,
    light,
    none,
    none,
    light,
    light,
  ]);
  mesh.renderOrder = 2;
  mesh.userData.light = light;
  return mesh;
}

/**
 * The most a wheel turns in one frame: under half the gap between two spokes,
 * so a fast car's wheels never look as if they are turning backwards.
 */
const MAX_ROLL = (30 * Math.PI) / 180;
/** The front wheels turn less than the real lock, so they stay inside the arches. */
const MAX_STEER_SHOWN = 0.45;

/** Roll a car's wheels as if it had just travelled `distance` metres forward. */
function rollWheels(holder: THREE.Object3D, distance: number) {
  const model = holder.userData.model as CarModel;
  const radius = model.userData.wheelRadius ?? WHEEL_RADIUS;
  const turn = Math.min(distance / radius, MAX_ROLL);
  // The nose points down -z, so rolling forward turns the top of the wheel that way.
  for (const wheel of model.userData.wheels) wheel.rotation.x -= turn;
}

const PARKED_PAINTS = ["#2456b4", "#dfe3e8", "#2f3238", "#1f7a4d"];
const PARKED_PLATES = ["KDA 101B", "KCB 442T", "KDG 907K", "KCY 365H"];

// ---- the view -------------------------------------------------------------------

/** Where the camera sits round the table for each seat, as a compass angle. */
const SEAT_ANGLE: Record<Seat, number> = {
  south: 0,
  west: -Math.PI / 2,
  north: Math.PI,
  east: Math.PI / 2,
};
/** The direction "away from me" on the table, for each seat. */
const AWAY: Record<Seat, { x: number; z: number }> = {
  south: { x: 0, z: -1 },
  west: { x: 1, z: 0 },
  north: { x: 0, z: 1 },
  east: { x: -1, z: 0 },
};

const TILT_OUT = 47 * DEG;
const TILT_IN = 40 * DEG;
/** Metres of board across the screen when closed in on the car, on a phone. */
const SPAN_IN = 23;
/** And when backed off on a phone, which shows only part of the table. */
const SPAN_PART = 64;
/** Faster than this and the view closes in. */
const MOVING = 0.8;
/** How long after stopping before it backs off, so a pause doesn't pump it. */
const LINGER = 2;
/** How far in the view waits on a phone before the car first moves, 0 to 1. */
const START_CLOSE = 0.55;
/** The joystick's pad and the task card, in pixels: the car is held between them. */
const PAD_PX = 232;
const HUD_PX = 150;
/** The examiner's card is taller than the joystick. */
const SHEET_SHARE = 0.64;
const SHEET_HUD_PX = 60;
/** Backing up, the view closes in this much further: a bay is a tight fit. */
const REVERSE_CLOSER = 0.72;
/** The strip of light on the lane that lane assist is holding, metres. */
const HOLD_W = 3;
const HOLD_L = 9;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const ease = (t: number) => t * t * (3 - 2 * t);

type Rig = {
  /** How far back the camera is. */
  dist: number;
  zoom: number;
  linger: number;
  x: number;
  z: number;
  snappedFor: number;
  seat: Seat | null;
  /** 1 looking past the nose, -1 past the tail, eased between the two. */
  look: number;
  /** 0 to 1 as the view closes in further for reversing. */
  tight: number;
  /** The lane strip's brightness, eased so it fades rather than blinks. */
  hold: number;
  /** Coming back from the learner's own view: ease, don't jump. */
  returning: boolean;
  /** How closed in the view is drawn, 0 to 1: it sets the slant. */
  near: number;
  /** Seconds left of the opening look at the finish. */
  intro: number;
};

/** The opening look rests on the finish this long, then slides to the car. */
const SWEEP_HOLD = 0.6;
const SWEEP_MOVE = 1.2;
/** A finish this close to the car is already in view: no look is needed. */
const SWEEP_FROM = 25;

function Scene({
  challenge,
  driving,
  attempt,
  tier,
  seat,
  car: driven,
  paint,
  learning = false,
  focus = false,
  sweep = false,
  onReady,
  extraCars,
  models,
  shadow,
  onSlow,
}: BoardTableProps & {
  models: CarSources;
  /** The shadow picture's size, or 0 for none: the ladder's say. */
  shadow: number;
  /** The drive has been running slowly: go down a step. */
  onSlow: () => void;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  // How the drive is running, to catch a phone that can't keep up.
  const pace = React.useRef(newPace());
  const slow = React.useRef(onSlow);
  slow.current = onSlow;

  const table = React.useMemo(() => buildTable(tier), [tier]);
  React.useEffect(() => () => dispose(table.group), [table]);

  // The room the paint and the varnish reflect. Phones that struggle go without.
  React.useEffect(() => {
    gl.toneMappingExposure = tier === "high" ? 0.8 : 0.95;
    if (tier !== "high") return;
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = pmrem.fromScene(new RoomEnvironment(), 0.035);
    scene.environment = room.texture;
    scene.environmentIntensity = 0.5;
    invalidate();
    return () => {
      scene.environment = null;
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, tier, invalidate]);

  // The board's top is painted from its drawing, then the learner may start.
  const ready = React.useRef(onReady);
  ready.current = onReady;
  React.useEffect(() => {
    let alive = true;
    let painted: THREE.CanvasTexture | null = null;
    let shapes: BoardPaint | null = null;
    const done = () => {
      if (!alive) return;
      invalidate();
      ready.current?.();
    };
    const sharpest = gl.capabilities.getMaxAnisotropy();

    // The paint as shapes, sharp at any distance. `?paint=picture` asks for
    // the old stretched picture instead, to set the two side by side.
    const asPicture =
      new URLSearchParams(window.location.search).get("paint") === "picture";
    if (!asPicture) {
      try {
        shapes = buildBoardPaint({
          shadows: tier === "high",
          anisotropy: Math.min(tier === "high" ? 8 : 4, sharpest),
        });
        table.group.add(shapes.group);
        table.top.visible = false;
      } catch {
        shapes = null;
      }
    }

    if (shapes) {
      done();
    } else {
      // The drawing could not be read as shapes: wear it as a picture.
      const limit = gl.capabilities.maxTextureSize;
      const wanted = tier === "high" ? 2048 : 1280;
      // The board is taller than wide, so the height is what must fit.
      const width = Math.min(wanted, Math.floor((limit * BOARD_W) / BOARD_H));
      paintBoard(width)
        .then((texture) => {
          if (!alive) {
            texture.dispose();
            return;
          }
          painted = texture;
          texture.anisotropy = Math.min(tier === "high" ? 8 : 2, sharpest);
          table.surface.map = texture;
          table.surface.color.set("#ffffff");
          table.surface.needsUpdate = true;
        })
        .catch(() => {
          // The table still draws, with a plain black top. Better than nothing.
        })
        .finally(done);
    }
    return () => {
      alive = false;
      painted?.dispose();
      if (shapes) {
        table.group.remove(shapes.group);
        shapes.dispose();
        table.top.visible = true;
      }
    };
  }, [gl, tier, table, invalidate]);

  const player = React.useMemo(
    () =>
      carOnTable(
        paint ?? CAR_COLORS.player,
        "KDR 254U",
        tier,
        models?.[driven],
      ),
    [tier, models, driven, paint],
  );
  React.useEffect(() => () => dispose(player), [player]);

  const others = React.useMemo(
    () =>
      (challenge?.otherCars ?? []).map((other, i) => {
        const beside = carsBeside(driven);
        return carOnTable(
          other.paint ?? CAR_COLORS.red,
          other.plate ?? "KCZ 718M",
          tier,
          models?.[other.car ?? beside[i % beside.length]],
          other.flipped,
        );
      }),
    [challenge, tier, models, driven],
  );
  React.useEffect(() => () => others.forEach(dispose), [others]);

  // Cars standing in the parking zone, to show what it is for. They are moved
  // about between attempts, and the green box of a parking task with them.
  const layout = useParkingLayout();
  const parked = React.useMemo(() => {
    const group = new THREE.Group();
    if (tier !== "high") return group;
    parkedCars(layout).forEach((spot, i) => {
      const parkedCar = carOnTable(
        PARKED_PAINTS[i % PARKED_PAINTS.length],
        PARKED_PLATES[i % PARKED_PLATES.length],
        tier,
        models?.[BOARD_CARS[i % BOARD_CARS.length].id],
      );
      parkedCar.position.set(spot.x, 0, spot.z);
      parkedCar.rotation.y = -spot.heading;
      group.add(parkedCar);
    });
    return group;
  }, [tier, models, layout]);
  React.useEffect(() => () => dispose(parked), [parked]);

  const extras = React.useMemo(() => {
    const group = new THREE.Group();
    (extraCars ?? []).forEach((spot) => {
      const extra = carOnTable(
        spot.paint,
        spot.plate,
        tier,
        models?.[spot.car],
        spot.flipped,
      );
      extra.position.set(spot.x, 0, spot.z);
      extra.rotation.y = -spot.heading;
      group.add(extra);
    });
    return group;
  }, [tier, models, extraCars]);
  React.useEffect(() => () => dispose(extras), [extras]);

  const goal = React.useMemo(() => {
    if (!challenge) return null;
    const box = taskGoalBox(challenge);
    return {
      x: (box.x0 + box.x1) / 2,
      z: (box.z0 + box.z1) / 2,
      w: box.x1 - box.x0 - 0.6,
      h: box.z1 - box.z0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the box moves with the parked cars
  }, [challenge, layout]);
  const goalMaterial = React.useRef<THREE.MeshBasicMaterial>(null);
  const fence = React.useMemo(() => {
    if (!goal) return null;
    const mesh = finishFence(goal.w, goal.h);
    mesh.position.set(goal.x, FENCE_H / 2 + 0.05, goal.z);
    return mesh;
  }, [goal]);
  React.useEffect(
    () => () => {
      if (!fence) return;
      fence.geometry.dispose();
      for (const material of fence.material as THREE.MeshBasicMaterial[]) {
        material.alphaMap?.dispose();
        material.dispose();
      }
    },
    [fence],
  );
  const probe = React.useMemo(() => new THREE.Vector3(), []);

  // The light points at the middle of the board, which is not the origin,
  // until the view says which part of the board its shadows are wanted on.
  const sun = React.useRef<THREE.DirectionalLight>(null);
  React.useEffect(() => {
    const light = sun.current;
    if (!light) return;
    light.target.position.set(CX, 0, CZ);
    light.target.updateMatrixWorld();
    invalidate();
  }, [invalidate]);
  // A step down the ladder: a smaller shadow picture, or none. The old one is
  // thrown away so the next frame makes one of the new size.
  React.useEffect(() => {
    const light = sun.current;
    if (!light) return;
    light.castShadow = shadow > 0;
    if (shadow > 0 && light.shadow.mapSize.x !== shadow) {
      light.shadow.mapSize.set(shadow, shadow);
      light.shadow.map?.dispose();
      light.shadow.map = null;
    }
    // Fit it afresh on the next frame.
    light.shadow.camera.right = 0;
    invalidate();
  }, [shadow, invalidate]);

  // ---- routes painted on the table, and a part of it lit up ----
  const lines = useStage((s) => s.lines);
  const glow = useStage((s) => s.glow);
  const route = useStage((s) => s.route);
  const playing = useStage((s) => s.playing);
  const chevrons = React.useMemo(() => chevronTexture(), []);
  React.useEffect(() => () => chevrons.dispose(), [chevrons]);
  const ribbons = React.useMemo(() => {
    const group = new THREE.Group();
    for (const line of lines) {
      if (line.points.length > 1) group.add(buildRibbon(line, chevrons));
    }
    return group;
  }, [lines, chevrons]);
  React.useEffect(() => () => disposeRibbons(ribbons), [ribbons]);
  const glowMaterial = React.useRef<THREE.MeshBasicMaterial>(null);
  const stillChevrons = React.useMemo(
    () =>
      tier === "low" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [tier],
  );
  // The camera pad and the lessons ask for a frame when nothing is animating.
  React.useEffect(() => {
    setWake(invalidate);
    return () => setWake(() => {});
  }, [invalidate]);

  const rig = React.useRef<Rig>({
    dist: 0,
    zoom: 0,
    linger: 0,
    x: CX,
    z: CZ,
    snappedFor: -1,
    seat: null,
    look: 1,
    tight: 0,
    hold: 0,
    returning: false,
    near: 0,
    intro: 0,
  });
  const calm = React.useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const holdStrip = React.useRef<THREE.Group>(null);
  const holdMaterial = React.useRef<THREE.MeshBasicMaterial>(null);

  // Off the clock, one frame is enough to show where things stand.
  React.useEffect(() => {
    invalidate();
  }, [
    driving,
    attempt,
    challenge,
    seat,
    lines,
    glow,
    route,
    playing,
    learning,
    focus,
    extraCars,
    paint,
    invalidate,
  ]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    if (driving) {
      tick(dt);
      // A drive that stays under about 26 frames a second goes down a step:
      // shadows first, sharpness last. Smooth driving matters more than either.
      if (paceFrame(pace.current, delta)) slow.current();
    }

    // A route being played back moves the car itself, so the minimap and the
    // camera follow it as they follow a drive.
    const pose = driving ? null : advance(dt);
    if (pose) {
      const moved = Math.hypot(pose.x - car.x, pose.z - car.z);
      if (moved < 2) rollWheels(player, pose.reversing ? -moved : moved);
      car.x = pose.x;
      car.z = pose.z;
      car.heading = pose.heading;
      car.speed = 0;
      car.steer = 0;
    }
    player.visible = !learning || route !== null;
    // In a parking task the parked cars are solid and drawn with the task's
    // own cars, so the ones that only dress the board step aside.
    parked.visible = !(
      challenge &&
      isRouteTask(challenge) &&
      challenge.otherCars.some((other) => !other.flipped)
    );
    if (playing && !stillChevrons) chevrons.offset.x -= dt * 0.9;
    if (glowMaterial.current) {
      glowMaterial.current.opacity =
        0.3 + 0.12 * Math.sin(state.clock.elapsedTime * 3);
    }

    // In a drive the car is drawn between two physics steps, so it is smooth
    // on a screen faster or slower than the physics.
    const at = driving ? shown : car;
    player.position.set(at.x, 0, at.z);
    player.rotation.y = -at.heading;
    const model = player.userData.model as CarModel;
    model.userData.tail.emissiveIntensity =
      view.braking || view.reversing || pose?.reversing ? 2.4 : 0.5;
    // The wheels roll with the road and the front pair follows the steering.
    if (driving) rollWheels(player, car.speed * dt);
    const lock = clamp(car.steer, -MAX_STEER_SHOWN, MAX_STEER_SHOWN);
    for (const hub of model.userData.steering) hub.rotation.y = -lock;
    others.forEach((other, i) => {
      const pose = view.others[i] ?? challenge?.otherCars[i];
      if (!pose) return;
      // A car that has been shoved rolls as far as it was pushed.
      const moved = Math.hypot(
        pose.x - other.position.x,
        pose.z - other.position.z,
      );
      if (driving && moved < 1 && !other.userData.flipped) {
        rollWheels(other, moved);
      }
      other.position.set(pose.x, 0, pose.z);
      other.rotation.y = -pose.heading;
    });
    if (goalMaterial.current) {
      goalMaterial.current.opacity =
        0.34 + 0.12 * Math.sin(state.clock.elapsedTime * 3);
    }
    if (fence) {
      (fence.userData.light as THREE.MeshBasicMaterial).opacity =
        0.55 + 0.2 * Math.sin(state.clock.elapsedTime * 3);
    }

    // ---- the camera: fixed to the seat, it only zooms and slides ----
    const r = rig.current;
    const fresh = r.snappedFor !== attempt || r.seat !== seat;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const halfV = (VFOV * DEG) / 2;
    const halfH = Math.atan(Math.tan(halfV) * aspect);

    const moving = driving && Math.abs(car.speed) > MOVING;
    // A thumb on the stick counts as driving, so a car held against a kerb or
    // waiting on reverse gear doesn't send the view out and back in.
    const busy =
      moving || (driving && Math.hypot(stick.x, stick.y) > STICK_DEADZONE);
    r.linger = busy ? LINGER : Math.max(0, r.linger - dt);
    // On a phone, before the car has set off, the view waits part-way in: far
    // enough out to see the road ahead, close enough to see which car is
    // yours. Backed right off, the car is a few pixels long.
    const waiting = driving && !hasMoved() && aspect < 1 ? START_CLOSE : 0;
    const wantIn =
      focus || (driving && (busy || r.linger > 0)) ? 1 : waiting;
    if (fresh) {
      r.zoom = waiting;
      r.look = 1;
      r.tight = 0;
      r.hold = 0;
    } else {
      const rate = wantIn > r.zoom ? 2.4 : 1.3;
      r.zoom += (wantIn - r.zoom) * (1 - Math.exp(-dt * rate));
    }
    const close = ease(r.zoom);
    const away = AWAY[seat];
    const sideways = seat === "east" || seat === "west";

    // Backed off: the whole table on a wide screen, part of it on a tall one.
    const edge = 2 * (FRAME + MARGIN) + 6;
    const across = (sideways ? BOARD_H : BOARD_W) + edge;
    const deep = (sideways ? BOARD_W : BOARD_H) + edge;
    const whole =
      1.13 *
      Math.max(
        across / 2 / Math.tan(halfH),
        (deep * Math.sin(TILT_OUT) * 0.56) / Math.tan(halfV),
      );
    const wide = clamp((aspect - 0.75) / 0.5, 0, 1);
    const part = SPAN_PART / 2 / Math.tan(halfH);
    const farOut = Math.min(whole, lerp(part, whole, wide));
    const depthOut = (2 * farOut * Math.tan(halfV)) / Math.sin(TILT_OUT);
    const partX = clamp(
      car.x + away.x * 0.12 * depthOut,
      BOUNDS.x0 + 8,
      BOUNDS.x1 - 8,
    );
    const partZ = clamp(
      car.z + away.z * 0.12 * depthOut,
      BOUNDS.z0 + 8,
      BOUNDS.z1 - 8,
    );
    const outX = lerp(partX, CX, wide);
    const outZ = lerp(partZ, CZ, wide);

    // Closed in: the car, a little of the road ahead of it, and more of the
    // table beyond it than in front.
    // Backing up, it looks past the tail instead of the nose, and closes in
    // further, because a bay is a tight fit.
    const backing = driving && view.reversing;
    const turnRate = 1 - Math.exp(-dt * 3);
    r.look += ((backing ? -1 : 1) - r.look) * turnRate;
    r.tight += ((backing ? 1 : 0) - r.tight) * turnRate;
    // How close is the learner's to choose. How far it backs off is not, so
    // pushing the stick always closes in.
    const spanOf = (d: number) => 2 * d * Math.tan(halfH);
    cam.underWay = busy;
    cam.inSpan = SPAN_IN * Math.max(1, aspect / 0.62);
    cam.outSpan = spanOf(farOut);
    const inSpan =
      cam.driveSpan === null ? cam.inSpan : asDriveSpan(cam.driveSpan);
    const nearIn =
      (inSpan / 2 / Math.tan(halfH)) * lerp(1, REVERSE_CLOSER, r.tight);
    const depthIn = (2 * nearIn * Math.tan(halfV)) / Math.sin(TILT_IN);
    const nose = dirOf(at.heading);
    const ahead = { x: nose.x * r.look, z: nose.z * r.look };
    // The joystick covers the bottom of the screen and the task card the top:
    // hold the car in the clear part between them, not under the thumb. With
    // the examiner's card up, that is higher still.
    const tall = Math.max(1, state.size.height);
    const lift = clamp(
      focus
        ? // The card may fill the lower 62% of the screen, and only the
          // buttons are left along the top.
          (SHEET_SHARE * tall - SHEET_HUD_PX) / 2 / tall
        : (PAD_PX - HUD_PX) / 2 / tall,
      0.03,
      0.3,
    );
    const inX = at.x + ahead.x * 4 - away.x * lift * depthIn;
    const inZ = at.z + ahead.z * 4 - away.z * lift * depthIn;

    let distance = lerp(farOut, nearIn, close);
    let goalX = lerp(outX, inX, close);
    let goalZ = lerp(outZ, inZ, close);
    // The opening look: on a screen that shows only part of the table, the
    // view starts on the finish and slides back to the car. A push of the
    // stick ends it at once.
    // With a way blocked, the upside-down car is the thing to see first.
    const blockAt = challenge?.otherCars.find((other) => other.flipped);
    const look = blockAt ?? goal;
    if (fresh) {
      r.intro =
        sweep &&
        !calm &&
        look != null &&
        wide < 1 &&
        Math.hypot(look.x - car.x, look.z - car.z) > (blockAt ? 12 : SWEEP_FROM)
          ? (blockAt ? SWEEP_HOLD * 2 : SWEEP_HOLD) + SWEEP_MOVE
          : 0;
    } else if (busy || focus) {
      r.intro = 0;
    } else if (driving) {
      r.intro = Math.max(0, r.intro - dt);
    }
    if (r.intro > 0 && look) {
      const t = ease(clamp(r.intro / SWEEP_MOVE, 0, 1));
      goalX = lerp(goalX, look.x, t);
      goalZ = lerp(goalZ, look.z, t);
    }
    let near = close;
    const k = fresh ? 1 : 1 - Math.exp(-dt * 4);

    // The learner has hold of the camera: it goes where they slide it and as
    // close as they pinch it. It still never turns.
    cam.aspect = aspect;
    cam.max = spanOf(whole);
    // A slide or a zoom is a look round the table. Once the stick is pushed
    // the view goes back to the drive, which follows the car and closes in.
    if (busy && cam.free) endLook();
    const free = cam.free;
    if (free) {
      r.returning = true;
      if (!driving && cam.follow && pose) {
        cam.x = pose.x;
        cam.z = pose.z;
      }
      cam.span = clamp(cam.span, cam.min, cam.max);
      distance = cam.span / 2 / Math.tan(halfH);
      r.dist += (distance - r.dist) * (r.dist === 0 ? 1 : k);
      near = clamp((whole - r.dist) / Math.max(1, whole - nearIn), 0, 1);
      // A panel over the bottom of the screen: look a little nearer, so what
      // matters sits above it.
      const depth =
        (2 * r.dist * Math.tan(halfV)) /
        Math.sin(lerp(TILT_OUT, TILT_IN, near));
      if (driving) {
        if (cam.follow) {
          // The car and a little of the road ahead of it, as the drive's own
          // view has it. Backed right off, it is the middle of the table.
          const out = clamp((cam.span / cam.max - 0.7) / 0.3, 0, 1);
          cam.x = lerp(
            clamp(
              at.x + ahead.x * 4 - away.x * lift * depth,
              BOUNDS.x0,
              BOUNDS.x1,
            ),
            CX,
            out,
          );
          cam.z = lerp(
            clamp(
              at.z + ahead.z * 4 - away.z * lift * depth,
              BOUNDS.z0,
              BOUNDS.z1,
            ),
            CZ,
            out,
          );
        }
        goalX = cam.x;
        goalZ = cam.z;
      } else {
        // and a panel down the left: look a little to the left, so it sits in
        // the middle of what is left of the screen
        const across = spanOf(r.dist) * cam.side;
        goalX = cam.x - away.x * cam.lift * depth - -away.z * across;
        goalZ = cam.z - away.z * cam.lift * depth - away.x * across;
      }
    } else {
      if (fresh || r.dist === 0) r.returning = false;
      if (r.returning) {
        r.dist += (distance - r.dist) * k;
        r.near += (close - r.near) * k;
        near = r.near;
        if (
          Math.abs(distance - r.dist) < 0.3 &&
          Math.abs(close - r.near) < 0.01
        ) {
          r.returning = false;
        }
      } else {
        r.dist = distance;
      }
      cam.x = r.x;
      cam.z = r.z;
      cam.span = spanOf(r.dist);
    }
    r.near = near;
    const tiltNow = lerp(TILT_OUT, TILT_IN, near);
    r.snappedFor = attempt;
    r.seat = seat;
    r.x += (goalX - r.x) * k;
    r.z += (goalZ - r.z) * k;

    // A bump shakes the table a little.
    const shake = driving ? view.jolt * 0.3 : 0;
    const sx = r.x + Math.sin(state.clock.elapsedTime * 61) * shake;
    const sz = r.z + Math.cos(state.clock.elapsedTime * 53) * shake;
    const lookY = lerp(-5, 0, near);
    const angle = SEAT_ANGLE[seat];
    state.camera.position.set(
      sx + r.dist * Math.cos(tiltNow) * Math.sin(angle),
      lookY + r.dist * Math.sin(tiltNow),
      sz + r.dist * Math.cos(tiltNow) * Math.cos(angle),
    );
    state.camera.lookAt(sx, lookY, sz);

    // The sun's shadows are spent on the part of the board in view: closed in
    // on a car, the same shadow picture covers a fifth of the ground it does
    // for the whole table, so the car's shadow has a clean edge.
    const light = sun.current;
    if (light?.castShadow) {
      const groundAcross = 2 * r.dist * Math.tan(halfH);
      const groundDeep = (2 * r.dist * Math.tan(halfV)) / Math.sin(tiltNow);
      const want = 0.575 * Math.hypot(groundAcross, groundDeep) + 6;
      const half = SHADOW_STEPS.find((s) => s >= want) ?? SHADOW_REACH;
      // Backed right off it is the whole table, about its middle.
      const room = SHADOW_REACH - half;
      const px = clamp(r.x, CX - room, CX + room);
      const pz = clamp(r.z, CZ - room, CZ + room);
      // Moved in whole pixels of the shadow picture, so edges don't shimmer
      // as the view slides.
      const texel = (2 * half) / light.shadow.mapSize.x;
      const u = px * SUN_RIGHT.x + pz * SUN_RIGHT.z;
      const v = px * SUN_UP.x + pz * SUN_UP.z;
      const du = Math.round(u / texel) * texel - u;
      const dv = Math.round(v / texel) * texel - v;
      light.target.position.set(
        px + SUN_RIGHT.x * du + SUN_UP.x * dv,
        SUN_UP.y * dv,
        pz + SUN_RIGHT.z * du + SUN_UP.z * dv,
      );
      light.position.copy(light.target.position).add(SUN_OFFSET);
      light.target.updateMatrixWorld();
      const lens = light.shadow.camera;
      if (lens.right !== half) {
        lens.left = -half;
        lens.right = half;
        lens.top = half;
        lens.bottom = -half;
        lens.updateProjectionMatrix();
        // Enough to stop the surface shading itself, and no more: about a
        // pixel of the shadow picture.
        light.shadow.normalBias = Math.max(0.03, 0.83 * texel);
      }
    }

    // The lane that lane assist is holding, lit a little way ahead of the car.
    // It fades when the stick points somewhere else: the learner has the wheel.
    r.hold += ((driving ? view.hold : 0) - r.hold) * (1 - Math.exp(-dt * 8));
    if (holdStrip.current && holdMaterial.current) {
      holdStrip.current.visible = r.hold > 0.02;
      holdStrip.current.position.set(view.aimX, 0.045, view.aimZ);
      holdStrip.current.rotation.y = -view.along;
      holdMaterial.current.opacity = 0.15 * r.hold;
    }

    // Where the finish is on the screen, for the marker drawn over the table.
    finish.on = driving && goal !== null;
    if (goal && driving) {
      state.camera.updateMatrixWorld();
      probe.set(goal.x, FENCE_H, goal.z).project(state.camera);
      // Behind the camera the picture is turned over: turn it back, and push
      // it well off the screen.
      if (probe.z > 1) {
        const far = 3 / Math.max(0.001, Math.abs(probe.x), Math.abs(probe.y));
        probe.x *= -far;
        probe.y *= -far;
      }
      finish.x = (probe.x + 1) / 2;
      finish.y = (1 - probe.y) / 2;
      finish.metres = Math.hypot(goal.x - car.x, goal.z - car.z);
    }

    // Where the upside-down cars are on the screen, so nothing is drawn over them.
    blockSpots.length = 0;
    if (driving && challenge) {
      for (const other of challenge.otherCars) {
        if (!other.flipped) continue;
        probe.set(other.x, 1, other.z).project(state.camera);
        if (probe.z > 1) continue;
        blockSpots.push({ x: (probe.x + 1) / 2, y: (1 - probe.y) / 2 });
      }
    }

    // Where each car that can be picked is on the screen, for its button.
    picks.length = 0;
    if (!driving && extraCars) {
      state.camera.updateMatrixWorld();
      for (const spot of extraCars) {
        if (!spot.pick) continue;
        probe.set(spot.x, 1.2, spot.z).project(state.camera);
        if (probe.z > 1) continue;
        picks.push({
          id: spot.pick,
          x: (probe.x + 1) / 2,
          y: (1 - probe.y) / 2,
        });
      }
    }
    // And each place a learner is asked to find, for its pin.
    if (!driving && marks.length > 0) {
      state.camera.updateMatrixWorld();
      for (const mark of marks) {
        probe.set(mark.x, 0.4, mark.z).project(state.camera);
        if (probe.z > 1) continue;
        picks.push({
          id: mark.id,
          x: (probe.x + 1) / 2,
          y: (1 - probe.y) / 2,
        });
      }
    }

    // Still easing after the car has stopped: ask for another frame.
    const settled =
      Math.abs(distance - r.dist) < 0.05 &&
      (free || Math.abs(wantIn - r.zoom) < 0.004) &&
      Math.hypot(goalX - r.x, goalZ - r.z) < 0.03;
    if (!driving && !settled) invalidate();
  });

  return (
    <>
      <color attach="background" args={[ROOM]} />
      <fog attach="fog" args={[ROOM, 520, 1200]} />
      <hemisphereLight
        args={["#dfeaff", "#6a7a4a", tier === "high" ? 0.6 : 1.25]}
      />
      {/* Sun through a window: one warm light from over the left shoulder. */}
      <directionalLight
        ref={sun}
        position={[CX + SUN_OFFSET.x, SUN_OFFSET.y, CZ + SUN_OFFSET.z]}
        intensity={tier === "high" ? 3.1 : 2.3}
        color="#fff0d6"
        shadow-camera-near={30}
        shadow-camera-far={760}
        shadow-bias={-0.0004}
      />

      <primitive object={table.group} />
      <primitive object={parked} />
      <primitive object={extras} />

      {goal && (
        <mesh position={[goal.x, 0.05, goal.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[goal.w, goal.h]} />
          <meshBasicMaterial
            ref={goalMaterial}
            color={COLORS.goal}
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      )}

      {fence && <primitive object={fence} />}

      <group ref={holdStrip} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
          <planeGeometry args={[HOLD_W, HOLD_L]} />
          <meshBasicMaterial
            ref={holdMaterial}
            color="#ffffff"
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      <primitive object={ribbons} />
      {glow && (
        <mesh
          position={[(glow.x0 + glow.x1) / 2, 0.06, (glow.z0 + glow.z1) / 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={1}
        >
          <planeGeometry args={[glow.x1 - glow.x0, glow.z1 - glow.z0]} />
          <meshBasicMaterial
            ref={glowMaterial}
            color="#ffd84d"
            transparent
            opacity={0.34}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      {others.map((other, i) => (
        <primitive key={i} object={other} />
      ))}
      <primitive object={player} />
    </>
  );
}

type SceneProps = BoardTableProps & { shadow: number; onSlow: () => void };

/** Fetches the car models, then draws the scene with them. */
function SceneWithCars(props: SceneProps) {
  const loaded = useLoader(GLTFLoader, CAR_URLS, withMeshopt);
  const models = React.useMemo(() => {
    const byId = {} as Record<BoardCarId, THREE.Object3D>;
    BOARD_CARS.forEach((entry, i) => {
      byId[entry.id] = loaded[i].scene;
    });
    return byId;
  }, [loaded]);
  return <Scene {...props} models={models} />;
}

/** If the models can't be fetched, the board carries on with the built car. */
class CarsFallback extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** The screen the scene is drawn on. The table fills the window, or nearly. */
function screenNow() {
  return {
    native: window.devicePixelRatio || 1,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export default function BoardTable(props: BoardTableProps) {
  const { tier } = props;
  const high = tier === "high";
  const playing = useStage((s) => s.playing);
  // Where the device stands on the quality ladder. It starts where it settled
  // last time, only ever goes down, and starts again if the picture is changed.
  const first = props.startRung ?? 0;
  const [held, setHeld] = React.useState({ tier, rung: first });
  const rung = held.tier === tier ? held.rung : first;
  const step = rungAt(tier, rung);
  const onSlow = React.useCallback(() => {
    const next = stepDown(tier, rung, screenNow());
    if (next === rung) return;
    saveRung(tier, next);
    setHeld({ tier, rung: next });
  }, [tier, rung]);
  const scene = { ...props, shadow: high ? step.shadow : 0, onSlow };
  return (
    <Canvas
      shadows={high ? "soft" : false}
      dpr={props.pixelRatio ?? pixelRatioAt(step, screenNow())}
      frameloop={props.driving || playing ? "always" : "demand"}
      camera={{ fov: VFOV, near: 4, far: 2600, position: [CX, 240, CZ + 260] }}
      gl={{
        // Smoothed edges on every device: on a phone's chip it costs little,
        // and it can't be switched on once the scene is running.
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      style={{ touchAction: "none" }}
    >
      <CarsFallback fallback={<Scene {...scene} models={null} />}>
        <React.Suspense fallback={null}>
          <SceneWithCars {...scene} />
        </React.Suspense>
      </CarsFallback>
    </Canvas>
  );
}
