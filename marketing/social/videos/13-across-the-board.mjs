import { watch } from "./_shared.mjs";

export default {
  id: "13-across-the-board",
  music: "b",
  shots: [
    watch("across-town", {
      hook: "the examiner points from one\nend of the board to the other 😳",
      steps: [
        [2, "*10 steps.* here's the\nright way, start to end"],
        [3, "hold your lane\nround the roundabout"],
        [5, "back onto the\nthree-lane road"],
        [7, "the *shortest correct route*\nnot through the parking ❌"],
        [9, "almost there 🏁"],
      ],
      end: "save this for\nthe night before 📌",
      max: 50,
    }),
  ],
};
