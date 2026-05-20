/**
 * One-off generator for app/data/road-signs-3d.json.
 *
 * Reads the GLB models in public/assets/road-signs/models and the existing
 * Pelican board (app/data/road-signs-pelican.json), matches each model to a
 * sign by its NTSA Highway Code, and emits a Signs3DData board that reuses the
 * Pelican name / note / category / audio. Models with no matching Pelican entry
 * (e.g. W_13.glb — only W.13(a)/W.13(b) are catalogued) are reported and left
 * out; map them later in /tools/sign-3d.
 *
 * Run once:  node scripts/gen-signs-3d.mjs
 * After that the JSON is the source of truth (the tool edits + re-exports it).
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MODELS_DIR = path.join(ROOT, "public", "assets", "road-signs", "models");
const MODELS_BASE = "/assets/road-signs/models";
const PELICAN = path.join(ROOT, "app", "data", "road-signs-pelican.json");
const OUT = path.join(ROOT, "app", "data", "road-signs-3d.json");

const DEFAULT_SETTINGS = {
  revealMode: "auto",
  defaultRevealDelay: 4,
  initialDisplayDuration: 1,
  betweenRegionsDuration: 0.8,
  autoAdvance: true,
  autoAdvanceDelay: 3,
  randomization: "none",
  loopPlayback: true,
  startIndex: 0,
  reverseOrder: false,
  playAudio: true,
  autoRotate: true,
  autoRotateSpeed: 1.2,
};

/** GLB filename stem → candidate Highway Code strings, best-match first. */
function candidateCodes(stem) {
  // "P_27a" → "P.27a", "A_1b" → "A.1b", "M_10" → "M.10", "W_13a" → "W.13a"
  const dotted = stem.replace("_", ".");
  // Pelican catalogues W/(a)(b) variants with parens: "W.13(a)", "W.28(b)".
  const paren = dotted.replace(/([ab])$/, "($1)");
  return paren !== dotted ? [dotted, paren] : [dotted];
}

const pelican = JSON.parse(readFileSync(PELICAN, "utf8"));
/** code → region */
const byCode = new Map();
for (const r of pelican.regions) if (r.code) byCode.set(r.code, r);

const files = readdirSync(MODELS_DIR)
  .filter((f) => f.toLowerCase().endsWith(".glb"))
  .sort();

const matched = [];
const orphans = [];
for (const file of files) {
  const stem = file.replace(/\.glb$/i, "");
  const codes = candidateCodes(stem);
  const code = codes.find((c) => byCode.has(c));
  if (!code) {
    orphans.push(file);
    continue;
  }
  const region = byCode.get(code);
  matched.push({
    region,
    sign: {
      id: `sign-3d-${stem.toLowerCase()}`,
      name: region.name,
      category: region.category,
      code: region.code,
      note: region.note,
      modelSrc: `${MODELS_BASE}/${file}`,
      audioSrc: region.audioSrc,
    },
  });
}

// Keep the Pelican board's order, then renumber contiguously 0…n-1.
matched.sort((a, b) => (a.region.index ?? 0) - (b.region.index ?? 0));
const signs = matched.map((m, i) => ({ ...m.sign, index: i }));

const board = { modelsBase: MODELS_BASE, settings: DEFAULT_SETTINGS, signs };
writeFileSync(OUT, `${JSON.stringify(board, null, 2)}\n`, "utf8");

console.log(`Wrote ${signs.length} signs → ${path.relative(ROOT, OUT)}`);
if (orphans.length) {
  console.log(`Unmapped GLBs (no Pelican code): ${orphans.join(", ")}`);
}
