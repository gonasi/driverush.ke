/**
 * The 3D road-sign recognition trainer — one Zustand store that owns everything:
 * persisted per-player settings + mastery progress, transient runtime state, and
 * the playback engine (timed reveal → answer → auto-advance → next). A sibling of
 * `pelican-store.ts` with the same state machine; the differences are the data
 * shape (3D `Sign3D` models instead of image regions) and that the recall timer
 * waits for each model to appear. Timers and audio live in module scope, driven
 * by store actions. Client-side only.
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
  boxOf,
  isMastered,
  type GradeResult,
  type SignProgress,
} from "./pelican-progress";
import { analytics } from "./analytics";
import { triggerAdAndAwaitClose, triggerAdFromNonReact } from "./ads/ad-engine";
import {
  defaultScope,
  pickRound,
  runTally,
  type RunScope,
} from "./trainer-rounds";
import {
  playSfx,
  playVoice,
  stopAllSfx,
  stopVoice,
  warmSfx,
  warmVoice,
} from "./sounds";

// ---------------------------------------------------------------------------
// module-scope engine bits (one trainer instance — fine to keep these here)
// ---------------------------------------------------------------------------
let phaseTimer: ReturnType<typeof setTimeout> | null = null;
let countdownInt: ReturnType<typeof setInterval> | null = null;

function clearTimers() {
  startWhenVisible = null;
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
function ordered(signs: Sign3D[], s: Signs3DUserSettings): Sign3D[] {
  return orderSigns(signs, {
    shuffle: s.order === "shuffle",
    reverse: s.reverse,
  });
}
function buildQueue(
  board: Signs3DData | null,
  s: Signs3DUserSettings,
  scope: RunScope,
  progress: SignProgress,
): Sign3D[] {
  if (scope.kind === "chart") {
    return ordered(practiceSigns(board, s.categories), s);
  }
  if (scope.kind === "drill") {
    const ids = new Set(scope.ids);
    return ordered((board?.signs ?? []).filter((r) => ids.has(r.id)), s);
  }
  const pool = practiceSigns(board, scope.categories ?? s.categories);
  return pickRound(ordered(pool, s), progress);
}

/** Fetch a GLB into the browser cache, once. Plain `fetch` (no three import, so
 *  this module stays out of the heavy 3D chunk); the viewer parses it from cache
 *  via drei's `useGLTF`. */
const warmedModels = new Set<string>();
function warmModel(url: string) {
  if (typeof window === "undefined" || warmedModels.has(url)) return;
  warmedModels.add(url);
  void fetch(url, { cache: "force-cache" }).catch(() => warmedModels.delete(url));
}

/** Buffer the next few signs, so a sign rarely has to load while you wait. */
function warmAhead(queue: Sign3D[], pos: number, playAudio: boolean) {
  for (const sign of queue.slice(pos, pos + 3)) {
    warmModel(sign.modelSrc);
    if (playAudio) warmVoice(sign.audioSrc);
  }
}

/**
 * The recall timer can't start until the sign is on screen, or a slow connection
 * would burn the whole window on the loader. Module scope, like the timers: these
 * don't drive rendering.
 */
const MODEL_WAIT_CAP_MS = 8000;
let visibleModel: string | null = null;
let startWhenVisible: { src: string; begin: () => void } | null = null;

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
export type AssetStatus = "idle" | "ready";

type Signs3DState = {
  // ---- persisted ----
  settings: Signs3DUserSettings;
  progress: SignProgress;
  inProgressRun: InProgressRun | null;
  // ---- transient ----
  board: Signs3DData | null;
  assetStatus: AssetStatus;
  overlayOpen: boolean;
  running: boolean;
  settingsOpen: boolean;
  phase: TrainerPhase;
  /** What this run contains. Only whole-chart runs keep a resume checkpoint. */
  runScope: RunScope;
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
  /** The viewer reports each sign as it reaches the screen. */
  markModelVisible: (src: string) => void;
  setSetting: (p: Partial<Signs3DUserSettings>) => void;
  resetSettings: () => void;
  resetProgress: () => void;
  setSettingsOpen: (open: boolean) => void;
  start: (scope?: RunScope) => void;
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
      overlayOpen: false,
      running: false,
      settingsOpen: false,
      phase: "ready",
      runScope: { kind: "round" },
      queue: [],
      pos: 0,
      timeRemaining: 0,
      runRecalled: [],
      runMissed: [],
      runMissCount: 0,
      runSeen: 0,

      // ---- config / preload ----
      configure: (board) => set({ board }),

      // Nothing blocks Start: models and voice clips buffer a few signs ahead of
      // play, and the recall timer holds until each sign is visible. The route
      // waits for this flag so saved progress stays off the first paint.
      preload: () => {
        if (typeof window === "undefined" || get().assetStatus !== "idle")
          return;
        if (get().settings.playAudio) warmSfx();
        set({ assetStatus: "ready" });
      },

      markModelVisible: (src) => {
        visibleModel = src;
        if (startWhenVisible?.src === src) {
          const { begin } = startWhenVisible;
          clearTimers();
          begin();
        }
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
          // A drill's signs were chosen by hand, so a new filter falls back to
          // a round rather than silently ignoring the setting.
          const current = get().runScope;
          const scope: RunScope =
            current.kind === "drill" ? { kind: "round" } : current;
          clearTimers();
          stopSignAudio();
          set({
            queue: buildQueue(get().board, next, scope, get().progress),
            runScope: scope,
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

      // ---- engine ----
      start: (requested) => {
        clearTimers();
        stopAllSfx();
        stopSignAudio();
        const { board, settings, progress } = get();
        const scope = requested ?? defaultScope(settings.selfGrading);
        const queue = buildQueue(board, settings, scope, progress);
        if (queue.length === 0) return; // nothing to play — leave the ready card up
        visibleModel = null;
        set({
          queue,
          pos: 0,
          runScope: scope,
          phase: "initial",
          overlayOpen: true,
          running: true,
          settingsOpen: false,
          timeRemaining: 0,
          runRecalled: [],
          runMissed: [],
          runMissCount: 0,
          runSeen: 0,
          // Starting the whole chart replaces any saved chart run. A round or
          // drill leaves the save alone, so it can still be resumed afterwards.
          ...(scope.kind === "chart" ? { inProgressRun: null } : {}),
        });
        analytics.signs3dStarted({
          signsTotal: queue.length,
          categories:
            scope.kind === "round"
              ? (scope.categories ?? settings.categories)
              : scope.kind === "chart"
                ? settings.categories
                : [],
          scope: scope.kind,
        });
        warmAhead(queue, 0, settings.playAudio);
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
        visibleModel = null;
        warmAhead(queue, run.pos, state.settings.playAudio);
        set({
          queue,
          pos: run.pos,
          runScope: { kind: "chart" },
          phase: "between",
          overlayOpen: true,
          running: true,
          settingsOpen: false,
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
        // The answer sheet stays tappable while it animates away, so a double
        // tap must not grade the same sign twice.
        if (get().phase !== "revealed") return;
        const { settings, queue, pos } = get();
        const sign = queue[pos];
        if (!sign) return;
        if (settings.playAudio) playSfx(r === "knew" ? "correct" : "wrong");
        const before = boxOf(get().progress, sign.id);
        const progress = applyGrade(get().progress, sign.id, r);
        set({ progress });
        analytics.signGraded({
          trainer: "3d",
          sign_code: sign.code ?? sign.id,
          category: sign.category,
          result: r,
          box_before: before,
          box_after: boxOf(progress, sign.id),
          first_try: !get().runMissed.includes(sign.id),
          scope: get().runScope.kind,
        });
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
        visibleModel = null;
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
          const begin = () => {
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
          };
          if (sign.modelSrc === visibleModel) {
            begin();
          } else {
            // Still loading: hold a full bar until it appears, with a cap so a
            // failed download can't freeze the run.
            startWhenVisible = { src: sign.modelSrc, begin };
            phaseTimer = setTimeout(() => {
              startWhenVisible = null;
              phaseTimer = null;
              begin();
            }, MODEL_WAIT_CAP_MS);
          }
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
          const { runRecalled, runMissed, runMissCount, runScope } = get();
          const tally = runTally(queue, runRecalled, runMissed);
          analytics.signs3dCompleted({
            signsTotal: tally.signsTotal,
            scope: runScope.kind,
            graded: settings.selfGrading
              ? { knewFirstTry: tally.firstTry, missCount: runMissCount }
              : undefined,
          });
          triggerAdFromNonReact("chapter_complete");
          set({
            phase: "complete",
            running: false,
            ...(runScope.kind === "chart" ? { inProgressRun: null } : {}),
          });
          return;
        }

        const snapshotState = get();
        const nextSeen = snapshotState.runSeen + 1;

        set({
          phase: "between",
          runSeen: nextSeen,
          // Rounds don't need a checkpoint: anything ungraded gets picked again.
          ...(snapshotState.runScope.kind === "chart"
            ? {
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
              }
            : {}),
        });

        // Rounds are short: their natural break is the end, so only a long
        // whole-chart run can be interrupted between signs.
        if (snapshotState.runScope.kind === "chart") {
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
        const { queue, pos, settings } = get();
        warmAhead(queue, pos, settings.playAudio);
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
