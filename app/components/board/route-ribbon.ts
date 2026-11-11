/**
 * A route painted on the table: a flat strip lying just above the paint, with
 * chevrons along it pointing the way. Only `board-table.tsx` imports this, so
 * three.js still loads with the table and not before.
 */
import * as THREE from "three";

import type { StageLine } from "~/lib/board/stage";

/** How far apart the chevrons are, in metres. */
const CHEVRON_EVERY = 3.4;
/** Above the board's paint, below the cars. */
const HEIGHT = 0.07;

/** One chevron on a paler ground. The strip's colour tints both. */
export function chevronTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#cfcfcf";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(18, 12);
    ctx.lineTo(42, 32);
    ctx.lineTo(18, 52);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  return texture;
}

export function buildRibbon(line: StageLine, map: THREE.Texture): THREE.Mesh {
  const half = (line.width ?? 2) / 2;
  const count = line.points.length;
  const positions = new Float32Array(count * 6);
  const uvs = new Float32Array(count * 4);
  const indices: number[] = [];
  let along = 0;
  for (let i = 0; i < count; i += 1) {
    const p = line.points[i];
    const before = line.points[Math.max(0, i - 1)];
    const after = line.points[Math.min(count - 1, i + 1)];
    if (i > 0) along += Math.hypot(p.x - before.x, p.z - before.z);
    const tx = after.x - before.x;
    const tz = after.z - before.z;
    const length = Math.hypot(tx, tz) || 1;
    // to the left of the way the line runs
    const nx = tz / length;
    const nz = -tx / length;
    positions.set(
      [
        p.x + nx * half,
        HEIGHT,
        p.z + nz * half,
        p.x - nx * half,
        HEIGHT,
        p.z - nz * half,
      ],
      i * 6,
    );
    uvs.set([along / CHEVRON_EVERY, 0, along / CHEVRON_EVERY, 1], i * 4);
    if (i < count - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const material = new THREE.MeshBasicMaterial({
    map,
    color: line.color,
    transparent: true,
    opacity: line.opacity ?? 0.95,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 2;
  return mesh;
}

/** Free a ribbon's own geometry and material. The chevrons are shared. */
export function disposeRibbons(group: THREE.Group): void {
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    (child.material as THREE.Material).dispose();
  });
}
