/**
 * Client-only wrapper around the react-three-fiber scene. The heavy 3D module
 * (`sign-3d-canvas.tsx`, which imports `three` + drei) is pulled in via
 * `React.lazy` **after mount**, so it never runs during SSR and forms its own
 * async chunk. Until it's ready — and on the server / first paint — we show the
 * house traffic-light loader.
 *
 * Auto-rotate is suppressed under `prefers-reduced-motion`.
 */
import * as React from "react";

import { cn } from "~/lib/utils";
import { LoadingPanel } from "~/components/brand/traffic-loader";

const Sign3DCanvas = React.lazy(
  () => import("~/components/brand/sign-3d-canvas"),
);

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export type Sign3DViewerProps = {
  modelSrc: string | null | undefined;
  yaw?: number;
  pitch?: number;
  zoom?: number;
  autoRotate?: boolean;
  interactive?: boolean;
  /** Caption shown under the loader while the scene boots. */
  loaderLabel?: string;
  /** Light loader caption, for the dark fullscreen overlay. */
  onDark?: boolean;
  className?: string;
};

export function Sign3DViewer({
  modelSrc,
  yaw,
  pitch,
  zoom,
  autoRotate = false,
  interactive = true,
  loaderLabel = "Loading the sign",
  onDark = false,
  className,
}: Sign3DViewerProps) {
  const [mounted, setMounted] = React.useState(false);
  const reducedMotion = usePrefersReducedMotion();
  React.useEffect(() => setMounted(true), []);

  const loader = (
    <div className="flex h-full w-full items-center justify-center">
      <LoadingPanel label={loaderLabel} size="lg" onDark={onDark} />
    </div>
  );

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {!mounted || !modelSrc ? (
        loader
      ) : (
        <React.Suspense fallback={loader}>
          {/* One Canvas for the session — swapping `modelSrc` reloads only the
              model (from cache) and re-fits the camera; we deliberately do NOT
              key the Canvas, to avoid recreating the WebGL context per sign. */}
          <Sign3DCanvas
            modelSrc={modelSrc}
            yaw={yaw}
            pitch={pitch}
            zoom={zoom}
            autoRotate={autoRotate && !reducedMotion}
            interactive={interactive}
          />
        </React.Suspense>
      )}
    </div>
  );
}
