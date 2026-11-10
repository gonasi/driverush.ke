/**
 * The three controls, drawn in plain DOM over the game: hold Go to drive and
 * let go to brake, and tap left or right to change lane. Close to the
 * roundabout and on it, the left button becomes Exit. The car steers itself
 * along its lane (`board/guide.ts`), so nobody has to wrestle a wheel.
 *
 * Presses go straight to `board/runtime.ts`. The only React state is whether
 * the left button reads "Lane" or "Exit", checked a few times a second.
 */
import * as React from "react";

import {
  controls,
  pressLeft,
  pressRight,
  resetInput,
  view,
} from "~/lib/board/runtime";
import { cn } from "~/lib/utils";

const GO_KEYS = new Set(["ArrowUp", "w", "W", " "]);
const LEFT_KEYS = new Set(["ArrowLeft", "a", "A"]);
const RIGHT_KEYS = new Set(["ArrowRight", "d", "D"]);

const BUTTON =
  "pointer-events-auto flex touch-none select-none flex-col items-center justify-center gap-0.5 rounded-xl border-2 font-display font-extrabold uppercase leading-none tracking-tight outline-none transition-transform duration-75 active:translate-y-1 focus-visible:border-white";

function Arrow({ flip }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn("size-7", flip && "-scale-x-100")}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M11 5.5L4.5 12l6.5 6.5" />
    </svg>
  );
}

export function BoardControls({ active }: { active: boolean }) {
  const [exit, setExit] = React.useState(false);
  // Shown until the learner has pressed Go once.
  const [hint, setHint] = React.useState(true);
  const go = React.useRef<HTMLButtonElement>(null);

  const hold = React.useCallback((down: boolean) => {
    controls.go = down;
    if (go.current) go.current.dataset.down = String(down);
    if (down) setHint(false);
  }, []);

  React.useEffect(() => {
    if (!active) {
      hold(false);
      resetInput();
      setExit(false);
      return;
    }

    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (GO_KEYS.has(e.key)) {
        e.preventDefault();
        hold(down);
        return;
      }
      if (!down || e.repeat) return;
      if (LEFT_KEYS.has(e.key)) {
        e.preventDefault();
        pressLeft();
      } else if (RIGHT_KEYS.has(e.key)) {
        e.preventDefault();
        pressRight();
      }
    };
    const keyDown = onKey(true);
    const keyUp = onKey(false);
    const letGo = () => hold(false);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    // Switching tabs with Go held must not leave the car driving itself.
    window.addEventListener("blur", letGo);
    const watch = window.setInterval(() => setExit(view.leftIsExit), 120);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", letGo);
      window.clearInterval(watch);
      hold(false);
    };
  }, [active, hold]);

  const tap = (press: () => unknown) => (e: React.PointerEvent) => {
    e.preventDefault();
    press();
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-opacity duration-200 sm:pb-6",
        active ? "opacity-100" : "opacity-0",
        !active && "[&_button]:pointer-events-none",
      )}
    >
      <p
        aria-hidden={!hint}
        className={cn(
          "m-0 rounded-md bg-[#101114]/85 px-3 py-1.5 text-center text-[12.5px] font-semibold leading-snug text-white transition-opacity duration-300",
          hint ? "opacity-100" : "opacity-0",
        )}
      >
        Hold Go to drive. Let go to stop.
      </p>

      <div className="grid w-full max-w-md grid-cols-[1fr_1.35fr_1fr] gap-2.5">
        <button
          type="button"
          aria-label={exit ? "Take the next exit" : "Move one lane to the left"}
          onPointerDown={tap(pressLeft)}
          onContextMenu={(e) => e.preventDefault()}
          className={cn(
            BUTTON,
            "h-[4.75rem] text-[15px] shadow-[0_5px_0_rgba(0,0,0,0.5)]",
            exit
              ? "border-[#17181b] bg-[#f6c416] text-[#17181b]"
              : "border-white/30 bg-[#2b2d33] text-white",
          )}
        >
          <Arrow />
          {exit ? "Exit" : "Lane"}
        </button>

        <button
          ref={go}
          type="button"
          aria-label="Go. Hold to drive, let go to brake."
          data-down="false"
          onPointerDown={(e) => {
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // No capture (some webviews): leaving the button lets go instead.
            }
            hold(true);
          }}
          onPointerUp={() => hold(false)}
          onPointerCancel={() => hold(false)}
          onLostPointerCapture={() => hold(false)}
          onContextMenu={(e) => e.preventDefault()}
          className={cn(
            BUTTON,
            "h-[4.75rem] border-[#0c3d22] bg-[#1fa85a] text-[26px] text-white shadow-[0_5px_0_rgba(0,0,0,0.5)] data-[down=true]:translate-y-1 data-[down=true]:bg-[#178a49] data-[down=true]:shadow-[0_1px_0_rgba(0,0,0,0.5)]",
          )}
        >
          Go
        </button>

        <button
          type="button"
          aria-label="Move one lane to the right"
          onPointerDown={tap(pressRight)}
          onContextMenu={(e) => e.preventDefault()}
          className={cn(
            BUTTON,
            "h-[4.75rem] border-white/30 bg-[#2b2d33] text-[15px] text-white shadow-[0_5px_0_rgba(0,0,0,0.5)]",
          )}
        >
          <Arrow flip />
          Lane
        </button>
      </div>
    </div>
  );
}
