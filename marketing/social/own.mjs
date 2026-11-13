/**
 * Captions on a video you recorded yourself.
 *
 *   node own.mjs <name>          # reads own/<name>.mjs, writes out/<name>.mp4
 *
 * The recording (full screen, 9:16) is shrunk into the same phone-shaped
 * window the recorded videos use, so TikTok's bars and buttons never cover
 * it, and the captions go in the strip above it. Captions are drawn by
 * stage.html, so they look the same as everywhere else. After the recording
 * ends its last frame holds under the closing call to action.
 *
 * A spec: { src, captions: [[from, to, text], ...], cta, ctaSeconds, outroSeconds }
 * Times are seconds into the recording. *Stars* mark the red words.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
if (!name) throw new Error("usage: node own.mjs <name>");
const spec = (
  await import(pathToFileURL(path.join(here, "own", `${name}.mjs`)))
).default;

// The window from capture.mjs (TIKTOK_WIN), in CSS px of the 360x640 frame.
const WIN = { x: 68, y: 140, w: 224, h: 400 };
const K = 3; // CSS px to video px
const work = path.join(here, ".work", `own-${name}`);
mkdirSync(work, { recursive: true });
mkdirSync(path.join(here, "out"), { recursive: true });

const probe = (args) =>
  execFileSync("ffprobe", ["-v", "error", ...args, "-of", "csv=p=0", spec.src])
    .toString()
    .trim();
const length = Number(probe(["-show_entries", "format=duration"]));
const ctaSeconds = spec.ctaSeconds ?? 2.4;
const outroSeconds = spec.outroSeconds ?? 3.4;
const total = length + ctaSeconds + outroSeconds;

// Everything shown over the video, as timed layers.
const layers = [
  ...spec.captions.map(([from, to, text]) => ({ from, to, text })),
  { from: length, to: length + ctaSeconds, text: spec.cta },
  { from: length + ctaSeconds, to: total, outro: true },
];

// ---- draw the frame and each caption as a transparent picture ----------------
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: K,
});
await page.goto(pathToFileURL(path.join(here, "stage.html")).href);
await page.evaluate(() => document.fonts.ready);
await page.evaluate(
  (win) => window.stage.layout({ win, scale: 1, appH: 640, viewY: 0 }),
  WIN,
);
await page.addStyleTag({
  content: "#app{display:none} #win{background:transparent}",
});

// The frame: dark everywhere except a rounded hole where the video plays.
await page.evaluate(() =>
  window.stage.frame({ text: "", textT: 1, outro: -1 }),
);
await page.addStyleTag({
  content:
    "#win{box-shadow:0 0 0 1px rgb(255 255 255 / .1),0 0 0 400px #0b0b0d} html,body{background:transparent}",
});
const frame = path.join(work, "frame.png");
await page.screenshot({ path: frame, omitBackground: true });

await page.addStyleTag({ content: "#win{display:none}" });
for (const [i, layer] of layers.entries()) {
  await page.evaluate(
    (l) =>
      window.stage.frame({
        text: l.outro ? "" : l.text,
        textT: 1,
        outro: l.outro ? 1 : -1,
      }),
    layer,
  );
  layer.png = path.join(work, `layer${i}.png`);
  await page.screenshot({ path: layer.png, omitBackground: true });
}
await browser.close();

// ---- put it together ------------------------------------------------------------
const W = WIN.w * K;
const H = WIN.h * K;
const hold = (ctaSeconds + outroSeconds).toFixed(3);
const graph = [
  // Fill the window (same 9:16 shape, a hair of overflow cropped).
  `[0:v]fps=30,scale=-2:${H},crop=${W}:${H},tpad=stop_mode=clone:stop_duration=${hold},setsar=1[app]`,
  `color=c=#0b0b0d:s=1080x1920:r=30:d=${total.toFixed(3)}[bg]`,
  `[bg][app]overlay=${WIN.x * K}:${WIN.y * K}:shortest=1[v0]`,
  `[v0][1:v]overlay=0:0[v1]`,
  ...layers.map(
    (l, i) =>
      `[v${i + 1}][${i + 2}:v]overlay=0:0:enable='between(t,${l.from},${l.to})'[v${i + 2}]`,
  ),
  `[0:a]apad=whole_dur=${total.toFixed(3)}[a]`,
];
const out = path.join(here, "out", `${name}.mp4`);
execFileSync(
  "ffmpeg",
  [
    "-v",
    "error",
    "-y",
    "-i",
    spec.src,
    "-loop",
    "1",
    "-i",
    frame,
    ...layers.flatMap((l) => ["-loop", "1", "-i", l.png]),
    "-filter_complex",
    graph.join(";"),
    "-map",
    `[v${layers.length + 1}]`,
    "-map",
    "[a]",
    "-t",
    total.toFixed(3),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    out,
  ],
  { stdio: "inherit" },
);
// Cover picture: the first caption over the first sign.
execFileSync("ffmpeg", [
  "-v",
  "error",
  "-y",
  "-ss",
  String(spec.cover ?? 1),
  "-i",
  out,
  "-frames:v",
  "1",
  "-q:v",
  "3",
  out.replace(/\.mp4$/, ".jpg"),
]);
console.log(`${path.relative(here, out)}  ${total.toFixed(1)} s`);
