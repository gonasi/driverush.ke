import { board } from "../videos/_shared.mjs";

export default {
  id: "06-level-one-done",
  layout: "card",
  theme: "green",
  url: "/model-town-board/play?level=first-drive",
  seed: board(),
  settle: 7000,
  app: { w: 450, h: 470 },
  async prepare(app, h) {
    await h.keyDown("ArrowUp");
    await h.wait(4700);
    await h.keyUp("ArrowUp");
    await h.wait(3500);
  },
  kicker: "Free practice",
  headline: "*45 levels.* Free. No signup.",
  sub: "Start with a first drive you cannot fail.",
};
