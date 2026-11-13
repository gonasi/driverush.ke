#!/usr/bin/env node
/**
 * Show how a video looks inside TikTok on a tall phone.
 *
 *   node preview.mjs .work/05-parking-unit/video.mp4 1 12 30
 *     → .work/05-parking-unit/phone.png, one picture per time, side by side
 *
 * It cuts the sides off the way an iPhone 15 Pro Max does (the phone is
 * taller than 9:16, so the video is zoomed to fill the height) and paints
 * red over what TikTok covers: the search bar on top, the buttons down the
 * right, the reaction bubbles at the lower left, the username and caption at the bottom. Positions were measured
 * from a screenshot of the app. Anything under red, or cut off, is lost.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

const [video, ...times] = process.argv.slice(2);
const dir = path.dirname(video);
// The video area on the phone is 590 wide by 1165 tall for a 1080x1920 file.
const W = Math.round((1920 * 590) / 1165 / 2) * 2;
const X = (1080 - W) / 2;
const zones = [
  `drawbox=x=0:y=0:w=iw:h=${Math.round(1920 * 0.12)}:color=red@0.45:t=fill`,
  `drawbox=x=iw*0.86:y=${Math.round(1920 * 0.52)}:w=iw*0.14:h=${Math.round(1920 * 0.4)}:color=red@0.45:t=fill`,
  `drawbox=x=0:y=${Math.round(1920 * 0.7)}:w=iw*0.15:h=${Math.round(1920 * 0.13)}:color=red@0.45:t=fill`,
  `drawbox=x=0:y=${Math.round(1920 * 0.865)}:w=iw:h=${Math.round(1920 * 0.135)}:color=red@0.45:t=fill`,
].join(",");
const shots = times.map((t, i) => {
  const out = path.join(dir, `_p${i}.png`);
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-ss", String(t), "-i", video, "-frames:v", "1",
    "-vf", `crop=${W}:1920:${X}:0,${zones},scale=${process.env.W ?? 300}:-1`, out,
  ]);
  return out;
});
const out = path.join(dir, "phone.png");
if (shots.length > 1) {
  execFileSync("ffmpeg", ["-v", "error", "-y", ...shots.flatMap((s) => ["-i", s]), "-filter_complex", `hstack=${shots.length}`, out]);
} else execFileSync("cp", [shots[0], out]);
console.log(out);
