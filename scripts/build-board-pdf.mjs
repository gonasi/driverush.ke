#!/usr/bin/env node
/**
 * The Model Town Board questions as a PDF to print, at
 * `public/downloads/model-town-board-questions.pdf`. Printed by headless
 * Chrome from `/tools/og?print=board-questions`, which draws the same question
 * data as the questions page, so the file and the page always match.
 *
 * Run against a built app:
 *   npm run build && PORT=5190 npm run start
 *   DEV_URL=http://localhost:5190 npm run build:board-pdf
 *
 * Re-run whenever `app/data/board-questions.ts` changes.
 */
import { execFile } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DEV_URL = process.env.DEV_URL ?? "http://localhost:5173";

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

async function main() {
  const chrome = await findChrome();
  const dir = path.join(process.cwd(), "public/downloads");
  await mkdir(dir, { recursive: true });
  const pdf = path.join(dir, "model-town-board-questions.pdf");
  await execFileAsync(chrome, [
    "--headless=new",
    "--no-pdf-header-footer",
    "--virtual-time-budget=6000",
    `--print-to-pdf=${pdf}`,
    `${DEV_URL}/tools/og?print=board-questions`,
  ]);
  const { size } = await stat(pdf);
  console.log(
    `Board questions PDF written: ${pdf} (${Math.round(size / 1024)} kB)`,
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
