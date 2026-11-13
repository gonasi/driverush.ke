import { say, signShot, until, wait } from "./_shared.mjs";

export default {
  id: "09-shape-cheat-code",
  cover: 0.3,
  music: "c",
  shots: [
    signShot(
      "pelican",
      ["W.1", "W.21", "W.30", "M.2", "M.7", "M.10", "P.1", "P.22", "P.25"],
      { selfGrading: false, autoAdvance: true, revealDelay: 1, autoAdvanceDelay: 2 },
      [
        say("the cheat code for\nroad signs is the *shape* 🧠"),
        wait(3.4),
        say("triangle = *warning* ⚠️\nsomething's coming"),
        until(/vehicles travel straight/, 25),
        say("blue circle =\nyou *must* 🔵"),
        until(/no entry/, 25),
        say("red ring =\nyou must *not* 🔴"),
        until(/speed limit/, 25),
        wait(1.4),
        say("most of the 83 follow\nthese 3 patterns"),
        wait(2.4),
      ],
    ),
  ],
};
