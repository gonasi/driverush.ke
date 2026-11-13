import { signs } from "../videos/_shared.mjs";

export default {
  id: "li-04-83-signs",
  dir: "../linkedin",
  frame: { h: 675 },
  headY: 38,
  footY: 617,
  layout: "card",
  theme: "paper",
  url: "/road-signs/pelican?codes=P.25,W.20&go=1",
  seed: signs({ revealDelay: 10 }),
  settle: 600,
  win: { x: 120, y: 190, w: 300, h: 408 },
  app: { w: 440, h: 598 },
  async prepare(app, h) {
    await h.wait(900);
  },
  kicker: "Road signs",
  headline: "*83 road signs* on the chart.",
  sub: "Said aloud, with a note on each one.",
};
