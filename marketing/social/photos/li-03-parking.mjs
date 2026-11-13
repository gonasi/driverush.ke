import { board } from "../videos/_shared.mjs";

export default {
  id: "li-03-parking",
  dir: "../linkedin",
  frame: { h: 675 },
  headY: 38,
  footY: 617,
  layout: "card",
  theme: "amber",
  url: "/model-town-board/play?level=drive-park-angle",
  seed: board(),
  settle: 7000,
  win: { x: 105, y: 196, w: 330, h: 400 },
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
  kicker: "Rules from the NTSA handbook",
  headline: "Stuck? The app *shows you* the route.",
  sub: "Parking, lane by lane and step by step.",
};
