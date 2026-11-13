import { watch } from "./_shared.mjs";

export default {
  id: "12-long-way-round",
  music: "c",
  shots: [
    watch("long-way-round", {
      hook: "\"rule 2: the long way round\"\nsounds confusing. watch 👀",
      steps: [
        [2, "you're in lane 2 and\nasked to turn *left*"],
        [3, "but lane 2 only goes\nstraight. so... 🤷"],
        [4, "you go the *long way*\nround instead 🔄"],
        [6, "no stopping.\nno changing lanes."],
        [8, "leave in the lane\nyou came round in ✅"],
      ],
      end: "make sense now? 🧠",
      max: 50,
    }),
  ],
};
