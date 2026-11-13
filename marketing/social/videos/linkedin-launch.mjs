/**
 * The launch film for Gonasi's LinkedIn page: 1080x1350, a made film and not
 * a screen recording (see stage-launch.html). Finished file: out/linkedin/.
 *
 *   node capture.mjs linkedin-launch && node compose.mjs linkedin-launch
 */
import {
  answer,
  board,
  drag,
  hold,
  release,
  say,
  signShot,
  signs,
  tap,
  untilButton,
  wait,
} from "./_shared.mjs";

const PLAY = "/model-town-board/play?level=";

/** Real-time, before recording: start a watch level and run it on to a step. */
const playTo = (step, zooms) => async (_, h) => {
  await h.tap("Watch the car drive it");
  for (let i = 0; i < zooms; i += 1) {
    await h.wait(250);
    await h.tap("Zoom in");
  }
  // A negative count pulls back instead, to show the whole table.
  for (let i = 0; i > zooms; i -= 1) {
    await h.wait(250);
    await h.tap("Zoom out");
  }
  const re = new RegExp(`step ${step} of`);
  for (let i = 0; i < 400 && !(await h.sees(re).catch(() => false)); i += 1)
    await h.wait(100);
};

/** A watch level, joined part way through its route. */
const watching = (level, { step, zooms = 4, text, seconds }) => ({
  url: `${PLAY}watch-${level}`,
  seed: board(),
  settle: 11000,
  // Laid out very tall, so the text panel opens below what the window shows.
  appH: 1150,
  prepare: playTo(step, zooms),
  beats: [say(text), wait(seconds)],
});

const scroll = (px, seconds) =>
  Array.from({ length: Math.round(seconds * 15) }, () => [
    { do: (_, h) => h.scrollBy(px / (seconds * 15)) },
    wait(1 / 15),
  ]).flat();

export default {
  id: "linkedin-launch",
  dir: "linkedin",
  stage: "stage-launch.html",
  frame: { w: 432, h: 540, dsf: 2.5 },
  win: { x: 76, y: 108, w: 280, h: 396 },
  outroSeconds: 5,
  music: "c",
  cover: 2,
  shots: [
    watching("across-town", {
      step: 2,
      zooms: -2,
      text: "Kenya's Model Town Board.\n*In 3D.* On your phone.",
      seconds: 4.2,
    }),
    {
      url: `${PLAY}first-drive`,
      seed: board(),
      settle: 7000,
      beats: [
        say("You *drive* it.\nNot just look at it."),
        wait(1),
        hold("ArrowUp"),
        wait(4.7),
        release("ArrowUp"),
        wait(0.8),
      ],
    },
    watching("long-way-round", {
      step: 4,
      text: "*45 levels:* lanes, the\nroundabout, routes, parking.",
      seconds: 7,
    }),
    {
      url: `${PLAY}four-lane`,
      seed: board(),
      settle: 7000,
      beats: [
        say("Lane rules from\nthe *NTSA handbook.*"),
        wait(2.2),
        tap("Where each lane may go"),
        wait(3.4),
      ],
    },
    watching("park-angle", {
      step: 4,
      text: "Parking too.\nThen a *mock test.*",
      seconds: 5.5,
    }),
    signShot("pelican", ["W.30", "P.1"], { revealDelay: 2 }, [
      say("*83 road signs*\non the chart."),
      ...answer("Knew it", 1.6),
      untilButton("Knew it", 12),
      wait(1.4),
    ]),
    signShot("3d", ["W.21", "R.1"], { revealDelay: 6 }, [
      say("The same signs\n*in 3D.*"),
      wait(0.8),
      drag([110, 200], [250, 190], 1.6),
      drag([250, 190], [100, 200], 1.6),
      wait(1.2),
    ]),
    {
      url: "/",
      seed: { ...board(), ...signs() },
      settle: 3000,
      beats: [
        say("Others charge for this.\n*DriveRush is free.*"),
        wait(1.6),
        ...scroll(380, 2.2),
        wait(0.6),
      ],
    },
  ],
};
