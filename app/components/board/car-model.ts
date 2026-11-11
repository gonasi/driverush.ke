/**
 * The cars on the table: a modern compact saloon built from numbers, so it is
 * ours and nobody downloads a model for it. A smooth lofted body with flush
 * glass, lamps that wrap the corners, wheel arches, alloy wheels and
 * Kenyan-style plates. The nose points down -z and the wheels sit on y = 0.
 */
import * as THREE from "three";

export type CarOptions = {
  paint: number;
  plate: string;
  /** Cheaper paint and glass, for phones that struggle. */
  simple?: boolean;
};

const LENGTH = 4.3;
const STATIONS = 96;
/** Points round half the body, from the middle of the floor to the middle of the roof. */
const POINTS = 11;
const RING = POINTS * 2 - 2;

type Keys = readonly (readonly [number, number])[];

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function key(t: number, keys: Keys): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i += 1) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      return v0 + (v1 - v0) * smooth(t0, t1, t);
    }
  }
  return keys[keys.length - 1][1];
}

// `t` runs from the rear bumper (0) to the nose (1): a short boot, a tall cabin
// set well forward, and a short sloping bonnet.
const deck = (t: number) =>
  key(t, [
    [0, 0.78],
    [0.03, 0.93],
    [0.075, 0.995],
    [0.16, 1.005],
    [0.7, 1.0],
    [0.8, 0.965],
    [0.92, 0.87],
    [0.975, 0.79],
    [1, 0.72],
  ]);
const roofline = (t: number) =>
  key(t, [
    [0.1, 0.9],
    [0.155, 1.005],
    [0.295, 1.435],
    [0.4, 1.48],
    [0.515, 1.455],
    [0.7, 1.0],
    [0.75, 0.88],
  ]);
const roof = (t: number) => Math.max(deck(t), roofline(t));
const halfWidth = (t: number) =>
  0.885 - 0.15 * Math.pow(Math.abs(2 * t - 1), 4.2);
const floor = (t: number) =>
  key(t, [
    [0, 0.37],
    [0.055, 0.2],
    [0.945, 0.2],
    [1, 0.33],
  ]);
const cabin = (t: number) => roof(t) - deck(t);
const zAt = (t: number) => LENGTH / 2 - t * LENGTH;

/** One half of the body's outline at `t`, as [across, up] pairs. */
function halfRing(t: number): [number, number][] {
  const w = halfWidth(t);
  const h = deck(t);
  const yb = floor(t);
  const cab = roof(t) - h;
  const grow = smooth(0, 0.32, cab);
  const wr = w - 0.2 + (0.635 - (w - 0.2)) * grow;
  const crown = 0.02 + 0.014 * grow;
  return [
    [0, yb],
    [w * 0.82, yb],
    [w * 0.985, yb + 0.07],
    [w, yb + (h - yb) * 0.5],
    [w - 0.01, h - 0.085],
    [w - 0.05, h - 0.004],
    [w - 0.095, h + Math.min(cab, 0.02)],
    [wr + 0.045, h + cab * 0.8],
    [wr - 0.025, h + cab * 0.965],
    [wr * 0.58, h + cab + crown * 0.75],
    [0, h + cab + crown],
  ];
}

type Part = "paint" | "glass" | "trim" | "lamp" | "tail";
const PARTS: readonly Part[] = ["paint", "glass", "trim", "lamp", "tail"];

/** Which half-ring segment a ring edge belongs to (mirrored on the left side). */
const segment = (k: number) => (k < POINTS - 1 ? k : RING - 1 - k);

/** What a patch of the body is made of: paint, glass, dark trim or a lamp. */
function partAt(t: number, s: number): Part {
  if (s <= 1) return "trim";
  const cab = cabin(t);
  if (s === 6 && cab > 0.26) {
    // the pillar between the doors
    if (t > 0.405 && t < 0.42) return "trim";
    if ((t > 0.215 && t < 0.405) || (t > 0.42 && t < 0.635)) return "glass";
  }
  if (
    (s === 8 || s === 9) &&
    cab > 0.03 &&
    ((t > 0.54 && t < 0.692) || (t > 0.168 && t < 0.29))
  ) {
    return "glass";
  }
  // lamps wrap round the corners, flush with the body
  if (t > 0.935 && s === 4) return "lamp";
  if (t < 0.05 && s === 4) return "tail";
  return "paint";
}

type Body = { positions: number[]; groups: Record<Part, number[]> };

let body: Body | null = null;

/** The body's skin. Worked out once and shared by every car. */
function buildBody(): Body {
  const positions: number[] = [];
  const stations: number[] = [];
  for (let i = 0; i <= STATIONS; i += 1) {
    const t = i / STATIONS;
    stations.push(t);
    const z = zAt(t);
    const ring = halfRing(t);
    for (let j = 0; j < POINTS; j += 1) {
      positions.push(ring[j][0], ring[j][1], z);
    }
    for (let j = POINTS - 2; j >= 1; j -= 1) {
      positions.push(-ring[j][0], ring[j][1], z);
    }
  }
  const groups: Record<Part, number[]> = {
    paint: [],
    glass: [],
    trim: [],
    lamp: [],
    tail: [],
  };
  for (let i = 0; i < STATIONS; i += 1) {
    const mid = (stations[i] + stations[i + 1]) / 2;
    for (let k = 0; k < RING; k += 1) {
      const next = (k + 1) % RING;
      const a = i * RING + k;
      const b = i * RING + next;
      const c = (i + 1) * RING + next;
      const d = (i + 1) * RING + k;
      groups[partAt(mid, segment(k))].push(a, c, b, a, d, c);
    }
  }
  // Each end is closed by a band and an inner panel, so the lamps and the
  // grille get real shapes instead of a fan of triangles.
  const cap = (station: number, front: boolean) => {
    const ring = halfRing(front ? 1 : 0);
    const first = station * RING;
    const cy = (ring[0][1] + ring[POINTS - 1][1]) / 2;
    const z = (front ? -1 : 1) * (LENGTH / 2 + 0.035);
    const inner = positions.length / 3;
    for (let k = 0; k < RING; k += 1) {
      const x = positions[(first + k) * 3];
      const y = positions[(first + k) * 3 + 1];
      positions.push(x * 0.56, cy + (y - cy) * 0.5, z);
    }
    const centre = positions.length / 3;
    positions.push(0, cy, z + (front ? -0.01 : 0.01));
    for (let k = 0; k < RING; k += 1) {
      const next = (k + 1) % RING;
      const s = segment(k);
      const part: Part =
        s <= 1 ? "trim" : s === 4 ? (front ? "lamp" : "tail") : "paint";
      const a = first + k;
      const b = first + next;
      const c = inner + next;
      const d = inner + k;
      if (front) {
        groups[part].push(a, c, b, a, d, c);
        groups.paint.push(centre, inner + next, inner + k);
      } else {
        groups[part].push(a, b, c, a, c, d);
        groups.paint.push(centre, inner + k, inner + next);
      }
    }
  };
  cap(0, false);
  cap(STATIONS, true);
  return { positions, groups };
}

function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

let alloy: THREE.CanvasTexture | null = null;

/** The face of an alloy wheel, drawn once. */
function alloyTexture(): THREE.CanvasTexture {
  alloy ??= canvasTexture(128, 128, (x) => {
    x.fillStyle = "#0c0c0e";
    x.fillRect(0, 0, 128, 128);
    x.translate(64, 64);
    x.fillStyle = "#c9cdd3";
    x.beginPath();
    x.arc(0, 0, 60, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "#0e0e11";
    for (let i = 0; i < 5; i += 1) {
      x.save();
      x.rotate((i / 5) * Math.PI * 2);
      x.beginPath();
      x.moveTo(-13, -50);
      x.quadraticCurveTo(0, -60, 13, -50);
      x.lineTo(6, -20);
      x.lineTo(-6, -20);
      x.closePath();
      x.fill();
      x.restore();
    }
    x.strokeStyle = "#8d9299";
    x.lineWidth = 4;
    x.beginPath();
    x.arc(0, 0, 58, 0, Math.PI * 2);
    x.stroke();
    x.fillStyle = "#e3e6ea";
    x.beginPath();
    x.arc(0, 0, 13, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "#70757c";
    x.beginPath();
    x.arc(0, 0, 5, 0, Math.PI * 2);
    x.fill();
    // A valve by one spoke. Five matching spokes can look as if they are
    // turning backwards at speed; one odd mark keeps the wheel reading forward.
    x.fillStyle = "#15161a";
    x.beginPath();
    x.arc(0, -49, 4.5, 0, Math.PI * 2);
    x.fill();
  });
  return alloy;
}

function plateTexture(text: string, background: string): THREE.CanvasTexture {
  return canvasTexture(256, 64, (x) => {
    x.fillStyle = background;
    x.fillRect(0, 0, 256, 64);
    x.strokeStyle = "#111";
    x.lineWidth = 4;
    x.strokeRect(3, 3, 250, 58);
    x.fillStyle = "#111";
    x.font = "bold 44px Arial, sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(text, 128, 34);
  });
}

export type CarModel = THREE.Group & {
  userData: {
    /** The tail lamps, so the scene can light them when the car brakes. */
    tail: THREE.MeshStandardMaterial;
    /** All four wheels. Turn each about its `x` to roll it. */
    wheels: THREE.Group[];
    /** The front pair. Turn each about its `y` to steer it. */
    steering: THREE.Group[];
    /** The wheels' radius in metres, when it is not `WHEEL_RADIUS`. */
    wheelRadius?: number;
  };
};

/** How far a wheel rolls for each radian it turns, in metres. */
export const WHEEL_RADIUS = 0.32;

export function buildCar({ paint, plate, simple = false }: CarOptions) {
  body ??= buildBody();
  const base = new THREE.BufferGeometry();
  base.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(body.positions, 3),
  );
  base.setIndex(PARTS.flatMap((part) => body!.groups[part]));
  base.computeVertexNormals();
  const normals = base.getAttribute("normal");

  const lacquer = (
    color: number,
    roughness: number,
    extra: THREE.MeshStandardMaterialParameters = {},
  ): THREE.MeshStandardMaterial =>
    simple
      ? new THREE.MeshStandardMaterial({ color, roughness, ...extra })
      : new THREE.MeshPhysicalMaterial({
          color,
          roughness,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          ...extra,
        });

  const materials = {
    paint: lacquer(paint, 0.3, { metalness: 0.1, envMapIntensity: 0.7 }),
    glass: lacquer(0x070b10, 0.05, { metalness: 0.2, envMapIntensity: 0.95 }),
    trim: new THREE.MeshStandardMaterial({
      color: 0x15161a,
      roughness: 0.6,
      metalness: 0.2,
      envMapIntensity: 0.5,
    }),
    lamp: lacquer(0xf6f3ea, 0.08, {
      emissive: 0xfff1cc,
      emissiveIntensity: 0.35,
      envMapIntensity: 1.4,
    }),
    tail: lacquer(0xa30f12, 0.12, {
      emissive: 0x700000,
      emissiveIntensity: 0.5,
      envMapIntensity: 1.2,
    }),
  } satisfies Record<Part, THREE.Material>;
  const tyreMaterial = new THREE.MeshStandardMaterial({
    color: 0x111113,
    roughness: 0.9,
  });
  const chrome = new THREE.MeshStandardMaterial({
    color: 0xd4d7dc,
    metalness: 0.9,
    roughness: 0.22,
    envMapIntensity: 1.3,
  });
  const dark = new THREE.MeshBasicMaterial({ color: 0x08080a });

  const car = new THREE.Group();
  for (const part of PARTS) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", base.getAttribute("position"));
    geometry.setAttribute("normal", normals);
    geometry.setIndex(body.groups[part]);
    const mesh = new THREE.Mesh(geometry, materials[part]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    car.add(mesh);
  }

  const add = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    turn: [number, number, number] | null = null,
    shadow = false,
  ) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (turn) mesh.rotation.set(turn[0], turn[1], turn[2]);
    mesh.castShadow = shadow;
    car.add(mesh);
  };

  // Wheels: a dark well in the body side and an arch lip in body colour, both
  // fixed to the body, and a tyre with an alloy face that turns on its axle.
  // The front pair also turns with the steering.
  const rim = new THREE.MeshStandardMaterial({
    map: alloyTexture(),
    metalness: 0.7,
    roughness: 0.3,
  });
  const radius = WHEEL_RADIUS;
  const wheels: THREE.Group[] = [];
  const steering: THREE.Group[] = [];
  const tyre = new THREE.CylinderGeometry(radius, radius, 0.225, 28);
  tyre.rotateZ(Math.PI / 2);
  const face = new THREE.CircleGeometry(0.215, 24);
  const lip = new THREE.TorusGeometry(
    radius + 0.058,
    0.017,
    6,
    24,
    Math.PI * 1.16,
  );
  lip.rotateZ(-Math.PI * 0.08);
  // The widest the body gets, so the arch stands clear of it all the way round.
  const wide = 0.885;
  // The nose points down -z, so the second axle is the front one.
  const axles: [number, number, boolean][] = [
    [1.24, 0.5 - 1.24 / LENGTH, false],
    [-1.37, 0.5 + 1.37 / LENGTH, true],
  ];
  for (const [z, t, front] of axles) {
    for (const side of [-1, 1]) {
      const lift = Math.asin((floor(t) - radius) / (radius + 0.05));
      const well = new THREE.CircleGeometry(
        radius + 0.05,
        26,
        lift,
        Math.PI - 2 * lift,
      );
      const outward: [number, number, number] = [0, (side * Math.PI) / 2, 0];
      add(well, dark, side * (wide + 0.004), radius, z, outward);
      add(lip, materials.paint, side * (wide + 0.012), radius, z, outward);

      const hub = new THREE.Group();
      hub.position.set(side * (wide - 0.105), radius, z);
      const wheel = new THREE.Group();
      const rubber = new THREE.Mesh(tyre, tyreMaterial);
      rubber.castShadow = true;
      const alloyFace = new THREE.Mesh(face, rim);
      alloyFace.position.x = side * 0.114;
      alloyFace.rotation.y = (side * Math.PI) / 2;
      wheel.add(rubber, alloyFace);
      hub.add(wheel);
      car.add(hub);
      wheels.push(wheel);
      if (front) steering.push(hub);
    }
  }

  // The grille and a lower air intake, dark, with a chrome strip across.
  const nose = -LENGTH / 2 - 0.035;
  const tail = LENGTH / 2 + 0.035;
  add(new THREE.BoxGeometry(0.56, 0.085, 0.03), materials.trim, 0, 0.64, nose);
  add(
    new THREE.BoxGeometry(0.74, 0.07, 0.03),
    materials.trim,
    0,
    0.4,
    nose + 0.012,
  );
  add(new THREE.BoxGeometry(0.6, 0.02, 0.02), chrome, 0, 0.69, nose - 0.02);
  add(new THREE.BoxGeometry(0.7, 0.02, 0.02), chrome, 0, 0.7, tail + 0.012);

  // Kenyan plates: white in front, yellow behind.
  const plateShape = new THREE.PlaneGeometry(0.44, 0.11);
  add(
    plateShape,
    new THREE.MeshStandardMaterial({
      map: plateTexture(plate, "#f4f4f0"),
      roughness: 0.5,
    }),
    0,
    0.5,
    nose - 0.016,
    [0, Math.PI, 0],
  );
  add(
    plateShape,
    new THREE.MeshStandardMaterial({
      map: plateTexture(plate, "#f2c318"),
      roughness: 0.5,
    }),
    0,
    0.6,
    tail + 0.016,
  );

  // Mirrors, door handles, shut lines and a roof aerial.
  const mirror = new THREE.BoxGeometry(0.085, 0.065, 0.13);
  const handle = new THREE.BoxGeometry(0.02, 0.028, 0.13);
  const shutLine = new THREE.BoxGeometry(0.006, 0.56, 0.012);
  for (const side of [-1, 1]) {
    add(
      mirror,
      materials.paint,
      side * (halfWidth(0.655) + 0.03),
      deck(0.655) + 0.03,
      zAt(0.655),
      [0, side * 0.35, 0],
      true,
    );
    for (const t of [0.345, 0.555]) {
      add(
        handle,
        chrome,
        side * (halfWidth(t) + 0.002),
        deck(t) - 0.13,
        zAt(t),
      );
    }
    for (const t of [0.213, 0.4125, 0.638]) {
      add(
        shutLine,
        dark,
        side * (halfWidth(t) + 0.002),
        floor(t) + 0.4,
        zAt(t),
      );
    }
  }
  add(
    new THREE.ConeGeometry(0.035, 0.11, 8),
    materials.trim,
    0,
    roof(0.31) + 0.05,
    zAt(0.31),
    [-0.5, 0, 0],
  );

  car.userData.tail = materials.tail;
  car.userData.wheels = wheels;
  car.userData.steering = steering;
  return car as CarModel;
}
