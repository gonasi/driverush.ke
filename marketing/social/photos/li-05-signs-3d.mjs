import { signs } from "../videos/_shared.mjs";

export default {
  id: "li-05-signs-3d",
  dir: "../linkedin",
  frame: { h: 675 },
  headY: 38,
  footY: 617,
  layout: "card",
  theme: "red",
  url: "/road-signs/3d?codes=W.18,W.21&go=1",
  seed: signs({ revealDelay: 10 }),
  settle: 1800,
  win: { x: 85, y: 196, w: 370, h: 400 },
  app: { w: 450, h: 486 },
  async prepare(app, h) {
    await h.drag([190, 250], [228, 244], 500);
    await h.wait(400);
  },
  kicker: "Road signs in 3D",
  headline: "The same signs, *in 3D.*",
  sub: "Spin it. On the road it is never flat.",
};
