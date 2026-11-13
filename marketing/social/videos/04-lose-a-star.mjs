import { board, hold, release, say, until, wait } from "./_shared.mjs";

const url = "/model-town-board/play?level=drive-right";

export default {
  id: "04-lose-a-star",
  music: "a",
  shots: [
    {
      url,
      seed: board(),
      settle: 7000,
      beats: [
        say("2 ways to lose a star\nbefore you even park ⭐"),
        wait(2.6),
        say("1. touching the kerb"),
        hold("ArrowUp"),
        wait(2.6),
        hold("ArrowLeft"),
        until(/hit the kerb/, 8),
        release("ArrowLeft"),
        release("ArrowUp"),
        wait(1.4),
        say("it tells you *exactly*\nwhich rule you broke 👀"),
        wait(4.2),
      ],
    },
    {
      url,
      seed: board(),
      settle: 7000,
      beats: [
        say("2. stopping on\nthe roundabout 🛑"),
        wait(1.4),
        hold("ArrowUp"),
        until(/finish\s+40 m/, 12),
        release("ArrowUp"),
        say("just... stopping here\nfor a second 🙃"),
        until(/no stopping|keep moving/, 12),
        wait(1.2),
        say("yeah. *no stopping\non the roundabout*"),
        wait(3.6),
        say("better here than in front\nof the examiner 😅"),
        wait(2.8),
      ],
    },
  ],
};
