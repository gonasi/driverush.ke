/**
 * The joystick: one knob, drawn in plain DOM over the table. Push it toward
 * where you want the car to go on the screen, further to go faster, and let go
 * to stop. Up is always away from you, whichever side of the table you stand
 * at. `board/joystick.ts` turns that into steering and pedals, and holds the
 * lane you are in when lane assist is on.
 *
 * It writes straight into `board/runtime.ts`'s `stick` and moves the knob with a
 * transform, so driving never re-renders React. Arrow keys and WASD push the
 * same knob on a computer, and holding Shift pushes it gently, for parking.
 */
import * as React from "react";

import { STICK_DEADZONE } from "~/lib/board/joystick";
import { resetInput, stick, view } from "~/lib/board/runtime";
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

/** How far the keys push the knob with Shift held: a crawl, for a parking bay. */
const GENTLE = 0.45;

export function BoardControls({
  active,
  reverse = false,
  note,
}: {
  active: boolean;
  /** The task has a reverse gear: say when it is coming in, and when it is in. */
  reverse?: boolean;
  /** Guidance for this task, shown once the first-push hint has gone. */
  note?: string;
}) {
  const base = React.useRef<HTMLDivElement>(null);
  const knob = React.useRef<HTMLDivElement>(null);
  const gear = React.useRef<HTMLParagraphElement>(null);
  const dragging = React.useRef(false);
  const gentle = React.useRef(false);
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
      gentle.current = false;
      keys.left = keys.right = keys.up = keys.down = false;
      if (knob.current) knob.current.dataset.held = "false";
      if (base.current) base.current.dataset.held = "false";
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
      // Two keys at once would push further than one: keep it to the rim.
      const reach = Math.hypot(x, y) || 1;
      const push = gentle.current ? GENTLE : 1;
      place((x / reach) * push, (y / reach) * push);
    };
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        gentle.current = down;
        fromKeys();
        return;
      }
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
    if (base.current) base.current.dataset.held = "false";
    place(0, 0);
  };

  // Reverse gear takes a moment of holding back to come in. Say so, so the
  // learner knows the car heard them, and say when it is in.
  React.useEffect(() => {
    const el = gear.current;
    if (!el) return;
    if (!active || !reverse) {
      el.style.opacity = "0";
      return;
    }
    let frame = 0;
    let shown = "";
    const look = () => {
      frame = requestAnimationFrame(look);
      const text = view.reversing
        ? "Reverse"
        : view.backing > 0
          ? "Keep holding to reverse"
          : "";
      if (text === shown) return;
      shown = text;
      if (text) el.textContent = text;
      el.style.opacity = text ? "1" : "0";
    };
    frame = requestAnimationFrame(look);
    return () => cancelAnimationFrame(frame);
  }, [active, reverse]);

  return (
    <div
      data-board-stick
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-opacity duration-200 sm:pb-6",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      {/* One line of guidance, and no box at all once it has been read: the
          road above the joystick is where the car is. */}
      {(hint || note) && (
        <p
          key={hint ? "hint" : "note"}
          className="dr-rise m-0 max-w-[17rem] rounded-md bg-[#101114]/85 px-3 py-1.5 text-center text-[12.5px] font-semibold leading-snug text-white"
        >
          {hint ? "Push toward where you want to go. Let go to stop." : note}
        </p>
      )}
      <p
        ref={gear}
        role="status"
        className="m-0 rounded-md border-2 border-[#17181b] bg-[#f6c416] px-3 py-1 text-center font-mono text-[11px] font-bold uppercase tracking-widest text-[#17181b] opacity-0 transition-opacity duration-150"
      />

      {/* The pad is bigger than the drawn base, so a thumb doesn't have to aim. */}
      <div
        role="application"
        aria-label="Joystick. Push toward where you want the car to go, and let go to stop. The arrow keys or W, A, S and D work too. Hold Shift to go slowly."
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
          if (base.current) base.current.dataset.held = "true";
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
          data-held="false"
          // Under a thumb the base goes faint, so the road shows through it.
          className="relative flex size-36 items-center justify-center rounded-full border-2 border-white/30 bg-[#17181b]/70 shadow-[0_6px_0_rgba(0,0,0,0.45)] transition-colors duration-150 data-[held=true]:border-white/20 data-[held=true]:bg-[#17181b]/30 data-[held=true]:shadow-none"
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
