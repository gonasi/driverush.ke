/**
 * Course-player UI store (Gonasi-style feel). Holds two things:
 *  - persisted player preferences: sound + haptics on/off (localStorage);
 *  - the transient "Why?" bottom-sheet state (explanation content + open flag),
 *    lifted here so any block renderer can open it without prop-drilling.
 *
 * Mirrors Gonasi's `useStore` (sound/vibration prefs + explanation sheet).
 * SSR-safe storage like the other persisted stores.
 */
import type { ReactNode } from "react";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export type WhyContent = { title: string; body: ReactNode };

type CourseUiState = {
  // ---- persisted prefs ----
  isSoundEnabled: boolean;
  isVibrationEnabled: boolean;
  toggleSound: () => void;
  toggleVibration: () => void;
  // ---- transient: the "Why?" bottom sheet ----
  why: WhyContent | null;
  openWhy: (why: { title?: string; body: ReactNode }) => void;
  closeWhy: () => void;
};

export const useCourseUiStore = create<CourseUiState>()(
  persist(
    (set) => ({
      isSoundEnabled: true,
      isVibrationEnabled: true,
      toggleSound: () => set((s) => ({ isSoundEnabled: !s.isSoundEnabled })),
      toggleVibration: () =>
        set((s) => ({ isVibrationEnabled: !s.isVibrationEnabled })),

      why: null,
      openWhy: (w) => set({ why: { title: w.title ?? "Why?", body: w.body } }),
      closeWhy: () => set({ why: null }),
    }),
    {
      name: "driverush:course-ui",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage,
      ),
      // Only the prefs persist; the Why sheet is per-session.
      partialize: (s) => ({
        isSoundEnabled: s.isSoundEnabled,
        isVibrationEnabled: s.isVibrationEnabled,
      }),
    },
  ),
);
