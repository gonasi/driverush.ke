/**
 * The actual react-three-fiber scene for one road-sign GLB. This module pulls in
 * `three` + `@react-three/drei`, so it is **only ever loaded via `React.lazy`**
 * from `sign-3d-viewer.tsx` (client, after mount) — never on the server, and
 * never in the main bundle. Keep all heavy 3D imports in here.
 *
 * The GLBs are full roadside signs (panel on a ~5-unit post), so the camera
 * frames the panel close with a sliver of post showing below. Their materials are
 * flat colours, so the sign look is built here: faces become retroreflective
 * sheeting (see `sheetingMaterial`), lit by an in-engine `Lightformer` environment
 * (no external HDRI fetch) whose strips sweep across the gloss as the sign turns,
 * plus a soft contact shadow to ground it.
 */
import * as React from "react";
import { Canvas, useThree, type ThreeElements } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";

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

/** Real road-sign colours, close to RAL 3020 Traffic Red and RAL 5017 Traffic Blue.
 *  The GLBs ship a brick orange (#c24825) and a washed-out periwinkle (#607cf3,
 *  #6284e4), so they're corrected at load rather than re-exporting 83 models. */
const SIGN_RED = new THREE.Color("#c1121c");
const SIGN_BLUE = new THREE.Color("#00559a");
function trueSignColor(c: THREE.Color): THREE.Color {
  if (c.r > 0.45 && c.g < 0.1 && c.b < 0.05) return SIGN_RED;
  if (c.b > 0.6 && c.r < 0.2 && c.g < 0.3) return SIGN_BLUE;
  return c;
}

/** The little Pelican sticker on the post is printed vinyl, not sheeting. */
const isSticker = (name: string) => /Pelican|Dark_Blue|pasted__/.test(name);

/** How hard the sheeting throws light back: a hint by day, the whole show at night. */
const RETRO_GAIN = { day: 0.16, night: 1.4 };

/** Front of the face on sign-on-post models. The post's radius stops just short
 *  of it, so the post doesn't glow along with the sheeting. */
const POST_FRONT_Z = 0.102;

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
  float signFacing = saturate(dot(normal, normalize(vViewPosition)));
  float signRetro = 0.85 * pow(signFacing, 1.5) + 0.5 * pow(signFacing, 48.0);

  vec2 signGrid = vSignXY / 0.024;
  const vec2 signHex = vec2(1.0, 1.7320508);
  vec2 signA = mod(signGrid, signHex) - signHex * 0.5;
  vec2 signB = mod(signGrid - signHex * 0.5, signHex) - signHex * 0.5;
  vec2 signLocal = dot(signA, signA) < dot(signB, signB) ? signA : signB;
  float signSeed = fract(sin(dot(signGrid - signLocal, vec2(127.1, 311.7))) * 43758.5453);
  float signAngle = signSeed * 6.2832;
  float signTwinkle = 0.5 + 0.5 * sin(signAngle * 3.0 + dot(normal.xy, vec2(cos(signAngle), sin(signAngle))) * 22.0);
  float signEdge = 0.5 - max(abs(signLocal.x), dot(abs(signLocal), normalize(signHex)));
  float signCell = mix(0.5, 1.0, smoothstep(0.0, 0.07, signEdge)) * (0.8 + 0.5 * signTwinkle);
  float signDetail = 1.0 - smoothstep(0.4, 0.8, fwidth(signGrid.x) + fwidth(signGrid.y));

  totalEmissiveRadiance += diffuseColor.rgb * uRetroGain * signRetro
    * mix(1.0, signCell, signDetail) * vSheeting;
`;

/**
 * Retroreflective sheeting: a satin colour layer under a glossy acrylic overlay
 * (the clearcoat carries the crisp reflections), plus {@link SHEETING_GLSL}.
 */
function sheetingMaterial(
  src: THREE.MeshStandardMaterial,
  retroGain: { value: number },
  faceMinZ: number,
): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    name: src.name,
    side: src.side,
    color: trueSignColor(src.color),
    metalness: 0,
    roughness: 0.5,
    specularIntensity: 0.35,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRetroGain = retroGain;
    shader.uniforms.uFaceMinZ = { value: faceMinZ };
    shader.vertexShader =
      "uniform float uFaceMinZ;\nvarying float vSheeting;\nvarying vec2 vSignXY;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        // Sign faces all look down +Z, so this leaves out the back, edges and post.
        vSheeting = step(0.3, normal.z) * step(uFaceMinZ, position.z);
        vSignXY = position.xy;`,
      );
    shader.fragmentShader =
      "uniform float uRetroGain;\nvarying float vSheeting;\nvarying vec2 vSignXY;\n" +
      shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>\n${SHEETING_GLSL}`,
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
  const invalidate = useThree((s) => s.invalidate);

  // One uniform shared by the sign's materials, so a theme flip needs no rebuild.
  const [retroGain] = React.useState(() => ({
    value: night ? RETRO_GAIN.night : RETRO_GAIN.day,
  }));
  React.useEffect(() => {
    retroGain.value = night ? RETRO_GAIN.night : RETRO_GAIN.day;
    invalidate();
  }, [night, retroGain, invalidate]);

  const model = React.useMemo(() => {
    const root = scene.clone(true);
    // A handful of models are bare panels with no post to leave out.
    const hasPost =
      new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).y > 3;
    const faceMinZ = hasPost ? POST_FRONT_Z : -Infinity;
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const dress = (m: THREE.Material): THREE.Material =>
        isSticker(m.name)
          ? m.clone()
          : sheetingMaterial(
              m as THREE.MeshStandardMaterial,
              retroGain,
              faceMinZ,
            );
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(dress)
        : dress(mesh.material);
    });
    return root;
  }, [scene, retroGain]);

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

    const dir = new THREE.Vector3(0.42, 0.14, 1).normalize();
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

/** Softboxes ringed around the sign: azimuth in degrees (0 = straight out of the
 *  face). The resting camera's reflection lands near -23 and a strip there would
 *  wash the red pink and grey out the legend, so that gap stays open: the sign
 *  rests in its true colour with a highlight at the edge, and the strips only cross
 *  the face as it turns. Uneven spacing keeps the sweep from feeling mechanical. */
const REFLECTION_STRIPS = [
  { azimuth: -76, width: 2.2, power: 3 },
  { azimuth: -44, width: 1, power: 5 },
  { azimuth: 6, width: 0.7, power: 4 },
  { azimuth: 52, width: 1.6, power: 4 },
  { azimuth: 150, width: 2, power: 3 },
  { azimuth: -140, width: 1.2, power: 3 },
];

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

  return (
    <>
      {/* Day = bright sky backdrop; night = deep navy. */}
      <color attach="background" args={[night ? "#0a0e1a" : "#e8eef3"]} />

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
        <>
          {/* Diffuse daylight. No flat ambient: it washes out the red and leaves
              no headroom for the reflections to read on white. */}
          <hemisphereLight
            intensity={0.85}
            color="#e8f1ff"
            groundColor="#bdb29a"
          />
          {/* Sun key, raking the face. */}
          <directionalLight
            position={[1.5, 4, 8]}
            intensity={1.15}
            color="#fff6e8"
          />
        </>
      )}

      {/* What the gloss reflects: a dim sky so the colour stays saturated, then
          narrow bright strips around the sign that sweep across it as it turns.
          In-engine, so no remote HDRI fetch. */}
      <Environment resolution={256}>
        <color attach="background" args={[night ? "#04060c" : "#39424d"]} />
        <Lightformer
          intensity={night ? 0.12 : 0.9}
          position={[0, 9, 0]}
          scale={[24, 24, 1]}
          color={night ? "#27345c" : "#dcebff"}
        />
        {REFLECTION_STRIPS.map(({ azimuth, width, power }) => (
          <Lightformer
            key={azimuth}
            position={[
              Math.sin(azimuth * DEG) * 10,
              -1,
              Math.cos(azimuth * DEG) * 10,
            ]}
            scale={[width, 10, 1]}
            intensity={power * (night ? 0.3 : 1)}
            color={night ? "#d5ddf5" : "#ffffff"}
          />
        ))}
      </Environment>

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
