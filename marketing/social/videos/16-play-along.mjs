import { answer, say, signShot, untilButton, wait } from "./_shared.mjs";

/*
 * Twelve signs, easy to hard, a perfect run the viewer plays along with.
 * The app plays a drill in chart order, so each level is its own shot.
 * Every code here is confirmed (CONFIRMED_CODES in app/lib/road-sign-pages.ts).
 */
const READ = 0.8;
const go = (mark = "Knew it") => answer(mark, READ);

export default {
  id: "16-play-along",
  cover: 1.2,
  music: "a",
  shots: [
    signShot("pelican", ["W.22", "W.23", "P.20", "P.32"], {}, [
      say("12 signs, easy to hard.\nname it before it shows 👀"),
      ...go(),
      say("warm up 😌"),
      ...go(),
      say("2 for 2 ✅"),
      ...go(),
      say("last easy one"),
      ...go(),
    ]),
    signShot("pelican", ["W.4", "W.11", "W.27", "P.33"], {}, [
      say("level 2: *medium* 😏"),
      ...go(),
      say("5 for 5"),
      ...go(),
      say("still with me? 👀"),
      ...go(),
      say("seen this one already?\nlook *closer* 🤔"),
      untilButton("Knew it", 14),
      say("one bar: no parking\na *cross*: no waiting either ❌"),
      wait(1.9),
      ...answer("Knew it", 0),
    ]),
    signShot("pelican", ["W.25", "M.5", "M.10", "P.30"], {}, [
      say("level 3: *hard* 🥵"),
      ...go(),
      say("9 down, 3 to go"),
      ...go(),
      say("no peeking 🙈"),
      untilButton("Knew it", 14),
      say("blue = *minimum* speed\nred ring = *maximum* 🧠"),
      wait(1.9),
      ...answer("Knew it", 0),
      say("last one 🥁"),
      untilButton("Knew it", 14),
      wait(READ),
      say("12 for 12 🏁\nhow many did you get? 👇"),
      wait(1.8),
      say("play along with all 83 👉\n*driverush.ke*"),
      wait(2.6),
    ]),
  ],
};
