import { watch } from "./_shared.mjs";

export default {
  id: "05-parking-unit",
  music: "b",
  shots: [
    watch("park-angle", {
      hook: "parking is a whole unit 🅿️\nangle parking first",
      steps: [
        [2, "into the parking aisle,\n*slowly*"],
        [4, "farthest free bay,\n*nose in*"],
      ],
      end: "nose in, reverse out ✅",
    }),
    watch("park-flush-reverse", {
      hook: "then flush parking:\ndrive past, *reverse in* 😬",
      steps: [
        [2, "drive past the bay first"],
        [4, "then reverse into it 🔙"],
      ],
      end: "replay it till\nit makes sense 🔁",
    }),
  ],
};
