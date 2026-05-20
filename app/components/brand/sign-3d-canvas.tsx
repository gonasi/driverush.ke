/**
 * The actual react-three-fiber scene for one road-sign GLB. This module pulls in
 * `three` + `@react-three/drei`, so it is **only ever loaded via `React.lazy`**
 * from `sign-3d-viewer.tsx` (client, after mount) — never on the server, and
 * never in the main bundle. Keep all heavy 3D imports in here.
 *
 * The GLBs are full roadside signs (panel on a ~5-unit post), so the camera
 * frames the panel close with a sliver of post showing below. Materials are flat
 * PBR; we add an in-engine `Lightformer` environment (no external HDRI fetch) for
 * a reflective road-sign sheen, plus a soft contact shadow to ground it.
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
};

/** Load a GLB, clone it (so per-instance material tweaks don't poison the cache)
 *  and give the surfaces a touch more reflectivity for the sign sheen. */
function SignModel({
  modelSrc,
  groupRef,
  yaw = 0,
  pitch = 0,
  onReady,
}: {
  modelSrc: string;
  groupRef: React.RefObject<THREE.Group | null>;
  yaw?: number;
  pitch?: number;
  onReady?: () => void;
}) {
  const { scene } = useGLTF(modelSrc);

  const model = React.useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // Retroreflective road-sign look: pick up the environment, stay matte
      // enough to read the colour, never mirror-shiny. Clone first so the tweak
      // doesn't poison the GLB cache shared across sign instances.
      const tweak = (m: THREE.Material): THREE.Material => {
        const mat = m.clone() as THREE.MeshStandardMaterial;
        if ("envMapIntensity" in mat) mat.envMapIntensity = 1.15;
        if ("roughness" in mat)
          mat.roughness = Math.min(mat.roughness ?? 0.5, 0.42);
        if ("metalness" in mat)
          mat.metalness = Math.max(mat.metalness ?? 0, 0.04);
        return mat;
      };
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(tweak)
        : tweak(mesh.material);
    });
    return root;
  }, [scene]);

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

function SceneContents({
  modelSrc,
  yaw = 0,
  pitch = 0,
  zoom = 1,
  autoRotate = false,
  interactive = true,
}: Sign3DCanvasProps) {
  const groupRef = React.useRef<THREE.Group | null>(null);
  const controlsRef = React.useRef<any>(null);
  const [floorY, setFloorY] = React.useState(0);
  // Bumped when the model's geometry lands, to force FitCamera to re-frame.
  const [fitTick, setFitTick] = React.useState(0);
  const handleReady = React.useCallback(() => setFitTick((t) => t + 1), []);

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
          {/* Moonlit ambience — cool and low. */}
          <ambientLight intensity={0.25} color="#2b3a5e" />
          <hemisphereLight
            intensity={0.4}
            color="#1b2747"
            groundColor="#05070d"
          />
          {/* Warm streetlight / headlight key, raking the face. */}
          <directionalLight
            position={[1.4, 3.2, 7]}
            intensity={1.6}
            color="#ffce92"
          />
          {/* Cool moon fill from above for separation. */}
          <directionalLight
            position={[-4, 8, 1]}
            intensity={0.5}
            color="#9fb6ff"
          />
        </>
      ) : (
        <>
          {/* Daylight — bright and neutral-warm. */}
          <ambientLight intensity={0.7} />
          <hemisphereLight
            intensity={0.55}
            color="#cfe2ff"
            groundColor="#b9a884"
          />
          {/* Sun key, raking the face. */}
          <directionalLight
            position={[1.5, 4, 8]}
            intensity={2}
            color="#fff4e0"
          />
          {/* Soft sky fill. */}
          <directionalLight
            position={[-6, 5, -2]}
            intensity={0.5}
            color="#cdddee"
          />
        </>
      )}

      {/* In-engine studio env — reflections without fetching a remote HDRI.
          Subdued + cool at night, bright by day. */}
      <Environment resolution={256}>
        <Lightformer
          intensity={night ? 1.2 : 2.2}
          position={[0, 4, 5]}
          scale={[8, 8, 1]}
          color={night ? "#ffd9a3" : "#fff7ec"}
        />
        <Lightformer
          intensity={night ? 0.45 : 1.1}
          position={[-5, 2, 2]}
          scale={[5, 5, 1]}
          color={night ? "#7e93c8" : "#dfe8ff"}
        />
        <Lightformer
          intensity={night ? 0.35 : 0.9}
          position={[5, 1, -2]}
          scale={[5, 5, 1]}
          color={night ? "#3f4d70" : "#ffffff"}
        />
      </Environment>

      <React.Suspense fallback={null}>
        <SignModel
          modelSrc={modelSrc}
          groupRef={groupRef}
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
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
      camera={{ fov: 35, position: [0, 1, 8], near: 0.1, far: 100 }}
    >
      <SceneContents {...props} />
    </Canvas>
  );
}

// `ThreeElements` is imported so the JSX intrinsics (mesh, group, …) resolve.
export type { ThreeElements };
