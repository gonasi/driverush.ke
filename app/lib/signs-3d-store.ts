/**
 * The 3D road-sign recognition trainer — one Zustand store that owns everything:
 * persisted per-player settings + mastery progress, transient runtime state, and
 * the playback engine (timed reveal → answer → auto-advance → next). A sibling of
 * `pelican-store.ts` with the same state machine; the differences are the data
 * shape (3D `Sign3D` models instead of image regions) and the preload (it warms
 * GLB models + voice clips rather than a chart image). Timers and audio live in
 * module scope, driven by store actions. Client-side only.
 *
 * Mastery is tracked under its OWN localStorage key (`driverush:signs3d`),
 * independent of the Pelican recall trainer — recognition and recall are
 * different skills.
 */
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import {
  orderSigns,
  type Sign3D,
  type Signs3DData,
  type SignCategoryId,
} from "./signs-3d";
import {
  DEFAULT_SIGNS_3D_SETTINGS,
  normalizeSettings,
  type Signs3DUserSettings,
} from "./signs-3d-settings";
import {
  applyGrade,
  isMastered,
  type GradeResult,
  type SignProgress,
} from "./pelican-progress";
import { analytics } from "./analytics";
import { triggerAdAndAwaitClose, triggerAdFromNonReact } from "./ads/ad-engine";
import {
  playSfx,
  playVoice,
  preloadSfx,
  preloadVoices,
  stopAllSfx,
  stopVoice,
} from "./sounds";

// ---------------------------------------------------------------------------
// module-scope engine bits (one trainer instance — fine to keep these here)
// ---------------------------------------------------------------------------
let phaseTimer: ReturnType<typeof setTimeout> | null = null;
let countdownInt: ReturnType<typeof setInterval> | null = null;

function clearTimers() {
  if (phaseTimer) {
    clearTimeout(phaseTimer);
    phaseTimer = null;
  }
  if (countdownInt) {
    clearInterval(countdownInt);
    countdownInt = null;
  }
}
const stopSignAudio = stopVoice;
const playSignAudio = playVoice;

function practiceSigns(
  board: Signs3DData | null,
  categories: SignCategoryId[],
): Sign3D[] {
  if (!board) return [];
  return categories.length === 0
    ? board.signs
    : board.signs.filter((r) => categories.includes(r.category));
}
function buildQueue(
  board: Signs3DData | null,
  s: Signs3DUserSettings,
): Sign3D[] {
  return orderSigns(practiceSigns(board, s.categories), {
    shuffle: s.order === "shuffle",
    reverse: s.reverse,
  });
}

/** Warm the GLB models into the browser cache so the viewer never stalls
 *  fetching one mid-run. Plain `fetch` (no three import — keeps this module out
 *  of the heavy 3D chunk); the viewer parses from cache via drei's `useGLTF`.
 *  Capped so one slow/hung file can't wedge the loader. */
function warmModels(
  urls: readonly string[],
  onOne: () => void,
  capMs = 45000,
): Promise<void> {
  if (typeof window === "undefined" || urls.length === 0)
    return Promise.resolve();
  const all = Promise.all(
    urls.map((u) =>
      fetch(u, { cache: "force-cache" })
        .then((r) => r.blob())
        .then(
          () => {},
          () => {},
        )
        .finally(onOne),
    ),
  ).then(() => undefined);
  return Promise.race([
    all,
    new Promise<void>((resolve) => setTimeout(resolve, capMs)),
  ]);
}

/** In-progress run snapshot — persisted so a reload resumes between signs. */
type InProgressRun = {
  queueIds: string[];
  pos: number;
  runRecalled: string[];
  runMissed: string[];
  runMissCount: number;
  runSeen: number;
  settingsSig: string;
  boardSig: string;
  savedAt: number;
};

function computeSettingsSig(s: Signs3DUserSettings): string {
  return JSON.stringify({
    c: [...s.categories].sort(),
    o: s.order,
    r: s.reverse,
  });
}

function computeBoardSig(b: Signs3DData | null): string {
  if (!b) return "";
  return `${b.modelsBase}::${b.signs.length}`;
}

function hydrateQueueFromIds(
  board: Signs3DData | null,
  ids: string[],
): Sign3D[] | null {
  if (!board) return null;
  const byId = new Map(board.signs.map((r) => [r.id, r]));
  const out: Sign3D[] = [];
  for (const id of ids) {
    const sign = byId.get(id);
    if (!sign) return null;
    out.push(sign);
  }
  return out;
}

// SSR-safe storage: real localStorage on the client, a no-op on the server.
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// ---------------------------------------------------------------------------
// store
// ---------------------------------------------------------------------------
export type TrainerPhase =
  | "ready"
  | "initial"
  | "focused"
  | "revealed"
  | "between"
  | "complete";
export type AssetStatus = "idle" | "loading" | "ready";

type Signs3DState = {
  // ---- persisted ----
  settings: Signs3DUserSettings;
  progress: SignProgress;
  inProgressRun: InProgressRun | null;
  // ---- transient ----
  board: Signs3DData | null;
  assetStatus: AssetStatus;
  /** 0–1 — how much of the board's models + audio has buffered. */
  assetProgress: number;
  overlayOpen: boolean;
  running: boolean;
  settingsOpen: boolean;
  introOpen: boolean;
  phase: TrainerPhase;
  queue: Sign3D[];
  pos: number;
  timeRemaining: number;
  // ---- this run (transient, self-grading) ----
  runRecalled: string[];
  runMissed: string[];
  runMissCount: number;
  runSeen: number;
  // ---- actions ----
  configure: (board: Signs3DData) => void;
  preload: () => void;
  setSetting: (p: Partial<Signs3DUserSettings>) => void;
  resetSettings: () => void;
  resetProgress: () => void;
  setSettingsOpen: (open: boolean) => void;
  setIntroOpen: (open: boolean) => void;
  dismissIntro: () => void;
  start: () => void;
  resumeRun: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  revealNow: () => void;
  gradeAndNext: (r: GradeResult) => void;
  replaySignAudio: () => void;
  exit: () => void;
  // ---- internal engine steps ----
  _armInitial: () => void;
  _armFocused: () => void;
  _armRevealed: () => void;
  _armBetween: () => void;
  _toFocused: () => void;
  _toRevealed: () => void;
  _toBetween: () => void;
  _advance: () => void;
};

export const useSigns3DStore = create<Signs3DState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SIGNS_3D_SETTINGS,
      progress: {},
      inProgressRun: null,

      board: null,
      assetStatus: "idle",
      assetProgress: 0,
      overlayOpen: false,
      running: false,
      settingsOpen: false,
      introOpen: false,
      phase: "ready",
      queue: [],
      pos: 0,
      timeRemaining: 0,
      runRecalled: [],
      runMissed: [],
      runMissCount: 0,
      runSeen: 0,

      // ---- config / preload ----
      configure: (board) => set({ board }),

      // Warm everything the trainer needs — the GLB models, the gameplay SFX,
      // and every per-sign voice clip — before the page lets the user press
      // Start, so a run never stalls fetching an asset. Client-only; safe to
      // call more than once.
      preload: () => {
        if (typeof window === "undefined" || get().assetStatus !== "idle")
          return;
        const board = get().board;
        set({ assetStatus: "loading", assetProgress: 0 });

        const models = [
          ...new Set((board?.signs ?? []).map((r) => r.modelSrc)),
        ];
        const voices = [
          ...new Set(
            (board?.signs ?? [])
              .map((r) => r.audioSrc)
              .filter(
                (s): s is string => typeof s === "string" && s.length > 0,
              ),
          ),
        ];

        const grand = models.length + voices.length;
        let modelsDone = 0;
        let voicesDone = 0;
        const recompute = () =>
          set({
            assetProgress: grand > 0 ? (modelsDone + voicesDone) / grand : 1,
          });

        const modelsP = warmModels(models, () => {
          modelsDone += 1;
          recompute();
        });
        const voicesP = preloadVoices(voices, {
          onProgress: (done) => {
            voicesDone = done;
            recompute();
          },
        });

        void Promise.all([modelsP, voicesP, preloadSfx()]).then(() =>
          set({ assetStatus: "ready", assetProgress: 1 }),
        );
      },

      // ---- settings / progress ----
      setSetting: (p) => {
        const next = { ...get().settings, ...p };
        set({ settings: next });
        const touchedOrder =
          "categories" in p || "order" in p || "reverse" in p;
        if (touchedOrder) {
          set({
            inProgressRun: null,
            runRecalled: [],
            runMissed: [],
            runMissCount: 0,
            runSeen: 0,
          });
        }
        if (touchedOrder && get().overlayOpen) {
          clearTimers();
          stopSignAudio();
          set({
            queue: buildQueue(get().board, next),
            pos: 0,
            phase: "focused",
            timeRemaining: 0,
          });
          if (!get().settingsOpen && get().running) get()._armFocused();
        }
      },
      resetSettings: () => get().setSetting({ ...DEFAULT_SIGNS_3D_SETTINGS }),
      resetProgress: () => set({ progress: {}, inProgressRun: null }),

      setSettingsOpen: (open) => {
        set({ settingsOpen: open });
        if (open) {
          clearTimers();
          stopAllSfx();
          stopSignAudio();
        } else if (get().running && get().overlayOpen) {
          get().resume();
        }
      },

      setIntroOpen: (open) => set({ introOpen: open }),
      dismissIntro: () => {
        set({ introOpen: false });
        if (!get().settings.hasSeenIntro) {
          get().setSetting({ hasSeenIntro: true });
        }
      },

      // ---- engine ----
      start: () => {
        clearTimers();
        stopAllSfx();
        stopSignAudio();
        const queue = buildQueue(get().board, get().settings);
        if (queue.length === 0) return;
        void preloadSfx();
        set({
          queue,
          pos: 0,
          phase: "initial",
          overlayOpen: true,
          running: true,
          settingsOpen: false,
          timeRemaining: 0,
          runRecalled: [],
          runMissed: [],
          runMissCount: 0,
          runSeen: 0,
          inProgressRun: null,
        });
        analytics.signs3dStarted({
          signsTotal: queue.length,
          categories: get().settings.categories,
        });
        get()._armInitial();
      },

      resumeRun: () => {
        const state = get();
        const run = state.inProgressRun;
        if (!run || !state.board) return;
        if (run.settingsSig !== computeSettingsSig(state.settings)) {
          set({ inProgressRun: null });
          return;
        }
        if (run.boardSig !== computeBoardSig(state.board)) {
          set({ inProgressRun: null });
          return;
        }
        const queue = hydrateQueueFromIds(state.board, run.queueIds);
        if (!queue || run.pos < 0 || run.pos >= queue.length) {
          set({ inProgressRun: null });
          return;
        }
        clearTimers();
        stopAllSfx();
        stopSignAudio();
        set({
          queue,
          pos: run.pos,
          phase: "between",
          overlayOpen: true,
          running: true,
          settingsOpen: false,
          introOpen: false,
          timeRemaining: 0,
          runRecalled: run.runRecalled,
          runMissed: run.runMissed,
          runMissCount: run.runMissCount,
          runSeen: run.runSeen,
        });
        get()._armBetween();
      },

      pause: () => {
        clearTimers();
        stopAllSfx();
        stopSignAudio();
        set({ running: false });
      },

      resume: () => {
        set({ running: true });
        switch (get().phase) {
          case "initial":
            get()._armInitial();
            break;
          case "focused":
            get()._armFocused();
            break;
          case "revealed":
            get()._armRevealed();
            break;
          case "between":
            get()._armBetween();
            break;
          default:
            break;
        }
      },

      next: () => get()._toBetween(),
      prev: () => {
        clearTimers();
        stopSignAudio();
        set((s) => ({ pos: Math.max(0, s.pos - 1) }));
        get()._toFocused();
      },
      revealNow: () => {
        if (get().phase === "focused") get()._toRevealed();
      },
      gradeAndNext: (r) => {
        const { settings, queue, pos } = get();
        const sign = queue[pos];
        if (!sign) return;
        if (settings.playAudio) playSfx(r === "knew" ? "correct" : "wrong");
        set((s) => ({ progress: applyGrade(s.progress, sign.id, r) }));
        if (r === "knew") {
          set((s) => ({
            runRecalled: s.runRecalled.includes(sign.id)
              ? s.runRecalled
              : [...s.runRecalled, sign.id],
          }));
        } else {
          set((s) => {
            const q = [...s.queue];
            q.splice(Math.min(s.pos + 2, q.length), 0, sign);
            return {
              queue: q,
              runMissCount: s.runMissCount + 1,
              runMissed: s.runMissed.includes(sign.id)
                ? s.runMissed
                : [...s.runMissed, sign.id],
            };
          });
        }
        get()._toBetween();
      },
      replaySignAudio: () => {
        const { queue, pos } = get();
        playSignAudio(queue[pos]?.audioSrc);
      },

      exit: () => {
        clearTimers();
        stopAllSfx();
        stopSignAudio();
        set({
          overlayOpen: false,
          running: false,
          phase: "ready",
          queue: [],
          pos: 0,
          timeRemaining: 0,
          runRecalled: [],
          runMissed: [],
          runMissCount: 0,
          runSeen: 0,
        });
      },

      // ---- internal: arm the timer(s) for the current phase ----
      _armInitial: () => {
        clearTimers();
        const ms = (get().board?.settings.initialDisplayDuration ?? 1) * 1000;
        phaseTimer = setTimeout(() => get()._toFocused(), Math.max(0, ms));
      },
      _armFocused: () => {
        clearTimers();
        const { settings, queue, pos } = get();
        const sign = queue[pos];
        if (!sign) {
          get()._toBetween();
          return;
        }
        if (settings.revealMode === "auto") {
          const delay = sign.revealDelay ?? settings.revealDelay;
          set({ timeRemaining: delay });
          const startedAt = Date.now();
          countdownInt = setInterval(() => {
            const rem = Math.max(0, delay - (Date.now() - startedAt) / 1000);
            set({ timeRemaining: rem });
            if (rem <= 0) {
              if (countdownInt) {
                clearInterval(countdownInt);
                countdownInt = null;
              }
              get()._toRevealed();
            }
          }, 100);
        }
      },
      _armRevealed: () => {
        clearTimers();
        const { settings } = get();
        if (settings.autoAdvance && !settings.selfGrading) {
          phaseTimer = setTimeout(
            () => get()._toBetween(),
            Math.max(0, settings.autoAdvanceDelay * 1000),
          );
        }
      },
      _armBetween: () => {
        clearTimers();
        const ms = (get().board?.settings.betweenRegionsDuration ?? 0.8) * 1000;
        phaseTimer = setTimeout(() => get()._advance(), Math.max(0, ms));
      },

      // ---- internal: transition into a phase ----
      _toFocused: () => {
        clearTimers();
        set({ phase: "focused" });
        if (get().settings.playAudio) playSfx("whoosh");
        get()._armFocused();
      },
      _toRevealed: () => {
        clearTimers();
        set({ phase: "revealed" });
        const { settings, queue, pos } = get();
        if (settings.playAudio) {
          playSfx("reveal");
          playSignAudio(queue[pos]?.audioSrc);
        }
        get()._armRevealed();
      },
      _toBetween: () => {
        clearTimers();
        stopSignAudio();
        const { settings, queue, pos } = get();
        if (pos >= queue.length - 1) {
          if (settings.selfGrading && settings.playAudio) playSfx("complete");
          const { runRecalled, runMissed, runMissCount } = get();
          analytics.signs3dCompleted({
            signsTotal: runRecalled.length + runMissed.length,
            knewFirstTry: runRecalled.length,
            missCount: runMissCount,
          });
          triggerAdFromNonReact("chapter_complete");
          set({ phase: "complete", running: false, inProgressRun: null });
          return;
        }

        const snapshotState = get();
        const nextSeen = snapshotState.runSeen + 1;

        set({
          phase: "between",
          runSeen: nextSeen,
          inProgressRun: {
            queueIds: snapshotState.queue.map((r) => r.id),
            pos: snapshotState.pos,
            runRecalled: snapshotState.runRecalled,
            runMissed: snapshotState.runMissed,
            runMissCount: snapshotState.runMissCount,
            runSeen: nextSeen,
            settingsSig: computeSettingsSig(snapshotState.settings),
            boardSig: computeBoardSig(snapshotState.board),
            savedAt: Date.now(),
          },
        });

        {
          const opened = triggerAdAndAwaitClose("gameplay_milestone", () => {
            get().resume();
          });
          if (opened) {
            get().pause();
            return;
          }
        }

        get()._armBetween();
      },
      _advance: () => {
        set((s) => ({ pos: s.pos + 1 }));
        get()._toFocused();
      },
    }),
    {
      name: "driverush:signs3d",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage,
      ),
      partialize: (s) => ({
        settings: s.settings,
        progress: s.progress,
        inProgressRun: s.inProgressRun,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.settings = normalizeSettings(state.settings);
      },
    },
  ),
);

// ---------------------------------------------------------------------------
// selectors / derived helpers
// ---------------------------------------------------------------------------
export const selectSign = (s: Signs3DState): Sign3D | undefined =>
  s.queue[s.pos];

export function getPracticeSigns(
  board: Signs3DData | null,
  categories: SignCategoryId[],
): Sign3D[] {
  return practiceSigns(board, categories);
}

export function getMasteredCount(
  progress: SignProgress,
  signs: Sign3D[],
): number {
  return signs.filter((r) => isMastered(progress, r.id)).length;
}

/** Whether the saved run can actually be resumed in the current world. */
export function selectCanResume(s: Signs3DState): boolean {
  const run = s.inProgressRun;
  if (!run || !s.board) return false;
  if (s.assetStatus !== "ready") return false;
  if (run.settingsSig !== computeSettingsSig(s.settings)) return false;
  if (run.boardSig !== computeBoardSig(s.board)) return false;
  if (run.pos < 0 || run.pos >= run.queueIds.length) return false;
  const ids = new Set(s.board.signs.map((r) => r.id));
  return run.queueIds.every((id) => ids.has(id));
}

/** Display stats for the Resume CTA. Returns null when there's nothing to show. */
export function selectResumeStats(
  s: Signs3DState,
): { signsDone: number; total: number; recalled: number } | null {
  const run = s.inProgressRun;
  if (!run) return null;
  return {
    signsDone: run.pos + 1,
    total: run.queueIds.length,
    recalled: run.runRecalled.length,
  };
}
