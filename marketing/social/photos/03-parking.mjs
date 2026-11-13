import { board } from "../videos/_shared.mjs";

export default {
  id: "03-parking",
  layout: "card",
  theme: "amber",
  url: "/model-town-board/play?level=drive-park-angle",
  seed: board(),
  settle: 7000,
  app: { w: 450, h: 734 },
  async prepare(app, h) {
    await h.tap("Hint");
    await h.wait(900);
    await h.tap("Show me");
    await h.wait(600);
    await h.tap("Zoom in").catch(() => console.log("  no zoom"));
    await h.until(/step 6 of/, 40);
    await h.wait(250);
  },
  kicker: "Parking",
  headline: "Angle parking: *nose in,* reverse out.",
  sub: "Practise it before test day.",
};
