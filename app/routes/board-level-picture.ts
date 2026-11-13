/**
 * A level's picture, as an SVG file: `/model-town-board/levels/<level id>.svg`.
 * Drawn on the server from the same board data the game uses, so a picture can
 * never fall behind the board, and the pages that show the pictures carry
 * neither the drawings nor the route finder. Each is drawn once and kept.
 */
import type { LoaderFunctionArgs } from "react-router";

import { levelById } from "~/lib/board/curriculum";
import { fullBoardSvg } from "~/lib/board/full-board";
import { levelPreview } from "~/lib/board/level-preview";

const drawn = new Map<string, string>();

export function loader({ params }: LoaderFunctionArgs) {
  const file = params.file ?? "";
  const id = file.endsWith(".svg") ? file.slice(0, -4) : "";
  const level = id ? levelById(id) : undefined;
  if (!level) throw new Response("Not found", { status: 404 });
  let svg = drawn.get(level.id);
  if (!svg) {
    svg = fullBoardSvg(levelPreview(level));
    drawn.set(level.id, svg);
  }
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // The address carries a version (`levelPictureHref`), so a picture can
      // be kept for a long time and still change when the board does.
      "Cache-Control":
        "public, max-age=2592000, stale-while-revalidate=31536000",
    },
  });
}
