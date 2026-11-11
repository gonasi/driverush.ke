/**
 * A board car made from one of the downloaded models (`~/lib/board/cars`).
 *
 * It hands back the same thing `buildCar` does: a group with its nose down -z
 * and its wheels on y = 0, whose `userData` holds the tail lamps to light, the
 * wheels to roll and the front hubs to steer. The scene drives either kind the
 * same way.
 *
 * The model's shapes are shared by every car made from it; each car gets its
 * own materials, so each has its own paint and its own brake lamps.
 */
import * as THREE from "three";

import type { CarModel } from "~/components/board/car-model";

export type GlbCarOptions = {
  paint: number;
  /** Plain materials, for phones that struggle. */
  simple?: boolean;
};

/** Geometry marked this way belongs to the loader's cache: never dispose it. */
export const SHARED = "sharedGeometry";

export function carFromGltf(
  source: THREE.Object3D,
  { paint, simple = false }: GlbCarOptions,
): CarModel {
  const car = new THREE.Group();
  const copy = source.clone(true);
  car.add(copy);

  const body = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.62,
    metalness: 0.05,
    envMapIntensity: 0.6,
  });
  const paintwork = simple
    ? new THREE.MeshStandardMaterial({
        color: paint,
        flatShading: true,
        roughness: 0.45,
      })
    : new THREE.MeshPhysicalMaterial({
        color: paint,
        flatShading: true,
        roughness: 0.38,
        metalness: 0.1,
        clearcoat: 0.7,
        clearcoatRoughness: 0.18,
        envMapIntensity: 0.7,
      });
  const tail = new THREE.MeshStandardMaterial({
    color: 0xa30f12,
    emissive: 0x900000,
    emissiveIntensity: 0.5,
    flatShading: true,
    roughness: 0.3,
  });

  let wheelRadius = 0.32;
  const wheelMeshes: THREE.Mesh[] = [];
  copy.traverse((node) => {
    const radius = node.userData.wheelRadius;
    if (typeof radius === "number") wheelRadius = radius;
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.userData[SHARED] = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.material =
      mesh.name === "paint" ? paintwork : mesh.name === "tail" ? tail : body;
    if (mesh.name.startsWith("wheel_")) wheelMeshes.push(mesh);
  });

  // Each wheel goes inside a hub that stays on the axle: the hub turns to
  // steer, the group inside it turns to roll.
  const wheels: THREE.Group[] = [];
  const steering: THREE.Group[] = [];
  for (const mesh of wheelMeshes) {
    const parent = mesh.parent!;
    const hub = new THREE.Group();
    hub.position.copy(mesh.position);
    const spin = new THREE.Group();
    mesh.position.set(0, 0, 0);
    hub.add(spin);
    spin.add(mesh);
    parent.add(hub);
    wheels.push(spin);
    if (mesh.name.startsWith("wheel_f")) steering.push(hub);
  }

  car.userData = { tail, wheels, steering, wheelRadius };
  return car as CarModel;
}
