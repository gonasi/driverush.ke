/**
 * Client-only wrapper round the 3D board. The scene (and with it `three`) is
 * pulled in with `React.lazy` after mount, so it never runs on the server and
 * only downloads once the learner has asked to drive. Until the road surface is
 * painted, the house traffic-light loader covers the canvas.
 */
import * as React from "react";

import type { BoardChallenge } from "~/lib/board/challenges";
import type { BoardQuality } from "~/lib/board-store";
import { cn } from "~/lib/utils";

import { LoadingPanel } from "~/components/brand/traffic-loader";
import type { BoardTier } from "~/components/board/board-canvas";

const BoardCanvas = React.lazy(() => import("~/components/board/board-canvas"));

/** Low-memory and few-core phones get the lighter scene unless told otherwise. */
export function pickTier(quality: BoardQuality): BoardTier {
  if (quality !== "auto") return quality;
  if (typeof navigator === "undefined") return "low";
  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  const cores = navigator.hardwareConcurrency;
  if ((memory != null && memory <= 3) || (cores != null && cores <= 4)) {
    return "low";
  }
  return "high";
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function BoardViewer({
  challenge,
  driving,
  attempt,
  quality,
  onUnsupported,
  className,
}: {
  challenge: BoardChallenge | null;
  driving: boolean;
  attempt: number;
  quality: BoardQuality;
  /** This device can't draw the 3D board at all. */
  onUnsupported?: () => void;
  className?: string;
}) {
  const [state, setState] = React.useState<"boot" | "ok" | "none">("boot");
  const [painted, setPainted] = React.useState(false);
  const tier = React.useMemo(() => pickTier(quality), [quality]);

  React.useEffect(() => {
    const ok = hasWebGL();
    setState(ok ? "ok" : "none");
    if (!ok) onUnsupported?.();
    // Checked once, when the board opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loader = (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#101114]">
      <LoadingPanel label="Loading the board" size="lg" onDark />
    </div>
  );

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {state === "ok" && (
        <React.Suspense fallback={loader}>
          <BoardCanvas
            challenge={challenge}
            driving={driving && painted}
            attempt={attempt}
            tier={tier}
            onReady={() => setPainted(true)}
          />
        </React.Suspense>
      )}
      {state !== "none" && !painted && loader}
    </div>
  );
}
