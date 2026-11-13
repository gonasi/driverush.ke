import { watch } from "./_shared.mjs";

export default {
  id: "02-roundabout-panic",
  music: "b",
  shots: [
    watch("straight-over", {
      hook: "examiner: \"go straight on\"\nme: ...which lane?? 😩",
      steps: [
        [2, "*lane 2* going in"],
        [3, "no changing lanes\non the roundabout ❌"],
        [4, "second exit =\nstraight on ✅"],
      ],
      end: "ok that one's easy",
    }),
    watch("come-back", {
      hook: "now the scary one:\nright round and *come back* 🔄",
      steps: [
        [2, "watch which lane\nit picks 👀"],
        [3, "all the way round...\nno stopping"],
        [5, "and out the way\nyou came in"],
      ],
      end: "you can pause it or\nslow it down 🐢",
    }),
  ],
};
