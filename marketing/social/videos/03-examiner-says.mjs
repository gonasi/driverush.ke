import { showMe } from "./_shared.mjs";

export default {
  id: "03-examiner-says",
  music: "c",
  shots: [
    showMe("behind-red", {
      hook: "examiner: \"stop behind\nthe red car\"\nme: 🧍",
      stuck: "no idea? tap *show me*",
      steps: [
        [2, "change lanes where\nthe lines are *broken*"],
        [4, "round the roundabout\nin the same lane"],
      ],
      end: "ohhh. ok. got it 💡",
    }),
    showMe("right", {
      hook: "examiner: \"turn right\nat the roundabout\"\nme: 🧍🧍",
      stuck: "show me again 😭",
      steps: [
        [2, "pick the lane\n*before* the roundabout"],
        [4, "third exit =\nturn right ➡️"],
      ],
      end: "then it's your turn\nto drive it 🎮",
    }),
  ],
};
