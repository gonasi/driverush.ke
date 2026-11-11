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
import { shuffleParkingLayout } from "./board/parking-layouts";
import type { Fault, FaultId } from "./board/referee";
import {
  beginChallenge,
  elapsedSeconds,
  hasMoved,
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
import { applyGrade, type SignProgress } from "./pelican-progress";
import { bumpPracticeStreak } from "./practice-streak";
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

/** Driving the tasks, or learning the board with no task on. */
export type BoardMode = "drive" | "learn";

type BoardState = {
  // ---- persisted ----
  settings: BoardSettings;
  /** Same boxes as the sign trainers, keyed by challenge id. */
  progress: SignProgress;
  bestStars: Record<string, number>;
  /** Lessons watched to the end. */
  learned?: string[];
  // ---- transient ----
  overlayOpen: boolean;
  mode: BoardMode;
  /** A hint was used on the task in front of the learner. */
  hinted: boolean;
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
  /** The latest small mistake, shown as a toast. `n` restarts its animation. */
  notice: { fault: Fault; n: number } | null;
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
  /** A hint was shown. The task no longer counts as known without help. */
  hint: (kind: "next_step" | "show_me" | "after_fault") => void;
  /** Pause the task to watch the right way played back. */
  watch: () => void;
  /** Done watching: the task again, from its start line. */
  resume: () => void;
  markLearned: (id: string) => void;
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
  notice: null as { fault: Fault; n: number } | null,
  noticeCount: 0,
  lastStars: 0,
  runClean: [] as string[],
  runFaulted: [] as string[],
  runFaultCount: 0,
  runFaultRules: [] as FaultId[],
  runStreak: 0,
  runBestStreak: 0,
};

export function starsFor(faults: number): number {
  return faults === 0 ? 3 : faults === 1 ? 2 : 1;
}

/** This many small mistakes in one attempt and the examiner stops it. */
export const SMALL_FAULT_LIMIT = 3;
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
          progress: first
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

      /** A serious mistake: the examiner stops the attempt. */
      const onFault = (fault: Fault) => {
        if (get().settings.sound) playSfx("wrong");
        buzz(BUZZ.miss);
        record(fault);
        stopped(fault);
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

      const onGoal = () => {
        const { queue, pos, faults, taskFaults, tries, hinted, settings } =
          get();
        const challenge = queue[pos];
        if (!challenge) return;
        if (settings.sound) playSfx("correct");
        buzz(BUZZ.tap);
        // Clean means alone and first time: no mistake on any attempt, no hint.
        const clean = taskFaults === 0 && !hinted;
        // The stars are for this attempt. Shown the way, it is two at most.
        const stars = Math.min(starsFor(faults), hinted ? 2 : 3);
        set((s) => {
          const runStreak = clean ? s.runStreak + 1 : 0;
          return {
            phase: "passed",
            lastStars: stars,
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
          seconds: Math.round(elapsedSeconds()),
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
        if (isRouteTask(challenge) && challenge.otherCars.length > 0) {
          shuffleParkingLayout();
        }
        beginChallenge(challenge, { onFault, onSmall, onGoal });
        set((s) => ({
          phase: "driving",
          faults: 0,
          fault: null,
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
        hinted: false,
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
            hinted: false,
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
            set({ phase: "complete" });
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
            before.phase !== "ready"
          ) {
            analytics.boardAbandoned({
              challenge_id: task.id,
              phase: before.phase,
              task: before.pos + 1,
              of: before.queue.length,
              tries: before.tries,
              moved: hasMoved(),
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
            hinted: false,
          });
          analytics.boardLearnOpened();
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

        setSetting: (patch) =>
          set((s) => ({ settings: { ...s.settings, ...patch } })),
        resetProgress: () => set({ progress: {}, bestStars: {} }),
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
        learned: s.learned,
      }),
      // Here from day one, so a later version bump can keep progress instead
      // of wiping it. New optional fields don't need a bump at all.
      migrate: (persisted) => {
        const prev = persisted as Partial<BoardState> | null;
        return {
          settings: { ...DEFAULT_BOARD_SETTINGS, ...prev?.settings },
          progress: prev?.progress ?? {},
          bestStars: prev?.bestStars ?? {},
          learned: prev?.learned ?? [],
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
