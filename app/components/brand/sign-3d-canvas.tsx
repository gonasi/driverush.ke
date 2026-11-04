/**
 * The actual react-three-fiber scene for one road-sign GLB. This module pulls in
 * `three` + `@react-three/drei`, so it is **only ever loaded via `React.lazy`**
 * from `sign-3d-viewer.tsx` (client, after mount) — never on the server, and
 * never in the main bundle. Keep all heavy 3D imports in here.
 *
 * The GLBs are full roadside signs (panel on a ~5-unit post), so the camera
 * frames the panel close with a sliver of post showing below. Their materials are
 * flat colours, so the sign look is built here: faces become retroreflective
 * sheeting (see `sheetingMaterial`) under an in-engine sky (`ReflectedSky`, no
 * external HDRI fetch) whose soft glare drifts across the gloss as the sign turns,
 * plus a soft contact shadow to ground it.
 */
import * as React from "react";
import { Canvas, useThree, type ThreeElements } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  GradientTexture,
  OrbitControls,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";

import { SIGN_BRAND } from "~/lib/sign-credits";
import { useActiveTheme } from "~/lib/theme";

const DEG = Math.PI / 180;

export type Sign3DCanvasProps = {
  modelSrc: string;
  /** Initial Y-axis rotation of the model, degrees. */
  yaw?: number;
  /** Initial X-axis tilt of the model, degrees. */
  pitch?: number;
  /** Dolly multiplier on the auto-fit distance (1 = default, <1 = closer). */
  zoom?: number;
  /** Gentle turntable rotation. */
  autoRotate?: boolean;
  /** Allow drag-to-orbit + scroll-zoom. */
  interactive?: boolean;
  /** Told each time a model has actually reached the scene. */
  onModelReady?: (modelSrc: string) => void;
};

/**
 * Real road-sign colours. The GLBs ship a brick orange (#c24825), a washed-out
 * periwinkle (#607cf3, #6284e4), a dull amber and a neon green, so they're corrected
 * at load rather than re-exporting 83 models. Red and blue start from RAL 3020 and
 * RAL 5017, a touch brighter so they hold up on a screen. White comes down from the
 * GLBs' pure 1.0: no real surface is that white, and at full strength it has no room
 * left to read as a lit surface, which is what makes a render look overexposed.
 */
const SIGN_RED = new THREE.Color("#cc0f1c");
const SIGN_BLUE = new THREE.Color("#005cab");
const SIGN_WHITE = new THREE.Color("#eaeae8");
const SIGN_AMBER = new THREE.Color("#eb9c00");
const SIGN_GREEN = new THREE.Color("#009a44");
function trueSignColor(c: THREE.Color): THREE.Color {
  if (c.r > 0.9 && c.g > 0.9 && c.b > 0.9) return SIGN_WHITE;
  if (c.r > 0.45 && c.g < 0.1 && c.b < 0.05) return SIGN_RED;
  if (c.b > 0.6 && c.r < 0.2 && c.g < 0.3) return SIGN_BLUE;
  if (c.r > 0.6 && c.g > 0.2 && c.g < 0.35 && c.b < 0.1) return SIGN_AMBER;
  if (c.g > 0.7 && c.r < 0.5 && c.b < 0.3) return SIGN_GREEN;
  return c;
}

/** The little Pelican sticker on the post. W_9 exports it under sign materials, so
 *  that one is caught by what it is: a tiny flat decal sitting on the post. */
function isSticker(mesh: THREE.Mesh): boolean {
  if (/Pelican|Dark_Blue|pasted__/.test((mesh.material as THREE.Material).name)) {
    return true;
  }
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const { min, max } = mesh.geometry.boundingBox!;
  return (
    max.z < POST_FRONT_Z &&
    max.z - min.z < 0.01 &&
    max.x - min.x < 0.4 &&
    max.y - min.y < 0.2
  );
}

/** Vinyl doesn't retroreflect, so at night the logo would vanish into the dark post.
 *  This stands in for headlights catching it. */
const LOGO_NIGHT_GLOW = 0.75;

/** Every post is an octagon of this radius with a corner facing forward. */
const POST_RADIUS = 0.1;

/**
 * The GLBs model the sticker as a flat plate wider than the post, so it floats off
 * the sides and shows as a blue tab from behind. This replaces it with the real logo
 * wrapped around the post's front facets, the way a vinyl sticker sits on a pole.
 * Local origin is the post's centre, at the sticker's height.
 */
const STICKER_GEOMETRY = (() => {
  const facet = 2 * POST_RADIUS * Math.sin(Math.PI / 8);
  const arcLength = 0.18;
  // Slid toward the resting camera, which sits to the sign's right, so the start of
  // the name doesn't wrap out of sight.
  const arcStart = -0.078;
  const arcEnd = arcStart + arcLength;
  const height = (arcLength * SIGN_BRAND.logoHeight) / SIGN_BRAND.logoWidth;
  const lift = 0.0015;
  // Where a distance along the wrap lands on the octagon.
  const corner = (k: number) => {
    const angle = (k * Math.PI) / 4;
    return [POST_RADIUS * Math.sin(angle), POST_RADIUS * Math.cos(angle)];
  };
  const onPost = (arc: number) => {
    const k = Math.min(Math.floor(Math.abs(arc) / facet), 1);
    const t = (Math.abs(arc) - k * facet) / facet;
    const [x0, z0] = corner(k);
    const [x1, z1] = corner(k + 1);
    return [Math.sign(arc) * (x0 + (x1 - x0) * t), z0 + (z1 - z0) * t];
  };
  const stops = [arcStart, -facet, 0, facet, arcEnd];
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, b] = [stops[i], stops[i + 1]];
    const [ax, az] = onPost(a);
    const [bx, bz] = onPost(b);
    const len = Math.hypot(bx - ax, bz - az);
    const nx = (az - bz) / len;
    const nz = (bx - ax) / len;
    const base = positions.length / 3;
    for (const [x, z, arc] of [
      [ax, az, a],
      [bx, bz, b],
    ]) {
      for (const y of [-height / 2, height / 2]) {
        positions.push(x + nx * lift, y, z + nz * lift);
        normals.push(nx, 0, nz);
        uvs.push((arc - arcStart) / arcLength, y > 0 ? 1 : 0);
      }
    }
    indices.push(base, base + 2, base + 3, base, base + 3, base + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
})();

/** The GLBs fuse the old sticker's white "SIGNS" lettering into the plate mesh (on W_9,
 *  its outline too, into the post), where it glows as sheeting at night. Nothing else
 *  in any model sits wholly in this spot, so cut it by place, in a copy so the shared
 *  GLB stays intact. */
function cutOldStickerLettering(mesh: THREE.Mesh, sticker: THREE.Box3) {
  const { geometry } = mesh;
  const index = geometry.index;
  if (!index) return;
  const position = geometry.getAttribute("position");
  const area = sticker.clone().expandByScalar(0.03);
  const point = new THREE.Vector3();
  const onSticker = (i: number) => {
    point.fromBufferAttribute(position, i);
    return area.containsPoint(point) && point.z > POST_RADIUS + 0.0005;
  };
  const kept: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const [a, b, c] = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    if (!(onSticker(a) && onSticker(b) && onSticker(c))) kept.push(a, b, c);
  }
  if (kept.length === index.count) return;
  mesh.geometry = geometry.clone();
  mesh.geometry.setIndex(kept);
}

/** Find the post from its foot: nothing else on a sign reaches the ground. */
function postCenter(root: THREE.Object3D) {
  const foot = new THREE.Box2();
  const point = new THREE.Vector2();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const position = mesh.geometry.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      if (position.getY(i) < 0.1) {
        foot.expandByPoint(point.set(position.getX(i), position.getZ(i)));
      }
    }
  });
  return foot.getCenter(new THREE.Vector2());
}

/** The steel clamps that hold a plate to its post, seen from behind. They run from
 *  behind the post up to the plate's back, so nothing shows from the front. */
const CLAMP_GEOMETRY = new THREE.BoxGeometry(0.3, 0.075, 0.21);
const CLAMP_MATERIAL = new THREE.MeshStandardMaterial({
  color: "#8b8f94",
  metalness: 0.85,
  roughness: 0.42,
});
function addPostClamps(
  root: THREE.Object3D,
  post: THREE.Vector2,
  plateBottom: number,
  plateTop: number,
) {
  const height = plateTop - plateBottom;
  for (const y of [plateBottom + height * 0.3, plateBottom + height * 0.75]) {
    const clamp = new THREE.Mesh(CLAMP_GEOMETRY, CLAMP_MATERIAL);
    // The post stops just above 5 units, so a clamp can't sit higher than that.
    clamp.position.set(post.x, Math.min(y, 4.9), post.y - 0.01);
    root.add(clamp);
  }
}

/** How hard the sheeting throws light back: a hint by day, the whole show at night. */
const RETRO_GAIN = { day: 0.09, night: 1.4 };

/** Front of the face on sign-on-post models. The post's radius stops just short
 *  of it, so the post doesn't glow along with the sheeting. */
const POST_FRONT_Z = 0.102;

/** Plates sit in front of the post from here on, so a surface past this that doesn't
 *  face forward is the back or edge of the plate. The post itself never qualifies. */
const PLATE_MIN_Z = 0.06;

/**
 * The part of the sheeting no stock material does: returning light to its source.
 * The camera is the headlight, so brightness follows how squarely the face looks
 * back at it, a broad glow and then a flash as the sign comes head-on. Up close the
 * sheeting shows its honeycomb of sealed cells, each catching the light a little
 * differently, so they twinkle as the sign turns. Cells fade out once they get too
 * small to draw cleanly. Multiplying by the base colour keeps black legend black,
 * as printed ink doesn't retroreflect.
 */
const SHEETING_GLSL = `
  // Bare metal where the sheeting isn't: the back and edges of the plate, and any
  // surface seen from behind. Real sign backs are unpainted aluminium.
  float signBare = (vSignNormal.z < 0.3 && vSignPos.z > uPlateMinZ)
    || dot(normalize(vNormal), normalize(vViewPosition)) < -0.02 ? 1.0 : 0.0;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.51, 0.52), signBare);
  metalnessFactor = mix(metalnessFactor, 0.7, signBare);
  roughnessFactor = mix(roughnessFactor, 0.48, signBare);

  float signFacing = saturate(dot(normal, normalize(vViewPosition)));
  float signRetro = 0.85 * pow(signFacing, 1.5) + 0.5 * pow(signFacing, 48.0);

  vec2 signGrid = vSignPos.xy / 0.024;
  const vec2 signHex = vec2(1.0, 1.7320508);
  vec2 signA = mod(signGrid, signHex) - signHex * 0.5;
  vec2 signB = mod(signGrid - signHex * 0.5, signHex) - signHex * 0.5;
  vec2 signLocal = dot(signA, signA) < dot(signB, signB) ? signA : signB;
  float signSeed = fract(sin(dot(signGrid - signLocal, vec2(127.1, 311.7))) * 43758.5453);
  float signAngle = signSeed * 6.2832;
  float signTwinkle = 0.5 + 0.5 * sin(signAngle * 3.0 + dot(normal.xy, vec2(cos(signAngle), sin(signAngle))) * 22.0);
  float signEdge = 0.5 - max(abs(signLocal.x), dot(abs(signLocal), normalize(signHex)));
  float signCell = mix(0.6, 1.0, smoothstep(0.0, 0.07, signEdge)) * (0.86 + 0.34 * signTwinkle);
  float signDetail = 1.0 - smoothstep(0.4, 0.8, fwidth(signGrid.x) + fwidth(signGrid.y));

  totalEmissiveRadiance += diffuseColor.rgb * uRetroGain * signRetro
    * mix(1.0, signCell, signDetail) * vSheeting * (1.0 - signBare);
`;

/**
 * Retroreflective sheeting: a satin colour layer under a glossy acrylic overlay
 * (the clearcoat carries the crisp reflections), plus {@link SHEETING_GLSL}.
 */
function sheetingMaterial(
  src: THREE.MeshStandardMaterial,
  retroGain: { value: number },
  hasPost: boolean,
): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    name: src.name,
    side: src.side,
    color: trueSignColor(src.color),
    metalness: 0,
    roughness: 0.5,
    specularIntensity: 0.35,
    clearcoat: 0.8,
    clearcoatRoughness: 0.14,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRetroGain = retroGain;
    // Bare panels have no post to leave out, so every surface counts.
    shader.uniforms.uFaceMinZ = { value: hasPost ? POST_FRONT_Z : -Infinity };
    shader.uniforms.uPlateMinZ = { value: hasPost ? PLATE_MIN_Z : -Infinity };
    shader.vertexShader =
      "uniform float uFaceMinZ;\nvarying float vSheeting;\nvarying vec3 vSignPos;\nvarying vec3 vSignNormal;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        // Sign faces all look down +Z, so this leaves out the back, edges and post.
        vSheeting = step(0.3, normal.z) * step(uFaceMinZ, position.z);
        vSignPos = position;
        vSignNormal = normal;`,
      );
    shader.fragmentShader =
      "uniform float uRetroGain;\nuniform float uPlateMinZ;\nvarying float vSheeting;\nvarying vec3 vSignPos;\nvarying vec3 vSignNormal;\n" +
      shader.fragmentShader
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>\n${SHEETING_GLSL}`,
        )
        .replace(
          "#include <lights_physical_fragment>",
          `#include <lights_physical_fragment>
          material.clearcoat *= 1.0 - signBare;`,
        );
  };
  mat.customProgramCacheKey = () => "road-sign-sheeting";
  return mat;
}

/** Load a GLB, clone it (so per-instance material changes don't poison the cache)
 *  and dress its faces in retroreflective sheeting. */
function SignModel({
  modelSrc,
  groupRef,
  night,
  yaw = 0,
  pitch = 0,
  onReady,
}: {
  modelSrc: string;
  groupRef: React.RefObject<THREE.Group | null>;
  night: boolean;
  yaw?: number;
  pitch?: number;
  onReady?: () => void;
}) {
  const { scene } = useGLTF(modelSrc);
  const logo = useTexture(SIGN_BRAND.logo);
  const invalidate = useThree((s) => s.invalidate);

  const stickerMaterial = React.useMemo(() => {
    logo.colorSpace = THREE.SRGBColorSpace;
    logo.anisotropy = 4;
    logo.needsUpdate = true;
    // Printed vinyl: satin, and no sheeting.
    return new THREE.MeshStandardMaterial({
      map: logo,
      emissiveMap: logo,
      emissive: 0xffffff,
      emissiveIntensity: 0,
      roughness: 0.6,
    });
  }, [logo]);

  // One uniform shared by the sign's materials, so a theme flip needs no rebuild.
  const [retroGain] = React.useState(() => ({
    value: night ? RETRO_GAIN.night : RETRO_GAIN.day,
  }));
  React.useEffect(() => {
    retroGain.value = night ? RETRO_GAIN.night : RETRO_GAIN.day;
    stickerMaterial.emissiveIntensity = night ? LOGO_NIGHT_GLOW : 0;
    invalidate();
  }, [night, retroGain, stickerMaterial, invalidate]);

  const model = React.useMemo(() => {
    const root = scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(root);
    // A handful of models are bare panels: no post, sticker or clamps.
    const hasPost = bounds.max.y - bounds.min.y > 3;
    const stickerParts: THREE.Mesh[] = [];
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (hasPost && isSticker(mesh)) {
        stickerParts.push(mesh);
      } else {
        mesh.material = sheetingMaterial(
          mesh.material as THREE.MeshStandardMaterial,
          retroGain,
          hasPost,
        );
      }
    });
    if (hasPost) {
      const post = postCenter(root);
      // The sticker sits just under the plate, so it marks where the plate starts.
      let plateBottom = bounds.max.y - 2;
      if (stickerParts.length) {
        const sticker = new THREE.Box3();
        for (const part of stickerParts) {
          sticker.union(part.geometry.boundingBox!);
          part.removeFromParent();
        }
        root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            cutOldStickerLettering(o as THREE.Mesh, sticker);
          }
        });
        plateBottom = sticker.max.y;
        const wrapped = new THREE.Mesh(STICKER_GEOMETRY, stickerMaterial);
        wrapped.position.set(post.x, sticker.getCenter(new THREE.Vector3()).y, post.y);
        root.add(wrapped);
      }
      addPostClamps(root, post, plateBottom, bounds.max.y);
    }
    return root;
  }, [scene, retroGain, stickerMaterial]);

  // The GLB resolves a commit (or more) after the camera rig mounts, so by then
  // FitCamera has already run against an empty group. Once the geometry is in
  // the scene graph, ping the parent so it re-frames against real bounds.
  React.useLayoutEffect(() => {
    onReady?.();
  }, [model, onReady]);

  // Rotation is applied here, declaratively, so the bounds FitCamera measures
  // already include the authored orientation.
  return (
    <group ref={groupRef} rotation={[pitch * DEG, yaw * DEG, 0]}>
      <primitive object={model} />
    </group>
  );
}

/** After the model mounts (and on resize / framing changes), frame the sign's
 *  panel: target the upper region for sign-on-post models so the panel reads
 *  large with a bit of post below; fit the whole thing for panel-only models. */
function FitCamera({
  groupRef,
  controlsRef,
  zoom = 1,
  recomputeKey,
  onFloor,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  controlsRef: React.RefObject<{
    target: THREE.Vector3;
    update: () => void;
  } | null>;
  zoom?: number;
  recomputeKey: string;
  onFloor: (y: number) => void;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  React.useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    const box = new THREE.Box3().setFromObject(g);
    if (box.isEmpty()) return;
    const sz = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const widest = Math.max(sz.x, sz.z) || sz.y;
    const tall = sz.y > 1.8 * widest;

    // Panel extent + where to aim. Aim a touch BELOW the panel centre so the
    // sign rides higher in the frame (more post / road leading down below it).
    const panel = tall ? widest : Math.max(sz.x, sz.y, sz.z);
    const baseTargetY = tall ? box.max.y - panel * 0.55 : center.y;
    const lift = panel * (tall ? 0.16 : 0.06);
    const target = new THREE.Vector3(center.x, baseTargetY - lift, center.z);

    // Fit so the panel fills the frame with margin; the spare room shows a
    // little post below. Pull back further on wider (desktop) viewports so the
    // sign isn't crowding the frame; keep it tighter on phones.
    const isWide = size.width >= 640;
    const fov = (camera.fov * Math.PI) / 180;
    const aspect = size.width / Math.max(1, size.height);
    const fit = panel * (isWide ? 1.92 : 1.55);
    const distH = fit / 2 / Math.tan(fov / 2);
    const distW = fit / 2 / (Math.tan(fov / 2) * aspect);
    const dist = Math.max(distH, distW) * zoom;

    // A driver's view: a little off to one side and looking up at the sign.
    const dir = new THREE.Vector3(0.34, -0.1, 1).normalize();
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.near = Math.max(0.01, dist / 100);
    camera.far = dist * 100;
    camera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.copy(target);
      controls.update();
    }
    onFloor(box.min.y);
    invalidate();
  }, [
    groupRef,
    controlsRef,
    camera,
    size.width,
    size.height,
    zoom,
    recomputeKey,
    onFloor,
    invalidate,
  ]);

  return null;
}

/** Soft bright patches of sky that drift across the gloss as the sign turns, in
 *  degrees: azimuth (0 = straight out of the face), elevation, half-width, half-height.
 *  None sits within about 25 of straight ahead: the resting camera's reflection lands
 *  there, and head-on is how a sign gets recognised, so that view keeps its true colour. */
const SKY_GLARE = [
  { az: 44, el: 14, w: 9, h: 18 },
  { az: -56, el: 12, w: 7, h: 16 },
  { az: 140, el: 14, w: 12, h: 18 },
  { az: -150, el: 12, w: 14, h: 18 },
];

const SKY = {
  day: {
    // Kept near neutral and well under 1: it fills the shadows, and a bluer or
    // brighter sky tints the whites and lays a milky veil over every colour.
    zenith: [0.26, 0.33, 0.52],
    horizon: [0.6, 0.6, 0.6],
    ground: [0.16, 0.145, 0.125],
    glare: 1.8,
  },
  night: {
    zenith: [0.003, 0.005, 0.012],
    horizon: [0.02, 0.03, 0.055],
    ground: [0.004, 0.004, 0.006],
    glare: 0.25,
  },
};

const SKY_VERTEX = `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT = `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  uniform float uGlare;
  varying vec3 vDir;

  float glarePatch(float az, float el, float atAz, float atEl, float w, float h) {
    float dAz = mod(az - atAz + 180.0, 360.0) - 180.0;
    float dEl = el - atEl;
    return exp(-(dAz * dAz) / (w * w) - (dEl * dEl) / (h * h));
  }

  void main() {
    vec3 d = normalize(vDir);
    vec3 color = d.y > 0.0
      ? mix(uHorizon, uZenith, pow(d.y, 0.55))
      : mix(uHorizon, uGround, smoothstep(0.0, 0.2, -d.y));
    float az = degrees(atan(d.x, d.z));
    float el = degrees(asin(d.y));
    ${SKY_GLARE.map(
      (g) =>
        `color += uGlare * glarePatch(az, el, ${g.az.toFixed(1)}, ${g.el.toFixed(1)}, ${g.w.toFixed(1)}, ${g.h.toFixed(1)});`,
    ).join("\n    ")}
    gl_FragColor = vec4(color, 1.0);
  }
`;

/** What the gloss reflects and most of the soft daylight on the sign: a dome of real
 *  sky over dark ground, so a sign picks up the gradient it would outdoors. */
function ReflectedSky({ night }: { night: boolean }) {
  const uniforms = React.useMemo(() => {
    const sky = night ? SKY.night : SKY.day;
    return {
      uZenith: { value: new THREE.Vector3(...(sky.zenith as [number, number, number])) },
      uHorizon: { value: new THREE.Vector3(...(sky.horizon as [number, number, number])) },
      uGround: { value: new THREE.Vector3(...(sky.ground as [number, number, number])) },
      uGlare: { value: sky.glare },
    };
  }, [night]);
  return (
    <mesh scale={100}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        key={night ? "night" : "day"}
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={SKY_VERTEX}
        fragmentShader={SKY_FRAGMENT}
      />
    </mesh>
  );
}

/** The sky you see behind a sign by day: a mid-tone blue, so white borders stand out
 *  from it rather than melting into a near-white backdrop. */
const BACKDROP_STOPS = [0, 1];
const BACKDROP_COLORS = ["#6ea6da", "#cfe2f0"];

function SceneContents({
  modelSrc,
  yaw = 0,
  pitch = 0,
  zoom = 1,
  autoRotate = false,
  interactive = true,
  onModelReady,
}: Sign3DCanvasProps) {
  const groupRef = React.useRef<THREE.Group | null>(null);
  const controlsRef = React.useRef<any>(null);
  const [floorY, setFloorY] = React.useState(0);
  // Bumped when the model's geometry lands, to force FitCamera to re-frame.
  const [fitTick, setFitTick] = React.useState(0);
  const handleReady = React.useCallback(() => {
    setFitTick((t) => t + 1);
    onModelReady?.(modelSrc);
  }, [modelSrc, onModelReady]);

  const theme = useActiveTheme();
  const night = theme === "dark";
  const invalidate = useThree((s) => s.invalidate);
  // Repaint when the day/night atmosphere flips (matters in demand mode).
  React.useEffect(() => {
    invalidate();
  }, [night, invalidate]);
  // Memoised because a new child makes <Environment> re-render its whole cube.
  const sky = React.useMemo(() => <ReflectedSky night={night} />, [night]);

  return (
    <>
      {night ? (
        <color attach="background" args={["#0a0e1a"]} />
      ) : (
        <GradientTexture
          attach="background"
          stops={BACKDROP_STOPS}
          colors={BACKDROP_COLORS}
          size={256}
          width={2}
        />
      )}

      {night ? (
        <>
          {/* Moonlit ambience: cool and low. The sheeting supplies the brightness. */}
          <hemisphereLight
            intensity={0.5}
            color="#2b3a5e"
            groundColor="#05070d"
          />
          {/* Cool moon rim from above for separation. */}
          <directionalLight
            position={[-4, 8, 1]}
            intensity={0.5}
            color="#9fb6ff"
          />
        </>
      ) : (
        /* Sun key, raking the face. The sky below supplies the soft fill. */
        <directionalLight
          position={[1.5, 4, 8]}
          intensity={2.2}
          color="#fffaf2"
        />
      )}

      <Environment resolution={128}>{sky}</Environment>

      <React.Suspense fallback={null}>
        <SignModel
          modelSrc={modelSrc}
          groupRef={groupRef}
          night={night}
          yaw={yaw}
          pitch={pitch}
          onReady={handleReady}
        />
      </React.Suspense>

      <ContactShadows
        position={[0, floorY - 0.01, 0]}
        opacity={night ? 0.3 : 0.45}
        scale={12}
        blur={2.6}
        far={6}
        resolution={512}
        color="#000000"
      />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableZoom={interactive}
        enableRotate={interactive}
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.62}
      />

      <FitCamera
        groupRef={groupRef}
        controlsRef={controlsRef}
        zoom={zoom}
        recomputeKey={`${modelSrc}|${yaw}|${pitch}|${fitTick}`}
        onFloor={setFloorY}
      />
    </>
  );
}

export default function Sign3DCanvas(props: Sign3DCanvasProps) {
  return (
    <Canvas
      className="!touch-none"
      shadows={false}
      dpr={[1, 2]}
      frameloop={props.autoRotate ? "always" : "demand"}
      // Khronos neutral, not fiber's default ACES: ACES drags saturated reds to
      // orange, and this one is built to keep base colours true.
      gl={{
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: false,
        toneMapping: THREE.NeutralToneMapping,
      }}
      camera={{ fov: 35, position: [0, 1, 8], near: 0.1, far: 100 }}
    >
      <SceneContents {...props} />
    </Canvas>
  );
}

// `ThreeElements` is imported so the JSX intrinsics (mesh, group, …) resolve.
export type { ThreeElements };
