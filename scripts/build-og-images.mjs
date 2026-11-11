#!/usr/bin/env node
/**
 * Capture the social cards from `/tools/og` into `public/og/*.png`.
 *
 * The cards are authored as real app components (same fonts, same colours,
 * real sprite crops off the Pelican chart, real GLB models in the 3D card),
 * so this script just points headless Chrome at each one and takes a picture.
 * No image service, no runtime rendering, no cold starts: the PNGs ship as
 * static files and only change when we redesign a card.
 *
 * Usage:
 *   npm run dev                    # terminal 1, the cards render from the app
 *   npm run build:og               # terminal 2
 *   npm run build:og -- signs3d    # just one card
 *   DEV_URL=http://localhost:3000 npm run build:og
 *
 * Requires Google Chrome. `--enable-unsafe-swiftshader` is what lets the 3D
 * card render WebGL without a GPU; the flag only ever runs on a developer's
 * machine against localhost, never in production.
 */
import { execFile } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "og");
const DEV_URL = process.env.DEV_URL ?? "http://localhost:5173";

const WIDTH = 1200;
const HEIGHT = 630;
/**
 * Pixels per CSS pixel. Social cards stay at 1 (1200×630 is what the sites
 * want). `SCALE=2` is for the board still, which is shown large on retina
 * phones and has to stay sharp there.
 */
const SCALE = Number(process.env.SCALE ?? 1);

/**
 * Keep in step with OG_CARDS in `app/lib/og-cards.ts`.
 *
 * `minBytes` is a blank-frame tripwire. The 3D card sometimes screenshots
 * before SwiftShader has painted the models, and the failure is silent: you
 * get a perfectly valid PNG with three empty tiles. An empty card compresses
 * far smaller than one with three rendered signs in it, so a size floor
 * catches it and we retry rather than shipping a blank preview.
 */
const CARDS = [
  // The 3D still of the board game. It comes first because the board's social
  // card below shows it. After capturing it, compress it and build again
  // before capturing "board":
  // Capture it at twice the size, then make a large and a small file, which
  // `board-thumb.tsx` offers with srcset:
  //   SCALE=2 DEV_URL=http://localhost:5190 npm run build:og -- board-3d
  //   sips -s format jpeg -s formatOptions 82 -Z 2400 public/og/board-3d.png \
  //     --out public/assets/board/poster-2400.jpg
  //   sips -s format jpeg -s formatOptions 78 -Z 1200 public/og/board-3d.png \
  //     --out public/assets/board/poster.jpg && rm public/og/board-3d.png
  { id: "board-3d", settleMs: 25000, minBytes: 200_000 },
  { id: "default", settleMs: 2500, minBytes: 20_000 },
  { id: "board", settleMs: 3500, minBytes: 20_000 },
  { id: "pelican", settleMs: 3500, minBytes: 20_000 },
  // WebGL through SwiftShader plus three GLB loads: this one needs room.
  { id: "signs3d", settleMs: 20000, minBytes: 50_000 },
  { id: "road-signs", settleMs: 3500, minBytes: 20_000 },
  // The homepage's 3D still rather than a social card. Compress it afterwards:
  //   sips -s format jpeg -s formatOptions 72 -Z 640 public/og/poster-3d.png \
  //     --out public/assets/road-signs/3d-poster.jpg && rm public/og/poster-3d.png
  { id: "poster-3d", settleMs: 20000, minBytes: 15_000 },
];

/** How many times to re-shoot a card that comes back under its floor. */
const MAX_ATTEMPTS = 4;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

async function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await stat(candidate);
      return candidate;
    } catch {
      // try the next one
    }
  }
  throw new Error(
    `No Chrome found. Set CHROME_PATH to your browser binary. Looked in:\n  ${CHROME_CANDIDATES.join("\n  ")}`,
  );
}

async function assertDevServer() {
  try {
    const res = await fetch(`${DEV_URL}/tools/og`, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    throw new Error(
      `Can't reach ${DEV_URL}/tools/og (${err.message}). Start the app first:\n  npm run dev`,
    );
  }
}

async function capture(chrome, card, attempt = 1) {
  const out = path.join(OUT_DIR, `${card.id}.png`);
  const url = `${DEV_URL}/tools/og?card=${encodeURIComponent(card.id)}`;
  const settleMs = card.settleMs * attempt;
  await execFileAsync(
    chrome,
    [
      "--headless=new",
      "--enable-unsafe-swiftshader",
      "--hide-scrollbars",
      // Cards are designed in the light theme. Without this they follow whatever
      // the machine is set to, and a dark-mode capture inverts every card.
      "--blink-settings=preferredColorScheme=1",
      // Without these the shot can land before WebGL has composited, which
      // shows up as an empty white tile on the 3D card.
      "--run-all-compositor-stages-before-draw",
      "--disable-new-content-rendering-timeout",
      `--force-device-scale-factor=${SCALE}`,
      `--window-size=${WIDTH},${HEIGHT}`,
      // Lets the page's own timers, fonts and model loads finish before the
      // shot without us guessing at a wall-clock sleep.
      `--virtual-time-budget=${settleMs}`,
      `--screenshot=${out}`,
      url,
    ],
    { maxBuffer: 1024 * 1024 * 16 },
  );
  const { size } = await stat(out);
  return { out, size };
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const wanted = only.length ? CARDS.filter((c) => only.includes(c.id)) : CARDS;

  if (only.length && wanted.length !== only.length) {
    const known = CARDS.map((c) => c.id).join(", ");
    throw new Error(`Unknown card. Known cards: ${known}`);
  }

  const chrome = await findChrome();
  await assertDevServer();
  await mkdir(OUT_DIR, { recursive: true });

  const failed = [];

  for (const card of wanted) {
    process.stdout.write(`  ${card.id.padEnd(12)} `);
    let size = 0;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      // Each retry waits longer: the failure mode is "not painted yet", so
      // more time is exactly the fix.
      ({ size } = await capture(chrome, card, attempt));
      if (size >= card.minBytes) break;
      process.stdout.write(`(blank, retry ${attempt}) `);
      if (attempt === MAX_ATTEMPTS) failed.push(card.id);
    }
    console.log(`${(size / 1024).toFixed(0)} kB  →  public/og/${card.id}.png`);
  }

  if (failed.length) {
    throw new Error(
      `Rendered blank after ${MAX_ATTEMPTS} attempts: ${failed.join(", ")}.\n` +
        `Check the card at ${DEV_URL}/tools/og?card=${failed[0]} in a real browser.`,
    );
  }

  console.log(`\n${wanted.length} card(s) captured at ${WIDTH}×${HEIGHT}.`);
}

main().catch((err) => {
  console.error(`\n${err.message}\n`);
  process.exit(1);
});
