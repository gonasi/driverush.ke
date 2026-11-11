/**
 * The cars of a lane options level that can be taken now, each with a button
 * standing over it on the table. The camera pad lies over the canvas, so a tap
 * on the car itself would never arrive: these are the taps.
 *
 * The scene works out where each car is on the screen (`stage.ts`'s `picks`).
 * This moves the buttons with transforms, once a frame, so sliding and zooming
 * the view never re-renders React.
 */
import * as React from "react";

import type { QueueCar } from "~/lib/board/lane-queue";
import { picks } from "~/lib/board/stage";

export function BoardCarPicks({
  cars,
  onPick,
}: {
  /** The front waiting car of each lane. */
  cars: readonly QueueCar[];
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
      for (const button of box.querySelectorAll<HTMLElement>("[data-pick]")) {
        const at = picks.find((pick) => pick.id === button.dataset.pick);
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

  return (
    <div
      ref={root}
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      {cars.map((car) => (
        <button
          key={car.id}
          type="button"
          data-pick={car.id}
          onClick={() => onPick(car.id)}
          aria-label={`Drive the lane ${car.lane} car: ${car.option.label}`}
          style={{ visibility: "hidden" }}
          className="pointer-events-auto absolute left-0 top-0 flex min-h-11 min-w-8 flex-col items-center justify-end pb-0.5 outline-none"
        >
          <span className="rounded-md border-2 border-[#17181b] bg-[#f6c416] px-1.5 py-0.5 font-mono text-[11px] font-bold leading-none text-[#17181b]">
            {car.lane}
          </span>
          <span
            aria-hidden
            className="-mt-px size-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-[#f6c416]"
          />
        </button>
      ))}
    </div>
  );
}
