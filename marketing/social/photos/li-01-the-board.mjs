import { board } from "../videos/_shared.mjs";

export default {
  id: "li-01-the-board",
  dir: "../linkedin",
  frame: { h: 675 },
  headY: 38,
  footY: 617,
  layout: "bleed",
  url: "/model-town-board/play?level=watch-across-town",
  seed: board(),
  settle: 7000,
  // Laid out tall: the board fills the frame and the text panel falls below it.
  app: { w: 540, h: 1560 },
  css: `button[aria-label="Zoom in"], button[aria-label="Zoom out"], button[aria-label="Show the whole table"] { opacity: 0; }`,
  async prepare(app, h) {
    await h.tap("Watch the car drive it");
    await h.until(/step 3 of/, 40);
    await h.tap("Pause");
    await h.tap("Zoom out");
    await h.wait(400);
    await h.tap("Zoom out");
    await h.wait(2500);
  },
  kicker: "NTSA driving test",
  headline: "The Model Town Board.\n*In 3D.* Free.",
  sub: "Drive every route before test day.",
};
