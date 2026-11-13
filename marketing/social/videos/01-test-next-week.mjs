import { firstDrive, laneDrive } from "./_shared.mjs";

export default {
  id: "01-test-next-week",
  music: "a",
  shots: [
    firstDrive({
      hook: "pov: your NTSA test is next week 😭\nand you've never touched the board",
      mid: "push to go.\nlet go to stop 🛑",
      done: "ok level 1 done ✅\nthat was easy",
    }),
    laneDrive(2, {
      intro: "level 9 now 👀\nnine cars, drive each one home",
      driving: "lane 2 only goes straight\nso... straight we go",
      mid: "hold your lane\nround the roundabout 🫣",
      home: "1 of 9 home 😮‍💨\n*eight more*",
    }),
  ],
};
