import { answer, say, signShot, untilButton, wait } from "./_shared.mjs";

export default {
  id: "07-name-all-six",
  music: "a",
  shots: [
    signShot("pelican", ["W.14", "W.20", "W.30", "R.2", "P.22", "P.25"], {}, [
      say("name all 6 before\nthe answer shows 👀"),
      ...answer(),
      say("1 for 1? ok ok"),
      ...answer(),
      say("too easy? 😏"),
      ...answer(),
      say("halfway. this one\ntrips people up"),
      ...answer(),
      say("two left.\nno peeking 🙈"),
      ...answer(),
      say("last one 🥁"),
      untilButton("Knew it", 14),
      wait(1.2),
      say("how many did you get?\ncomment your score 👇"),
      wait(1.4),
    ]),
  ],
};
