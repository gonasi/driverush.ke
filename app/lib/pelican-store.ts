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

/**
 * In-progress run snapshot. Persisted to localStorage so users can pick up
 * where they left off across reloads / tab closes. We save just enough to
 * deterministically reconstruct the in-flight run (the queue as sign IDs +
 * the per-run grading state), plus signatures that let us refuse to resume
 * when the user's settings or the board itself have changed.
 *
 * Always saved with `phase: "between"` because that's the only point in the
 * state machine where pausing the world is safe — we never try to resume
 * mid-countdown or mid-reveal.
 */
type InProgressRun = {
  queueIds: string[];
  pos: number;
  runRecalled: string[];
  runMissed: string[];
  runMissCount: number;
  runSeen: number;
  /** Stable hash of queue-affecting settings — invalidates the save if they change. */
  settingsSig: string;
  /** Stable hash of the board — invalidates the save if the data file changes shape. */
  boardSig: string;
  savedAt: number;
};

function computeSettingsSig(s: PelicanUserSettings): string {
  // Only settings that change the queue contents/order need to invalidate
  // a resume. Visual prefs (blur, dim, audio) can mutate freely.
  return JSON.stringify({
    c: [...s.categories].sort(),
    o: s.order,
    r: s.reverse,
  });
}

function computeBoardSig(b: ImageFocusData | null): string {
  if (!b) return "";
  return `${b.imageSrc}::${b.regions.length}`;
}

function hydrateQueueFromIds(
  board: ImageFocusData | null,
  ids: string[],
): FocusRegion[] | null {
  if (!board) return null;
  const byId = new Map(board.regions.map((r) => [r.id, r]));
  const out: FocusRegion[] = [];
  for (const id of ids) {
    const region = byId.get(id);
    // If any saved sign is missing (data change), bail — partial resume
    // would be worse than starting fresh.
    if (!region) return null;
    out.push(region);
  }
  return out;
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
  /**
   * Saved in-flight run. Survives reload so the user resumes between signs
   * instead of restarting from scratch. Cleared on completion, explicit
   * exit, fresh Start, or settings/progress reset. `null` means no save.
   */
  inProgressRun: InProgressRun | null;
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
  /**
   * Sign cycles the user has *finished* this run (incremented at the
   * inter-sign boundary, never on completion). Used for resume display
   * and as the "natural break" boundary at which gameplay_milestone fires.
   * Transient — resets per run.
   */
  runSeen: number;
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
  /**
   * Restore the saved in-progress run, if any. Validates the saved
   * signatures (board + settings) against current state — if anything has
   * shifted, the saved run is silently discarded. No-op if there's nothing
   * to resume.
   */
  resumeRun: () => void;
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
        // Any change that affects the queue means "the run the user is
        // doing isn't the run they'd be doing now" — so wipe both the
        // saved checkpoint and the in-flight tallies. Continuing with stale
        // runRecalled/runMissed/runMissCount/runSeen would leave references
        // to signs that may no longer even be in the queue.
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
      resetProgress: () => set({ progress: {}, inProgressRun: null }),

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
          runSeen: 0,
          // Fresh Start = wipe any prior save. The first _toBetween writes
          // a new checkpoint at the first "between" boundary.
          inProgressRun: null,
        });
        analytics.pelicanStarted({
          signsTotal: queue.length,
          categories: get().settings.categories,
        });
        get()._armInitial();
      },

      resumeRun: () => {
        const state = get();
        const run = state.inProgressRun;
        if (!run || !state.board) return;
        // Refuse to resume if the world has shifted underneath the save.
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
        stopRegionAudio();
        // Snap to "between" — the safe inter-sign boundary — and let
        // _armBetween advance into the next focused sign cleanly. The user
        // doesn't lose the just-graded sign because pos is the LAST graded.
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
        // Exit closes the overlay and clears transient run state, but
        // DELIBERATELY preserves the persisted `inProgressRun`. Closing
        // the trainer is "I'm done for now," not "wipe my progress" — the
        // user returns later to a Resume CTA. The only paths that wipe
        // the save are: fresh Start (start), Reset Progress (resetProgress),
        // queue-affecting settings changes (setSetting), or completion.
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
          // Zustand store can't use React hooks — route the trigger through
          // the engine singleton instead. Silent no-op if the AdProvider
          // hasn't mounted yet (it has, by the time you can finish a run).
          triggerAdFromNonReact("chapter_complete");
          // Run is done — no point saving a resume point.
          set({ phase: "complete", running: false, inProgressRun: null });
          return;
        }

        // Mid-run: tick the seen counter, snapshot the run for resume, and
        // *always* announce the inter-sign break point to the ad engine.
        // The engine's active-session budget decides whether to actually
        // fire — most calls block silently with `session_budget_not_met`.
        // We commit the phase *before* potentially firing so that when the
        // ad closes, resume() finds phase="between" and re-arms _armBetween
        // cleanly — no special-case path needed in resume().
        const snapshotState = get();
        const nextSeen = snapshotState.runSeen + 1;

        set({
          phase: "between",
          runSeen: nextSeen,
          // Checkpoint the run for reload-safe resume. Saved at every
          // "between" boundary because that's the only phase where
          // snapping back is safe — no in-flight timers, no mid-countdown
          // to recover.
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
            // resume() switches on phase and calls _armBetween() — gameplay
            // picks up exactly where it left off. running=true flips back too.
            get().resume();
          });
          if (opened) {
            // pause() already does clearTimers + stopAllSfx + stopRegionAudio
            // and flips running=false. The engine's subscription above will
            // fire resume() when the user closes the ad.
            get().pause();
            return;
          }
          // Trigger was blocked (budget not met, premium, etc.) — fall through and
          // arm the between phase like nothing happened. newNextMilestone has
          // already been advanced, so we won't retry on the next sign.
        }

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
      version: 8,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage,
      ),
      partialize: (s) => ({
        settings: s.settings,
        progress: s.progress,
        inProgressRun: s.inProgressRun,
      }),
      // Settings/defaults churned a lot during early dev — for any saved blob
      // older than v6, drop prefs back to the current defaults but keep the
      // mastery progress. v6 also re-shows the one-time intro modal. v7 added
      // the in-progress run save. v8 added a (now-removed) `nextMilestoneAt`
      // to the saved run — current code ignores that vestigial field, so v8
      // blobs are forward-compatible. Older versions get a fresh `null`.
      migrate: (persisted, version) => {
        const prev = persisted as {
          settings?: PelicanUserSettings;
          progress?: SignProgress;
          inProgressRun?: InProgressRun | null;
        } | null;
        const progress = prev?.progress ?? {};
        const base =
          version < 6
            ? { settings: DEFAULT_PELICAN_SETTINGS, progress }
            : {
                settings: prev?.settings ?? DEFAULT_PELICAN_SETTINGS,
                progress,
              };
        return {
          ...base,
          // Honour an existing save only if it's a v8+ blob (matches the
          // current InProgressRun shape).
          inProgressRun: version >= 8 ? (prev?.inProgressRun ?? null) : null,
        };
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

/**
 * Whether the saved run can actually be resumed in the current world.
 * Returns false if there's no save, if assets haven't finished preloading,
 * or if the user's settings / the board itself have shifted since the save.
 */
export function selectCanResume(s: PelicanState): boolean {
  const run = s.inProgressRun;
  if (!run || !s.board) return false;
  if (s.assetStatus !== "ready") return false;
  if (run.settingsSig !== computeSettingsSig(s.settings)) return false;
  if (run.boardSig !== computeBoardSig(s.board)) return false;
  if (run.pos < 0 || run.pos >= run.queueIds.length) return false;
  const ids = new Set(s.board.regions.map((r) => r.id));
  return run.queueIds.every((id) => ids.has(id));
}

/** Display stats for the Resume CTA. Returns null when there's nothing to show. */
export function selectResumeStats(
  s: PelicanState,
): { signsDone: number; total: number; recalled: number } | null {
  const run = s.inProgressRun;
  if (!run) return null;
  return {
    // `pos` is the index of the just-graded sign; "done" feels more
    // natural as a count, so use pos+1.
    signsDone: run.pos + 1,
    total: run.queueIds.length,
    recalled: run.runRecalled.length,
  };
}
