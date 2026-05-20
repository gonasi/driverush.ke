/**
 * Server-only read/write for the 3D road-sign trainer board —
 * `app/data/road-signs-3d.json`. The `.server.ts` suffix keeps `node:fs` out of
 * the client bundle; only the `/tools/sign-3d` loader/action import it. Writes
 * are dev-only — production builds ship the JSON baked into the page bundle, not
 * a writable file tree.
 *
 * Also lists the GLBs present in `public/assets/road-signs/models` so the tool
 * can flag any model that isn't mapped into the board yet (e.g. `W_13.glb`).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  DEFAULT_SIGNS_3D_SETTINGS,
  emptyBoard3D,
  ROAD_SIGNS_MODELS_BASE,
  type Signs3DData,
} from "./signs-3d";

const DATA_FILE = path.join(process.cwd(), "app", "data", "road-signs-3d.json");
const MODELS_DIR = path.join(
  process.cwd(),
  "public",
  "assets",
  "road-signs",
  "models",
);
const SOUNDS_DIR = path.join(
  process.cwd(),
  "public",
  "assets",
  "road-signs",
  "sounds",
);

/** Writes are only allowed while developing locally. */
export function isDevWriteEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

function normalize(raw: Partial<Signs3DData> | null | undefined): Signs3DData {
  const base = emptyBoard3D();
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
    modelsBase: ROAD_SIGNS_MODELS_BASE,
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    signs: Array.isArray(raw.signs) ? raw.signs : [],
  };
}

/** Read the board file (merged onto defaults). Returns an empty board if missing. */
export function readBoard3D(): Signs3DData {
  try {
    if (!existsSync(DATA_FILE)) return emptyBoard3D();
    return normalize(JSON.parse(readFileSync(DATA_FILE, "utf8")));
  } catch {
    return emptyBoard3D();
  }
}

/** All GLB model paths present on disk (public URLs), sorted. */
export function listModelFiles(): string[] {
  try {
    if (!existsSync(MODELS_DIR)) return [];
    return readdirSync(MODELS_DIR)
      .filter((f) => f.toLowerCase().endsWith(".glb"))
      .sort()
      .map((f) => `${ROAD_SIGNS_MODELS_BASE}/${f}`);
  } catch {
    return [];
  }
}

/** All voice-clip paths present on disk (public URLs), sorted. */
export function listSoundFiles(): string[] {
  try {
    if (!existsSync(SOUNDS_DIR)) return [];
    return readdirSync(SOUNDS_DIR)
      .filter((f) => f.toLowerCase().endsWith(".mp3"))
      .sort()
      .map((f) => `/assets/road-signs/sounds/${f}`);
  } catch {
    return [];
  }
}

/** Write the board file as pretty JSON. Throws a 403 Response outside development. */
export function writeBoard3D(data: unknown): Signs3DData {
  if (!isDevWriteEnabled()) {
    throw new Response("Writes are disabled outside development.", {
      status: 403,
    });
  }
  const candidate = data as Partial<Signs3DData> | null;
  if (
    !candidate ||
    typeof candidate !== "object" ||
    !Array.isArray(candidate.signs)
  ) {
    throw new Response("Invalid board payload.", { status: 422 });
  }
  const merged = normalize(candidate);
  writeFileSync(DATA_FILE, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  return merged;
}

export { DEFAULT_SIGNS_3D_SETTINGS };
