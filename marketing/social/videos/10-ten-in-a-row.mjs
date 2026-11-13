import { answer, say, signShot, wait } from "./_shared.mjs";

const quick = () => answer("Knew it", 0.9);

export default {
  id: "10-ten-in-a-row",
  cover: 0.3,
  music: "a",
  shots: [
    signShot(
      "pelican",
      ["W.1", "W.2", "W.5", "W.6", "W.7", "W.12", "W.14", "W.20", "W.21", "W.30"],
      { revealDelay: 1 },
      [
        say("can you get\n*10 in a row*? 🔥"),
        ...quick(),
        ...quick(),
        ...quick(),
        say("3 🔥"),
        ...quick(),
        ...quick(),
        say("5 in a row...\ndon't choke now 😅"),
        ...quick(),
        ...quick(),
        ...quick(),
        say("two more 😬"),
        ...quick(),
        ...quick(),
        say("10 for 10 🏁\nyour turn. post your streak 👇"),
        wait(3.2),
      ],
    ),
  ],
};
