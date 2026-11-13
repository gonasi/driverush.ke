#!/usr/bin/env node
/**
 * Make the three background music beds, from nothing but arithmetic.
 *
 *   node make-music.mjs        → music/a.wav, b.wav, c.wav (48 kHz stereo)
 *
 * They are written here rather than downloaded so there is no licence to
 * track: DriveRush owns them outright. Swap any of them for a track you like
 * better by dropping a file with the same name into `music/`.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SR = 48000;
const TAU = Math.PI * 2;
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** A small repeatable noise source, so every run makes the same file. */
function noiseSource(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2147483648 - 1;
  };
}

class Bed {
  constructor(bpm, bars) {
    this.beat = 60 / bpm;
    this.bars = bars;
    this.n = Math.round(bars * 4 * this.beat * SR);
    this.l = new Float32Array(this.n);
    this.r = new Float32Array(this.n);
    this.noise = noiseSource(7);
  }
  /** Add a voice: `fn(t)` is its sample `t` seconds after it starts. */
  add(atBeats, seconds, fn, gain = 1, pan = 0) {
    const start = Math.round(atBeats * this.beat * SR);
    const len = Math.round(seconds * SR);
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < len; i += 1) {
      const v = fn(i / SR);
      // Wrap the tail round to the start, so the bed loops without a click.
      const j = (start + i) % this.n;
      this.l[j] += v * gl;
      this.r[j] += v * gr;
    }
  }
  kick(at, gain = 0.9) {
    this.add(at, 0.32, (t) => Math.sin(TAU * (48 * t + (110 / 28) * (1 - Math.exp(-28 * t)))) * Math.exp(-9 * t), gain);
  }
  clap(at, gain = 0.32) {
    let lp = 0;
    this.add(at, 0.2, (t) => {
      const x = this.noise();
      lp += 0.35 * (x - lp);
      const burst = t < 0.03 ? 0.6 + 0.4 * Math.sin(TAU * 90 * t) : 1;
      return (x - lp) * burst * Math.exp(-22 * t);
    }, gain);
  }
  hat(at, gain = 0.12, decay = 60, pan = 0.2) {
    let prev = 0;
    this.add(at, 0.09, (t) => {
      const x = this.noise();
      const hp = x - prev;
      prev = x;
      return hp * Math.exp(-decay * t);
    }, gain, pan);
  }
  shaker(at, gain = 0.06, pan = -0.3) {
    let prev = 0;
    this.add(at, 0.07, (t) => {
      const x = this.noise();
      const hp = x - prev;
      prev = x;
      return hp * Math.sin(Math.min(1, t / 0.02) * Math.PI) * Math.exp(-30 * t);
    }, gain, pan);
  }
  /** A round, sliding bass note, the log-drum sound of amapiano. */
  logDrum(at, midi, beats, gain = 0.5) {
    const f = hz(midi);
    const len = beats * this.beat;
    this.add(at, len + 0.1, (t) => {
      const bend = 1 + 0.5 * Math.exp(-30 * t);
      const ph = TAU * f * (t + (0.5 / 30) * (1 - Math.exp(-30 * t)));
      const env = Math.min(1, t / 0.004) * Math.exp(-3.2 * t) * (t > len ? Math.exp(-40 * (t - len)) : 1);
      return Math.tanh(1.6 * (Math.sin(ph) + 0.3 * Math.sin(2 * ph * bend))) * env;
    }, gain);
  }
  sub(at, midi, beats, gain = 0.4) {
    const f = hz(midi);
    const len = beats * this.beat;
    this.add(at, len, (t) => Math.sin(TAU * f * t) * Math.min(1, t / 0.01) * Math.min(1, (len - t) / 0.05), gain);
  }
  /** A wooden, marimba-like note. */
  mallet(at, midi, gain = 0.2, pan = 0) {
    const f = hz(midi);
    this.add(at, 0.9, (t) =>
      (Math.sin(TAU * f * t) * Math.exp(-5 * t) + 0.35 * Math.sin(TAU * f * 4 * t) * Math.exp(-18 * t)) *
      Math.min(1, t / 0.003), gain, pan);
  }
  /** A soft electric-piano note. */
  keys(at, midi, beats, gain = 0.12, pan = 0) {
    const f = hz(midi);
    const len = beats * this.beat;
    this.add(at, len + 0.4, (t) => {
      const env = Math.min(1, t / 0.008) * Math.exp(-1.6 * t) * (t > len ? Math.exp(-9 * (t - len)) : 1);
      const trem = 1 + 0.12 * Math.sin(TAU * 4.5 * t);
      return (Math.sin(TAU * f * t + 0.9 * Math.exp(-6 * t) * Math.sin(TAU * f * 2 * t)) * trem) * env;
    }, gain, pan);
  }
  /** A short bright pluck. */
  pluck(at, midi, gain = 0.12, pan = 0) {
    const f = hz(midi);
    this.add(at, 0.45, (t) => {
      const saw = 2 * ((f * t) % 1) - 1;
      const sq = Math.sin(TAU * f * t) > 0 ? 1 : -1;
      const bright = Math.exp(-14 * t);
      return (Math.sin(TAU * f * t) * (1 - bright) + (0.6 * saw + 0.4 * sq) * bright) * Math.exp(-7 * t) * Math.min(1, t / 0.002);
    }, gain, pan);
  }
  async write(file) {
    // Gentle limiter, then 16-bit.
    let peak = 0;
    for (let i = 0; i < this.n; i += 1) peak = Math.max(peak, Math.abs(this.l[i]), Math.abs(this.r[i]));
    const g = 0.89 / Math.max(peak, 1e-6);
    const data = Buffer.alloc(this.n * 4);
    for (let i = 0; i < this.n; i += 1) {
      data.writeInt16LE(Math.round(Math.tanh(this.l[i] * g * 1.15) * 30000), i * 4);
      data.writeInt16LE(Math.round(Math.tanh(this.r[i] * g * 1.15) * 30000), i * 4 + 2);
    }
    const head = Buffer.alloc(44);
    head.write("RIFF", 0);
    head.writeUInt32LE(36 + data.length, 4);
    head.write("WAVEfmt ", 8);
    head.writeUInt32LE(16, 16);
    head.writeUInt16LE(1, 20);
    head.writeUInt16LE(2, 22);
    head.writeUInt32LE(SR, 24);
    head.writeUInt32LE(SR * 4, 28);
    head.writeUInt16LE(4, 32);
    head.writeUInt16LE(16, 34);
    head.write("data", 36);
    head.writeUInt32LE(data.length, 40);
    await writeFile(file, Buffer.concat([head, data]));
    console.log(`  ${path.basename(file)}  ${(this.n / SR).toFixed(1)} s`);
  }
}

// Chords as [bass note, ...chord notes], one per bar.
const A = [
  [36, 60, 64, 67, 72], // C
  [43, 59, 62, 67, 71], // G
  [45, 60, 64, 69, 72], // Am
  [41, 60, 65, 69, 72], // F
];
const B = [
  [45, 57, 60, 64, 67], // Am7
  [38, 57, 60, 65, 69], // Dm7
  [43, 55, 59, 62, 65], // G7
  [36, 55, 59, 60, 64], // Cmaj7
];
const C = [
  [41, 57, 60, 65, 69], // F
  [43, 59, 62, 67, 71], // G
  [45, 60, 64, 69, 72], // Am
  [40, 59, 64, 67, 71], // Em
];

/** a: mid-tempo and warm, log-drum bass under a mallet tune. */
function bedA() {
  const b = new Bed(112, 8);
  for (let bar = 0; bar < 8; bar += 1) {
    const at = bar * 4;
    const [bass, ...ch] = A[bar % 4];
    for (const k of [0, 1, 2, 3]) b.kick(at + k, 0.8);
    b.clap(at + 1);
    b.clap(at + 3);
    for (let s = 0; s < 16; s += 1) b.shaker(at + s / 4, s % 2 ? 0.07 : 0.04);
    for (const s of [0.5, 1.5, 2.5, 3.5]) b.hat(at + s, 0.1);
    b.logDrum(at, bass, 0.7, 0.55);
    b.logDrum(at + 1.5, bass, 0.4, 0.45);
    b.logDrum(at + 2.75, bass + 7, 0.4, 0.4);
    b.logDrum(at + 3.5, bass + (bar % 2 ? 5 : 12), 0.4, 0.4);
    const tune = bar % 2 ? [3, 2, 1, 2, 3, 1] : [0, 1, 2, 3, 2, 1];
    [0, 0.75, 1.5, 2, 2.75, 3.5].forEach((s, i) => b.mallet(at + s, ch[tune[i]] + 12, 0.2, i % 2 ? 0.35 : -0.35));
    for (const n of ch.slice(0, 3)) b.keys(at, n, 3.5, 0.045);
  }
  return b;
}

/** b: slower and laid back, electric piano over a soft beat. */
function bedB() {
  const b = new Bed(96, 8);
  for (let bar = 0; bar < 8; bar += 1) {
    const at = bar * 4;
    const [bass, ...ch] = B[bar % 4];
    b.kick(at, 0.8);
    b.kick(at + 2.5, 0.7);
    if (bar % 2) b.kick(at + 3.25, 0.5);
    b.clap(at + 1, 0.26);
    b.clap(at + 3, 0.26);
    for (let s = 0; s < 8; s += 1) b.hat(at + s / 2 + (s % 2 ? 0.04 : 0), s % 2 ? 0.1 : 0.06, 70);
    b.sub(at, bass, 2.3, 0.42);
    b.sub(at + 2.5, bass, 1.2, 0.36);
    ch.forEach((n, i) => b.keys(at + i * 0.02, n, 1.8, 0.11, (i - 1.5) * 0.25));
    ch.forEach((n, i) => b.keys(at + 2.5 + i * 0.02, n, 1.2, 0.08, (i - 1.5) * 0.25));
    const top = [ch[3] + 12, ch[2] + 12, ch[3] + 12, ch[1] + 12];
    [1, 1.75, 3, 3.5].forEach((s, i) => b.mallet(at + s, top[i], 0.1, 0.4));
  }
  return b;
}

/** c: the quick one, four on the floor with a running pluck. */
function bedC() {
  const b = new Bed(122, 8);
  for (let bar = 0; bar < 8; bar += 1) {
    const at = bar * 4;
    const [bass, ...ch] = C[bar % 4];
    for (const k of [0, 1, 2, 3]) {
      b.kick(at + k, 0.85);
      b.hat(at + k + 0.5, 0.14, 40);
      b.sub(at + k + 0.5, bass, 0.42, 0.4);
    }
    b.clap(at + 1, 0.3);
    b.clap(at + 3, 0.3);
    for (let s = 0; s < 16; s += 1) b.shaker(at + s / 4, 0.04);
    const run = [0, 2, 1, 3, 2, 1, 3, 2];
    run.forEach((k, i) => b.pluck(at + i / 2, ch[k] + 12, 0.11, i % 2 ? 0.4 : -0.4));
    if (bar % 4 === 3) [3, 3.25, 3.5, 3.75].forEach((s) => b.clap(at + s, 0.16));
    for (const n of ch.slice(0, 3)) b.keys(at, n, 3.6, 0.04);
  }
  return b;
}

await mkdir(path.join(HERE, "music"), { recursive: true });
await bedA().write(path.join(HERE, "music", "a.wav"));
await bedB().write(path.join(HERE, "music", "b.wav"));
await bedC().write(path.join(HERE, "music", "c.wav"));
