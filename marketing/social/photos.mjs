#!/usr/bin/env node
/**
 * Shoot the still photos for TikTok photo posts from the built app.
 *
 *   npm run build && PORT=5191 npm run start      # in the repo root
 *   node photos.mjs                                # all of photos/*.mjs
 *   node photos.mjs 04-name-this-sign              # one
 *   SAFE=1 node photos.mjs                         # also a copy with TikTok's bars drawn on
 *
 * Writes `out/photos/<id>.png` and `.jpg`, 1080x1920.
 *
 * Like the videos, a photo is the real app in an iframe on a stage
 * (`photo-stage.html`) served on the app's own origin. Unlike the videos,
 * time runs normally: `prepare` plays the app to the moment wanted, then one
 * screenshot is taken. The frame is 540x960 at 2x, not 360x640 at 3x, because
 * the 3D sign canvas draws at 2x at most and would be blurred at 3x.
 */
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE ?? "http://localhost:5191";
const OUT = path.join(HERE, "out", "photos");
const FRAME = { w: 540, h: 960 };
/** Shared by every photo: no install prompt over the picture. */
const QUIET = { "driverush:install": { dismissed: true, at: Date.now() } };

async function shoot(browser, spec, stageHtml) {
  // A spec may shoot in its own frame (4:5 for LinkedIn) and its own folder.
  const FR = { ...FRAME, ...spec.frame };
  const headY = spec.headY ?? 124;
  const outDir = path.join(OUT, spec.dir ?? "");
  await mkdir(outDir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: FR.w, height: FR.h },
    deviceScaleFactor: 2,
    colorScheme: spec.scheme ?? "light",
    isMobile: true,
    hasTouch: true,
    locale: "en-KE",
    timezoneId: "Africa/Nairobi",
  });
  try {
    const page = await ctx.newPage();
    page.on("pageerror", (e) =>
      console.log("  page error:", e.message.slice(0, 160)),
    );
    await page.route(`${BASE}/__photo`, (route) =>
      route.fulfill({ contentType: "text/html", body: stageHtml }),
    );
    await page.goto(`${BASE}/__photo`);
    await page.evaluate(() => document.fonts.ready);

    const app = { w: FR.w, h: FR.h, ...spec.app };
    const win =
      spec.layout === "bleed"
        ? { x: 0, y: 0, w: FR.w, h: FR.h }
        : { x: 45, y: 300, w: 450, h: 470, ...spec.win };
    const scale = win.w / app.w;
    const viewY = spec.viewY ?? 0;
    await page.evaluate(
      ({ seed, url, set }) => {
        for (const [k, v] of Object.entries(seed)) {
          if (v === null) localStorage.removeItem(k);
          else localStorage.setItem(k, JSON.stringify(v));
        }
        window.stage.set(set);
        document.getElementById("app").src = url;
      },
      {
        seed: { ...QUIET, ...spec.seed },
        url: spec.url,
        set: {
          layout: spec.layout,
          theme: spec.theme ?? "ink",
          win,
          app,
          viewY,
          footY: spec.footY,
          frameH: FR.h,
          headY,
        },
      },
    );
    await page.waitForTimeout(400);
    const frame = page.frames().find((f) => f !== page.mainFrame());
    await frame.waitForLoadState("load");
    if (spec.css) await frame.addStyleTag({ content: spec.css });
    await page.waitForTimeout(spec.settle ?? 2500);
    if (spec.prepare)
      await spec.prepare(frame, helpers(page, frame, { win, scale, viewY }));
    await page.mouse.up().catch(() => {});

    const fit = await page.evaluate((w) => window.stage.words(w), {
      kicker: spec.kicker,
      headline: spec.headline,
      sub: spec.sub,
      size: spec.size,
      maxH: spec.maxH ?? (spec.layout === "bleed" ? 230 : win.y - headY - (spec.foot === "head" ? 68 : 16)),
      footInHead: spec.foot === "head",
    });
    await page.waitForTimeout(150);
    const png = path.join(outDir, `${spec.id}.png`);
    await page.screenshot({ path: png, type: "png" });
    execFileSync(
      "sips",
      [
        "-s",
        "format",
        "jpeg",
        "-s",
        "formatOptions",
        "93",
        png,
        "--out",
        png.replace(/\.png$/, ".jpg"),
      ],
      { stdio: "ignore" },
    );
    if (process.env.SAFE) {
      const dir = path.join(HERE, ".work", "photos");
      await mkdir(dir, { recursive: true });
      await page.evaluate(() => window.stage.safe(true));
      await page.screenshot({
        path: path.join(dir, `${spec.id}-safe.jpg`),
        type: "jpeg",
        quality: 80,
        scale: "css",
      });
    }
    const rung = await frame
      .evaluate(() => localStorage.getItem("driverush:board-rung"))
      .catch(() => null);
    console.log(
      `  ${spec.id}: headline ${fit.px}px, block ${fit.height}px${rung ? `, board quality step ${rung}` : ""}`,
    );
  } finally {
    await ctx.close();
  }
}

/** The moves a spec's `prepare` uses to play the app to its moment. */
function helpers(page, app, { win, scale, viewY }) {
  const button = (name) =>
    app
      .getByRole("button", {
        name: name instanceof RegExp ? name : new RegExp(name, "i"),
      })
      .first();
  const toPage = (ax, ay) => [win.x + ax * scale, win.y + (ay - viewY) * scale];
  const h = {
    page,
    wait: (ms) => page.waitForTimeout(ms),
    /** Click a button by its words, wherever it sits in the app. */
    async tap(name) {
      const el = button(name);
      await el.waitFor({ state: "attached", timeout: 8000 });
      await el.evaluate((node) => node.click());
    },
    has: async (name) =>
      (await button(name).isVisible()) && (await button(name).isEnabled()),
    sees: (re) =>
      app.evaluate(
        (src) => new RegExp(src, "i").test(document.body.innerText),
        re.source ?? re,
      ),
    /** Wait until these words are on screen. */
    async until(re, max = 30) {
      const end = Date.now() + max * 1000;
      while (Date.now() < end) {
        if (await h.sees(re).catch(() => false)) return true;
        await page.waitForTimeout(100);
      }
      console.log(`  never saw ${re}`);
      return false;
    },
    async untilButton(name, max = 30) {
      const end = Date.now() + max * 1000;
      while (Date.now() < end) {
        if (await h.has(name).catch(() => false)) return true;
        await page.waitForTimeout(100);
      }
      console.log(`  never saw button ${name}`);
      return false;
    },
    /** The joystick listens for keys on the app's window. */
    keyDown: (key) =>
      app.evaluate(
        (k) =>
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: k, bubbles: true }),
          ),
        key,
      ),
    keyUp: (key) =>
      app.evaluate(
        (k) =>
          window.dispatchEvent(
            new KeyboardEvent("keyup", { key: k, bubbles: true }),
          ),
        key,
      ),
    /** Drag across the app, in its own CSS px: spins a 3D sign. */
    async drag(from, to, ms = 600) {
      const steps = Math.max(2, Math.round(ms / 16));
      await page.mouse.move(...toPage(...from));
      await page.mouse.down();
      for (let i = 1; i <= steps; i += 1) {
        const k = i / steps;
        await page.mouse.move(
          ...toPage(
            from[0] + (to[0] - from[0]) * k,
            from[1] + (to[1] - from[1]) * k,
          ),
        );
        await page.waitForTimeout(ms / steps);
      }
      await page.mouse.up();
    },
    text: () =>
      app.evaluate(() => document.body.innerText.replace(/\n+/g, " | ")),
  };
  return h;
}

// ---- command line -----------------------------------------------------------
await mkdir(OUT, { recursive: true });
const all = (await readdir(path.join(HERE, "photos")))
  .filter((f) => /^\d.*\.mjs$/.test(f))
  .map((f) => f.slice(0, -4))
  .sort();
const ids = process.argv.slice(2).length ? process.argv.slice(2) : all;
const stageHtml = await readFile(path.join(HERE, "photo-stage.html"), "utf8");
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: [
    "--use-angle=metal",
    "--ignore-gpu-blocklist",
    "--enable-gpu",
    "--hide-scrollbars",
  ],
});
try {
  for (const id of ids) {
    const spec = (
      await import(pathToFileURL(path.join(HERE, "photos", `${id}.mjs`)).href)
    ).default;
    // One photo failing must not stop the rest.
    await shoot(browser, spec, stageHtml).catch((e) => {
      process.exitCode = 1;
      console.log(
        `  FAILED ${id}: ${String(e.message).split("\n").slice(0, 3).join(" | ")}`,
      );
    });
  }
} finally {
  await browser.close();
}
