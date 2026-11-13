#!/usr/bin/env node
/**
 * Poke at a page the way a spec will, in real time, and save what it looks
 * like after each step. A help while writing a spec; makes no video.
 *
 *   node explore.mjs "/road-signs/pelican?go=1" wait:2000 shot buttons tap:"Knew it" shot
 *
 * Steps: wait:<ms>  shot  buttons  text  tap:<words>  key:<Key>:<ms held>  js:<expression>
 * Env: H=<app height>, SEED=board|none, BASE
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { board } from "./videos/_shared.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE ?? "http://localhost:5191";
const [url, ...steps] = process.argv.slice(2);
const out = path.join(HERE, ".work", "explore");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-gpu"],
});
const ctx = await browser.newContext({
  viewport: { width: 360, height: Number(process.env.H ?? 514) },
  deviceScaleFactor: 2,
  colorScheme: "light",
  isMobile: true,
  hasTouch: true,
});
const seed = process.env.SEED === "none" ? {} : { ...board(), ...JSON.parse(process.env.SEEDJSON ?? "{}") };
await ctx.addInitScript((seed) => {
  if (sessionStorage.getItem("__seeded")) return;
  sessionStorage.setItem("__seeded", "1");
  for (const [k, v] of Object.entries(seed)) {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  }
}, seed);
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("page error:", e.message.slice(0, 200)));
await page.goto(BASE + url);
let n = 0;
const shots = [];
for (const step of steps) {
  const [kind, ...rest] = step.split(":");
  const arg = rest.join(":");
  if (kind === "wait") await page.waitForTimeout(Number(arg));
  else if (kind === "shot") {
    const p = path.join(out, `s${n++}.png`);
    await page.screenshot({ path: p });
    shots.push(p);
  } else if (kind === "buttons") {
    console.log(
      "buttons:",
      JSON.stringify(
        await page.evaluate(() =>
          [...document.querySelectorAll("button,a[href],[role=button],[role=switch],input")]
            .filter((b) => b.getClientRects().length)
            .map((b) => (b.getAttribute("aria-label") || b.textContent || "").trim().slice(0, 50)),
        ),
      ),
    );
  } else if (kind === "text") {
    console.log("text:", (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, " | ").slice(0, 1500));
  } else if (kind === "tap") {
    await page.getByRole("button", { name: new RegExp(arg, "i") }).first().click({ timeout: 6000 }).catch(async () => {
      await page.getByText(new RegExp(arg, "i")).first().click({ timeout: 4000 });
    });
  } else if (kind === "key") {
    const [key, ms] = arg.split(":");
    await page.keyboard.down(key);
    await page.waitForTimeout(Number(ms ?? 100));
    await page.keyboard.up(key);
  } else if (kind === "js") {
    console.log("js:", JSON.stringify(await page.evaluate(arg)));
  }
}
await writeFile(path.join(out, "list.txt"), shots.join("\n"));
await browser.close();
if (shots.length) {
  const { execFileSync } = await import("node:child_process");
  const args = ["-v", "error", "-y"];
  for (const s of shots) args.push("-i", s);
  if (shots.length > 1) args.push("-filter_complex", `hstack=${shots.length},scale=${Math.min(shots.length * 360, 1800)}:-1`);
  args.push(path.join(out, `${process.env.NAME ?? "strip"}.png`));
  execFileSync("ffmpeg", args);
  console.log("strip:", path.join(out, `${process.env.NAME ?? "strip"}.png`), `(${shots.length} shots)`);
}
