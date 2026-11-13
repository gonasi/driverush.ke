import { board, laneDrive, say, tap, wait } from "./_shared.mjs";

export default {
  id: "06-learn-2124",
  music: "c",
  shots: [
    {
      url: "/model-town-board/play?level=four-lane",
      seed: board(),
      settle: 7000,
      beats: [
        say("if your instructor keeps\nsaying *2124* 🤨\nthis is what it means"),
        wait(3.6),
        tap("Where each lane may go"),
        say("the options in each lane,\ncounted from the kerb"),
        wait(4.4),
        say("lane 1: *2*   lane 2: *1*\nlane 3: *2*   lane 4: *4*"),
        wait(4.6),
      ],
    },
    laneDrive(2, {
      intro: "one car per option.\nyou drive them all 🚗",
      driving: "lane 2 has *one* option:\nstraight",
      mid: "same lane all the\nway round 🫣",
      home: "1 of 9 home ✅\n2124 makes sense now 🧠",
    }),
  ],
};
