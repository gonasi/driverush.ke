/**
 * The Pelican road-sign trainer — one Zustand store that owns *everything*:
 * persisted per-player settings + mastery progress, transient runtime state, and
 * the playback engine (timed reveal → answer → auto-advance → next, mirroring
 * the original ImageFocusQuiz). Timers and audio live in module scope, driven by
 * store actions — so the trainer's state is decoupled from React's render cycle.
 * Client-side only (the trainer page gates on an asset preload).
 */
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import {
  orderRegions,
  type FocusRegion,
  type ImageFocusData,
  type SignCategoryId,
} from "./image-focus";
import {
  DEFAULT_PELICAN_SETTINGS,
  normalizeSettings,
  type PelicanUserSettings,
} from "./pelican-settings";
import {
  applyGrade,
  isMastered,
  LEGACY_PROGRESS_KEY,
  type GradeResult,
  type SignProgress,
} from "./pelican-progress";
import { analytics } from "./analytics";
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
// The per-sign voice clip is owned by `sounds.ts` (cached + preloadable);
// these are just the trainer-engine call sites.
const stopRegionAudio = stopVoice;
const playRegionAudio = playVoice;

function practiceRegions(
  board: ImageFocusData | null,
  categories: SignCategoryId[],
): FocusRegion[] {
  if (!board) return [];
  return categories.length === 0
    ? board.regions
    : board.regions.filter((r) => categories.includes(r.category));
}
function buildQueue(
  board: ImageFocusData | null,
  s: PelicanUserSettings,
): FocusRegion[] {
  return orderRegions(practiceRegions(board, s.categories), {
    shuffle: s.order === "shuffle",
    reverse: s.reverse,
  });
}

// SSR-safe storage: real localStorage on the client, a no-op on the server.
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// best-effort migration of the pre-Zustand keys (only matters on the client)
function readLegacy<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return v && typeof v === "object" ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

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

type PelicanState = {
  // ---- persisted ----
  settings: PelicanUserSettings;
  progress: SignProgress;
  // ---- transient ----
  board: ImageFocusData | null;
  assetStatus: AssetStatus;
  /** 0–1 — how much of the board's audio has buffered (drives the loader %). */
  assetProgress: number;
  overlayOpen: boolean;
  running: boolean;
  settingsOpen: boolean;
  /** One-time "make it yours" pre-run nudge — gated on `settings.hasSeenIntro`. */
  introOpen: boolean;
  phase: TrainerPhase;
  queue: FocusRegion[];
  pos: number;
  timeRemaining: number;
  // ---- this run (transient, self-grading) ----
  /** Distinct region ids graded "Knew it" so far this run. */
  runRecalled: string[];
  /** Distinct region ids missed at least once this run. */
  runMissed: string[];
  /** Total "Missed it" taps this run (counts repeats). */
  runMissCount: number;
  // ---- actions ----
  configure: (board: ImageFocusData) => void;
  preload: () => void;
  setSetting: (p: Partial<PelicanUserSettings>) => void;
  resetSettings: () => void;
  resetProgress: () => void;
  setSettingsOpen: (open: boolean) => void;
  setIntroOpen: (open: boolean) => void;
  /** Mark the intro as seen and close it; used by both CTAs in the dialog. */
  dismissIntro: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  revealNow: () => void;
  gradeAndNext: (r: GradeResult) => void;
  replayRegionAudio: () => void;
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

export const usePelicanStore = create<PelicanState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_PELICAN_SETTINGS,
      progress: readLegacy<SignProgress>(LEGACY_PROGRESS_KEY, {}),

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

      // ---- config / preload ----
      configure: (board) => set({ board }),

      // Warm *everything* the trainer needs — the chart image, the gameplay
      // SFX, and every per-sign voice clip on the board — before the page lets
      // the user press Start, so a run never stalls fetching an asset. Call
      // after `configure(board)`. Client-only; safe to call more than once.
      preload: () => {
        if (typeof window === "undefined" || get().assetStatus !== "idle")
          return;
        const board = get().board;
        set({ assetStatus: "loading", assetProgress: 0 });

        const imgDone = new Promise<void>((resolve) => {
          const src = board?.imageSrc;
          if (!src) {
            resolve();
            return;
          }
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
          if (img.complete) resolve();
        });

        const voices = (board?.regions ?? [])
          .map((r) => r.audioSrc)
          .filter((s): s is string => typeof s === "string" && s.length > 0);
        const voicesDone = preloadVoices(voices, {
          onProgress: (done, total) =>
            set({ assetProgress: total > 0 ? done / total : 1 }),
        });

        void Promise.all([imgDone, preloadSfx(), voicesDone]).then(() =>
          set({ assetStatus: "ready", assetProgress: 1 }),
        );
      },

      // ---- settings / progress ----
      setSetting: (p) => {
        const next = { ...get().settings, ...p };
        set({ settings: next });
        const touchedOrder =
          "categories" in p || "order" in p || "reverse" in p;
        if (touchedOrder && get().overlayOpen) {
          clearTimers();
          stopRegionAudio();
          set({
            queue: buildQueue(get().board, next),
            pos: 0,
            phase: "focused",
            timeRemaining: 0,
          });
          // settings are only changed while the sheet is open ⇒ paused; close
          // re-arms via resume(). If somehow open & not via the sheet, arm now.
          if (!get().settingsOpen && get().running) get()._armFocused();
        }
      },
      resetSettings: () => get().setSetting({ ...DEFAULT_PELICAN_SETTINGS }),
      resetProgress: () => set({ progress: {} }),

      setSettingsOpen: (open) => {
        set({ settingsOpen: open });
        if (open) {
          clearTimers();
          stopAllSfx();
          stopRegionAudio();
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
        stopRegionAudio();
        const queue = buildQueue(get().board, get().settings);
        if (queue.length === 0) return; // nothing to play — leave the ready card up
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
        });
        analytics.pelicanStarted({
          signsTotal: queue.length,
          categories: get().settings.categories,
        });
        get()._armInitial();
      },

      pause: () => {
        clearTimers();
        stopAllSfx();
        stopRegionAudio();
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
        stopRegionAudio();
        set((s) => ({ pos: Math.max(0, s.pos - 1) }));
        get()._toFocused();
      },
      revealNow: () => {
        if (get().phase === "focused") get()._toRevealed();
      },
      gradeAndNext: (r) => {
        const { settings, queue, pos } = get();
        const region = queue[pos];
        if (!region) return;
        if (settings.playAudio) playSfx(r === "knew" ? "correct" : "wrong");
        set((s) => ({ progress: applyGrade(s.progress, region.id, r) }));
        if (r === "knew") {
          set((s) => ({
            runRecalled: s.runRecalled.includes(region.id)
              ? s.runRecalled
              : [...s.runRecalled, region.id],
          }));
        } else {
          // Missed → it comes back a couple of signs later in this run, and
          // it's logged so the result card can show first-try accuracy.
          set((s) => {
            const q = [...s.queue];
            q.splice(Math.min(s.pos + 2, q.length), 0, region);
            return {
              queue: q,
              runMissCount: s.runMissCount + 1,
              runMissed: s.runMissed.includes(region.id)
                ? s.runMissed
                : [...s.runMissed, region.id],
            };
          });
        }
        get()._toBetween();
      },
      replayRegionAudio: () => {
        const { queue, pos } = get();
        playRegionAudio(queue[pos]?.audioSrc);
      },

      exit: () => {
        clearTimers();
        stopAllSfx();
        stopRegionAudio();
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
        const region = queue[pos];
        if (!region) {
          get()._toBetween();
          return;
        }
        if (settings.revealMode === "auto") {
          const delay = region.revealDelay ?? settings.revealDelay;
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
        // manual mode: wait for revealNow()
      },
      _armRevealed: () => {
        clearTimers();
        const { settings } = get();
        // With self-grading on we never auto-advance past the answer — we wait
        // for a Knew it / Missed it tap (gradeAndNext). Otherwise honour the
        // auto-advance timer (and the manual Prev / Next either way).
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
          playRegionAudio(queue[pos]?.audioSrc);
        }
        get()._armRevealed();
      },
      _toBetween: () => {
        clearTimers();
        stopRegionAudio();
        const { settings, queue, pos } = get();
        // Queue exhausted → the run's over. Every "Missed it" re-queues the
        // sign within the run, so in self-grading mode reaching the end means
        // every sign was ultimately recalled — that's a win, hence the fanfare.
        if (pos >= queue.length - 1) {
          if (settings.selfGrading && settings.playAudio) playSfx("complete");
          const { runRecalled, runMissed, runMissCount } = get();
          analytics.pelicanCompleted({
            signsTotal: runRecalled.length + runMissed.length,
            knewFirstTry: runRecalled.length,
            missCount: runMissCount,
          });
          set({ phase: "complete", running: false });
          return;
        }
        set({ phase: "between" });
        get()._armBetween();
      },
      _advance: () => {
        // `_armBetween` is only armed when there's another sign queued (see
        // `_toBetween`'s else branch), so pos + 1 is always valid here.
        set((s) => ({ pos: s.pos + 1 }));
        get()._toFocused();
      },
    }),
    {
      name: "driverush:pelican",
      version: 6,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage,
      ),
      partialize: (s) => ({ settings: s.settings, progress: s.progress }),
      // Settings/defaults churned a lot during early dev — for any saved blob
      // older than v6, drop prefs back to the current defaults but keep the
      // mastery progress. v6 also re-shows the one-time intro modal.
      migrate: (persisted, version) => {
        const prev = persisted as {
          settings?: PelicanUserSettings;
          progress?: SignProgress;
        } | null;
        const progress = prev?.progress ?? {};
        return version < 6
          ? { settings: DEFAULT_PELICAN_SETTINGS, progress }
          : { settings: prev?.settings ?? DEFAULT_PELICAN_SETTINGS, progress };
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.settings = normalizeSettings(state.settings);
      },
    },
  ),
);

// ---------------------------------------------------------------------------
// selectors / derived helpers
// ---------------------------------------------------------------------------
export const selectRegion = (s: PelicanState): FocusRegion | undefined =>
  s.queue[s.pos];

export const selectFocused = (s: PelicanState): boolean =>
  s.phase === "focused" || s.phase === "revealed";

export function getPracticeRegions(
  board: ImageFocusData | null,
  categories: SignCategoryId[],
): FocusRegion[] {
  return practiceRegions(board, categories);
}

export function getMasteredCount(
  progress: SignProgress,
  regions: FocusRegion[],
): number {
  return regions.filter((r) => isMastered(progress, r.id)).length;
}
