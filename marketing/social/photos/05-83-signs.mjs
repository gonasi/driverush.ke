import { signs } from "../videos/_shared.mjs";

export default {
  id: "05-83-signs",
  layout: "card",
  theme: "paper",
  url: "/road-signs/pelican?codes=P.25,W.20&go=1",
  seed: signs({ revealDelay: 10 }),
  settle: 600,
  win: { x: 81, y: 256, w: 378, h: 514 },
  app: { w: 440, h: 598 },
  async prepare(app, h) {
    await h.wait(900);
  },
  kicker: "The Pelican chart",
  headline: "*83 road signs.* How many do you know?",
};
