/**
 * The Model Town Board trainer's store, built like `pelican-store.ts`: persisted
 * progress and settings, plus the run in flight. The car itself is not in here.
 * It moves sixty times a second in `board/runtime.ts`, and this store only hears
 * about it when the referee calls a mistake or a pass.
 */
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import { analytics } from "./analytics";
import {
  BOARD_CHALLENGES,
  BOARD_ROUND_SIZE,
  isRouteTask,
  type BoardChallenge,
} from "./board/challenges";
import {
  learnedKey,
  levelById,
  unitOf,
  type Level,
} from "./board/curriculum";
import type { ArmId } from "./board/geometry";
import {
  pickable,
  queueCars,
  queueChallenge,
  type QueuePose,
} from "./board/lane-queue";
import { shuffleParkingLayout } from "./board/parking-layouts";
import { challengeRoute, taskParks } from "./board/lessons";
import {
  STOPS_ALWAYS,
  type Fault,
  type FaultId,
} from "./board/referee";
import {
  beginChallenge,
  car,
  deviation,
  drive,
  judging,
  elapsedSeconds,
  hasMoved,
  setBack,
  stopDriving,
  trail,
} from "./board/runtime";
import type { BoardCarSetting } from "./board/cars";
import type { Seat } from "./board/joystick";
import {
  fitTable,
  forgetDriveZoom,
  releaseCamera,
  useStage,
} from "./board/stage";
import {
  OFF_ROUTE_SCORE,
  SCORE_VERSION,
  beats,
  parSeconds,
  scoreFor,
  type BestScore,
} from "./board/score";
import { FIRST_DRIVE } from "./board/warmup";
import { applyGrade, type SignProgress } from "./pelican-progress";
import { bumpPracticeStreak, dayKey } from "./practice-streak";
import { BUZZ, buzz, playSfx, stopAllSfx, warmSfx } from "./sounds";
import { pickRound } from "./trainer-rounds";

export type BoardQuality = "auto" | "low" | "high";
export type BoardSettings = {
  sound: boolean;
  quality: BoardQuality;
  /**
   * Which side of the table the learner stands at. Left out until they choose:
   * the bottom on a tall screen, the right-hand side on a wide one.
   */
  seat?: Seat;
  /** Hold the lane the car is in. On unless switched off. */
  assist?: boolean;
  /** Which car to drive. Left out, or "random", is a different one each visit. */
  car?: BoardCarSetting;
  /** The first-drive tips have been read or skipped. */
  coached?: boolean;
};
export const DEFAULT_BOARD_SETTINGS: BoardSettings = {
  sound: true,
  quality: "auto",
};

/** "watch" is the drive paused while the right way is played back. */
export type BoardPhase =
  | "ready"
  | "driving"
  | "fault"
  | "watch"
  | "passed"
  | "complete";

/**
 * Driving the tasks, learning the board with no task on, or a level of the
 * course that is read or watched and not driven.
 */
export type BoardMode = "drive" | "learn" | "level";

/**
 * A lane options level in flight: every car of one road is on the table, and
 * the learner drives them home one at a time (`board/lane-queue.ts`).
 */
export type LanesRun = {
  arm: ArmId;
  /** Where each car that has been driven home stopped, by car id. */
  rest: Record<string, QueuePose>;
  /** The car being driven now. */
  picked: string | null;
};

/**
 * `back` means the car was put back a little. `route` means the car has left
 * the task's route: no rule broken, no star lost, but no pass either.
 */
export type BoardNotice = {
  fault: Fault;
  n: number;
  back?: boolean;
  route?: boolean;
};

type BoardState = {
  // ---- persisted ----
  settings: BoardSettings;
  /** Same boxes as the sign trainers, keyed by challenge id. */
  progress: SignProgress;
  bestStars: Record<string, number>;
  /** The best score on each task, with what it was worked out from. */
  bestScores?: Record<string, BestScore>;
  /** Lessons watched to the end. */
  learned?: string[];
  /** Levels finished today, for the day's goal on the Board page. */
  daily?: { day: string; done: number };
  /** The best mock test so far: tasks driven clean, out of how many. */
  mockBest?: { clean: number; total: number; day: string };
  /** The whole course has been finished once, and that has been marked. */
  courseCheered?: boolean;
  /** The card a deck of slides was left at, by level id. */
  places?: Record<string, number>;
  /** The cars already home in a lane options level left part-way, by level id. */
  homes?: Record<string, Record<string, QueuePose>>;
  // ---- transient ----
  overlayOpen: boolean;
  mode: BoardMode;
  /** The level of the course that is open, when the game was opened on one. */
  level: string | null;
  /** The line-up of a lane options level, while one is open. */
  lanes: LanesRun | null;
  /** A hint was used on the task in front of the learner. */
  hinted: boolean;
  /** The run is a mock test: a mixed round, not one task or a drill. */
  round: boolean;
  phase: BoardPhase;
  queue: BoardChallenge[];
  pos: number;
  /** Faults on this attempt at the task. The stars count these. */
  faults: number;
  /** Faults on the task over every attempt at it. */
  taskFaults: number;
  /** Which attempt at the task this is, from 1. */
  tries: number;
  fault: Fault | null;
  /**
   * How the car left the task's route on this attempt, once it has. It broke
   * no rule, so the drive goes on, but stopping in the box will not pass.
   */
  offRoute: Fault | null;
  /** The attempt ended in the box after leaving the route: not a pass. */
  missed: boolean;
  /** The score of the drive just finished, and how long it took. */
  lastScore: number | null;
  lastSeconds: number;
  lastPar: number;
  /** That score is the best yet on its task. */
  lastBest: boolean;
  /**
   * The latest small mistake, shown as a toast. `n` restarts its animation.
   * `back` means the car was put back a little instead of the attempt ending.
   */
  notice: BoardNotice | null;
  noticeCount: number;
  lastStars: number;
  /** Bumped on every (re)start, so the scene knows to snap the camera. */
  attempt: number;
  // ---- this run ----
  runClean: string[];
  runFaulted: string[];
  runFaultCount: number;
  runFaultRules: FaultId[];
  runStreak: number;
  runBestStreak: number;
  // ---- actions ----
  start: (ids?: readonly string[]) => void;
  /** After a fault: same challenge, from its start line. */
  retry: () => void;
  /** The learner's own restart while driving. Not a fault. */
  restart: () => void;
  next: () => void;
  exit: () => void;
  /** Open the board to learn it: no task, no clock. */
  learn: () => void;
  /** Open one level of the course: its cards, its playback or its task. */
  startLevel: (id: string) => void;
  /** The level's cards were read to the end, or its lanes all looked at. */
  completeLevel: () => void;
  /** Take one car of a lane options level and drive it to its place. */
  pickCar: (id: string) => void;
  /** Give up on the car being driven: it goes back to its place in the line. */
  putBack: () => void;
  /** A hint was shown. The task no longer counts as known without help. */
  hint: (kind: "next_step" | "show_me" | "after_fault") => void;
  /** Pause the task to watch the right way played back. */
  watch: () => void;
  /** Done watching: the task again, from its start line. */
  resume: () => void;
  markLearned: (id: string) => void;
  /** Remember the card a deck of slides is on. */
  keepPlace: (level: string, at: number) => void;
  setSetting: (patch: Partial<BoardSettings>) => void;
  resetProgress: () => void;
};

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const FRESH_RUN = {
  queue: [] as BoardChallenge[],
  pos: 0,
  faults: 0,
  taskFaults: 0,
  tries: 1,
  fault: null,
  offRoute: null as Fault | null,
  missed: false,
  lastScore: null as number | null,
  lastSeconds: 0,
  lastPar: 0,
  lastBest: false,
  notice: null as BoardNotice | null,
  noticeCount: 0,
  lastStars: 0,
  runClean: [] as string[],
  runFaulted: [] as string[],
  runFaultCount: 0,
  runFaultRules: [] as FaultId[],
  runStreak: 0,
  runBestStreak: 0,
  lanes: null as LanesRun | null,
};

export function starsFor(faults: number): number {
  return faults === 0 ? 3 : faults === 1 ? 2 : 1;
}

/** This many small mistakes in one attempt and the examiner stops it. */
export const SMALL_FAULT_LIMIT = 3;
/** A gentle level puts the car back about this far before a mistake, metres. */
const SET_BACK = 12;
/** Driven past the box, it goes back far enough to come up to it again. */
const SET_BACK_PAST = 28;
/** The line the car drove, painted on the table when the examiner stops it. */
const DRIVEN_COLOR = "#ff6b5e";

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => {
      /** Count a mistake against the task. The first one sends it back a box. */
      const record = (fault: Fault) => {
        const { queue, pos, taskFaults } = get();
        const challenge = queue[pos];
        if (!challenge) return;
        const first = taskFaults === 0;
        set((s) => ({
          faults: s.faults + 1,
          taskFaults: s.taskFaults + 1,
          runFaultCount: s.runFaultCount + 1,
          runStreak: 0,
          runFaulted: first ? [...s.runFaulted, challenge.id] : s.runFaulted,
          runFaultRules: s.runFaultRules.includes(fault.id)
            ? s.runFaultRules
            : [...s.runFaultRules, fault.id],
          // A car of a lane options level is a lesson, not a graded task.
          progress:
            first && !s.lanes
              ? applyGrade(s.progress, challenge.id, "missed")
              : s.progress,
        }));
        analytics.boardFaulted({
          challenge_id: challenge.id,
          rule: fault.id,
          severity: fault.serious ? "serious" : "small",
          fault_number: taskFaults + 1,
        });
      };

      /**
       * How kindly this drive is judged. "free" is the first drive: nothing
       * ends it and nothing is counted. "soft" is a lesson car or an Easy
       * level: the first mistakes put the car back a little, and only the
       * third stops the attempt. Breaking a lane rule is never softened: on
       * every level but the first drive it ends the attempt.
       */
      const gentle = (): "free" | "soft" | null => {
        const s = get();
        const level = levelById(s.level);
        if (level?.kind === "warmup") return "free";
        if (s.lanes?.picked) return "soft";
        if (level?.kind === "drive" && level.difficulty === "Easy") {
          return "soft";
        }
        return null;
      };

      /** A serious mistake: the examiner stops the attempt. */
      const onFault = (fault: Fault) => {
        if (get().settings.sound) playSfx("wrong");
        buzz(BUZZ.miss);
        const kind = gentle();
        const room =
          kind === "free" ||
          (kind === "soft" &&
            !STOPS_ALWAYS.has(fault.id) &&
            get().faults < SMALL_FAULT_LIMIT - 1);
        if (room && setBack(SET_BACK)) {
          if (kind === "soft") record(fault);
          set((s) => ({
            notice: { fault, n: s.noticeCount + 1, back: true },
            noticeCount: s.noticeCount + 1,
            // The car may be back before the place it left its route.
            offRoute: deviation(),
          }));
          return;
        }
        if (kind !== "free") record(fault);
        stopped(fault);
      };

      /**
       * The car has left the task's route without breaking a rule. It may
       * drive on wherever it likes, but this attempt can no longer pass. The
       * first drive has no route to lose: the car is put back, as before.
       */
      const onDeviation = (fault: Fault) => {
        if (get().settings.sound) playSfx("wrong");
        buzz(BUZZ.miss);
        if (gentle() === "free") {
          const back = setBack(
            fault.id === "past_end" ? SET_BACK_PAST : SET_BACK,
          );
          set((s) => ({
            notice: { fault, n: s.noticeCount + 1, back },
            noticeCount: s.noticeCount + 1,
          }));
          return;
        }
        const { queue, pos, taskFaults } = get();
        const challenge = queue[pos];
        if (!challenge) return;
        const first = taskFaults === 0;
        // Counted against the task, so it is not a clean first try, but not
        // against the stars: no rule was broken.
        set((s) => ({
          offRoute: fault,
          taskFaults: s.taskFaults + 1,
          runStreak: 0,
          runFaulted: first ? [...s.runFaulted, challenge.id] : s.runFaulted,
          progress:
            first && !s.lanes
              ? applyGrade(s.progress, challenge.id, "missed")
              : s.progress,
          notice: { fault, n: s.noticeCount + 1, route: true },
          noticeCount: s.noticeCount + 1,
        }));
        analytics.boardFaulted({
          challenge_id: challenge.id,
          rule: fault.id,
          severity: "route",
          fault_number: taskFaults + 1,
        });
      };

      /** In the box, but not by the task's route: the drive ends, not passed. */
      const missed = (challenge: BoardChallenge, fault: Fault) => {
        if (get().settings.sound) playSfx("wrong");
        buzz(BUZZ.miss);
        const seconds = elapsedSeconds();
        stopped(fault);
        set({ missed: true, lastScore: OFF_ROUTE_SCORE, lastSeconds: seconds });
        analytics.boardChallengeMissed({
          challenge_id: challenge.id,
          rule: fault.id,
          tries: get().tries,
          seconds: Math.round(seconds),
          score: OFF_ROUTE_SCORE,
          score_version: SCORE_VERSION,
        });
      };

      /** The attempt is over: the card, and the line the car drove. */
      const stopped = (fault: Fault) => {
        set({ phase: "fault", fault, notice: null });
        if (trail.length > 1) {
          useStage.getState().show([
            {
              id: "driven",
              points: trail.map(({ x, z }) => ({ x, z })),
              color: DRIVEN_COLOR,
              width: 1.1,
              opacity: 0.9,
            },
          ]);
        }
      };

      /** A small mistake: a star is lost, and the drive goes on. */
      const onSmall = (fault: Fault) => {
        if (get().settings.sound) playSfx("wrong");
        buzz(BUZZ.miss);
        // The first drive only says the rule. Nothing is counted.
        if (gentle() === "free") {
          set((s) => ({
            notice: { fault, n: s.noticeCount + 1 },
            noticeCount: s.noticeCount + 1,
          }));
          return;
        }
        record(fault);
        // Small mistakes add up. Leaning on kerbs all the way round is not a pass.
        if (get().faults >= SMALL_FAULT_LIMIT) {
          stopDriving();
          stopped({ ...fault, serious: true });
          return;
        }
        set((s) => ({
          notice: { fault, n: s.noticeCount + 1 },
          noticeCount: s.noticeCount + 1,
        }));
      };

      /** A car of a lane options level is home: it stays, and the line-up is back. */
      const carHome = (run: LanesRun, id: string) => {
        if (get().settings.sound) playSfx("correct");
        buzz(BUZZ.tap);
        const rest = {
          ...run.rest,
          [id]: { x: car.x, z: car.z, heading: car.heading },
        };
        stopDriving();
        useStage.getState().clear();
        forgetDriveZoom();
        const all = queueCars(run.arm).every((one) => rest[one.id]);
        const levelId = get().level;
        set((s) => {
          // Kept so the line-up can be left and come back to. Once every car
          // is home there is nothing to keep: next time it starts afresh.
          const homes = { ...s.homes };
          if (levelId) {
            if (all) delete homes[levelId];
            else homes[levelId] = rest;
          }
          return {
            mode: "level",
            phase: "ready",
            queue: [],
            pos: 0,
            fault: null,
            notice: null,
            lanes: { ...run, rest, picked: null },
            homes,
          };
        });
        if (all) {
          if (get().settings.sound) playSfx("complete");
          get().completeLevel();
        }
      };

      const onGoal = () => {
        const { queue, pos, faults, taskFaults, tries, hinted, settings } =
          get();
        const challenge = queue[pos];
        if (!challenge) return;
        const off = get().offRoute;
        if (off && gentle() !== "free") {
          missed(challenge, off);
          return;
        }
        const run = get().lanes;
        if (run?.picked) {
          carHome(run, run.picked);
          return;
        }
        if (settings.sound) playSfx("correct");
        buzz(BUZZ.tap);
        // The first drive is not graded: it is done, and that is all.
        const here = levelById(get().level);
        if (here?.kind === "warmup") {
          set({ phase: "passed", lastStars: 3 });
          const key = learnedKey(here);
          const first = !get().learned?.includes(key);
          get().markLearned(key);
          get().setSetting({ coached: true });
          if (first) {
            bumpPracticeStreak();
            levelCompleted(here);
          }
          return;
        }
        // Clean means alone and first time: no mistake on any attempt, no hint.
        const clean = taskFaults === 0 && !hinted;
        // The stars are for this attempt. Shown the way, it is two at most.
        const stars = Math.min(starsFor(faults), hinted ? 2 : 3);
        // The score: how clean this attempt was, and its time against par.
        const seconds = elapsedSeconds();
        const route = challengeRoute(challenge);
        const par = route ? parSeconds(route, taskParks(challenge)) : 0;
        const scored: BestScore = {
          v: SCORE_VERSION,
          score: scoreFor({ faults, hinted, seconds, par }),
          ms: Math.round(seconds * 1000),
          par,
          faults,
          hinted,
        };
        const best = beats(scored, get().bestScores?.[challenge.id]);
        set((s) => {
          const runStreak = clean ? s.runStreak + 1 : 0;
          return {
            phase: "passed",
            lastStars: stars,
            lastScore: scored.score,
            lastSeconds: seconds,
            lastPar: par,
            lastBest: best,
            bestScores: best
              ? { ...s.bestScores, [challenge.id]: scored }
              : s.bestScores,
            runStreak,
            runBestStreak: Math.max(s.runBestStreak, runStreak),
            runClean: clean ? [...s.runClean, challenge.id] : s.runClean,
            // with a hint it was not known yet, so it comes round again
            progress: clean
              ? applyGrade(s.progress, challenge.id, "knew")
              : s.progress,
            bestStars: {
              ...s.bestStars,
              [challenge.id]: Math.max(s.bestStars[challenge.id] ?? 0, stars),
            },
          };
        });
        bumpPracticeStreak();
        analytics.boardChallengePassed({
          challenge_id: challenge.id,
          clean,
          faults: taskFaults,
          stars,
          tries,
          seconds: Math.round(seconds),
          score: scored.score,
          score_version: SCORE_VERSION,
          par_seconds: par,
          best,
        });
        const level = levelById(get().level);
        if (level?.kind === "drive") levelCompleted(level);
      };

      const levelCompleted = (level: Level) => {
        if (level.kind === "mock") return;
        const today = dayKey(Date.now());
        set((s) => ({
          daily: {
            day: today,
            done: (s.daily?.day === today ? s.daily.done : 0) + 1,
          },
        }));
        analytics.boardLevelCompleted({
          level: level.id,
          number: level.n,
          kind: level.kind,
          unit: unitOf(level).id,
        });
      };

      const begin = () => {
        const { queue, pos } = get();
        const challenge = queue[pos];
        if (!challenge) return;
        useStage.getState().clear();
        releaseCamera();
        // The parked cars stand somewhere new each attempt, so the farthest
        // free bay has to be looked for.
        if (
          isRouteTask(challenge) &&
          challenge.otherCars.some((other) => !other.flipped)
        ) {
          shuffleParkingLayout();
        }
        beginChallenge(challenge, { onFault, onSmall, onDeviation, onGoal });
        // Judged kindly, the car is also carried out of the roundabout.
        drive.exitHold = gentle() !== null;
        judging.forgiveLanes = gentle() === "free";
        // A car from a line-up is told its option: its line is on the table.
        const run = get().lanes;
        const picked = run?.picked
          ? queueCars(run.arm).find((one) => one.id === run.picked)
          : undefined;
        if (picked) {
          const points = picked.option.route.points;
          let from = 0;
          for (let i = 1; i < points.length; i += 1) {
            const d = Math.hypot(points[i].x - car.x, points[i].z - car.z);
            const best = Math.hypot(
              points[from].x - car.x,
              points[from].z - car.z,
            );
            if (d < best) from = i;
            else if (d > best + 8) break;
          }
          useStage.getState().show([
            {
              id: picked.id,
              points: points.slice(from),
              color: picked.option.color,
              width: 2.2,
            },
          ]);
        }
        set((s) => ({
          phase: "driving",
          faults: 0,
          fault: null,
          offRoute: null,
          missed: false,
          lastScore: null,
          lastBest: false,
          notice: null,
          attempt: s.attempt + 1,
        }));
      };

      return {
        settings: DEFAULT_BOARD_SETTINGS,
        progress: {},
        bestStars: {},

        overlayOpen: false,
        mode: "drive",
        level: null,
        hinted: false,
        round: false,
        phase: "ready",
        attempt: 0,
        ...FRESH_RUN,

        start: (ids) => {
          const wanted = ids ? new Set(ids) : null;
          const queue = wanted
            ? BOARD_CHALLENGES.filter((c) => wanted.has(c.id))
            : pickRound(BOARD_CHALLENGES, get().progress, BOARD_ROUND_SIZE);
          if (queue.length === 0) return;
          if (get().settings.sound) warmSfx();
          set({
            ...FRESH_RUN,
            queue,
            overlayOpen: true,
            mode: "drive",
            level: null,
            hinted: false,
            round: !wanted,
          });
          analytics.boardStarted({
            challenges: queue.length,
            scope: wanted ? "drill" : "round",
          });
          begin();
        },

        retry: () => {
          if (get().phase !== "fault") return;
          set((s) => ({ tries: s.tries + 1 }));
          begin();
        },

        restart: () => {
          if (get().phase === "driving") begin();
        },

        next: () => {
          const s = get();
          if (s.phase !== "passed") return;
          if (s.pos >= s.queue.length - 1) {
            if (s.settings.sound) playSfx("complete");
            analytics.boardCompleted({
              challenges: s.queue.length,
              clean: s.runClean.length,
              fault_count: s.runFaultCount,
            });
            const best = s.mockBest;
            const clean = s.runClean.length;
            set({
              phase: "complete",
              mockBest:
                s.round && (!best || clean > best.clean)
                  ? {
                      clean,
                      total: s.queue.length,
                      day: dayKey(Date.now()),
                    }
                  : best,
            });
            return;
          }
          set({
            pos: s.pos + 1,
            faults: 0,
            taskFaults: 0,
            tries: 1,
            hinted: false,
          });
          begin();
        },

        exit: () => {
          const before = get();
          const task = before.queue[before.pos];
          if (
            before.mode === "drive" &&
            task &&
            before.phase !== "complete" &&
            before.phase !== "ready" &&
            // A level that was passed is finished, not walked away from.
            !(before.level && before.phase === "passed")
          ) {
            analytics.boardAbandoned({
              challenge_id: task.id,
              phase: before.phase,
              task: before.pos + 1,
              of: before.queue.length,
              tries: before.tries,
              moved: hasMoved(),
              off_route: before.offRoute != null,
            });
          }
          stopDriving();
          stopAllSfx();
          useStage.getState().clear();
          releaseCamera();
          forgetDriveZoom();
          set({
            ...FRESH_RUN,
            overlayOpen: false,
            phase: "ready",
            mode: "drive",
            level: null,
            hinted: false,
          });
        },

        learn: () => {
          stopDriving();
          useStage.getState().clear();
          forgetDriveZoom();
          fitTable();
          set({
            ...FRESH_RUN,
            overlayOpen: true,
            phase: "ready",
            mode: "learn",
            level: null,
            hinted: false,
          });
          analytics.boardLearnOpened();
        },

        startLevel: (id) => {
          const level = levelById(id);
          // A level that doesn't exist (an old or mistyped link) is a round.
          if (!level || level.kind === "mock") {
            get().start();
            return;
          }
          analytics.boardLevelStarted({
            level: level.id,
            number: level.n,
            kind: level.kind,
            unit: unitOf(level).id,
          });
          if (level.kind === "drive") {
            get().start([level.challenge]);
            set({ level: level.id });
            return;
          }
          if (level.kind === "warmup") {
            if (get().settings.sound) warmSfx();
            set({
              ...FRESH_RUN,
              queue: [FIRST_DRIVE],
              overlayOpen: true,
              mode: "drive",
              level: level.id,
              hinted: false,
            });
            begin();
            return;
          }
          stopDriving();
          useStage.getState().clear();
          forgetDriveZoom();
          fitTable();
          set({
            ...FRESH_RUN,
            overlayOpen: true,
            phase: "ready",
            mode: "level",
            level: level.id,
            hinted: false,
            lanes:
              level.kind === "lanes"
                ? {
                    arm: level.arm,
                    rest: get().homes?.[level.id] ?? {},
                    picked: null,
                  }
                : null,
          });
        },

        pickCar: (id) => {
          const { lanes, phase, settings } = get();
          if (!lanes || lanes.picked || phase === "driving") return;
          const cars = queueCars(lanes.arm);
          const picked = pickable(cars, Object.keys(lanes.rest)).find(
            (one) => one.id === id,
          );
          if (!picked) return;
          if (settings.sound) warmSfx();
          set({
            mode: "drive",
            queue: [queueChallenge(cars, picked, lanes.rest)],
            pos: 0,
            faults: 0,
            taskFaults: 0,
            tries: 1,
            hinted: false,
            fault: null,
            notice: null,
            lanes: { ...lanes, picked: id },
          });
          begin();
        },

        putBack: () => {
          const { lanes } = get();
          if (!lanes?.picked) return;
          stopDriving();
          useStage.getState().clear();
          forgetDriveZoom();
          set({
            mode: "level",
            phase: "ready",
            queue: [],
            pos: 0,
            fault: null,
            notice: null,
            lanes: { ...lanes, picked: null },
          });
        },

        completeLevel: () => {
          const level = levelById(get().level);
          if (
            !level ||
            level.kind === "drive" ||
            level.kind === "mock" ||
            level.kind === "warmup"
          ) {
            return;
          }
          const key = level.kind === "watch" ? level.lesson : learnedKey(level);
          const first = !get().learned?.includes(key);
          get().markLearned(key);
          if (first) {
            bumpPracticeStreak();
            levelCompleted(level);
          }
        },

        hint: (kind) => {
          const { queue, pos } = get();
          set({ hinted: true });
          analytics.boardHintUsed({
            challenge_id: queue[pos]?.id ?? "",
            kind,
          });
        },

        watch: () => {
          const { phase } = get();
          if (phase !== "driving" && phase !== "fault") return;
          stopDriving();
          set({ phase: "watch", hinted: true, notice: null });
        },

        resume: () => {
          if (get().phase !== "watch") return;
          // Watching after being stopped, then going again, is another try.
          if (get().fault) set((s) => ({ tries: s.tries + 1 }));
          begin();
        },

        markLearned: (id) =>
          set((s) =>
            s.learned?.includes(id)
              ? s
              : { learned: [...(s.learned ?? []), id] },
          ),

        keepPlace: (level, at) =>
          set((s) =>
            (s.places?.[level] ?? 0) === at
              ? s
              : { places: { ...s.places, [level]: at } },
          ),

        setSetting: (patch) =>
          set((s) => ({ settings: { ...s.settings, ...patch } })),
        resetProgress: () =>
          set({
            progress: {},
            bestStars: {},
            bestScores: {},
            learned: [],
            places: {},
            homes: {},
          }),
      };
    },
    {
      name: "driverush:board",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage,
      ),
      partialize: (s) => ({
        settings: s.settings,
        progress: s.progress,
        bestStars: s.bestStars,
        bestScores: s.bestScores,
        learned: s.learned,
        places: s.places,
        homes: s.homes,
        daily: s.daily,
        mockBest: s.mockBest,
        courseCheered: s.courseCheered,
      }),
      // Here from day one, so a later version bump can keep progress instead
      // of wiping it. New optional fields don't need a bump at all.
      migrate: (persisted) => {
        const prev = persisted as Partial<BoardState> | null;
        return {
          settings: { ...DEFAULT_BOARD_SETTINGS, ...prev?.settings },
          progress: prev?.progress ?? {},
          bestStars: prev?.bestStars ?? {},
          bestScores: prev?.bestScores ?? {},
          learned: prev?.learned ?? [],
          places: prev?.places ?? {},
          homes: prev?.homes ?? {},
          daily: prev?.daily,
          mockBest: prev?.mockBest,
          courseCheered: prev?.courseCheered,
        };
      },
      merge: (persisted, current) => {
        const saved = persisted as Partial<BoardState> | undefined;
        return {
          ...current,
          ...saved,
          settings: { ...DEFAULT_BOARD_SETTINGS, ...saved?.settings },
        };
      },
    },
  ),
);

export const BOARD_CHALLENGE_IDS = BOARD_CHALLENGES.map((c) => c.id);
