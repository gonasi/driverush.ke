import { board } from "../videos/_shared.mjs";

export default {
  id: "02-roundabout",
  layout: "split",
  theme: "ink",
  url: "/model-town-board/play?level=drive-straight-over",
  seed: board(),
  settle: 7000,
  // Taller than wide, or the board turns the camera side on.
  win: { x: 0, y: 296, w: 540, h: 544 },
  app: { w: 540, h: 544 },
  foot: "head",
  async prepare(app, h) {
    await h.keyDown("ArrowUp");
    // Shoot on the roundabout, 45 m from the finish.
    await h.until(/finish\s+4\d m/, 20);
    console.log("  ", (await h.text()).slice(-60));
  },
  headline: "Go straight on.\n*Which lane* do you take?",
};
