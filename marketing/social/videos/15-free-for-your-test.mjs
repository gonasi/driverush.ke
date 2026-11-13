import { answer, board, drag, hold, laneDrive, release, say, signShot, signs, tap, untilButton, wait } from "./_shared.mjs";

const scroll = (px, seconds) =>
  Array.from({ length: Math.round(seconds * 15) }, () => [
    { do: (_, h) => h.scrollBy(px / (seconds * 15)) },
    wait(1 / 15),
  ]).flat();

export default {
  id: "15-free-for-your-test",
  music: "c",
  shots: [
    {
      url: "/",
      seed: { ...board(), ...signs() },
      settle: 3000,
      beats: [
        say("free things for your\nNTSA test, on one site 🇰🇪"),
        wait(2.2),
        ...scroll(420, 2.4),
        wait(0.8),
      ],
    },
    {
      url: "/model-town-board/play?level=first-drive",
      seed: board(),
      settle: 7000,
      beats: [
        say("1. a 3D Model Town Board\nyou actually *drive* 🚗"),
        wait(1),
        hold("ArrowUp"),
        wait(4.7),
        release("ArrowUp"),
        wait(0.8),
      ],
    },
    {
      url: "/model-town-board/play?level=four-lane",
      seed: board(),
      settle: 7000,
      beats: [
        say("2. *45 levels:* lanes,\nroundabout, routes, parking"),
        wait(2.4),
        tap("Where each lane may go"),
        wait(3.4),
      ],
    },
    signShot("pelican", ["W.30", "P.1"], { revealDelay: 2 }, [
      say("3. *83 road signs*\non the chart"),
      ...answer("Knew it", 1.6),
      untilButton("Knew it", 12),
      wait(1.4),
    ]),
    signShot("3d", ["W.21", "R.1"], { revealDelay: 6 }, [
      say("4. the same signs *in 3D*"),
      wait(0.8),
      drag([110, 200], [250, 190], 1.6),
      drag([250, 190], [100, 200], 1.6),
      wait(1),
      say("no signup. just open it"),
      wait(1.2),
    ]),
  ],
};
