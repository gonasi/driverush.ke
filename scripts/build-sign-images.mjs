#!/usr/bin/env node
/**
 * One picture file per sign page that is in search, at
 * `public/assets/road-signs/signs/<slug>.png`, and the printable chart at
 * `public/downloads/kenya-road-signs-chart.pdf`. Each is the sign as its page
 * draws it, captured from `/tools/og?sign=<slug>`, so the file and the page
 * always match. The signs in search are read from the app's own sitemap.
 *
 * Run against a built app:
 *   npm run build && PORT=5190 npm run start
 *   DEV_URL=http://localhost:5190 npm run build:sign-images
 *
 * Re-run when a sign is confirmed (it joins the sitemap) or the chart is
 * redrawn.
 */
import { execFile } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DEV_URL = process.env.DEV_URL ?? "http://localhost:5173";
const SIZE = 512;
const OUT_DIR = path.join(process.cwd(), "public/assets/road-signs/signs");
// Signs that are classes of signs, not a sign each.
const NOT_SIGNS = new Set([
  "warning-signs",
  "mandatory-signs",
  "prohibitory-signs",
  "pelican",
  "3d",
]);

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
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
  throw new Error("No Chrome found. Set CHROME_PATH to your browser binary.");
}

async function signSlugs() {
  const res = await fetch(`${DEV_URL}/sitemap.xml`);
  if (!res.ok) throw new Error(`Can't read ${DEV_URL}/sitemap.xml`);
  const xml = await res.text();
  return [...xml.matchAll(/\/road-signs\/([a-z0-9-]+)<\/loc>/g)]
    .map((m) => m[1])
    .filter((slug) => !NOT_SIGNS.has(slug));
}

async function main() {
  const chrome = await findChrome();
  const slugs = await signSlugs();
  await mkdir(OUT_DIR, { recursive: true });
  for (const slug of slugs) {
    const out = path.join(OUT_DIR, `${slug}.png`);
    await execFileAsync(chrome, [
      "--headless=new",
      "--hide-scrollbars",
      "--blink-settings=preferredColorScheme=1",
      "--force-device-scale-factor=1",
      `--window-size=${SIZE},${SIZE}`,
      "--virtual-time-budget=4000",
      `--screenshot=${out}`,
      `${DEV_URL}/tools/og?sign=${slug}`,
    ]);
    const { size } = await stat(out);
    console.log(`  ${slug.padEnd(36)} ${Math.round(size / 1024)} kB`);
  }
  console.log(`\n${slugs.length} sign pictures written to ${OUT_DIR}.`);

  // The printable chart, one A4 page, linked from the Signs page.
  const pdfDir = path.join(process.cwd(), "public/downloads");
  await mkdir(pdfDir, { recursive: true });
  const pdf = path.join(pdfDir, "kenya-road-signs-chart.pdf");
  await execFileAsync(chrome, [
    "--headless=new",
    "--no-pdf-header-footer",
    "--virtual-time-budget=6000",
    `--print-to-pdf=${pdf}`,
    `${DEV_URL}/tools/og?print=chart`,
  ]);
  const { size } = await stat(pdf);
  console.log(`Chart PDF written: ${pdf} (${Math.round(size / 1024)} kB)`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
