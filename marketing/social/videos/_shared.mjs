/**
 * What the video specs share: the state a shot loads with, and the beats a
 * shot is written in.
 *
 * Seeds go into localStorage before the app loads. Keys and shapes follow the
 * app's own stores: `app/lib/board-store.ts`, `pelican-store.ts`,
 * `signs-3d-store.ts`.
 */

/** The board at its sharpest picture, first-drive tips already read. */
export const board = (settings = {}) => ({
  "driverush:board": {
    state: {
      settings: { sound: true, quality: "high", coached: true, car: "saloon", ...settings },
      progress: {},
      bestStars: {},
    },
    version: 1,
  },
  "driverush:board-rung": null,
});

/** Both sign trainers from a clean start, in chart order. */
export const signs = (settings = {}) => {
  const state = {
    settings: { order: "sequential", revealDelay: 3, ...settings },
    progress: {},
    inProgressRun: null,
  };
  return {
    "driverush:pelican": { state, version: 8 },
    "driverush:signs3d": { state, version: 1 },
    "driverush:streak": null,
  };
};

// ---- beats ------------------------------------------------------------------
/** Put words in the band above the app. *Stars* mark the red words. */
export const say = (text) => ({ say: text });
export const wait = (seconds) => ({ wait: seconds });
export const tap = (name) => ({ do: (_, h) => h.tap(name) });
/** Hold until these words are on screen (or `max` seconds pass). */
export const until = (re, max = 30) => ({ until: (_, h) => h.sees(re), max });
/** Hold until a button with this name is there. */
export const untilButton = (name, max = 30) => ({ until: (_, h) => h.has(name), max });
export const hold = (key) => ({ do: (_, h) => h.keyDown(key) });
export const release = (key) => ({ do: (_, h) => h.keyUp(key) });
/** Drag across the app window, in its own CSS pixels. */
export const drag = (from, to, seconds) => ({ drag: { from, to, seconds } });

/** One sign in a trainer: wait for the answer, let it be read, mark it. */
export const answer = (mark = "Knew it", read = 1.8) => [
  untilButton(mark, 14),
  wait(read),
  tap(mark),
  wait(0.5),
];

// ---- whole shots ------------------------------------------------------------
const PLAY = "/model-town-board/play?level=";

/** Level 1: push to go, let go inside the box, the app says done. */
export const firstDrive = ({ hook, mid, done }) => ({
  url: `${PLAY}first-drive`,
  seed: board(),
  settle: 7000,
  beats: [
    say(hook),
    wait(2.6),
    hold("ArrowUp"),
    wait(2.2),
    say(mid),
    wait(2.5),
    release("ArrowUp"),
    say(done),
    // Cut here: the app's finish sheet slides up over the car a moment later.
    wait(0.9),
  ],
});

/** A lane options level: pick a car that goes straight and drive it home. */
export const laneDrive = (lane, { intro, driving, mid, home }) => ({
  url: `${PLAY}four-lane`,
  seed: board(),
  settle: 7000,
  beats: [
    say(intro),
    wait(2.8),
    tap(`Drive the lane ${lane} car`),
    wait(1.4),
    hold("ArrowUp"),
    say(driving),
    wait(7),
    say(mid),
    // The distance label gives way to "Stop here" near the end, so time the
    // last stretch from 30 m out.
    until(/finish\s+30 m/, 22),
    wait(5.9),
    release("ArrowUp"),
    until(/1 of 9 cars home/, 5),
    say(home),
    wait(2.6),
  ],
});

/** A watch level: the app drives the route; captions follow its steps. */
export const watch = (level, { hook, steps = [], end, max = 45 }) => ({
  url: `${PLAY}watch-${level}`,
  seed: board(),
  settle: 11000,
  // Laid out very tall, so the app's text panel opens below what the window
  // shows and the board with the car fills it.
  appH: 1340,
  beats: [
    // Start the drive on the first frame: until then the app dims the board.
    tap("Watch the car drive it"),
    say(hook),
    // Close in on the car; from the default height it is a speck.
    ...[0, 1, 2, 3].flatMap(() => [wait(0.25), tap("Zoom in")]),
    wait(2.4),
    ...steps.flatMap(([n, text]) => [until(new RegExp(`step ${n} of`), 30), say(text)]),
    untilButton("Play again", max),
    ...(end ? [say(end)] : []),
    wait(1.6),
  ],
});

/** A drive task the learner gives up on: Hint, then Show me. */
export const showMe = (challenge, { hook, stuck, steps = [], end }) => ({
  url: `${PLAY}drive-${challenge}`,
  seed: board(),
  settle: 7000,
  // The window shows the road and the step's title, not the buttons under it.
  appH: 640,
  beats: [
    say(hook),
    wait(3.2),
    tap("Hint"),
    wait(0.9),
    say(stuck),
    wait(0.9),
    tap("Show me"),
    ...steps.flatMap(([n, text]) => [until(new RegExp(`step ${n} of`), 30), say(text)]),
    untilButton("Play again", 40),
    say(end),
    wait(2),
  ],
});

/** A run on the chart or in 3D, in the window, captions above it. */
export const signShot = (trainer, codes, settings, beats) => ({
  url: `/road-signs/${trainer}?codes=${codes.join(",")}&go=1`,
  seed: signs(settings),
  // The run starts when the page does, so start recording almost at once.
  settle: trainer === "3d" ? 1500 : 600,
  // Taller than the window, so the answer opens under the sign, not over it.
  appH: 685,
  beats,
});
