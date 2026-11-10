/**
 * The Model Town Board as a live 3D scene. This is the only board file that
 * imports `three`, and it is only ever loaded through `React.lazy` from
 * `board-viewer.tsx` after the learner taps Start, so no other page pays for it.
 *
 * Built to run on cheap phones:
 *  - the whole road surface is one textured plane, painted from the same SVG the
 *    page shows, so every lane line is exact and costs nothing extra to draw;
 *  - kerbs, trees and fence posts are instanced, a couple of dozen draw calls in
 *    all, with no model files to download;
 *  - no real-time shadows: tree shadows are painted into the ground and each car
 *    carries a soft blob;
 *  - frames are only rendered while the car can move.
 *
 * The car's position comes straight from `board/runtime.ts` each frame. Nothing
 * here goes through React state while driving.
 */
import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { BOARD_COLORS, boardSvg } from "~/lib/board/board-svg";
import type { BoardChallenge } from "~/lib/board/challenges";
import {
  ARMS,
  ARM_ORDER,
  BOARD_HALF,
  ISLAND_R,
  LANE_W,
  MEDIAN_START,
  RING_OUTER_R,
  TREES,
  armHalfWidth,
  dirOf,
  laneBearing,
  lanePoint,
  type Vec,
} from "~/lib/board/geometry";
import { car, tick } from "~/lib/board/runtime";

export type BoardTier = "low" | "high";

export type BoardCanvasProps = {
  challenge: BoardChallenge | null;
  /** True while the learner is driving. Frames only render then. */
  driving: boolean;
  /** Changes on every (re)start, so the camera snaps instead of gliding. */
  attempt: number;
  tier: BoardTier;
  /** The road surface has been painted and the board can be shown. */
  onReady?: () => void;
};

const SKY = "#bfe2f2";
const VFOV = 38;
/** Camera angle above the ground. */
const TILT = (54 * Math.PI) / 180;
const KERB = { width: 0.5, height: 0.3, length: 1.25 };
/** How many boards wide the ground plane is. */
const GROUND_SPAN = 3;

// ---- ground texture ---------------------------------------------------------

/** World metres to texture pixels. */
function toPx(value: number, size: number): number {
  return ((value + BOARD_HALF) / (BOARD_HALF * 2)) * size;
}

/** Fine grain plus broad blotches, so asphalt and grass don't look printed. */
function paintGrain(ctx: CanvasRenderingContext2D, size: number) {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 128;
  const tctx = tile.getContext("2d");
  if (!tctx) return;
  const data = tctx.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 110;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  const pattern = ctx.createPattern(tile, "repeat");
  if (!pattern) return;
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = pattern;
  ctx.globalAlpha = 0.34;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.22;
  ctx.scale(9, 9);
  ctx.fillRect(0, 0, size / 9, size / 9);
  ctx.restore();
}

/** The sun sits to the north-west, so shadows fall south-east. */
function paintTreeShadows(ctx: CanvasRenderingContext2D, size: number) {
  const perMetre = size / (BOARD_HALF * 2);
  for (const tree of TREES) {
    const cx = toPx(tree.x + 1.9 * tree.s, size);
    const cy = toPx(tree.z + 1.5 * tree.s, size);
    const radius = 3.1 * tree.s * perMetre;
    const shade = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    shade.addColorStop(0, "rgba(10,20,10,0.42)");
    shade.addColorStop(0.6, "rgba(10,20,10,0.26)");
    shade.addColorStop(1, "rgba(10,20,10,0)");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius, radius * 0.72, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function useGroundTexture(tier: BoardTier, onReady?: () => void) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const [texture, setTexture] = React.useState<THREE.CanvasTexture | null>(
    null,
  );
  const ready = React.useRef(onReady);
  ready.current = onReady;

  React.useEffect(() => {
    let cancelled = false;
    const size = tier === "high" ? 2048 : 1024;
    const url = URL.createObjectURL(
      new Blob([boardSvg({ size })], { type: "image/svg+xml" }),
    );
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(image, 0, 0, size, size);
      paintGrain(ctx, size);
      paintTreeShadows(ctx, size);
      const next = new THREE.CanvasTexture(canvas);
      next.colorSpace = THREE.SRGBColorSpace;
      // The plane is three boards wide. Past the painted square the edge
      // pixels repeat, so roads and grass carry on to the horizon.
      next.repeat.set(GROUND_SPAN, GROUND_SPAN);
      next.offset.set(-(GROUND_SPAN - 1) / 2, -(GROUND_SPAN - 1) / 2);
      next.anisotropy = Math.min(
        tier === "high" ? 8 : 2,
        gl.capabilities.getMaxAnisotropy(),
      );
      setTexture(next);
      invalidate();
      ready.current?.();
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      // The scene still works on bare asphalt, so don't hold the loader up.
      if (!cancelled) ready.current?.();
    };
    image.src = url;
    return () => {
      cancelled = true;
    };
  }, [tier, gl, invalidate]);

  React.useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

// ---- instanced scenery -------------------------------------------------------

type Placed = {
  x: number;
  y: number;
  z: number;
  yaw?: number;
  scale?: [number, number, number];
  color: string;
};

/** One draw call for any number of copies of a shape. */
function Instances({
  items,
  geometry,
  shiny = false,
}: {
  items: readonly Placed[];
  geometry: THREE.BufferGeometry;
  shiny?: boolean;
}) {
  const ref = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    items.forEach((item, i) => {
      dummy.position.set(item.x, item.y, item.z);
      dummy.rotation.set(0, item.yaw ?? 0, 0);
      const [sx, sy, sz] = item.scale ?? [1, 1, 1];
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(item.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, items.length]}
      frustumCulled={false}
    >
      {shiny ? <meshPhongMaterial shininess={30} /> : <meshLambertMaterial />}
    </instancedMesh>
  );
}

/** Striped blocks laid end to end along a line. */
function kerbLine(out: Placed[], a: Vec, b: Vec) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  const count = Math.max(1, Math.round(length / KERB.length));
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count;
    out.push({
      x: a.x + dx * t,
      y: KERB.height / 2,
      z: a.z + dz * t,
      yaw: Math.atan2(dx, dz),
      scale: [1, 1, length / count / KERB.length],
      color: i % 2 === 0 ? BOARD_COLORS.yellow : BOARD_COLORS.kerbBlack,
    });
  }
}

function alongArm(out: Vec, along: number, offset: number): Vec {
  // `offset` is measured to the left of the outward direction.
  return {
    x: out.x * along + out.z * offset,
    z: out.z * along - out.x * offset,
  };
}

function buildScenery() {
  const kerbs: Placed[] = [];
  const hedges: Placed[] = [];
  const reserves: Placed[] = [];
  const edge = KERB.width / 2;

  for (const id of ARM_ORDER) {
    const arm = ARMS[id];
    const half = armHalfWidth(arm) + edge;
    const from = Math.sqrt(RING_OUTER_R ** 2 - armHalfWidth(arm) ** 2);
    for (const side of [-1, 1]) {
      kerbLine(
        kerbs,
        alongArm(arm.out, from, side * half),
        alongArm(arm.out, BOARD_HALF, side * half),
      );
    }
    // Past the board the kerbs run on as plain yellow.
    const far = BOARD_HALF * GROUND_SPAN;
    const beyond = far - BOARD_HALF;
    const offsets = [-half, half];
    if (arm.medianHalf > 0) offsets.push(0);
    for (const offset of offsets) {
      const mid = alongArm(arm.out, BOARD_HALF + beyond / 2, offset);
      reserves.push({
        x: mid.x,
        y: KERB.height / 2,
        z: mid.z,
        yaw: Math.atan2(arm.out.x, arm.out.z),
        scale: [
          offset === 0 ? arm.medianHalf * 2 : KERB.width,
          KERB.height,
          beyond,
        ],
        color: offset === 0 ? BOARD_COLORS.island : BOARD_COLORS.yellow,
      });
    }
    if (arm.medianHalf > 0) {
      const inner = arm.medianHalf - edge;
      for (const side of [-1, 1]) {
        kerbLine(
          kerbs,
          alongArm(arm.out, MEDIAN_START, side * inner),
          alongArm(arm.out, BOARD_HALF, side * inner),
        );
      }
      kerbLine(
        kerbs,
        alongArm(arm.out, MEDIAN_START - edge, -arm.medianHalf),
        alongArm(arm.out, MEDIAN_START - edge, arm.medianHalf),
      );
      const length = BOARD_HALF - MEDIAN_START;
      const mid = alongArm(arm.out, MEDIAN_START + length / 2, 0);
      reserves.push({
        x: mid.x,
        y: 0.12,
        z: mid.z,
        yaw: Math.atan2(arm.out.x, arm.out.z),
        scale: [arm.medianHalf * 2 - KERB.width, 0.24, length],
        color: BOARD_COLORS.island,
      });
      for (let along = MEDIAN_START + 3; along < BOARD_HALF - 1; along += 5) {
        const p = alongArm(arm.out, along, 0);
        hedges.push({
          x: p.x,
          y: 0.5,
          z: p.z,
          yaw: Math.atan2(arm.out.x, arm.out.z),
          scale: [0.42, 0.42, 1.5],
          color: along % 2 > 1 ? "#2f7d32" : "#39903a",
        });
      }
    }
  }

  // The island's kerb.
  const steps = 26;
  const radius = ISLAND_R - edge;
  for (let i = 0; i < steps; i += 1) {
    const a = dirOf((i / steps) * Math.PI * 2);
    const b = dirOf(((i + 1) / steps) * Math.PI * 2);
    kerbs.push({
      x: ((a.x + b.x) / 2) * radius,
      y: KERB.height / 2,
      z: ((a.z + b.z) / 2) * radius,
      yaw: Math.atan2(b.x - a.x, b.z - a.z),
      scale: [1, 1, (Math.hypot(b.x - a.x, b.z - a.z) * radius) / KERB.length],
      color: i % 2 === 0 ? BOARD_COLORS.yellow : BOARD_COLORS.kerbBlack,
    });
  }

  const trunks: Placed[] = [];
  const leaves: Placed[] = [];
  const greens = ["#2e7d32", "#3a8f3a", "#2a6f2d", "#44993f"];
  TREES.forEach((tree, i) => {
    const s = tree.s;
    trunks.push({
      x: tree.x,
      y: 1.1 * s,
      z: tree.z,
      scale: [s, s, s],
      color: "#6b4a2f",
    });
    leaves.push({
      x: tree.x,
      y: 3.1 * s,
      z: tree.z,
      scale: [s, s * 0.9, s],
      color: greens[i % greens.length],
    });
    leaves.push({
      x: tree.x + 0.5 * s,
      y: 4.5 * s,
      z: tree.z - 0.3 * s,
      scale: [s * 0.68, s * 0.68, s * 0.68],
      color: greens[(i + 1) % greens.length],
    });
  });

  // A fence round the outside of each grass corner.
  const posts: Placed[] = [];
  const rails: Placed[] = [];
  const fenceLine = (a: Vec, b: Vec) => {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    for (const y of [0.5, 0.95]) {
      rails.push({
        x: (a.x + b.x) / 2,
        y,
        z: (a.z + b.z) / 2,
        yaw,
        scale: [1, 1, length],
        color: "#d9dcdf",
      });
    }
    const count = Math.round(length / 4);
    for (let i = 0; i <= count; i += 1) {
      posts.push({
        x: a.x + (dx * i) / count,
        y: 0.6,
        z: a.z + (dz * i) / count,
        color: "#c5c9cd",
      });
    }
  };
  const inset = BOARD_HALF - 1;
  const ns = armHalfWidth(ARMS.S) + 2;
  const ew = armHalfWidth(ARMS.E) + 2;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      fenceLine(
        { x: sx * ns, z: sz * inset },
        { x: sx * inset, z: sz * inset },
      );
      fenceLine(
        { x: sx * inset, z: sz * inset },
        { x: sx * inset, z: sz * ew },
      );
    }
  }

  return { kerbs, hedges, reserves, trunks, leaves, posts, rails };
}

// Shapes are made once, the first time the scene mounts.
let shapes: ReturnType<typeof buildShapes> | null = null;

function buildShapes() {
  const profile = new THREE.Shape();
  // Side view of a saloon, nose at +x.
  const outline: [number, number][] = [
    [-2.0, 0.4],
    [-2.05, 0.62],
    [-1.95, 0.86],
    [-1.42, 0.92],
    [-0.92, 1.36],
    [0.24, 1.38],
    [0.92, 0.95],
    [1.8, 0.8],
    [2.05, 0.62],
    [2.0, 0.4],
  ];
  outline.forEach(([x, y], i) =>
    i === 0 ? profile.moveTo(x, y) : profile.lineTo(x, y),
  );
  profile.closePath();

  const extrude = (points: [number, number][], depth: number, bevel = 0) => {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) =>
      i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y),
    );
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevel > 0,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 2,
    });
    geometry.translate(0, 0, -depth / 2);
    // The profile's +x becomes the car's nose, which points down -z.
    geometry.rotateY(Math.PI / 2);
    return geometry;
  };

  const body = extrude(outline, 1.62, 0.09);
  const glass = mergeGeometries([
    // Side windows, a hair proud of the doors.
    extrude(
      [
        [-1.3, 0.98],
        [-0.9, 1.3],
        [0.2, 1.32],
        [0.8, 1.0],
      ],
      1.87,
    ),
    // Rear screen and windscreen, laid on the slopes and clear of the
    // body's rounded edge.
    extrude(
      [
        [-1.45, 1.07],
        [-1.05, 1.42],
        [-0.93, 1.29],
        [-1.33, 0.94],
      ],
      1.4,
    ),
    extrude(
      [
        [0.36, 1.46],
        [0.92, 1.1],
        [0.83, 0.95],
        [0.27, 1.3],
      ],
      1.4,
    ),
  ]);

  const wheel = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 14);
  wheel.rotateZ(Math.PI / 2);
  const wheels = mergeGeometries(
    [
      [-0.84, -1.3],
      [0.84, -1.3],
      [-0.84, 1.3],
      [0.84, 1.3],
    ].map(([x, z]) => wheel.clone().translate(x, 0.34, z)),
  );

  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 64;
  shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext("2d");
  if (sctx) {
    sctx.scale(1, 2);
    const shade = sctx.createRadialGradient(32, 32, 6, 32, 32, 32);
    shade.addColorStop(0, "rgba(0,0,0,0.55)");
    shade.addColorStop(0.55, "rgba(0,0,0,0.4)");
    shade.addColorStop(1, "rgba(0,0,0,0)");
    sctx.fillStyle = shade;
    sctx.fillRect(0, 0, 64, 64);
  }

  const boxCanvas = document.createElement("canvas");
  boxCanvas.width = 128;
  boxCanvas.height = 128;
  const bctx = boxCanvas.getContext("2d");
  if (bctx) {
    bctx.fillStyle = "rgba(61,220,114,0.34)";
    bctx.fillRect(0, 0, 128, 128);
    bctx.strokeStyle = "rgba(61,220,114,1)";
    bctx.lineWidth = 10;
    bctx.strokeRect(5, 5, 118, 118);
  }

  return {
    body,
    glass,
    wheels,
    lights: new THREE.BoxGeometry(1.36, 0.11, 0.08),
    shadow: new THREE.CanvasTexture(shadowCanvas),
    goal: new THREE.CanvasTexture(boxCanvas),
    kerb: new THREE.BoxGeometry(KERB.width, KERB.height, KERB.length),
    box: new THREE.BoxGeometry(1, 1, 1),
    hedge: new THREE.IcosahedronGeometry(1, 1),
    trunk: new THREE.CylinderGeometry(0.24, 0.34, 2.2, 6),
    leaf: new THREE.IcosahedronGeometry(2.1, 1),
    post: new THREE.BoxGeometry(0.14, 1.2, 0.14),
    rail: new THREE.BoxGeometry(0.07, 0.09, 1),
    island: new THREE.CylinderGeometry(
      ISLAND_R - KERB.width,
      ISLAND_R - KERB.width,
      0.26,
      32,
    ),
    plane: new THREE.PlaneGeometry(1, 1),
  };
}

// ---- cars --------------------------------------------------------------------

const CarModel = React.forwardRef<
  THREE.Group,
  { color: string; x?: number; z?: number; heading?: number }
>(function CarModel({ color, x = 0, z = 0, heading = 0 }, ref) {
  const s = shapes!;
  return (
    <group ref={ref} position={[x, 0, z]} rotation={[0, -heading, 0]}>
      <mesh geometry={s.body}>
        <meshPhongMaterial color={color} shininess={90} specular="#9a9a9a" />
      </mesh>
      <mesh geometry={s.glass}>
        <meshPhongMaterial color="#14181d" shininess={120} specular="#bcd" />
      </mesh>
      <mesh geometry={s.wheels}>
        <meshLambertMaterial color="#18181a" />
      </mesh>
      <mesh geometry={s.lights} position={[0, 0.69, -2.1]}>
        <meshBasicMaterial color="#fff6d8" />
      </mesh>
      <mesh geometry={s.lights} position={[0, 0.74, 2.08]}>
        <meshBasicMaterial color="#c81e1e" />
      </mesh>
      <mesh
        geometry={s.plane}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0.25, 0.03, 0.25]}
        scale={[3.2, 6, 1]}
        renderOrder={1}
      >
        <meshBasicMaterial
          map={s.shadow}
          transparent
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
    </group>
  );
});

function GoalBox({ challenge }: { challenge: BoardChallenge }) {
  const material = React.useRef<THREE.MeshBasicMaterial>(null);
  const goal = challenge.goal;
  const arm = ARMS[goal.arm];
  const lanes =
    goal.lane != null
      ? [goal.lane]
      : Array.from({ length: arm.lanes }, (_, i) => i + 1);
  const mid = (goal.alongMin + goal.alongMax) / 2;
  const first = lanePoint(goal.arm, "exit", lanes[0], mid);
  const last = lanePoint(goal.arm, "exit", lanes[lanes.length - 1], mid);

  useFrame(({ clock }) => {
    if (material.current) {
      material.current.opacity =
        0.72 + Math.sin(clock.elapsedTime * 3.2) * 0.22;
    }
  });

  return (
    <group
      position={[(first.x + last.x) / 2, 0.04, (first.z + last.z) / 2]}
      rotation={[0, -laneBearing(goal.arm, "exit"), 0]}
    >
      <mesh
        geometry={shapes!.plane}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[lanes.length * LANE_W - 0.5, goal.alongMax - goal.alongMin, 1]}
      >
        <meshBasicMaterial
          ref={material}
          map={shapes!.goal}
          transparent
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>
    </group>
  );
}

// ---- the scene ---------------------------------------------------------------

function Scene({
  challenge,
  driving,
  attempt,
  tier,
  onReady,
}: BoardCanvasProps) {
  if (!shapes) shapes = buildShapes();
  const s = shapes;
  const scenery = React.useMemo(buildScenery, []);
  const texture = useGroundTexture(tier, onReady);
  const player = React.useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const setDpr = useThree((state) => state.setDpr);

  const rig = React.useRef({ x: 0, z: 0, snappedFor: -1 });
  const pace = React.useRef({ frames: 0, total: 0, done: tier === "low" });

  // Off the clock, one frame is enough to show where things stand.
  React.useEffect(() => {
    invalidate();
  }, [driving, attempt, challenge, texture, invalidate]);

  useFrame((state, delta) => {
    if (driving) {
      tick(delta);
      // A phone that can't keep up gets a lower resolution, once.
      const p = pace.current;
      if (!p.done) {
        p.frames += 1;
        p.total += delta;
        if (p.frames >= 90) {
          p.done = true;
          if (p.total / p.frames > 1 / 34) setDpr(1);
        }
      }
    }

    if (player.current) {
      player.current.position.set(car.x, 0, car.z);
      player.current.rotation.y = -car.heading;
    }

    // The camera stays pointing north and glides after the car. A tall screen
    // sees a narrower strip of road, and sits the car above the joystick.
    const aspect = state.size.width / Math.max(1, state.size.height);
    const wide = Math.min(1, Math.max(0, (aspect - 0.6) / 1));
    const width = 31 + (66 - 31) * wide;
    const halfV = (VFOV * Math.PI) / 360;
    const distance = width / (2 * Math.tan(halfV) * aspect);
    const depth = (2 * distance * Math.tan(halfV)) / Math.sin(TILT);
    const ahead = dirOf(car.heading);
    const goalX = car.x + ahead.x * 5;
    const goalZ = car.z + ahead.z * 5 + depth * (0.1 - 0.06 * wide);

    const r = rig.current;
    const k = r.snappedFor !== attempt ? 1 : 1 - Math.exp(-delta * 3.5);
    r.snappedFor = attempt;
    r.x += (goalX - r.x) * k;
    r.z += (goalZ - r.z) * k;
    state.camera.position.set(
      r.x,
      distance * Math.sin(TILT),
      r.z + distance * Math.cos(TILT),
    );
    state.camera.lookAt(r.x, 0, r.z);
  });

  return (
    <>
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 170, 420]} />
      <hemisphereLight args={["#eaf6ff", "#5d7a4a", 1.7]} />
      <directionalLight position={[-40, 70, -30]} intensity={2.1} />

      {/* The land beyond the board, so the edge never shows empty sky. */}
      <mesh
        geometry={s.plane}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        scale={[900, 900, 1]}
      >
        <meshLambertMaterial color="#468f37" />
      </mesh>
      <mesh
        geometry={s.plane}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[BOARD_HALF * 2 * GROUND_SPAN, BOARD_HALF * 2 * GROUND_SPAN, 1]}
      >
        {/* Keyed, because a material built without a map can't take one later. */}
        <meshLambertMaterial
          key={texture ? "painted" : "bare"}
          map={texture}
          color={texture ? "#ffffff" : BOARD_COLORS.asphalt}
        />
      </mesh>

      <Instances items={scenery.kerbs} geometry={s.kerb} shiny />
      <Instances items={scenery.reserves} geometry={s.box} />
      <Instances items={scenery.hedges} geometry={s.hedge} />
      <Instances items={scenery.trunks} geometry={s.trunk} />
      <Instances items={scenery.leaves} geometry={s.leaf} />
      <Instances items={scenery.posts} geometry={s.post} />
      <Instances items={scenery.rails} geometry={s.rail} />
      <mesh geometry={s.island} position={[0, 0.13, 0]}>
        <meshLambertMaterial color={BOARD_COLORS.island} />
      </mesh>

      {challenge && <GoalBox challenge={challenge} />}
      {challenge?.otherCars.map((other) => (
        <CarModel
          key={`${other.x}:${other.z}`}
          color={BOARD_COLORS.red}
          x={other.x}
          z={other.z}
          heading={other.heading}
        />
      ))}
      <CarModel ref={player} color={BOARD_COLORS.player} />
    </>
  );
}

export default function BoardCanvas(props: BoardCanvasProps) {
  return (
    <Canvas
      flat
      shadows={false}
      dpr={props.tier === "high" ? [1, 1.5] : 1}
      frameloop={props.driving ? "always" : "demand"}
      camera={{ fov: VFOV, near: 4, far: 700, position: [0, 90, 70] }}
      gl={{
        antialias: props.tier === "high",
        alpha: false,
        powerPreference: "high-performance",
      }}
      style={{ touchAction: "none" }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
