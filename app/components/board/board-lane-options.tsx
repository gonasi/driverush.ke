/**
 * One road's lane options, for the lane options guide: a picture of the cars
 * lined up the way the lesson sets them out, one per option, each with the
 * line it takes through the roundabout, and a table of what each lane may do.
 * Both come from the data the trainer's lane options levels use
 * (`laneOptions`, `queueCars`), so the page and the game cannot disagree.
 */
import { levelHref } from "~/lib/board-guides";
import { COURSE_LEVELS } from "~/lib/board/curriculum";
import { fullBoardSvg, RING_R } from "~/lib/board/full-board";
import { ARMS } from "~/lib/board/geometry";
import { queueCars } from "~/lib/board/lane-queue";
import { laneOptions } from "~/lib/board/lessons";

import { UNSURE_NOTE } from "~/components/board/board-playback";
import { MDX } from "~/components/brand/mdx-components";

type Road = "S" | "W";

const ROADS: Record<Road, { name: string; code: string; level: string }> = {
  S: { name: "four-lane road", code: "2124", level: "four-lane" },
  W: { name: "three-lane road", code: "215", level: "three-lane" },
};

const pictures = new Map<Road, string>();

/** The line-up and every way through, framed on the road and the roundabout. */
function picture(arm: Road): string {
  const cached = pictures.get(arm);
  if (cached) return cached;
  const cars = queueCars(arm);
  const xs = cars.map((c) => c.start.x);
  const zs = cars.map((c) => c.start.z);
  const pad = 6;
  const view = {
    x0: Math.min(-RING_R - pad, ...xs.map((x) => x - pad)),
    x1: Math.max(RING_R + pad, ...xs.map((x) => x + pad)),
    z0: Math.min(-RING_R - pad, ...zs.map((z) => z - pad)),
    z1: Math.max(RING_R + pad, ...zs.map((z) => z + pad)),
  };
  const svg = fullBoardSvg({
    view,
    cars: cars.map((c) => ({ ...c.start, color: c.paint })),
    routes: cars.map((c) => ({
      points: c.option.route.points,
      color: c.paint,
      width: 0.7,
      opacity: 0.85,
      arrow: true,
    })),
  });
  pictures.set(arm, svg);
  return svg;
}

export function BoardLaneOptions({ arm }: { arm: Road }) {
  const road = ROADS[arm];
  const lanes = Array.from({ length: ARMS[arm].lanes }, (_, i) => i + 1);
  const index = COURSE_LEVELS.findIndex((l) => l.id === road.level);
  const cars = queueCars(arm);
  return (
    <>
      <figure className="my-6">
        <div
          role="img"
          aria-label={`The ${road.name} lined up at the roundabout: one car for each lane option, ${cars.length} in all, each with the line it takes. Option code ${road.code}.`}
          className="overflow-hidden border-2 border-ink [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: picture(arm) }}
        />
        <figcaption className="mt-2 text-[14px] text-ink-3">
          One car for each option on the {road.name}, {cars.length} in all. Each
          line is the way that car goes.
        </figcaption>
      </figure>
      <MDX.table>
        <thead>
          <tr>
            <MDX.th>Lane</MDX.th>
            <MDX.th>Options</MDX.th>
            <MDX.th>What it may do</MDX.th>
          </tr>
        </thead>
        <tbody>
          {lanes.map((lane) => {
            const options = laneOptions(arm, lane);
            return (
              <tr key={lane}>
                <MDX.td>{lane}</MDX.td>
                <MDX.td>{options.length}</MDX.td>
                <MDX.td>
                  {options.map((option, i) => (
                    <span key={option.id}>
                      {i > 0 ? "; " : ""}
                      {option.label} ({option.degrees})
                      {option.confirmed ? "" : "*"}
                    </span>
                  ))}
                </MDX.td>
              </tr>
            );
          })}
        </tbody>
      </MDX.table>
      {lanes.some((lane) =>
        laneOptions(arm, lane).some((option) => !option.confirmed),
      ) ? (
        <MDX.p className="text-[15px] text-ink-3">* {UNSURE_NOTE}</MDX.p>
      ) : null}
      {index >= 0 ? (
        <MDX.p>
          Drive it:{" "}
          <MDX.a href={levelHref(road.level)}>
            level {index + 1}, {COURSE_LEVELS[index].title}
          </MDX.a>
          . Every car is set out at once, and you take one at a time to its
          place.
        </MDX.p>
      ) : null}
    </>
  );
}
