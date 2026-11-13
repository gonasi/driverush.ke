import { answer, say, signShot, wait } from "./_shared.mjs";

export default {
  id: "11-look-alikes",
  music: "b",
  shots: [
    signShot("pelican", ["W.8", "W.9", "W.31", "W.32", "P.20", "P.21"], { revealDelay: 2.5 }, [
      say("signs that look the same\nuntil it's the test 😵‍💫"),
      ...answer("Knew it", 1.6),
      say("ok so this one's...\nthe other side? 🤔"),
      ...answer("Missed it", 1.4),
      say("missed it. but look,\na *memory tip* 👇"),
      wait(4.6),
      { do: (_, h) => h.press("Next sign") },
      // The sheet takes a moment to close; its old buttons are still there.
      wait(1.2),
      say("barrier or\n*no barrier*? 🚂"),
      ...answer("Knew it", 1.6),
      ...answer("Knew it", 1.6),
      say("the one you missed\n*comes back* 🔁"),
      ...answer("Knew it", 1.6),
      say("no left turn or\nno right turn? 👀"),
      ...answer("Knew it", 1.6),
      ...answer("Knew it", 1.6),
      say("which pair gets you?\ntell us 👇"),
      wait(3),
    ]),
  ],
};
