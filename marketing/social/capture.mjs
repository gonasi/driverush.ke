#!/usr/bin/env node
/**
 * Record one video from the built app.
 *
 *   npm run build && PORT=5191 npm run start      # in the repo root
 *   node capture.mjs 13-across-the-board           # in marketing/social
 *
 * Writes `.work/<id>/video.mp4` (picture only) and `.work/<id>/cues.json` (which
 * sound played when). `compose.mjs` turns the two into `out/<id>.mp4`.
 *
 * How it works: the stage (`stage.html`) is served on the app's own origin and
 * holds the app in an iframe. Time is stepped by hand, 1/30 s per frame, with
 * a screenshot after each step, so every frame is sharp and the motion is even
 * however long the 3D takes to draw. Each shot loads in real time in a fresh
 * window, and shots are joined with hard cuts, like clips in a phone edit.
 */
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE ?? "http://localhost:5191";
export const FPS = 30;
const OUTRO_SECONDS = 3.6;
/** The frame a video is recorded in, CSS px times `dsf`: 1080x1920 unless the
 *  spec gives its own (`frame`), as the 4:5 LinkedIn film does. */
const FRAME = { w: 360, h: 640, dsf: 3 };
/**
 * The app window: the part of the frame no phone crops and no TikTok bar or
 * button covers, in CSS px of the 360x640 frame. Measured from a screenshot
 * of TikTok on an iPhone 15 Pro Max: the sides lose about 5% each, the top
 * 12% is under the search bar, the bottom 14% is under the username and
 * caption, buttons run down the right edge of the lower half, and reaction
 * bubbles float up the left edge near the bottom. So the window is a centred,
 * phone-shaped box clear of all four.
 */
const TIKTOK_WIN = { x: 68, y: 140, w: 224, h: 400 };

/** Runs in every document before its own scripts. */
function pageInit() {
  // ---- which sound played when -------------------------------------------
  const tags = new WeakMap();
  window.__cues = [];
  const arrayBuffer = Response.prototype.arrayBuffer;
  Response.prototype.arrayBuffer = function () {
    const url = this.url;
    return arrayBuffer.call(this).then((b) => {
      tags.set(b, url);
      return b;
    });
  };
  if (window.BaseAudioContext) {
    const P = BaseAudioContext.prototype;
    const decode = P.decodeAudioData;
    P.decodeAudioData = function (data, ok, err) {
      const url = tags.get(data);
      const tag = (buf) => {
        if (url && buf) tags.set(buf, url);
        return buf;
      };
      const p = decode.call(
        this,
        data,
        ok ? (b) => ok(tag(b)) : undefined,
        err,
      );
      return p ? p.then(tag) : p;
    };
    const S = AudioBufferSourceNode.prototype;
    const start = S.start;
    const stop = S.stop;
    let n = 0;
    S.start = function (...a) {
      const url = tags.get(this.buffer);
      if (url) {
        this.__cue = ++n;
        window.__cues.push({ id: this.__cue, type: "start", url });
      }
      return start.apply(this, a);
    };
    S.stop = function (...a) {
      if (this.__cue) window.__cues.push({ id: this.__cue, type: "stop" });
      return stop.apply(this, a);
    };
  }
  // ---- CSS animations follow the stepped clock ---------------------------
  const born = new WeakMap();
  window.__sync = () => {
    const now = performance.now();
    for (const a of document.getAnimations()) {
      try {
        let b = born.get(a);
        if (b === undefined) {
          b = now - (Number(a.currentTime) || 0);
          born.set(a, b);
          a.pause();
        }
        const t = now - b;
        const end = a.effect?.getComputedTiming().endTime;
        if (Number.isFinite(Number(end)) && t >= Number(end)) a.finish();
        else a.currentTime = t;
      } catch {
        /* an animation that was cancelled under us */
      }
    }
  };
}

export async function record(spec) {
  const work = path.join(HERE, ".work", spec.id);
  await mkdir(work, { recursive: true });
  const FR = { ...FRAME, ...spec.frame };
  const WIN = spec.win ?? TIKTOK_WIN;
  const SCALE = WIN.w / 360; // the app is laid out 360 wide and shrunk to fit
  const SLICE = Math.round(WIN.h / SCALE); // app px of height the window shows
  const outroSeconds = spec.outroSeconds ?? OUTRO_SECONDS;

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: [
      "--use-angle=metal",
      "--ignore-gpu-blocklist",
      "--enable-gpu",
      "--autoplay-policy=no-user-gesture-required",
      "--hide-scrollbars",
    ],
  });
  const stageHtml = await readFile(path.join(HERE, spec.stage ?? "stage.html"), "utf8");
  // Every shot gets a new window with its own clock. Reusing one across shots
  // left the next page's clock out of step, and the sign trainers drew nothing.
  let ctx = null;
  let page = null;
  const openStage = async () => {
    await ctx?.close();
    ctx = await browser.newContext({
      viewport: { width: FR.w, height: FR.h },
      deviceScaleFactor: FR.dsf,
      colorScheme: spec.scheme ?? "light",
      isMobile: true,
      hasTouch: true,
      locale: "en-KE",
      timezoneId: "Africa/Nairobi",
    });
    await ctx.addInitScript(pageInit);
    page = await ctx.newPage();
    page.on("pageerror", (e) => console.log("  page error:", e.message.slice(0, 160)));
    await page.route(`${BASE}/__stage`, (route) =>
      route.fulfill({ contentType: "text/html", body: stageHtml }),
    );
    await page.clock.install();
    await page.goto(`${BASE}/__stage`);
    await page.evaluate(() => document.fonts.ready);
  };

  const videoPath = path.join(work, "video.mp4");
  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-v", "error", "-y",
      "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
      "-c:v", "libx264", "-preset", "slow", "-crf", "15",
      "-pix_fmt", "yuv420p", "-color_range", "tv", "-colorspace", "bt709",
      "-vf", `scale=${Math.round(FR.w * FR.dsf)}:${Math.round(FR.h * FR.dsf)}:flags=lanczos:out_color_matrix=bt709:out_range=tv`,
      videoPath,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const ffmpegDone = new Promise((res, rej) =>
    ffmpeg.on("close", (code) => (code === 0 ? res() : rej(new Error(`ffmpeg ${code}`)))),
  );

  let frameNo = 0;
  const cues = [];
  const live = new Map(); // cue id in the page → index in `cues`
  const now = () => frameNo / FPS;
  // What the stage draws on top of the app.
  const over = { text: "", since: 0, dark: false, touch: null, outro: -1 };
  const setText = (t) => {
    if (t !== over.text) {
      over.text = t;
      over.since = now();
    }
  };
  /** Show the dot a screen recording draws under a finger. */
  const touchAt = (x, y, down = false) => {
    over.touch = { x, y, at: now(), down };
  };
  const shoot = async () => {
    const t = over.touch;
    await page.evaluate((s) => window.stage.frame(s), {
      text: over.text,
      textT: now() - over.since,
      dark: over.dark,
      outro: over.outro < 0 ? -1 : now() - over.outro,
      touch: t && (t.down || now() - t.at < 0.35) ? { x: t.x, y: t.y, t: now() - t.at, down: t.down } : null,
    });
    const jpg = await page.screenshot({ type: "jpeg", quality: 96 });
    if (!ffmpeg.stdin.write(jpg)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
    frameNo += 1;
  };
  /** A sound the video adds itself, on top of what the app plays. */
  const sfx = (name, volume = 0.45) =>
    cues.push({ t: now(), file: `/assets/sounds/${name}.mp3`, volume });

  const shots = spec.shots;
  try {
    for (let si = 0; si < shots.length; si += 1) {
      const shot = shots[si];
      const last = si === shots.length - 1;
      // The app may be laid out taller than the window shows: `viewY` picks
      // the slice, so a long panel under the board can stay out of the picture.
      const box = { win: WIN, scale: SCALE, appH: shot.appH ?? SLICE, viewY: shot.viewY ?? 0 };
      const toPage = (ax, ay) => [WIN.x + ax * SCALE, WIN.y + (ay - box.viewY) * SCALE];
      console.log(`  shot ${si + 1}/${shots.length}  ${shot.url}`);
      // ---- load in real time ------------------------------------------------
      await openStage();
      over.dark = shot.dark ?? false;
      over.touch = null;
      await page.evaluate(
        ({ seed, url, box }) => {
          for (const [k, v] of Object.entries(seed ?? {})) {
            if (v === null) localStorage.removeItem(k);
            else localStorage.setItem(k, JSON.stringify(v));
          }
          window.stage.layout(box);
          document.getElementById("app").src = url;
        },
        { seed: shot.seed, url: shot.url, box },
      );
      await page.waitForTimeout(400);
      const app = page.frames().find((f) => f !== page.mainFrame());
      await app.waitForLoadState("load");
      if (shot.css) await app.addStyleTag({ content: shot.css });
      const h = helpers(page, app, { sfx, setText, touchAt, toPage, WIN });
      await page.waitForTimeout(shot.settle ?? 2500);
      if (shot.prepare) await shot.prepare(app, h);
      over.touch = null;
      // Each document keeps its own stepped clock; pause at the latest of them.
      const clocks = await Promise.all(
        page.frames().map((f) => f.evaluate(() => Date.now()).catch(() => 0)),
      );
      await page.clock.pauseAt(new Date(Math.max(...clocks) + 60));
      for (const f of page.frames()) await f.evaluate(() => (window.__cues.length = 0)).catch(() => {});
      live.clear();

      // ---- record with stepped time ---------------------------------------
      // A shot is a list of beats, run in order: say words, wait, press, or
      // hold until the app shows something. The shot ends with its last beat.
      // The last shot then runs on under the closing label.
      const start = frameNo;
      const beats = [...shot.beats];
      if (last) beats.push({ do: () => (over.outro = now()) }, { wait: outroSeconds });
      const maxFrames = Math.round((shot.max ?? 120) * FPS);
      let beat = null;
      let beatFrames = 0;
      let done = false;
      for (let i = 0; i < maxFrames && !done; i += 1) {
        // Take beats until one needs time to pass.
        for (;;) {
          if (!beat) {
            beat = beats.shift() ?? null;
            beatFrames = 0;
            if (!beat) {
              done = true;
              break;
            }
          }
          if (beat.say !== undefined) setText(beat.say);
          else if (beat.do) await beat.do(app, h);
          else if (beat.wait !== undefined) {
            if (beatFrames < Math.round(beat.wait * FPS)) break;
          } else if (beat.until) {
            const hit =
              beatFrames >= Math.round((beat.max ?? 30) * FPS) ||
              (beatFrames % 3 === 0 && (await beat.until(app, h).catch(() => false)));
            if (!hit) break;
          } else if (beat.drag) {
            const { from, to, seconds } = beat.drag;
            const n = Math.round(seconds * FPS);
            const k = Math.min(1, beatFrames / n);
            const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            const [x, y] = toPage(
              from[0] + (to[0] - from[0]) * e,
              from[1] + (to[1] - from[1]) * e,
            );
            if (beatFrames === 0) {
              await page.mouse.move(x, y);
              await page.mouse.down();
            } else await page.mouse.move(x, y);
            touchAt(x, y, beatFrames < n);
            if (beatFrames < n) break;
            await page.mouse.up();
          }
          beat = null;
        }
        if (done) break;
        beatFrames += 1;
        await page.clock.runFor(1000 / FPS);
        for (const f of page.frames()) await f.evaluate(() => window.__sync?.()).catch(() => {});
        const fresh = await app.evaluate(() => window.__cues.splice(0)).catch(() => []);
        for (const c of fresh) {
          if (c.type === "start") {
            live.set(c.id, cues.length);
            const file = new URL(c.url).pathname;
            cues.push({ t: now(), file, volume: file.startsWith("/assets/sounds/") ? 0.45 : 1 });
          } else if (live.has(c.id)) {
            cues[live.get(c.id)].stop = now();
          }
        }
        await shoot();
      }
      await page.mouse.up().catch(() => {});
      // A voice clip still playing when the shot ends is cut with the picture.
      for (const idx of live.values()) cues[idx].stop ??= now();
      console.log(`    ${frameNo - start} frames (${((frameNo - start) / FPS).toFixed(1)} s)`);
    }
  } finally {
    // Keep what was recorded even when a beat fails: the frames show why.
    ffmpeg.stdin.end();
    await ffmpegDone.catch(() => {});
    await browser.close();
  }
  const meta = {
    id: spec.id,
    // A folder under out/ for the finished file, when the spec names one.
    dir: spec.dir,
    seconds: frameNo / FPS,
    music: spec.music ?? "a",
    // Seconds in for the cover picture, when the default lands on a bad frame.
    cover: spec.cover ?? 1.2,
    cues,
  };
  await writeFile(path.join(work, "cues.json"), JSON.stringify(meta, null, 2));
  console.log(`  ${spec.id}: ${meta.seconds.toFixed(1)} s, ${cues.length} sounds`);
  return meta;
}

/** Small moves the specs use, so each one reads as a list of beats. */
function helpers(page, app, { sfx, setText, touchAt, toPage, WIN }) {
  const button = (name, role = "button") =>
    app.getByRole(role, { name: name instanceof RegExp ? name : new RegExp(name, "i") }).first();
  const h = {
    page,
    sfx,
    setText,
    /** Tap a button by its words, with the dot a finger would leave. */
    async tap(name, opts = {}) {
      const el = button(name, opts.role);
      await el.waitFor({ state: "attached", timeout: 8000 });
      const box = await el.boundingBox();
      // No dot for a button the window does not show.
      if (box) {
        const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
        if (y > WIN.y && y < WIN.y + WIN.h) touchAt(x, y);
      }
      // Clicked in the page, not by pointer: the button may sit in a part of
      // the app the window leaves out.
      await el.evaluate((node) => node.click());
    },
    /** Press a button straight in the page: for one that sits below the fold
     *  of a scrolling sheet, where a pointer click would have to scroll first. */
    async press(name) {
      const at = await app.evaluate((src) => {
        const re = new RegExp(src, "i");
        const b = [...document.querySelectorAll("button,a")].find(
          (el) => el.getClientRects().length && re.test(el.getAttribute("aria-label") || el.textContent || ""),
        );
        if (!b) return null;
        b.scrollIntoView({ block: "center" });
        const r = b.getBoundingClientRect();
        b.click();
        return [r.x + r.width / 2, r.y + r.height / 2];
      }, name);
      if (!at) throw new Error(`No button "${name}" on screen`);
      const [x, y] = toPage(at[0], at[1]);
      if (y > WIN.y && y < WIN.y + WIN.h) touchAt(x, y);
    },
    /** True when a button with this name is on screen and can be pressed. */
    async has(name, role = "button") {
      const el = button(name, role);
      return (await el.isVisible()) && (await el.isEnabled());
    },
    /** Real-time wait: only for `prepare`, never while recording. */
    wait: (ms) => page.waitForTimeout(ms),
    /** The joystick listens for keys on the app's window. */
    keyDown: (key) =>
      app.evaluate((k) => window.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true })), key),
    keyUp: (key) =>
      app.evaluate((k) => window.dispatchEvent(new KeyboardEvent("keyup", { key: k, bubbles: true })), key),
    /** True when these words are on screen. */
    sees: (re) =>
      app.evaluate((src) => new RegExp(src, "i").test(document.body.innerText), re.source ?? re),
    /** Scroll the page smoothly by hand, a step per call. */
    scrollBy: (dy) => app.evaluate((d) => window.scrollBy(0, d), dy),
  };
  return h;
}

// ---- command line -----------------------------------------------------------
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const ids = process.argv.slice(2);
  if (!ids.length) {
    console.error("Which video? e.g. node capture.mjs 13-across-the-board");
    process.exit(1);
  }
  for (const id of ids) {
    const spec = (await import(pathToFileURL(path.join(HERE, "videos", `${id}.mjs`)).href)).default;
    console.log(`${spec.id}`);
    // One video failing must not stop the rest of a batch.
    await record(spec).catch((e) => {
      process.exitCode = 1;
      console.log(`  FAILED ${id}: ${String(e.message).split("\n").slice(0, 3).join(" | ")}`);
    });
  }
}
