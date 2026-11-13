import { answer, drag, firstDrive, say, signShot, untilButton, wait } from "./_shared.mjs";

export default {
  id: "14-study-session",
  music: "a",
  shots: [
    firstDrive({
      hook: "a quick NTSA study session ⏱️\nfirst: the board",
      mid: "level 1.\npush to go, let go to stop",
      done: "done ✅ next:\nroad signs",
    }),
    signShot("pelican", ["W.17", "P.1", "R.1"], { revealDelay: 2 }, [
      say("name it before\nthe answer shows 👀"),
      ...answer("Knew it", 1.4),
      say("everybody knows\nthis one 😂"),
      ...answer("Knew it", 1.4),
      say("knew it ✅"),
      ...answer("Knew it", 1.4),
      wait(2.4),
    ]),
    signShot("3d", ["W.21", "P.25"], { revealDelay: 5 }, [
      say("then the same signs\n*in 3D* 🤯"),
      wait(1),
      drag([110, 200], [250, 190], 1.6),
      drag([250, 190], [110, 200], 1.6),
      untilButton("Knew it", 14),
      wait(1.6),
      say("that's the session.\nsame time tomorrow 📅"),
      wait(1.6),
    ]),
  ],
};
