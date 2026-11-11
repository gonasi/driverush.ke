/**
 * The learner's hold on the camera, in plain DOM over the table: drag to slide
 * the view, pinch or scroll to zoom, double tap to see the whole table. The
 * camera never turns, so "up" stays away from you whichever side you stand at.
 *
 * It writes into `board/stage.ts`'s `cam`, which the scene reads every frame,
 * so moving the view never re-renders React.
 */
import * as React from "react";

import type { Seat } from "~/lib/board/joystick";
import { cam, fitTable, panBy, zoomBy } from "~/lib/board/stage";
import { cn } from "~/lib/utils";

import { Icon } from "~/components/brand/icon";
import { FocusIcon, MinusIcon, PlusIcon } from "~/components/brand/icons";

/** The direction "away from me" on the table, for each seat. */
const AWAY: Record<Seat, { x: number; z: number }> = {
  south: { x: 0, z: -1 },
  west: { x: 1, z: 0 },
  north: { x: 0, z: 1 },
  east: { x: -1, z: 0 },
};
/** The table is seen at a slant, so a drag up the screen covers more of it. */
const SLANT = 0.7;

const buttonClass =
  "inline-flex size-11 items-center justify-center rounded-md border-2 border-white/15 bg-[#101114]/85 text-white outline-none transition-colors hover:bg-white/15 focus-visible:border-white";

export function BoardCameraPad({
  seat,
  buttonsClassName,
}: {
  seat: Seat;
  /** Where the zoom buttons sit. */
  buttonsClassName?: string;
}) {
  const pad = React.useRef<HTMLDivElement>(null);
  const touches = React.useRef(new Map<number, { x: number; y: number }>());

  /** Slide the view by a drag measured in pixels. */
  const slide = React.useCallback(
    (dx: number, dy: number) => {
      const width = pad.current?.clientWidth || 1;
      const metres = Math.min(cam.span, cam.max) / width;
      const away = AWAY[seat];
      const right = { x: -away.z, z: away.x };
      panBy(
        (-right.x * dx + (away.x * dy) / SLANT) * metres,
        (-right.z * dx + (away.z * dy) / SLANT) * metres,
      );
    },
    [seat],
  );

  // Keys, for a computer: plus and minus zoom, 0 shows the whole table, and
  // the arrows slide the view.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const step = 60;
      if (e.key === "+" || e.key === "=") zoomBy(0.8);
      else if (e.key === "-" || e.key === "_") zoomBy(1.25);
      else if (e.key === "0") fitTable();
      else if (e.key === "ArrowLeft") slide(step, 0);
      else if (e.key === "ArrowRight") slide(-step, 0);
      else if (e.key === "ArrowUp") slide(0, step);
      else if (e.key === "ArrowDown") slide(0, -step);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slide]);

  const spread = () => {
    const [a, b] = [...touches.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  return (
    <>
      <div
        ref={pad}
        aria-hidden
        className="absolute inset-0 z-10 cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // a pointer that has already gone: nothing to hold
          }
          touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }}
        onPointerMove={(e) => {
          const prev = touches.current.get(e.pointerId);
          if (!prev) return;
          const before = spread();
          touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          const fingers = touches.current.size;
          if (fingers >= 2) {
            const now = spread();
            if (before > 0 && now > 0) zoomBy(before / now);
          }
          slide((e.clientX - prev.x) / fingers, (e.clientY - prev.y) / fingers);
        }}
        onPointerUp={(e) => touches.current.delete(e.pointerId)}
        onPointerCancel={(e) => touches.current.delete(e.pointerId)}
        onWheel={(e) => zoomBy(Math.exp(e.deltaY * 0.0015))}
        onDoubleClick={() => fitTable()}
      />
      <div
        className={cn(
          "absolute right-3 z-20 flex flex-col gap-2 sm:right-6",
          buttonsClassName ?? "top-[36%] -translate-y-1/2",
        )}
      >
        <button
          type="button"
          aria-label="Zoom in"
          className={buttonClass}
          onClick={() => zoomBy(0.7)}
        >
          <Icon icon={PlusIcon} size={20} />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          className={buttonClass}
          onClick={() => zoomBy(1.4)}
        >
          <Icon icon={MinusIcon} size={20} />
        </button>
        <button
          type="button"
          aria-label="Show the whole table"
          className={buttonClass}
          onClick={() => fitTable()}
        >
          <Icon icon={FocusIcon} size={20} />
        </button>
      </div>
    </>
  );
}
