import { board } from "../videos/_shared.mjs";

export default {
  id: "li-02-45-levels",
  dir: "../linkedin",
  frame: { h: 675 },
  headY: 38,
  footY: 617,
  layout: "card",
  theme: "ink",
  url: "/model-town-board/play?level=drive-straight-over",
  seed: board(),
  settle: 7000,
  // Taller than wide, or the board turns the camera side on.
  win: { x: 105, y: 196, w: 330, h: 400 },
  app: { w: 450, h: 546 },
  async prepare(app, h) {
    await h.keyDown("ArrowUp");
    // Shoot on the roundabout, 45 m from the finish.
    await h.until(/finish\s+4\d m/, 20);
  },
  kicker: "Model Town Board",
  headline: "*45 levels.* Every one open.",
  sub: "Lanes, the roundabout, routes, parking, then a mock test.",
};
