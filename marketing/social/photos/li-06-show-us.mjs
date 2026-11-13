import { board } from "../videos/_shared.mjs";

export default {
  id: "li-06-show-us",
  dir: "../linkedin",
  frame: { h: 675 },
  headY: 38,
  footY: 617,
  layout: "card",
  theme: "green",
  url: "/model-town-board/play?level=first-drive",
  seed: board(),
  settle: 7000,
  win: { x: 120, y: 250, w: 300, h: 346 },
  app: { w: 450, h: 519 },
  async prepare(app, h) {
    await h.keyDown("ArrowUp");
    await h.wait(4700);
    await h.keyUp("ArrowUp");
    await h.wait(3500);
  },
  kicker: "A challenge",
  headline: "Seen better NTSA prep in Kenya? *Show us.*",
  sub: "DriveRush is free. No signup.",
};
