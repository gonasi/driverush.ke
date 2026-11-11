/**
 * Pins standing on the table for "find it on the board": one over each thing
 * the deck showed, lettered and not named, so the learner has to know which is
 * which. Like the car picks, the scene says where each is on the screen
 * (`stage.ts`'s `picks`) and the buttons are moved by transforms once a frame.
 *
 * It is drawn over the whole screen, above the level's panel, because the
 * panel's own box is only the bottom of it.
 */
import * as React from "react";
import { createPortal } from "react-dom";

import type { FindSpot } from "~/lib/board/curriculum-content";
import { picks } from "~/lib/board/stage";
import { cn } from "~/lib/utils";

const LETTERS = "ABCDEFGH";

export function BoardSpotPicks({
  spots,
  wrong,
  onPick,
}: {
  spots: readonly FindSpot[];
  /** The pins already tried and found wrong. */
  wrong: readonly string[];
  onPick: (id: string) => void;
}) {
  const root = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let frame = 0;
    const place = () => {
      frame = requestAnimationFrame(place);
      const box = root.current;
      if (!box) return;
      const w = box.clientWidth;
      const h = box.clientHeight;
      for (const button of box.querySelectorAll<HTMLElement>("[data-spot]")) {
        const at = picks.find((pick) => pick.id === button.dataset.spot);
        if (!at) {
          button.style.visibility = "hidden";
          continue;
        }
        button.style.visibility = "visible";
        button.style.transform = `translate(${(at.x * w).toFixed(1)}px, ${(at.y * h).toFixed(1)}px) translate(-50%, -100%)`;
      }
    };
    frame = requestAnimationFrame(place);
    return () => cancelAnimationFrame(frame);
  }, []);

  return createPortal(
    <div
      ref={root}
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      {spots.map((spot, i) => {
        const tried = wrong.includes(spot.id);
        return (
          <button
            key={spot.id}
            type="button"
            data-spot={spot.id}
            disabled={tried}
            onClick={() => onPick(spot.id)}
            aria-label={`Pin ${LETTERS[i]}`}
            style={{ visibility: "hidden" }}
            className="pointer-events-auto absolute left-0 top-0 flex min-h-11 min-w-11 flex-col items-center justify-end pb-0.5 outline-none"
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full border-2 border-[#17181b] font-mono text-[15px] font-bold leading-none shadow-[0_3px_0_rgba(0,0,0,0.45)]",
                tried
                  ? "bg-[#3a3c42] text-white/60"
                  : "bg-[#f6c416] text-[#17181b]",
              )}
            >
              {LETTERS[i]}
            </span>
            <span
              aria-hidden
              className={cn(
                "-mt-px size-0 border-x-[6px] border-t-[8px] border-x-transparent",
                tried ? "border-t-[#3a3c42]" : "border-t-[#f6c416]",
              )}
            />
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
