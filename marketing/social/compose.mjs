#!/usr/bin/env node
/**
 * Turn a recording into the finished video: picture from capture.mjs, the
 * app's own sounds laid where they played, and a music bed underneath.
 *
 *   node compose.mjs 07-name-this-sign      → out/07-name-this-sign.mp4 + .jpg
 *   node compose.mjs                        → every recording in .work/
 *   MUSIC=0 node compose.mjs                → app sounds only
 */
import { execFile } from "node:child_process";
import { access, mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(HERE, "..", "..", "public");
const OUT = path.join(HERE, "out");
const exists = (p) => access(p).then(() => true, () => false);

async function musicFile(letter) {
  if (process.env.MUSIC === "0") return null;
  for (const ext of ["mp3", "m4a", "wav"]) {
    const p = path.join(HERE, "music", `${letter}.${ext}`);
    if (await exists(p)) return p;
  }
  return null;
}

export async function compose(id) {
  const work = path.join(HERE, ".work", id);
  const meta = JSON.parse(await readFile(path.join(work, "cues.json"), "utf8"));
  const total = meta.seconds;
  const args = ["-v", "error", "-y", "-i", path.join(work, "video.mp4")];
  const filters = [];
  const voices = [];
  meta.cues.forEach((cue, i) => {
    args.push("-i", path.join(PUBLIC, cue.file));
    const n = i + 1;
    const chain = [];
    if (cue.stop !== undefined) {
      const len = Math.max(0.05, cue.stop - cue.t);
      chain.push(`atrim=0:${len.toFixed(3)}`, `afade=t=out:st=${Math.max(0, len - 0.06).toFixed(3)}:d=0.06`);
    }
    chain.push("aformat=sample_rates=48000:channel_layouts=stereo", `volume=${cue.volume}`);
    chain.push(`adelay=${Math.round(cue.t * 1000)}:all=1`);
    filters.push(`[${n}:a]${chain.join(",")}[c${i}]`);
    voices.push(`[c${i}]`);
  });
  // Silence the length of the video, so the mix never ends early.
  filters.push(`anullsrc=r=48000:cl=stereo,atrim=0:${total.toFixed(3)}[sil]`);
  filters.push(`[sil]${voices.join("")}amix=inputs=${voices.length + 1}:normalize=0:duration=first[app]`);

  const music = await musicFile(meta.music);
  if (music) {
    args.push("-stream_loop", "-1", "-i", music);
    const m = meta.cues.length + 1;
    // The bed sits low, dips further under the app's sounds, and steps back
    // for the end card.
    filters.push("[app]asplit=2[app1][key]");
    filters.push(
      `[${m}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${total.toFixed(3)},volume=0.36,` +
        `afade=t=in:st=0:d=0.25,afade=t=out:st=${(total - 1.1).toFixed(3)}:d=1.1[bed]`,
    );
    filters.push("[bed][key]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[ducked]");
    filters.push("[app1][ducked]amix=inputs=2:normalize=0:duration=first[mix]");
  } else {
    filters.push("[app]anull[mix]");
  }
  filters.push("[mix]loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000[out]");

  const dir = path.join(OUT, meta.dir ?? "");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${id}.mp4`);
  await run("ffmpeg", [
    ...args,
    "-filter_complex", filters.join(";"),
    "-map", "0:v", "-map", "[out]",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-t", total.toFixed(3), "-movflags", "+faststart",
    file,
  ], { maxBuffer: 1 << 26 });
  // The cover is the hook, a second in.
  await run("ffmpeg", ["-v", "error", "-y", "-ss", String(meta.cover ?? 1.2), "-i", file, "-frames:v", "1", "-q:v", "2", "-pix_fmt", "yuvj420p", path.join(dir, `${id}.jpg`)]);
  console.log(`  out/${meta.dir ? meta.dir + "/" : ""}${id}.mp4  ${total.toFixed(1)} s  ${meta.cues.length} sounds${music ? `  music ${meta.music}` : ""}`);
}

const ids = process.argv.slice(2);
const all = ids.length
  ? ids
  : (await readdir(path.join(HERE, ".work"), { withFileTypes: true }))
      .filter((d) => d.isDirectory() && /^\d\d-/.test(d.name))
      .map((d) => d.name)
      .sort();
for (const id of all) await compose(id);
