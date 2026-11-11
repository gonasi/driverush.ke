/**
 * A picture of the board for the guides, drawn by the same file that paints the
 * trainer's table (`full-board.ts`), so the guides and the game always show the
 * same board. Pure SVG in the server's HTML: no three.js, no image file.
 */
import {
  BOARD_LANDMARKS,
  BOARD_VIEWS,
  fullBoardSvg,
} from "~/lib/board/full-board";
import { cn } from "~/lib/utils";

/** What the numbered discs on the whole-board picture point at, in order. */
const LEGEND: { at: keyof typeof BOARD_LANDMARKS; text: string }[] = [
  { at: "dualCarriageway", text: "Dual carriageway, four lanes each way" },
  { at: "uTurnGap", text: "Central reserve, with a gap for U-turns" },
  { at: "roundabout", text: "Roundabout, four lanes round the island" },
  { at: "threeLaneRoad", text: "Three-lane road with a yellow centre line" },
  { at: "parking", text: "Controlled parking zone, with angle bays" },
  { at: "street", text: "Street joining the two bigger roads" },
  { at: "twoWayRoad", text: "Two-way road" },
  { at: "crossing", text: "Pedestrian crossing" },
  { at: "flushParking", text: "Flush parking at the kerb" },
];

const PICTURES = {
  // Lying on its side, the way it fills a wide page.
  whole: fullBoardSvg({
    seen: "east",
    marks: LEGEND.map((item, i) => ({
      ...BOARD_LANDMARKS[item.at],
      label: String(i + 1),
    })),
  }),
  roundabout: fullBoardSvg({ view: BOARD_VIEWS.roundabout }),
  parking: fullBoardSvg({ seen: "east", view: BOARD_VIEWS.parking }),
} as const;

export function BoardPicture({
  part = "whole",
  alt,
  caption,
  className,
}: {
  part?: keyof typeof PICTURES;
  /** What the picture shows, for someone who can't see it. */
  alt: string;
  caption?: string;
  className?: string;
}) {
  return (
    <figure className={cn("my-6", className)}>
      <div
        role="img"
        aria-label={alt}
        className="overflow-hidden border-2 border-ink [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: PICTURES[part] }}
      />
      {part === "whole" && (
        <ol className="m-0 mt-3 grid list-none gap-x-6 gap-y-1 p-0 text-[14px] leading-snug text-ink-2 sm:grid-cols-2">
          {LEGEND.map((item, i) => (
            <li key={item.at} className="flex gap-2">
              <span className="font-mono text-[12px] font-bold text-ink">
                {i + 1}
              </span>
              {item.text}
            </li>
          ))}
        </ol>
      )}
      {caption && (
        <figcaption className="mt-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
