/**
 * Where the task ends, said over the table while the learner drives. With the
 * finish on screen, a flag stands over it. With it off screen, which on a
 * phone is most of the time, a button sits at the edge of the view on the side
 * the finish lies, with an arrow and how far it is. Pressing it backs the view
 * off to show the car and the finish together.
 *
 * The scene works out where the finish is on the screen (`stage.ts`'s
 * `finish`). This moves the two markers with transforms, once a frame, so
 * driving never re-renders React.
 */
import * as React from "react";

import { blockSpots, finish } from "~/lib/board/stage";

import { Icon } from "~/components/brand/icon";
import { ArrowRightIcon, FinishIcon } from "~/components/brand/icons";

const EDGE = 10;

export function BoardFinishCue({
  parks,
  onPeek,
}: {
  /** The task ends in a parking bay. */
  parks: boolean;
  /** Show the car and the finish together. */
  onPeek: () => void;
}) {
  const root = React.useRef<HTMLDivElement>(null);
  const flag = React.useRef<HTMLDivElement>(null);
  const chip = React.useRef<HTMLButtonElement>(null);
  const arrow = React.useRef<HTMLSpanElement>(null);
  const metres = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    let frame = 0;
    let n = 0;
    // The clear part of the view: under the task and its messages, above the
    // joystick, and left of the minimap and the zoom buttons.
    let top = 150;
    let low = 400;
    let right = 300;
    let shown = "";
    const place = () => {
      frame = requestAnimationFrame(place);
      const box = root.current;
      const f = flag.current;
      const c = chip.current;
      if (!box || !f || !c) return;
      const w = box.clientWidth;
      const h = box.clientHeight;
      // These change size as cards open and close, so look again a few times
      // a second.
      if (n % 15 === 0) {
        const edge = (name: string) =>
          document
            .querySelector(`[data-board-${name}]`)
            ?.getBoundingClientRect();
        top = Math.min((edge("hud-left")?.bottom ?? 150) + 8, h * 0.45);
        low = Math.max(top + 70, (edge("stick")?.top ?? h - 232) - 8);
        right = (edge("minimap")?.left ?? w) - 8;
      }
      n += 1;
      if (!finish.on) {
        f.style.visibility = "hidden";
        c.style.visibility = "hidden";
        return;
      }
      const x = finish.x * w;
      const y = finish.y * h;
      const inView = x > 24 && x < right && y > top + 30 && y < low;
      f.style.visibility = inView ? "visible" : "hidden";
      c.style.visibility = inView ? "hidden" : "visible";
      if (inView) {
        f.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
        return;
      }
      // Off screen: sit on the edge of the clear part of the view, on the line
      // from its middle to the finish.
      const halfW = c.offsetWidth / 2;
      const halfH = c.offsetHeight / 2;
      const x0 = EDGE + halfW;
      const x1 = Math.max(x0 + 2, right - halfW);
      const cx = (x0 + x1) / 2;
      const cy = (top + low) / 2;
      const dx = x - cx;
      const dy = y - cy;
      const reachX = (x1 - x0) / 2;
      const reachY = Math.max(1, (low - top) / 2 - halfH);
      const t = Math.min(
        1,
        reachX / Math.max(1, Math.abs(dx)),
        reachY / Math.max(1, Math.abs(dy)),
      );
      const px = cx + dx * t;
      let py = cy + dy * t;
      // Never over an upside-down car: slide down the edge, or up, to clear it.
      for (const spot of blockSpots) {
        const bx = spot.x * w;
        const by = spot.y * h;
        const clearY = halfH + 34;
        if (Math.abs(bx - px) > halfW + 30 || Math.abs(by - py) > clearY) {
          continue;
        }
        const below = by + clearY;
        py = below + halfH <= low ? below : by - clearY;
      }
      c.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -50%)`;
      if (arrow.current) {
        arrow.current.style.transform = `rotate(${Math.atan2(dy, dx).toFixed(3)}rad)`;
      }
      // To the nearest 5 m: it is a guide, and a steady number reads better.
      const text = `${Math.max(5, Math.round(finish.metres / 5) * 5)} m`;
      if (metres.current && text !== shown) {
        shown = text;
        metres.current.textContent = text;
      }
    };
    frame = requestAnimationFrame(place);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={root}
      className="pointer-events-none absolute inset-0 z-[15] overflow-hidden"
    >
      <div
        ref={flag}
        aria-hidden
        className="absolute left-0 top-0 flex flex-col items-center will-change-transform"
        style={{ visibility: "hidden" }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-[#0c3d1f] bg-[#5fe08a] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0c3d1f] shadow-[0_3px_0_rgba(0,0,0,0.45)]">
          <Icon icon={FinishIcon} size={14} />
          {parks ? "Park here" : "Stop here"}
        </span>
        <span className="h-3 w-0.5 bg-[#5fe08a]" />
      </div>

      <button
        ref={chip}
        type="button"
        aria-label="Show where this task ends"
        onClick={onPeek}
        className="pointer-events-auto absolute left-0 top-0 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[#0c3d1f] bg-[#5fe08a] py-1.5 pl-2 pr-3.5 text-[#0c3d1f] shadow-[0_4px_0_rgba(0,0,0,0.45)] outline-none will-change-transform focus-visible:border-white"
        style={{ visibility: "hidden" }}
      >
        <span
          ref={arrow}
          className="inline-flex size-7 items-center justify-center rounded-full bg-[#0c3d1f] text-[#5fe08a]"
        >
          <Icon icon={ArrowRightIcon} size={16} />
        </span>
        <span className="grid text-left leading-none">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Finish
          </span>
          <span
            ref={metres}
            className="mt-0.5 text-[13px] font-bold tabular-nums"
          />
        </span>
      </button>
    </div>
  );
}
