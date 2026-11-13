import { answer, drag, say, signShot, untilButton, wait } from "./_shared.mjs";

export default {
  id: "08-signs-in-3d",
  music: "b",
  shots: [
    signShot("3d", ["W.18", "W.21", "R.1", "P.25"], { revealDelay: 5 }, [
      say("road signs but you\ncan *spin them* 🤯"),
      wait(1.2),
      drag([110, 200], [250, 190], 1.6),
      drag([250, 190], [90, 200], 1.6),
      ...answer("Knew it", 2),
      say("because on the road they're\nnever flat like in the book"),
      wait(1),
      drag([120, 200], [250, 195], 1.5),
      drag([250, 195], [150, 200], 1.2),
      ...answer("Knew it", 2),
      say("this one you know.\nfrom the back too? 👀"),
      wait(0.8),
      drag([100, 200], [280, 200], 2),
      drag([280, 200], [170, 200], 1.2),
      ...answer("Knew it", 1.6),
      say("name it before\nthe answer drops ⏳"),
      wait(1),
      drag([230, 200], [110, 195], 1.5),
      untilButton("Knew it", 14),
      wait(1.6),
    ]),
  ],
};
