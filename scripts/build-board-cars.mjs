/**
 * Builds the Model Town Board's cars from the "LowPoly_Cars_01" pack.
 *
 * The pack is one 20 MB OBJ holding every vehicle, coloured from a palette
 * image. This cuts three cars out of it and writes each as a small GLB in
 * public/assets/board/cars, in the board's car frame: metres, nose down -z,
 * wheels standing on y = 0, origin at the middle of the body.
 *
 * Each GLB holds these nodes:
 *   body      everything that keeps its pack colour (vertex colours)
 *   paint     the bodywork, left white so the board can tint it
 *   tail      the rear lamps, so the board can make them glow
 *   wheel_fl, wheel_fr, wheel_rl, wheel_rr   each centred on its axle
 *
 * The pack itself is not in the repository (see docs/asset-rights.md).
 *
 * Run:  node scripts/build-board-cars.mjs <pack.obj> <palette.jpg>
 */
import { mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { Document, NodeIO } from "@gltf-transform/core";
import {
  EXTMeshoptCompression,
  KHRMeshQuantization,
} from "@gltf-transform/extensions";
import { meshopt, quantize } from "@gltf-transform/functions";
import jpeg from "jpeg-js";
import { MeshoptEncoder } from "meshoptimizer";

const [objPath, palettePath] = process.argv.slice(2);
if (!objPath || !palettePath) {
  console.error(
    "Usage: node scripts/build-board-cars.mjs <pack.obj> <palette.jpg>",
  );
  process.exit(1);
}

const OUT = path.join(process.cwd(), "public", "assets", "board", "cars");

/** The footprint every car is scaled to fit, so the driving rules stay put. */
const FIT = { length: 4.3, width: 1.85 };

/** Objects in the pack are named "<Something>_Mesh.<number>". */
const range = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const CARS = [
  { id: "saloon", objects: [175] },
  { id: "suv", objects: range(185, 197) },
  { id: "pickup", objects: range(198, 211) },
];

// ---- read the pack ----------------------------------------------------------

function readObj(file) {
  const positions = [];
  const uvs = [];
  /** object number -> faces, each a list of [position index, uv index] */
  const objects = new Map();
  let faces = null;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (line.startsWith("v ")) {
      const p = line.split(/\s+/);
      positions.push([+p[1], +p[2], +p[3]]);
    } else if (line.startsWith("vt ")) {
      const p = line.split(/\s+/);
      uvs.push([+p[1], +p[2]]);
    } else if (line.startsWith("o ")) {
      const number = Number(/\.(\d+)\s*$/.exec(line)?.[1] ?? 0);
      faces = [];
      objects.set(number, faces);
    } else if (line.startsWith("f ")) {
      faces.push(
        line
          .trim()
          .split(/\s+/)
          .slice(1)
          .map((corner) => {
            const [v, t] = corner.split("/");
            return [Number(v) - 1, Number(t) - 1];
          }),
      );
    }
  }
  return { positions, uvs, objects };
}

function readPalette(file) {
  const { width, height, data } = jpeg.decode(readFileSync(file), {
    useTArray: true,
  });
  return (u, v) => {
    const x = Math.min(width - 1, Math.floor((((u % 1) + 1) % 1) * width));
    const y = Math.min(
      height - 1,
      Math.floor((1 - (((v % 1) + 1) % 1)) * height),
    );
    const at = (y * width + x) * 4;
    return [data[at], data[at + 1], data[at + 2]];
  };
}

const toLinear = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

// ---- geometry helpers -------------------------------------------------------

function boxOf(points) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of points) {
    for (let k = 0; k < 3; k++) {
      if (p[k] < min[k]) min[k] = p[k];
      if (p[k] > max[k]) max[k] = p[k];
    }
  }
  return { min, max, size: max.map((m, k) => m - min[k]) };
}

const inside = (inner, outer, slack) =>
  [0, 1, 2].every(
    (k) =>
      inner.min[k] >= outer.min[k] - slack &&
      inner.max[k] <= outer.max[k] + slack,
  );

function area(a, b, c) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  return (
    Math.hypot(
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ) / 2
  );
}

/** Splits triangles into pieces that do not touch each other. */
function islands(tris) {
  const parent = new Map();
  const find = (a) => {
    while (parent.get(a) !== a) {
      parent.set(a, parent.get(parent.get(a)));
      a = parent.get(a);
    }
    return a;
  };
  const key = (p) => p.map((c) => c.toFixed(4)).join(",");
  for (const tri of tris) {
    tri.keys = tri.points.map(key);
    for (const k of tri.keys) if (!parent.has(k)) parent.set(k, k);
    const a = find(tri.keys[0]);
    for (const k of tri.keys.slice(1)) {
      const b = find(k);
      if (a !== b) parent.set(b, a);
    }
  }
  const groups = new Map();
  for (const tri of tris) {
    const root = find(tri.keys[0]);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(tri);
  }
  return [...groups.values()].map((list) => ({
    tris: list,
    box: boxOf(list.flatMap((t) => t.points)),
  }));
}

// ---- build one car ----------------------------------------------------------

function buildCar(pack, colourAt, car) {
  // Every face as triangles, with one flat colour each.
  const tris = [];
  for (const number of car.objects) {
    const faces = pack.objects.get(number);
    if (!faces) throw new Error(`${car.id}: no object .${number} in the pack`);
    for (const face of faces) {
      const u = face.reduce((s, [, t]) => s + pack.uvs[t][0], 0) / face.length;
      const v = face.reduce((s, [, t]) => s + pack.uvs[t][1], 0) / face.length;
      const rgb = colourAt(u, v);
      const points = face.map(([p]) => pack.positions[p]);
      for (let k = 1; k < points.length - 1; k++) {
        tris.push({ points: [points[0], points[k], points[k + 1]], rgb });
      }
    }
  }

  const whole = boxOf(tris.flatMap((t) => t.points));
  const ground = whole.min[1];

  // Wheels: a tyre is round from the side, thin, and stands on the ground.
  const parts = islands(tris);
  const tyres = parts.filter(({ box, tris: list }) => {
    const [w, h, d] = box.size;
    return (
      list.length > 60 &&
      h > 0.5 &&
      h < 1.2 &&
      Math.abs(h - d) < 0.1 &&
      w < 0.6 &&
      box.min[1] - ground < 0.12
    );
  });
  if (tyres.length !== 4) {
    throw new Error(`${car.id}: found ${tyres.length} tyres, expected 4`);
  }
  for (const part of parts) {
    part.wheel = tyres.find((tyre) => inside(part.box, tyre.box, 0.03));
  }

  // The pack's cars face +z. Turn them to face -z, centre them, sit them on
  // the ground, and scale them to the board's footprint.
  const centre = [
    (whole.min[0] + whole.max[0]) / 2,
    ground,
    (whole.min[2] + whole.max[2]) / 2,
  ];
  const scale = Math.min(FIT.length / whole.size[2], FIT.width / whole.size[0]);
  const place = (p) => [
    -(p[0] - centre[0]) * scale,
    (p[1] - centre[1]) * scale,
    -(p[2] - centre[2]) * scale,
  ];

  // Paint: the colour covering the most bodywork.
  const bodyTris = parts.filter((p) => !p.wheel).flatMap((p) => p.tris);
  const byColour = new Map();
  for (const tri of bodyTris) {
    const k = tri.rgb.join(",");
    byColour.set(k, (byColour.get(k) ?? 0) + area(...tri.points));
  }
  const ranked = [...byColour.entries()].sort((a, b) => b[1] - a[1]);
  const paint = car.paint ?? ranked[0][0];

  // Tail lamps: red or amber faces at the back (the back is the low-z end in the pack).
  const rearEdge = whole.min[2] + whole.size[2] * 0.12;
  const isTail = (tri) => {
    const [r, g, b] = tri.rgb;
    const z = (tri.points[0][2] + tri.points[1][2] + tri.points[2][2]) / 3;
    return r > 150 && b < 90 && r - g > 50 && z < rearEdge;
  };

  const groups = { body: [], paint: [], tail: [] };
  for (const tri of bodyTris) {
    if (isTail(tri)) groups.tail.push(tri);
    else if (tri.rgb.join(",") === paint) groups.paint.push(tri);
    else groups.body.push(tri);
  }

  // ---- write the document ----
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(car.id);
  const root = doc.createNode(car.id);
  scene.addChild(root);

  const material = (name, colour) =>
    doc
      .createMaterial(name)
      .setBaseColorFactor([...colour, 1])
      .setRoughnessFactor(0.6)
      .setMetallicFactor(0);
  const materials = {
    body: material("body", [1, 1, 1]),
    paint: material("paint", [1, 1, 1]),
    tail: material("tail", [0.7, 0.02, 0.02]),
  };

  /**
   * One node from a list of triangles. Corners that share a place and a
   * colour share a vertex, and there are no normals: the loader then shades
   * every face flat, which is the look of the pack.
   */
  function addNode(name, list, mat, { coloured, origin = [0, 0, 0] }) {
    const index = new Map();
    const position = [];
    const colour = [];
    const indices = [];
    for (const tri of list) {
      for (const point of tri.points) {
        const p = place(point).map((c, k) => c - origin[k]);
        const k = `${p.map((c) => c.toFixed(4)).join(",")}|${coloured ? tri.rgb.join(",") : ""}`;
        let at = index.get(k);
        if (at === undefined) {
          at = position.length / 3;
          index.set(k, at);
          position.push(...p);
          if (coloured) colour.push(...tri.rgb.map(toLinear));
        }
        indices.push(at);
      }
    }
    const prim = doc
      .createPrimitive()
      .setMaterial(mat)
      .setIndices(
        doc
          .createAccessor()
          .setType("SCALAR")
          .setArray(new Uint32Array(indices))
          .setBuffer(buffer),
      )
      .setAttribute(
        "POSITION",
        doc
          .createAccessor()
          .setType("VEC3")
          .setArray(new Float32Array(position))
          .setBuffer(buffer),
      );
    if (coloured) {
      prim.setAttribute(
        "COLOR_0",
        doc
          .createAccessor()
          .setType("VEC3")
          .setArray(new Float32Array(colour))
          .setBuffer(buffer),
      );
    }
    const node = doc
      .createNode(name)
      .setMesh(doc.createMesh(name).addPrimitive(prim))
      .setTranslation(origin);
    root.addChild(node);
    return list.length;
  }

  const counts = {};
  counts.body = addNode("body", groups.body, materials.body, {
    coloured: true,
  });
  counts.paint = addNode("paint", groups.paint, materials.paint, {
    coloured: false,
  });
  if (groups.tail.length) {
    counts.tail = addNode("tail", groups.tail, materials.tail, {
      coloured: false,
    });
  }

  let radius = 0;
  for (const tyre of tyres) {
    const a = place(tyre.box.min);
    const b = place(tyre.box.max);
    const origin = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const name = `wheel_${origin[2] < 0 ? "f" : "r"}${origin[0] < 0 ? "l" : "r"}`;
    const list = parts.filter((p) => p.wheel === tyre).flatMap((p) => p.tris);
    counts[name] = addNode(name, list, materials.body, {
      coloured: true,
      origin,
    });
    radius = Math.abs(b[1] - a[1]) / 2;
  }
  if (Object.keys(counts).filter((n) => n.startsWith("wheel_")).length !== 4) {
    throw new Error(`${car.id}: the four wheels did not land on four corners`);
  }
  root.setExtras({ wheelRadius: Number(radius.toFixed(3)) });

  return {
    doc,
    report: {
      scale: scale.toFixed(3),
      size: whole.size.map((s) => (s * scale).toFixed(2)).join(" x "),
      wheelRadius: radius.toFixed(3),
      paint,
      colours: ranked
        .slice(0, 4)
        .map(([c, a]) => `${c} (${a.toFixed(1)})`)
        .join("; "),
      tris: counts,
    },
  };
}

// ---- main -------------------------------------------------------------------

const pack = readObj(objPath);
const colourAt = readPalette(palettePath);
mkdirSync(OUT, { recursive: true });

await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });

for (const car of CARS) {
  const { doc, report } = buildCar(pack, colourAt, car);
  await doc.transform(
    quantize({ quantizePosition: 14, quantizeColor: 8 }),
    meshopt({ encoder: MeshoptEncoder, level: "high" }),
  );
  const file = path.join(OUT, `${car.id}.glb`);
  await io.write(file, doc);
  console.log(car.id, `${(statSync(file).size / 1024).toFixed(0)} KB`, report);
  if (!report.tris.tail) console.warn(`  ${car.id}: no tail lamps found`);
}
