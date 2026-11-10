/**
 * The Model Town Board trainer's store, built like `pelican-store.ts`: persisted
 * progress and settings, plus the run in flight. The car itself is not in here.
 * It moves sixty times a second in `board/runtime.ts`, and this store only hears
 * about it when the referee calls a fault or a pass.
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
  type BoardChallenge,
} from "./board/challenges";
import type { Fault, FaultId } from "./board/referee";
import { beginChallenge, elapsedSeconds, stopDriving } from "./board/runtime";
import { applyGrade, type SignProgress } from "./pelican-progress";
import { bumpPracticeStreak } from "./practice-streak";
import { BUZZ, buzz, playSfx, stopAllSfx, warmSfx } from "./sounds";
import { pickRound } from "./trainer-rounds";

export type BoardQuality = "auto" | "low" | "high";
export type BoardSettings = { sound: boolean; quality: BoardQuality };
export const DEFAULT_BOARD_SETTINGS: BoardSettings = {
  sound: true,
  quality: "auto",
};

export type BoardPhase = "ready" | "driving" | "fault" | "passed" | "complete";

type BoardState = {
  // ---- persisted ----
  settings: BoardSettings;
  /** Same boxes as the sign trainers, keyed by challenge id. */
  progress: SignProgress;
  bestStars: Record<string, number>;
  // ---- transient ----
  overlayOpen: boolean;
  phase: BoardPhase;
  queue: BoardChallenge[];
  pos: number;
  /** Faults on the challenge in front of the learner. */
  faults: number;
  fault: Fault | null;
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
  fault: null,
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

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => {
      const onFault = (fault: Fault) => {
        const { queue, pos, faults, settings } = get();
        const challenge = queue[pos];
        if (!challenge) return;
        if (settings.sound) playSfx("wrong");
        buzz(BUZZ.miss);
        const first = faults === 0;
        set((s) => ({
          phase: "fault",
          fault,
          faults: s.faults + 1,
          runFaultCount: s.runFaultCount + 1,
          runStreak: 0,
          runFaulted: first ? [...s.runFaulted, challenge.id] : s.runFaulted,
          runFaultRules: s.runFaultRules.includes(fault.id)
            ? s.runFaultRules
            : [...s.runFaultRules, fault.id],
          // One step back the first time, the way a missed sign is graded.
          progress: first
            ? applyGrade(s.progress, challenge.id, "missed")
            : s.progress,
        }));
        analytics.boardFaulted({
          challenge_id: challenge.id,
          rule: fault.id,
          fault_number: faults + 1,
        });
      };

      const onGoal = () => {
        const { queue, pos, faults, settings } = get();
        const challenge = queue[pos];
        if (!challenge) return;
        if (settings.sound) playSfx("correct");
        buzz(BUZZ.tap);
        const clean = faults === 0;
        const stars = starsFor(faults);
        set((s) => {
          const runStreak = clean ? s.runStreak + 1 : 0;
          return {
            phase: "passed",
            lastStars: stars,
            runStreak,
            runBestStreak: Math.max(s.runBestStreak, runStreak),
            runClean: clean ? [...s.runClean, challenge.id] : s.runClean,
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
          faults,
          stars,
          seconds: Math.round(elapsedSeconds()),
        });
      };

      const begin = () => {
        const { queue, pos } = get();
        const challenge = queue[pos];
        if (!challenge) return;
        beginChallenge(challenge, { onFault, onGoal });
        set((s) => ({ phase: "driving", fault: null, attempt: s.attempt + 1 }));
      };

      return {
        settings: DEFAULT_BOARD_SETTINGS,
        progress: {},
        bestStars: {},

        overlayOpen: false,
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
          set({ ...FRESH_RUN, queue, overlayOpen: true });
          analytics.boardStarted({
            challenges: queue.length,
            scope: wanted ? "drill" : "round",
          });
          begin();
        },

        retry: () => {
          if (get().phase === "fault") begin();
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
          set({ pos: s.pos + 1, faults: 0 });
          begin();
        },

        exit: () => {
          stopDriving();
          stopAllSfx();
          set({ ...FRESH_RUN, overlayOpen: false, phase: "ready" });
        },

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
      }),
      // Here from day one, so a later version bump can keep progress instead
      // of wiping it. New optional fields don't need a bump at all.
      migrate: (persisted) => {
        const prev = persisted as Partial<BoardState> | null;
        return {
          settings: { ...DEFAULT_BOARD_SETTINGS, ...prev?.settings },
          progress: prev?.progress ?? {},
          bestStars: prev?.bestStars ?? {},
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
