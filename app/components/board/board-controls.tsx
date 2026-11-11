/**
 * The joystick: one knob, drawn in plain DOM over the table. Push it toward
 * where you want the car to go on the screen, further to go faster, and let go
 * to stop. Up is always away from you, whichever side of the table you stand
 * at. `board/joystick.ts` turns that into steering and pedals, and holds the
 * lane you are in when lane assist is on.
 *
 * It writes straight into `board/runtime.ts`'s `stick` and moves the knob with a
 * transform, so driving never re-renders React. Arrow keys and WASD push the
 * same knob on a computer.
 */
import * as React from "react";

import { STICK_DEADZONE } from "~/lib/board/joystick";
import { resetInput, stick } from "~/lib/board/runtime";
import { cn } from "~/lib/utils";

type Dir = "left" | "right" | "up" | "down";

const KEYS: Record<string, Dir> = {
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
};

export function BoardControls({ active }: { active: boolean }) {
  const base = React.useRef<HTMLDivElement>(null);
  const knob = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);
  const held = React.useRef<Record<Dir, boolean>>({
    left: false,
    right: false,
    up: false,
    down: false,
  });
  // Shown until the learner has pushed the knob once.
  const [hint, setHint] = React.useState(true);

  /** Put the knob at `x`, `y` (each -1 to 1) and tell the car. */
  const place = React.useCallback((x: number, y: number) => {
    const reach = Math.hypot(x, y);
    const k = reach > 1 ? 1 / reach : 1;
    stick.x = x * k;
    stick.y = y * k;
    const b = base.current;
    const el = knob.current;
    if (b && el) {
      const travel = (b.offsetWidth - el.offsetWidth) / 2;
      el.style.transform = `translate(${(stick.x * travel).toFixed(1)}px, ${(stick.y * travel).toFixed(1)}px)`;
    }
    if (reach > STICK_DEADZONE) setHint(false);
  }, []);

  React.useEffect(() => {
    const keys = held.current;
    const release = () => {
      dragging.current = false;
      keys.left = keys.right = keys.up = keys.down = false;
      if (knob.current) knob.current.dataset.held = "false";
      place(0, 0);
      resetInput();
    };
    if (!active) {
      release();
      return;
    }

    const fromKeys = () => {
      if (dragging.current) return;
      const x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      const y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      place(x, y);
    };
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (e.key === " ") {
        // Space lets go of everything.
        e.preventDefault();
        if (down) {
          keys.left = keys.right = keys.up = keys.down = false;
          fromKeys();
        }
        return;
      }
      const dir = KEYS[e.key];
      if (!dir) return;
      e.preventDefault();
      keys[dir] = down;
      fromKeys();
    };
    const keyDown = onKey(true);
    const keyUp = onKey(false);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    // Switching tabs mid-push must not leave the car driving itself.
    window.addEventListener("blur", release);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", release);
      release();
    };
  }, [active, place]);

  const follow = (e: React.PointerEvent<HTMLDivElement>) => {
    const b = base.current;
    const el = knob.current;
    if (!b || !el) return;
    const box = b.getBoundingClientRect();
    const travel = (b.offsetWidth - el.offsetWidth) / 2 || 1;
    place(
      (e.clientX - (box.left + box.width / 2)) / travel,
      (e.clientY - (box.top + box.height / 2)) / travel,
    );
  };
  const drop = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (knob.current) knob.current.dataset.held = "false";
    place(0, 0);
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-opacity duration-200 sm:pb-6",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      <p
        aria-hidden={!hint}
        className={cn(
          "m-0 rounded-md bg-[#101114]/85 px-3 py-1.5 text-center text-[12.5px] font-semibold leading-snug text-white transition-opacity duration-300",
          hint ? "opacity-100" : "opacity-0",
        )}
      >
        Push toward where you want to go. Let go to stop.
      </p>

      {/* The pad is bigger than the drawn base, so a thumb doesn't have to aim. */}
      <div
        role="application"
        aria-label="Joystick. Push toward where you want the car to go, and let go to stop. Arrow keys work too."
        className={cn(
          "flex size-[12.5rem] touch-none select-none items-center justify-center",
          active && "pointer-events-auto",
        )}
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // No capture (some webviews): the drag still works over the pad.
          }
          dragging.current = true;
          if (knob.current) knob.current.dataset.held = "true";
          follow(e);
        }}
        onPointerMove={(e) => {
          if (dragging.current) follow(e);
        }}
        onPointerUp={drop}
        onPointerCancel={drop}
        onLostPointerCapture={drop}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          ref={base}
          className="relative flex size-36 items-center justify-center rounded-full border-2 border-white/30 bg-[#17181b]/70 shadow-[0_6px_0_rgba(0,0,0,0.45)]"
        >
          {/* Four ticks: the knob points at the screen, not at the car. */}
          <svg
            viewBox="0 0 100 100"
            aria-hidden
            className="absolute inset-0 size-full text-white/45"
          >
            <path
              d="M50 9l5 7H45zM50 91l5-7H45zM9 50l7-5v10zM91 50l-7-5v10z"
              fill="currentColor"
            />
          </svg>
          <div
            ref={knob}
            data-held="false"
            className="size-16 rounded-full border-2 border-[#f6c416] bg-[#2b2d33] shadow-[0_4px_0_rgba(0,0,0,0.55),inset_0_2px_0_rgba(255,255,255,0.18)] will-change-transform data-[held=false]:transition-transform data-[held=false]:duration-150"
          />
        </div>
      </div>
    </div>
  );
}
