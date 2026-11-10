/**
 * The Model Town Board as a 2D game, drawn with PixiJS. This is the only board
 * file that imports Pixi, and it is only ever loaded through `React.lazy` from
 * `board-viewer.tsx` after the learner taps Start, so no other page pays for it.
 *
 * Built to run on cheap phones:
 *  - the whole board is one textured sprite, painted from the same SVG the page
 *    shows, so every lane line is exact;
 *  - cars and trees are a handful of small sprites from one CC0 pack (see
 *    `docs/asset-rights.md`);
 *  - frames are only drawn while the car can move.
 *
 * The camera turns with the car, so the road always runs up the screen and
 * "left" on the buttons is always the driver's left.
 *
 * The car's position comes straight from `board/runtime.ts` each frame. Nothing
 * here goes through React state while driving.
 */
import * as React from "react";
import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Texture,
} from "pixi.js";

import { BOARD_COLORS, boardSvg } from "~/lib/board/board-svg";
import type { BoardChallenge } from "~/lib/board/challenges";
import {
  ARMS,
  ARM_ORDER,
  BOARD_HALF,
  LANE_W,
  RING_OUTER_R,
  SOLID_ZONE,
  TREES,
  armHalfWidth,
  dirOf,
  laneBearing,
  lanePoint,
  wrapPi,
  type Arm,
} from "~/lib/board/geometry";
import { car, tick, view } from "~/lib/board/runtime";

export type BoardTier = "low" | "high";

export type BoardStageProps = {
  challenge: BoardChallenge | null;
  /** True while the learner is driving. Frames only render then. */
  driving: boolean;
  /** Changes on every (re)start, so the camera snaps instead of gliding. */
  attempt: number;
  tier: BoardTier;
  /** Everything is loaded and the board can be shown. */
  onReady?: () => void;
};

const ART = {
  player: "/assets/board/car-yellow.png",
  red: "/assets/board/car-red.png",
  treeLarge: "/assets/board/tree-large.png",
  treeSmall: "/assets/board/tree-small.png",
} as const;

const GRASS = "#4d9a3c";
/** How far the plain road carries on past the painted board. */
const FAR = 260;
/** Metres of road across a tall screen, and the least up a wide one. */
const VIEW_ACROSS = 27;
const VIEW_UP = 42;
const CAR_SIZE = { width: 2.05, length: 4.3 };

// ---- ground texture ---------------------------------------------------------

function toPx(value: number, size: number): number {
  return ((value + BOARD_HALF) / (BOARD_HALF * 2)) * size;
}

/** A light grain, so the tarmac and grass don't look like flat paint. */
function paintGrain(ctx: CanvasRenderingContext2D, size: number) {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 128;
  const tctx = tile.getContext("2d");
  if (!tctx) return;
  const data = tctx.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 90;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  const pattern = ctx.createPattern(tile, "repeat");
  if (!pattern) return;
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = pattern;
  ctx.globalAlpha = 0.2;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.16;
  ctx.scale(9, 9);
  ctx.fillRect(0, 0, size / 9, size / 9);
  ctx.restore();
}

function paintTreeShadows(ctx: CanvasRenderingContext2D, size: number) {
  const perMetre = size / (BOARD_HALF * 2);
  ctx.fillStyle = "rgba(10,30,10,0.28)";
  for (const tree of TREES) {
    ctx.beginPath();
    ctx.ellipse(
      toPx(tree.x + 0.9 * tree.s, size),
      toPx(tree.z + 1.1 * tree.s, size),
      3 * tree.s * perMetre,
      2.8 * tree.s * perMetre,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function paintGround(tier: BoardTier): Promise<Texture> {
  const size = tier === "high" ? 2048 : 1024;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(
      new Blob([boardSvg({ size })], { type: "image/svg+xml" }),
    );
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const image = new Image();
    const finish = () => {
      URL.revokeObjectURL(url);
      resolve(Texture.from(canvas));
    };
    image.onload = () => {
      if (ctx) {
        ctx.drawImage(image, 0, 0, size, size);
        paintGrain(ctx, size);
        paintTreeShadows(ctx, size);
      }
      finish();
    };
    // Plain tarmac is still drivable, so don't hold the game up.
    image.onerror = () => {
      if (ctx) {
        ctx.fillStyle = BOARD_COLORS.asphalt;
        ctx.fillRect(0, 0, size, size);
      }
      finish();
    };
    image.src = url;
  });
}

// ---- the land past the painted board ---------------------------------------

/** A rectangle on an arm, from metres along it and metres left of its centre. */
function armRect(
  g: Graphics,
  arm: Arm,
  from: number,
  to: number,
  left: number,
  right: number,
) {
  const lx = arm.out.z;
  const lz = -arm.out.x;
  const ax = arm.out.x * from + lx * left;
  const az = arm.out.z * from + lz * left;
  const bx = arm.out.x * to + lx * right;
  const bz = arm.out.z * to + lz * right;
  g.rect(
    Math.min(ax, bx),
    Math.min(az, bz),
    Math.abs(bx - ax),
    Math.abs(bz - az),
  );
}

/** Repeating blocks along an arm, in step with a dashed line on the board. */
function armDashes(
  g: Graphics,
  arm: Arm,
  origin: number,
  on: number,
  period: number,
  left: number,
  right: number,
) {
  const first = origin + Math.floor((BOARD_HALF - origin) / period) * period;
  for (let along = first; along < FAR; along += period) {
    const from = Math.max(along, BOARD_HALF);
    if (along + on > from) armRect(g, arm, from, along + on, left, right);
  }
}

/** The roads carry on past the painted board, drawn to match it. */
function drawBeyond(): Graphics {
  const g = new Graphics();
  g.rect(-FAR - 80, -FAR - 80, (FAR + 80) * 2, (FAR + 80) * 2).fill(GRASS);

  for (const id of ARM_ORDER) {
    const arm = ARMS[id];
    const half = armHalfWidth(arm);
    const kerbFrom = Math.sqrt(RING_OUTER_R ** 2 - half ** 2);
    const kerbs: [number, number][] = [
      [-half - 0.7, -half],
      [half, half + 0.7],
    ];
    if (arm.medianHalf > 0) {
      kerbs.push([-arm.medianHalf - 0.15, -arm.medianHalf + 0.55]);
      kerbs.push([arm.medianHalf - 0.55, arm.medianHalf + 0.15]);
    }

    armRect(g, arm, BOARD_HALF - 0.1, FAR, -half, half);
    g.fill(BOARD_COLORS.asphalt);

    if (arm.medianHalf > 0) {
      armRect(g, arm, BOARD_HALF, FAR, -arm.medianHalf, arm.medianHalf);
      g.fill(BOARD_COLORS.island);
    } else {
      for (const offset of [-0.34, 0.1]) {
        armRect(g, arm, BOARD_HALF, FAR, offset, offset + 0.24);
      }
      g.fill(BOARD_COLORS.yellow);
    }

    // Striped kerbs: black underneath, yellow blocks on top.
    for (const [left, right] of kerbs) {
      armRect(g, arm, BOARD_HALF, FAR, left, right);
    }
    g.fill(BOARD_COLORS.kerbBlack);
    for (const [left, right] of kerbs) {
      armDashes(g, arm, kerbFrom, 1.3, 2.6, left, right);
    }
    g.fill(BOARD_COLORS.yellow);

    // Broken lane lines. A negative offset is the side driving in, whose
    // broken lines start where the continuous ones end.
    for (const side of [-1, 1]) {
      for (let k = 1; k < arm.lanes; k += 1) {
        const offset = side * (arm.medianHalf + k * LANE_W);
        const origin =
          side < 0 ? SOLID_ZONE : Math.sqrt(RING_OUTER_R ** 2 - offset ** 2);
        armDashes(g, arm, origin, 2.6, 5.2, offset - 0.12, offset + 0.12);
      }
    }
    g.fill(BOARD_COLORS.white);
  }
  return g;
}

/** Trees out in the fields, the same every time. */
function farTrees(): { x: number; z: number; s: number; small: boolean }[] {
  const out: { x: number; z: number; s: number; small: boolean }[] = [];
  let seed = 7;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  while (out.length < 46) {
    const x = (random() - 0.5) * 2 * 190;
    const z = (random() - 0.5) * 2 * 190;
    const onBoard =
      Math.abs(x) < BOARD_HALF + 3 && Math.abs(z) < BOARD_HALF + 3;
    const onRoad = Math.abs(x) < 21 || Math.abs(z) < 17;
    if (onBoard || onRoad) continue;
    out.push({ x, z, s: 0.8 + random() * 0.6, small: random() < 0.35 });
  }
  return out;
}

// ---- the scene --------------------------------------------------------------

type CarSprite = {
  root: Container;
  brake: Graphics;
  left: Graphics;
  right: Graphics;
};

function makeCar(texture: Texture): CarSprite {
  const root = new Container();
  const shadow = new Sprite(texture);
  shadow.anchor.set(0.5);
  shadow.width = CAR_SIZE.width;
  shadow.height = CAR_SIZE.length;
  shadow.tint = 0x000000;
  shadow.alpha = 0.28;
  const body = new Sprite(texture);
  body.anchor.set(0.5);
  body.width = CAR_SIZE.width;
  body.height = CAR_SIZE.length;

  const half = CAR_SIZE.width / 2;
  const rear = CAR_SIZE.length / 2;
  const brake = new Graphics()
    .roundRect(-half + 0.12, rear - 0.3, 0.55, 0.24, 0.08)
    .roundRect(half - 0.67, rear - 0.3, 0.55, 0.24, 0.08)
    .fill(0xff2a1f);
  const lamp = (x: number) =>
    new Graphics()
      .circle(x, -rear + 0.3, 0.26)
      .circle(x, rear - 0.3, 0.26)
      .fill(0xffa400);
  const left = lamp(-half + 0.16);
  const right = lamp(half - 0.16);
  brake.visible = left.visible = right.visible = false;

  root.addChild(shadow, body, brake, left, right);
  // The shadow is the first child; the stage slides it to the sunless side.
  return { root, brake, left, right };
}

type Scene = {
  app: Application;
  world: Container;
  ground: Texture;
  goal: Graphics;
  marks: Graphics;
  others: Container;
  otherSprites: CarSprite[];
  player: CarSprite;
  red: Texture;
  cam: { x: number; z: number; heading: number; snappedFor: number };
  pace: { frames: number; total: number; done: boolean };
  marksDrawn: number;
  clock: number;
  goalFor: BoardChallenge | null;
};

function buildScene(
  app: Application,
  ground: Texture,
  art: Record<string, Texture>,
  tier: BoardTier,
): Scene {
  const world = new Container();
  app.stage.addChild(world);

  world.addChild(drawBeyond());

  const board = new Sprite(ground);
  board.position.set(-BOARD_HALF, -BOARD_HALF);
  board.width = board.height = BOARD_HALF * 2;
  world.addChild(board);

  const marks = new Graphics();
  const goal = new Graphics();
  const others = new Container();
  const player = makeCar(art[ART.player]);
  world.addChild(marks, goal, others, player.root);

  const trees = new Container();
  const plant = (
    x: number,
    z: number,
    s: number,
    small: boolean,
    shade: boolean,
  ) => {
    if (shade) {
      trees.addChild(
        new Graphics()
          .ellipse(x + 0.9 * s, z + 1.1 * s, 3 * s, 2.8 * s)
          .fill({ color: 0x0a1e0a, alpha: 0.26 }),
      );
    }
    const tree = new Sprite(art[small ? ART.treeSmall : ART.treeLarge]);
    tree.anchor.set(0.5);
    tree.width = tree.height = (small ? 4.2 : 6) * s;
    tree.position.set(x, z);
    trees.addChild(tree);
  };
  // The board's own trees already have their shadows painted on the ground.
  TREES.forEach((t, i) => plant(t.x, t.z, t.s, i % 3 === 1, false));
  farTrees().forEach((t) => plant(t.x, t.z, t.s, t.small, true));
  world.addChild(trees);

  return {
    app,
    world,
    ground,
    goal,
    marks,
    others,
    otherSprites: [],
    player,
    red: art[ART.red],
    cam: { x: 0, z: 0, heading: 0, snappedFor: -1 },
    pace: { frames: 0, total: 0, done: tier === "low" },
    marksDrawn: 0,
    clock: 0,
    goalFor: null,
  };
}

/** Draw the stopping box and park the other cars for a task. */
function stageTask(scene: Scene, challenge: BoardChallenge | null) {
  scene.goalFor = challenge;
  scene.goal.clear();
  scene.marks.clear();
  scene.marksDrawn = 0;
  for (const sprite of scene.otherSprites)
    sprite.root.destroy({ children: true });
  scene.otherSprites = [];
  if (!challenge) return;

  const goal = challenge.goal;
  const arm = ARMS[goal.arm];
  const lanes =
    goal.lane != null
      ? [goal.lane]
      : Array.from({ length: arm.lanes }, (_, i) => i + 1);
  const mid = (goal.alongMin + goal.alongMax) / 2;
  const first = lanePoint(goal.arm, "exit", lanes[0], mid);
  const last = lanePoint(goal.arm, "exit", lanes[lanes.length - 1], mid);
  const w = lanes.length * LANE_W - 0.5;
  const h = goal.alongMax - goal.alongMin;
  scene.goal
    .roundRect(-w / 2, -h / 2, w, h, 0.5)
    .fill({ color: 0x3ddc72, alpha: 0.3 })
    .stroke({ color: 0x3ddc72, width: 0.45 });
  scene.goal.position.set((first.x + last.x) / 2, (first.z + last.z) / 2);
  scene.goal.rotation = laneBearing(goal.arm, "exit");

  challenge.otherCars.forEach(() => {
    const sprite = makeCar(scene.red);
    scene.others.addChild(sprite.root);
    scene.otherSprites.push(sprite);
  });
}

function pose(sprite: CarSprite, x: number, z: number, heading: number) {
  sprite.root.position.set(x, z);
  sprite.root.rotation = heading;
  // Keep the shadow to the south-east however the car is turned.
  const shadow = sprite.root.children[0];
  const c = Math.cos(-heading);
  const s = Math.sin(-heading);
  shadow.position.set(0.3 * c - 0.38 * s, 0.3 * s + 0.38 * c);
}

function frame(
  scene: Scene,
  seconds: number,
  live: { challenge: BoardChallenge | null; driving: boolean; attempt: number },
) {
  const { app, world, cam } = scene;
  if (live.challenge !== scene.goalFor) stageTask(scene, live.challenge);

  if (live.driving) {
    tick(seconds);
    // A phone that can't keep up gets a lower resolution, once.
    const p = scene.pace;
    if (!p.done) {
      p.frames += 1;
      p.total += seconds;
      if (p.frames >= 90) {
        p.done = true;
        if (p.total / p.frames > 1 / 34 && app.renderer.resolution > 1) {
          app.renderer.resolution = 1;
          app.resize();
        }
      }
    }
  }
  scene.clock += seconds;

  pose(scene.player, car.x, car.z, car.heading);
  const blink = scene.clock % 0.7 < 0.4;
  scene.player.brake.visible = view.braking;
  scene.player.left.visible = view.indicator === "left" && blink;
  scene.player.right.visible = view.indicator === "right" && blink;
  view.others.forEach((other, i) => {
    const sprite = scene.otherSprites[i];
    if (sprite) pose(sprite, other.x, other.z, other.heading);
  });

  // Rubber on the road under hard braking.
  if (view.braking && car.speed > 4.5 && scene.marksDrawn < 260) {
    const back = dirOf(car.heading + Math.PI);
    const side = dirOf(car.heading + Math.PI / 2);
    for (const k of [-0.72, 0.72]) {
      scene.marks.circle(
        car.x + back.x * 1.5 + side.x * k,
        car.z + back.z * 1.5 + side.z * k,
        0.17,
      );
    }
    scene.marks.fill({ color: 0x111114, alpha: 0.32 });
    scene.marksDrawn += 1;
  }

  scene.goal.alpha = 0.72 + Math.sin(scene.clock * 3.2) * 0.22;

  // The camera sits behind the car and turns with it.
  const snap = cam.snappedFor !== live.attempt;
  cam.snappedFor = live.attempt;
  const ahead = dirOf(car.heading);
  const tx = car.x + ahead.x * 3;
  const tz = car.z + ahead.z * 3;
  const glide = snap ? 1 : 1 - Math.exp(-seconds * 6);
  // Slow enough that a lane change doesn't swing the whole board about.
  const turn = snap ? 1 : 1 - Math.exp(-seconds * 2);
  cam.x += (tx - cam.x) * glide;
  cam.z += (tz - cam.z) * glide;
  cam.heading += wrapPi(car.heading - cam.heading) * turn;

  const { width, height } = app.screen;
  const tall = height > width;
  const perMetre = Math.min(width / VIEW_ACROSS, height / VIEW_UP);
  const shake = view.jolt * 7;
  world.pivot.set(cam.x, cam.z);
  world.position.set(
    width / 2 + (Math.random() - 0.5) * shake,
    height * (tall ? 0.62 : 0.6) + (Math.random() - 0.5) * shake,
  );
  world.rotation = -cam.heading;
  world.scale.set(perMetre);
}

export default function BoardStage(props: BoardStageProps) {
  const host = React.useRef<HTMLDivElement>(null);
  const scene = React.useRef<Scene | null>(null);
  const live = React.useRef(props);
  live.current = props;

  React.useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    const app = new Application();
    let ready = false;

    void (async () => {
      const high = props.tier === "high";
      await app.init({
        resizeTo: el,
        background: GRASS,
        antialias: high,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, high ? 2 : 1.25),
        preference: "webgl",
        powerPreference: "high-performance",
      });
      ready = true;
      if (cancelled) {
        app.destroy(true);
        return;
      }
      const [ground, art] = await Promise.all([
        paintGround(props.tier),
        Assets.load<Texture>(Object.values(ART)),
      ]);
      if (cancelled) {
        ground.destroy(true);
        app.destroy(true);
        return;
      }
      el.appendChild(app.canvas);
      const built = buildScene(app, ground, art, props.tier);
      scene.current = built;
      app.ticker.add((ticker) =>
        frame(built, ticker.deltaMS / 1000, live.current),
      );
      // Off the clock a still frame is enough, so redraw only on a resize.
      app.renderer.on("resize", () => {
        if (!live.current.driving) {
          frame(built, 0, live.current);
          app.render();
        }
      });
      if (!live.current.driving) {
        frame(built, 0, live.current);
        app.render();
        app.ticker.stop();
      }
      live.current.onReady?.();
    })();

    return () => {
      cancelled = true;
      const built = scene.current;
      scene.current = null;
      if (!ready) return;
      if (built) {
        built.ground.destroy(true);
        // The sprite art is shared through Pixi's cache, so it stays loaded.
        app.destroy(true, { children: true });
      }
    };
    // The stage is built once per quality tier.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.tier]);

  // Run the clock only while there is something moving.
  React.useEffect(() => {
    const built = scene.current;
    if (!built) return;
    if (props.driving) {
      built.app.ticker.start();
      return;
    }
    frame(built, 0, live.current);
    built.app.render();
    built.app.ticker.stop();
  }, [props.driving, props.attempt, props.challenge]);

  return (
    <div ref={host} className="size-full" style={{ touchAction: "none" }} />
  );
}
