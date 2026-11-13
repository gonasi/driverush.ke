/**
 * The Model Town Board as a course: units, and numbered levels inside them.
 * A learner is taught a thing before being asked to drive it, so each unit
 * opens with what to know (the parts of the board, the lanes, the rules) and
 * ends with the driving tasks that use it.
 *
 * This file is only names and order, with no geometry behind it, so the pages
 * that list the levels stay light. What a level shows on the table is worked
 * out in `curriculum-content.ts`, and `curriculum.test.ts` checks that every
 * id here is real and every title matches the lesson or task it names.
 *
 * The one exception is level 1, a short first drive with nothing to get wrong,
 * so the first thing a learner does on the board is move a car.
 *
 * Every level is open from the start. `nextLevel` is only where Continue goes.
 */

export type LevelKind =
  | "warmup"
  | "slides"
  | "lanes"
  | "watch"
  | "drive"
  | "mock";
export type LevelDifficulty = "Easy" | "Medium" | "Hard";

/** One card of a "slides" level, and where on the board to look. */
export type SlideRef =
  /** A painted thing from `features.ts`, said in its own words. */
  | { feature: string }
  /** One of the handbook's route rules, from `lessons.ts`. */
  | { rule: "shortest" | "longest" | "last_resort"; at: string }
  /**
   * A rule said here. `at` is the feature whose part of the board to show.
   * With `block`, an upside-down car stands on the board while the card is up
   * (`blocks.ts`), and the camera goes to it.
   */
  | { title: string; note: string; at: string; block?: string };

type LevelBase = {
  id: string;
  title: string;
  difficulty: LevelDifficulty;
};

export type LevelDef =
  /** The first drive (`warmup.ts`): a short straight road, nothing graded. */
  | (LevelBase & { kind: "warmup" })
  | (LevelBase & { kind: "slides"; slides: readonly SlideRef[] })
  /** Every lane of one road into the roundabout, and where each may go. */
  | (LevelBase & { kind: "lanes"; arm: "S" | "N" | "W" | "E" })
  /** A lesson from `lessons.ts`, driven by a car a step at a time. */
  | (LevelBase & { kind: "watch"; lesson: string })
  /** A task from `challenges.ts`, driven by the learner. */
  | (LevelBase & { kind: "drive"; challenge: string })
  /** A mixed round of tasks. Never "done": it is there to come back to. */
  | (LevelBase & { kind: "mock" });

export type Level = LevelDef & {
  /** The number said to the learner, from 1, counted straight through. */
  n: number;
  unit: string;
};

export type Unit = {
  id: string;
  title: string;
  /** One line under the unit's heading. */
  blurb: string;
  levels: readonly Level[];
};

const slides = (
  id: string,
  title: string,
  cards: readonly SlideRef[],
  difficulty: LevelDifficulty = "Easy",
): LevelDef => ({ kind: "slides", id, title, difficulty, slides: cards });

const watch = (
  lesson: string,
  title: string,
  difficulty: LevelDifficulty,
): LevelDef => ({
  kind: "watch",
  id: `watch-${lesson}`,
  title,
  difficulty,
  lesson,
});

const drive = (
  challenge: string,
  title: string,
  difficulty: LevelDifficulty,
): LevelDef => ({
  kind: "drive",
  id: `drive-${challenge}`,
  title,
  difficulty,
  challenge,
});

const UNIT_DEFS: readonly {
  id: string;
  title: string;
  blurb: string;
  levels: readonly LevelDef[];
}[] = [
  {
    id: "board",
    title: "Know the board",
    blurb: "Name every road, line and marking before you drive on it.",
    levels: [
      {
        kind: "warmup",
        id: "first-drive",
        title: "Your first drive",
        difficulty: "Easy",
      },
      slides("roads", "The four roads", [
        { feature: "dual-carriageway" },
        { feature: "three-lane-road" },
        { feature: "two-way-road" },
        { feature: "street" },
      ]),
      slides("roundabout-parts", "The roundabout and its island", [
        { feature: "roundabout" },
        { feature: "island" },
      ]),
      slides("lines", "Continuous lines and broken lines", [
        { feature: "continuous-lines" },
        { feature: "broken-lines" },
      ]),
      slides("kerbs", "Kerbs, the central reserve and the gap", [
        { feature: "yellow-kerb" },
        { feature: "central-reserve" },
        { feature: "u-turn-gap" },
      ]),
      slides("stops", "Stop lines, give way lines and crossings", [
        { feature: "stop-line" },
        { feature: "give-way-line" },
        { feature: "crossing" },
      ]),
      slides("parking-zone", "The parking zone", [
        { feature: "parking-aisle" },
        { feature: "angle-parking" },
        { feature: "flush-parking" },
      ]),
    ],
  },
  {
    id: "lanes",
    title: "Lanes",
    blurb: "Count your lane from the kerb, and know where each one may go.",
    levels: [
      slides("lane-numbers", "Keep left and count your lane", [
        {
          title: "Keep left",
          note: "In Kenya you drive on the left. On every road of the board, your side is the left-hand side of the line or the reserve down the middle.",
          at: "dual-carriageway",
        },
        { feature: "lane-numbers" },
        { feature: "lane-arrows" },
      ]),
      {
        kind: "lanes",
        id: "four-lane",
        title: "The four-lane road: 2124",
        difficulty: "Easy",
        arm: "S",
      },
      {
        kind: "lanes",
        id: "three-lane",
        title: "The three-lane road: 215",
        difficulty: "Medium",
        arm: "W",
      },
      slides("changing-lanes", "Changing lanes", [
        {
          title: "Only where the lines are broken",
          note: "You may change lanes only across a broken white line. Back from the roundabout the lines are broken, so that is where you get into the lane for your turn.",
          at: "broken-lines",
        },
        {
          title: "Mirrors, signal, then move",
          note: "Check your mirrors, signal for 3 seconds, then move across one lane at a time.",
          at: "broken-lines",
        },
        {
          title: "Too late at the continuous lines",
          note: "Once the lines are continuous you stay in your lane. If it is the wrong lane for your turn, do not cut across: go where your lane goes and take the long way round.",
          at: "continuous-lines",
        },
      ]),
    ],
  },
  {
    id: "roundabout",
    title: "The roundabout",
    blurb: "The rules on the roundabout, then every turn from both roads.",
    levels: [
      slides("roundabout-rules", "The roundabout rules", [
        {
          title: "Go round clockwise",
          note: "Traffic goes round the island clockwise, keeping left. You turn left onto the roundabout, never right.",
          at: "roundabout",
        },
        {
          title: "Give way to your right",
          note: "Traffic already on the roundabout comes from your right, and it goes first. Join when there is a gap.",
          at: "roundabout",
        },
        {
          title: "No stopping, no changing lanes",
          note: "Once you are on it, keep moving in the lane you came in on. No stopping, waiting, parking, overtaking or changing lanes on the roundabout.",
          at: "roundabout",
        },
        {
          title: "Only lane 4 goes all the way round",
          note: "The lane beside the island is the only one that may make a full circle. Every other lane has to leave before it gets back to where it joined.",
          at: "island",
        },
        {
          title: "Leave in the lane you came round in",
          note: "At your exit, leave in the same lane you have been driving in. Do not drift across to another one on the way out.",
          at: "roundabout",
        },
      ]),
      watch("straight-over", "Straight over the roundabout", "Easy"),
      drive("straight", "Go straight", "Easy"),
      watch("first-exit", "Left at the roundabout", "Easy"),
      drive("left", "Turn left", "Easy"),
      drive("right", "Turn right", "Easy"),
      watch("wrong-lane", "In the wrong lane, with room to move", "Easy"),
      watch("come-back", "Right round and back", "Medium"),
      drive("back", "Come back", "Medium"),
      drive("behind-red", "Behind the red car", "Medium"),
      drive("three-lane-right", "Right from the three-lane road", "Medium"),
      drive("three-lane-back", "Come back on the three-lane road", "Hard"),
    ],
  },
  {
    id: "routes",
    title: "Routes",
    blurb: "The three route rules, then routes across the whole board.",
    levels: [
      slides(
        "route-rules",
        "The three route rules",
        [
          { rule: "shortest", at: "dual-carriageway" },
          { rule: "longest", at: "continuous-lines" },
          { rule: "last_resort", at: "parking-aisle" },
        ],
        "Medium",
      ),
      slides(
        "the-gap",
        "Turning back through the gap",
        [
          {
            title: "Get beside the reserve first",
            note: "To turn back through a gap in the central reserve, be in the lane beside the reserve before you reach it. Move across where the lines are broken.",
            at: "u-turn-gap",
          },
          {
            title: "Give way, then join",
            note: "Traffic on the side you are joining goes first. Turn through the gap and carry on in the lane beside the reserve.",
            at: "u-turn-gap",
          },
        ],
        "Medium",
      ),
      drive("turn-back", "Turn back", "Medium"),
      watch("long-way-round", "Rule 2: the long way round", "Hard"),
      drive("long-way-round", "The long way round", "Hard"),
      watch("right-to-two-way", "Right, then onto the two-way road", "Medium"),
      drive("to-two-way", "Right, then the two-way road", "Medium"),
      watch("street", "Down the street to the two-way road", "Medium"),
      drive("down-the-street", "Down the street", "Medium"),
      watch(
        "two-way-to-dual",
        "From the two-way road to the dual carriageway",
        "Medium",
      ),
      drive("from-two-way", "Back to the dual carriageway", "Medium"),
      watch("across-town", "Across the board", "Hard"),
      watch("round-the-block", "Round the block and back north", "Hard"),
      slides(
        "blocked-roads",
        "When a road is blocked",
        [
          {
            title: "An upside-down car closes the way",
            note: "An instructor turns a toy car upside down to block a lane, an exit, a gap or a whole road. That way is closed for the task.",
            at: "dual-carriageway",
            block: "lane",
          },
          {
            title: "Never touch it or squeeze past",
            note: "Do not bump the upside-down car, and do not cross a continuous line to get round it. Changing lanes on the roundabout to pass one is still not allowed.",
            at: "roundabout",
            block: "ring",
          },
          {
            title: "Take the next correct route",
            note: "Look for the block before you set off. Then use the same three route rules on the roads that are still open: the shortest correct route, the long way round, and the parking area only as a last resort.",
            at: "u-turn-gap",
            block: "gap",
          },
        ],
        "Medium",
      ),
      drive("blocked-lane", "A lane is blocked", "Medium"),
      drive("blocked-exit", "An exit is blocked", "Medium"),
      drive("blocked-ring", "A lane on the roundabout is blocked", "Hard"),
      drive("blocked-gap", "The gap is blocked", "Hard"),
      drive("blocked-street", "The street is blocked", "Hard"),
    ],
  },
  {
    id: "parking",
    title: "Parking",
    blurb: "Angle bays and flush boxes: in, and out again.",
    levels: [
      slides("parking-rules", "The parking rules", [
        {
          title: "Angle parking: nose in, reverse out",
          note: "Drive into an angle bay forwards. To leave, reverse out, give way to anything in the aisle, then drive off forwards.",
          at: "angle-parking",
        },
        {
          title: "Flush parking: drive past, reverse in",
          note: "Drive just past the box, stop, and reverse into it. To leave, drive out forwards.",
          at: "flush-parking",
        },
        {
          title: "Take the farthest free bay",
          note: "Parked cars fill a row from one end. Take the farthest bay that is free, and finish with the whole car inside the lines and straight.",
          at: "angle-parking",
        },
        { rule: "last_resort", at: "parking-aisle" },
      ]),
      watch("park-angle", "Drive into an angle bay", "Easy"),
      drive("park-angle", "Angle parking", "Easy"),
      watch("leave-angle-reverse", "Reverse out of an angle bay", "Medium"),
      drive("leave-angle", "Reverse out of the bay", "Medium"),
      watch("park-flush-reverse", "Reverse into flush parking", "Medium"),
      drive("park-flush", "Flush parking", "Medium"),
      watch("leave-flush", "Pull out of flush parking", "Easy"),
      drive("leave-flush", "Pull out of flush parking", "Easy"),
      drive("blocked-parking", "The way into the parking is blocked", "Hard"),
    ],
  },
  {
    id: "mock",
    title: "Mock test",
    blurb: "Five tasks picked for you, mixed from everything above.",
    levels: [
      {
        kind: "mock",
        id: "mock-test",
        title: "Five tasks, mixed",
        difficulty: "Hard",
      },
    ],
  },
];

let count = 0;
export const UNITS: readonly Unit[] = UNIT_DEFS.map((unit) => ({
  ...unit,
  levels: unit.levels.map((level) => ({
    ...level,
    n: ++count,
    unit: unit.id,
  })),
}));

export const ALL_LEVELS: readonly Level[] = UNITS.flatMap((u) => u.levels);
/** The levels that can be finished. The mock test is not one of them. */
export const COURSE_LEVELS: readonly Level[] = ALL_LEVELS.filter(
  (l) => l.kind !== "mock",
);
export const MOCK_LEVEL_ID = "mock-test";

export function levelById(id: string | null | undefined): Level | undefined {
  return id ? ALL_LEVELS.find((l) => l.id === id) : undefined;
}

export function unitOf(level: Level): Unit {
  return UNITS.find((u) => u.id === level.unit) ?? UNITS[0];
}

/** What the saved progress needs to hold to say which levels are done. */
export type CourseProgress = {
  learned?: readonly string[];
  bestStars: Readonly<Record<string, number>>;
  /** Levels finished on one calendar day (`YYYY-MM-DD`), for the day's goal. */
  daily?: { day: string; done: number };
  /** The best mock test so far: tasks driven clean, out of how many. */
  mockBest?: { clean: number; total: number; day: string };
};

/** A small goal for one sitting: this many levels in a day. */
export const DAILY_GOAL = 3;

/** How a finished "slides" or "lanes" level is written in `learned`. */
export const learnedKey = (level: Level) => `lv:${level.id}`;

/**
 * Done means: read to the last card, watched to the end, or driven to a pass.
 * Lessons watched and tasks passed before there were levels count too.
 */
export function levelDone(level: Level, saved: CourseProgress): boolean {
  switch (level.kind) {
    case "drive":
      return (saved.bestStars[level.challenge] ?? 0) > 0;
    case "watch":
      return Boolean(saved.learned?.includes(level.lesson));
    case "mock":
      return false;
    case "warmup":
      // Anyone who has passed a driving task has had their first drive.
      return (
        Boolean(saved.learned?.includes(learnedKey(level))) ||
        Object.values(saved.bestStars).some((stars) => stars > 0)
      );
    default:
      return Boolean(saved.learned?.includes(learnedKey(level)));
  }
}

export function doneCount(saved: CourseProgress): number {
  return COURSE_LEVELS.filter((l) => levelDone(l, saved)).length;
}

/**
 * How much of the course is in hand, 0 to 100. A level read or watched counts
 * in full. A driving level counts by its best stars, so a pass with mistakes
 * leaves something to come back for.
 */
export function readiness(saved: CourseProgress): number {
  let points = 0;
  for (const level of COURSE_LEVELS) {
    if (level.kind === "drive") {
      points += Math.min(3, saved.bestStars[level.challenge] ?? 0) / 3;
    } else if (levelDone(level, saved)) {
      points += 1;
    }
  }
  return Math.round((points / COURSE_LEVELS.length) * 100);
}

/** The driving level with the fewest stars, once it has been passed. */
export function weakestDrive(saved: CourseProgress): Level | undefined {
  let worst: Level | undefined;
  let fewest = 3;
  for (const level of COURSE_LEVELS) {
    if (level.kind !== "drive") continue;
    const stars = saved.bestStars[level.challenge] ?? 0;
    if (stars > 0 && stars < fewest) {
      fewest = stars;
      worst = level;
    }
  }
  return worst;
}

/** Where Continue goes: the first level not done yet, then the mock test. */
export function nextLevel(saved: CourseProgress): Level {
  return (
    COURSE_LEVELS.find((l) => !levelDone(l, saved)) ??
    ALL_LEVELS[ALL_LEVELS.length - 1]
  );
}

/** The level after this one in the list, whether or not it is done. */
export function levelAfter(level: Level): Level | undefined {
  return ALL_LEVELS[ALL_LEVELS.indexOf(level) + 1];
}

/** The level before this one in the list. The first level has none. */
export function levelBefore(level: Level): Level | undefined {
  const i = ALL_LEVELS.indexOf(level);
  return i > 0 ? ALL_LEVELS[i - 1] : undefined;
}

export const KIND_LABEL: Record<LevelKind, string> = {
  warmup: "Drive",
  slides: "Learn",
  lanes: "Learn",
  watch: "Watch",
  drive: "Drive",
  mock: "Drive",
};
