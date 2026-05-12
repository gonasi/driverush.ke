/**
 * Server-only read/write for the single road-sign trainer board —
 * `app/data/road-signs-pelican.json`. The `.server.ts` suffix keeps `node:fs`
 * out of the client bundle; only the `/tools/image-coords` loader/action import
 * it. Writes are dev-only — production builds ship the JSON baked into the page
 * bundle, not a writable file tree.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  DEFAULT_IMAGE_FOCUS_SETTINGS,
  ROAD_SIGNS_IMAGE_SRC,
  type ImageFocusData,
} from "./image-focus";

const DATA_FILE = path.join(
  process.cwd(),
  "app",
  "data",
  "road-signs-pelican.json",
);

/** Writes are only allowed while developing locally. */
export function isDevWriteEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function emptyBoard(): ImageFocusData {
  return {
    imageSrc: ROAD_SIGNS_IMAGE_SRC,
    imageWidth: 1920,
    imageHeight: 1080,
    settings: { ...DEFAULT_IMAGE_FOCUS_SETTINGS },
    regions: [],
  };
}

function normalize(
  raw: Partial<ImageFocusData> | null | undefined,
): ImageFocusData {
  const base = emptyBoard();
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
    // The board image is fixed — never let it drift.
    imageSrc: ROAD_SIGNS_IMAGE_SRC,
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    regions: Array.isArray(raw.regions) ? raw.regions : [],
  };
}

/** Read the board file (merged onto defaults). Returns an empty board if missing. */
export function readBoard(): ImageFocusData {
  try {
    if (!existsSync(DATA_FILE)) return emptyBoard();
    return normalize(JSON.parse(readFileSync(DATA_FILE, "utf8")));
  } catch {
    return emptyBoard();
  }
}

/** Write the board file as pretty JSON. Throws a 403 Response outside development. */
export function writeBoard(data: unknown): ImageFocusData {
  if (!isDevWriteEnabled()) {
    throw new Response("Writes are disabled outside development.", {
      status: 403,
    });
  }
  const candidate = data as Partial<ImageFocusData> | null;
  if (
    !candidate ||
    typeof candidate !== "object" ||
    !Array.isArray(candidate.regions)
  ) {
    throw new Response("Invalid board payload.", { status: 422 });
  }
  const merged = normalize(candidate);
  mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  return merged;
}
