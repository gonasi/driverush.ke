import { signs } from "../videos/_shared.mjs";

export default {
  id: "04-name-this-sign",
  layout: "card",
  theme: "red",
  url: "/road-signs/3d?codes=W.18,W.21&go=1",
  seed: signs({ revealDelay: 10 }),
  settle: 1800,
  app: { w: 450, h: 470 },
  async prepare(app, h) {
    await h.drag([190, 250], [228, 244], 500);
    await h.wait(400);
  },
  kicker: "Road signs in 3D",
  headline: "Name this sign in *3 seconds.*",
  sub: "Spin it. On the road it is never flat.",
};
