/**
 * Client-only wrapper round the table. The scene (and with it three.js) is
 * pulled in with `React.lazy` after mount, so it never runs on the server and
 * only downloads once the learner has asked to drive. Until the board is
 * painted, the house traffic-light loader covers it.
 */
import * as React from "react";

import type { BoardCarId } from "~/lib/board/cars";
import type { BoardChallenge } from "~/lib/board/challenges";
import type { Seat } from "~/lib/board/joystick";
import { startRung, tierFor, type Device } from "~/lib/board/quality";
import type { BoardQuality } from "~/lib/board-store";
import { cn } from "~/lib/utils";

import { LoadingPanel } from "~/components/brand/traffic-loader";
import type { ExtraCar } from "~/components/board/board-table";

const loadTable = () => import("~/components/board/board-table");

/**
 * The scene is a big download. On a weak connection it can fail part-way, and
 * without this the whole page would fall over. Here it says so and offers
 * another go.
 */
class LoadGuard extends React.Component<
  { onRetry: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#101114] px-6 text-center text-white">
        <p className="m-0 max-w-sm text-[15px] leading-snug">
          The board did not finish loading. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={this.props.onRetry}
          className="min-h-11 rounded-md bg-[#f6c416] px-5 text-[14.5px] font-bold text-[#17181b] outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Try again
        </button>
      </div>
    );
  }
}

/**
 * What this device can do, read once from a throwaway drawing surface. `null`
 * when it can't draw the board at all.
 */
function probeDevice(): Device | null {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return null;
    const device: Device = {
      memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
      cores: navigator.hardwareConcurrency,
    };
    try {
      device.maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const name = info
        ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER);
      if (typeof name === "string") device.renderer = name;
    } catch {
      // A browser that won't say: judged on memory and cores alone.
    }
    // Hand the surface back at once; phones allow only a few at a time.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return device;
  } catch {
    return null;
  }
}

export function BoardViewer({
  challenge,
  driving,
  attempt,
  quality,
  seat,
  car,
  paint,
  extraCars,
  learning,
  focus,
  sweep,
  onUnsupported,
  onPainted,
  className,
}: {
  challenge: BoardChallenge | null;
  driving: boolean;
  attempt: number;
  quality: BoardQuality;
  /** The side of the table the learner stands at. */
  seat: Seat;
  /** The car the learner drives. */
  car: BoardCarId;
  /** Its paint, when it was picked from a line-up. */
  paint?: string;
  /** Cars standing on the table that nobody is driving. */
  extraCars?: readonly ExtraCar[];
  /** Learn mode: no task on the table. */
  learning?: boolean;
  /** Stopped by the examiner: keep the view on the car. */
  focus?: boolean;
  /** Open the attempt with a look at the finish. */
  sweep?: boolean;
  /** This device can't draw the board at all. */
  onUnsupported?: () => void;
  /** The board is drawn and on screen. */
  onPainted?: () => void;
  className?: string;
}) {
  const [state, setState] = React.useState<"boot" | "ok" | "none">("boot");
  const [device, setDevice] = React.useState<Device>({});
  const [painted, setPainted] = React.useState(false);
  // Sharp unless the device is plainly not up to it, or the learner says.
  const tier = React.useMemo(() => tierFor(quality, device), [quality, device]);
  const rung = React.useMemo(
    () => (state === "ok" ? startRung(quality, tier) : 0),
    [state, quality, tier],
  );
  // A failed download is asked for again from scratch: `lazy` remembers a
  // failure, so each go gets a new one.
  const [load, setLoad] = React.useState(() => ({
    n: 0,
    Table: React.lazy(loadTable),
  }));
  const BoardTable = load.Table;

  React.useEffect(() => {
    const found = probeDevice();
    if (found) setDevice(found);
    setState(found ? "ok" : "none");
    if (!found) onUnsupported?.();
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
        <LoadGuard
          key={load.n}
          onRetry={() => {
            setLoad((was) => ({ n: was.n + 1, Table: React.lazy(loadTable) }));
          }}
        >
          <React.Suspense fallback={loader}>
            <BoardTable
              challenge={challenge}
              driving={driving && painted}
              attempt={attempt}
              tier={tier}
              startRung={rung}
              seat={seat}
              car={car}
              paint={paint}
              extraCars={extraCars}
              learning={learning}
              focus={focus}
              sweep={sweep}
              onReady={() => {
                setPainted(true);
                onPainted?.();
              }}
            />
          </React.Suspense>
        </LoadGuard>
      )}
      {state !== "none" && !painted && loader}
    </div>
  );
}
