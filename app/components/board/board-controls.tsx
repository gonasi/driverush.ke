/**
 * The steering wheel and pedals, drawn in plain DOM over the 3D board. Touches
 * write straight into `board/runtime.ts`'s `input`, and one animation frame loop
 * turns the wheel on screen, so driving never re-renders React.
 *
 * Wheel and pedals each capture their own pointer, so a thumb on each works at
 * the same time. On a computer the arrow keys or WASD do the same job.
 */
import * as React from "react";

import { input, resetInput } from "~/lib/board/runtime";
import { cn } from "~/lib/utils";

/** How far the wheel turns each way, in degrees. */
const LOCK = 105;

type Held = {
  angle: number;
  grabbing: boolean;
  last: number;
  left: boolean;
  right: boolean;
  go: boolean;
  stop: boolean;
  pedalGo: boolean;
  pedalStop: boolean;
};

const KEYS: Record<string, keyof Pick<Held, "left" | "right" | "go" | "stop">> =
  {
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
    ArrowUp: "go",
    w: "go",
    W: "go",
    ArrowDown: "stop",
    s: "stop",
    S: "stop",
    " ": "stop",
  };

function Wheel() {
  return (
    <svg viewBox="0 0 120 120" className="size-full" aria-hidden>
      <circle
        cx="60"
        cy="60"
        r="50"
        fill="none"
        stroke="#17181b"
        strokeWidth="15"
      />
      <circle
        cx="60"
        cy="60"
        r="50"
        fill="none"
        stroke="#3a3c42"
        strokeWidth="3"
      />
      <path
        d="M60 10v14"
        stroke="#f6c416"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M13 55 46 58M107 55 74 58M60 76v32"
        stroke="#17181b"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <circle
        cx="60"
        cy="62"
        r="17"
        fill="#22242a"
        stroke="#3a3c42"
        strokeWidth="2"
      />
      <circle cx="60" cy="62" r="5" fill="#f6c416" />
    </svg>
  );
}

function Pedal({
  label,
  tall,
  onChange,
}: {
  label: string;
  tall?: boolean;
  onChange: (down: boolean) => void;
}) {
  const set = (el: HTMLButtonElement, down: boolean) => {
    el.dataset.down = String(down);
    onChange(down);
  };
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        set(e.currentTarget, true);
      }}
      onPointerUp={(e) => set(e.currentTarget, false)}
      onPointerCancel={(e) => set(e.currentTarget, false)}
      onLostPointerCapture={(e) => set(e.currentTarget, false)}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "pointer-events-auto flex w-[4.6rem] touch-none select-none flex-col items-center justify-end gap-1.5 rounded-md border-2 border-white/25 bg-[#2b2d33] pb-2 pt-3 font-mono text-[9.5px] font-bold uppercase tracking-widest text-white/85 shadow-[0_6px_0_rgba(0,0,0,0.55)] outline-none transition-transform duration-75 data-[down=true]:translate-y-1 data-[down=true]:bg-[#3a3d45] data-[down=true]:shadow-[0_2px_0_rgba(0,0,0,0.55)] focus-visible:border-white",
        tall ? "h-[7.5rem]" : "h-[5.25rem]",
      )}
    >
      <span aria-hidden className="grid w-full flex-1 content-evenly px-2.5">
        {Array.from({ length: tall ? 5 : 3 }, (_, i) => (
          <span key={i} className="block h-1 rounded-full bg-white/30" />
        ))}
      </span>
      {label}
    </button>
  );
}

export function BoardControls({ active }: { active: boolean }) {
  const wheel = React.useRef<HTMLDivElement>(null);
  const held = React.useRef<Held>({
    angle: 0,
    grabbing: false,
    last: 0,
    left: false,
    right: false,
    go: false,
    stop: false,
    pedalGo: false,
    pedalStop: false,
  });

  React.useEffect(() => {
    const h = held.current;
    if (!active) {
      Object.assign(h, {
        angle: 0,
        grabbing: false,
        left: false,
        right: false,
        go: false,
        stop: false,
        pedalGo: false,
        pedalStop: false,
      });
      resetInput();
      if (wheel.current) wheel.current.style.transform = "rotate(0deg)";
      return;
    }

    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      const key = KEYS[e.key];
      if (!key) return;
      e.preventDefault();
      h[key] = down;
    };
    const keyDown = onKey(true);
    const keyUp = onKey(false);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    let frame = 0;
    const loop = () => {
      if (!h.grabbing) {
        // Keys pull the wheel over; letting go lets it spring back.
        const want = ((h.right ? 1 : 0) - (h.left ? 1 : 0)) * LOCK;
        h.angle += (want - h.angle) * 0.22;
        if (want === 0 && Math.abs(h.angle) < 0.4) h.angle = 0;
      }
      input.steer = h.angle / LOCK;
      input.throttle = h.go || h.pedalGo ? 1 : 0;
      input.brake = h.stop || h.pedalStop ? 1 : 0;
      if (wheel.current) {
        wheel.current.style.transform = `rotate(${h.angle.toFixed(1)}deg)`;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      resetInput();
    };
  }, [active]);

  const angleOf = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    return (
      (Math.atan2(
        e.clientY - (box.top + box.height / 2),
        e.clientX - (box.left + box.width / 2),
      ) *
        180) /
      Math.PI
    );
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-opacity duration-200 sm:px-8 sm:pb-8",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        role="slider"
        aria-label="Steering wheel"
        aria-valuemin={-100}
        aria-valuemax={100}
        aria-valuenow={0}
        tabIndex={-1}
        className={cn(
          "size-[8.5rem] touch-none select-none rounded-full drop-shadow-[0_6px_0_rgba(0,0,0,0.5)] sm:size-40",
          active && "pointer-events-auto",
        )}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          held.current.grabbing = true;
          held.current.last = angleOf(e);
        }}
        onPointerMove={(e) => {
          const h = held.current;
          if (!h.grabbing) return;
          const now = angleOf(e);
          let turn = now - h.last;
          if (turn > 180) turn -= 360;
          if (turn < -180) turn += 360;
          h.last = now;
          h.angle = Math.max(-LOCK, Math.min(LOCK, h.angle + turn));
        }}
        onPointerUp={() => (held.current.grabbing = false)}
        onPointerCancel={() => (held.current.grabbing = false)}
        onLostPointerCapture={() => (held.current.grabbing = false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div ref={wheel} className="size-full will-change-transform">
          <Wheel />
        </div>
      </div>

      <div
        className={cn(
          "flex items-end gap-2.5",
          !active && "[&>*]:pointer-events-none",
        )}
      >
        <Pedal label="Brake" onChange={(d) => (held.current.pedalStop = d)} />
        <Pedal label="Go" tall onChange={(d) => (held.current.pedalGo = d)} />
      </div>
    </div>
  );
}
