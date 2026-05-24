/**
 * Course-player sound + haptic feedback, gated by the user's preferences in
 * `course-ui-store`. Reuses the existing one-shot SFX engine in `~/lib/sounds`
 * (whoosh / reveal / correct / wrong / complete) — no new audio library — and
 * adds the Gonasi double-buzz haptic on wrong answers.
 *
 * Event → effect mapping (mirrors Gonasi):
 *   tap      → whoosh   (option select / button)
 *   flip     → reveal   (tap-to-reveal card)
 *   correct  → correct
 *   wrong    → wrong   + vibrate [100,50,100]
 *   complete → complete (lesson done fanfare)
 *   scroll   → whoosh   (auto-scroll to revealed block)
 */
import { useMemo } from "react";

import { playSfx } from "./sounds";
import { useCourseUiStore } from "./course-ui-store";

const WRONG_VIBRATION = [100, 50, 100];

export function useFeedback() {
  const sound = useCourseUiStore((s) => s.isSoundEnabled);
  const vibration = useCourseUiStore((s) => s.isVibrationEnabled);

  return useMemo(() => {
    const sfx = (name: Parameters<typeof playSfx>[0]) => {
      if (sound) playSfx(name);
    };
    return {
      tap: () => sfx("whoosh"),
      flip: () => sfx("reveal"),
      correct: () => sfx("correct"),
      wrong: () => {
        sfx("wrong");
        if (
          vibration &&
          typeof navigator !== "undefined" &&
          typeof navigator.vibrate === "function"
        ) {
          navigator.vibrate(WRONG_VIBRATION);
        }
      },
      complete: () => sfx("complete"),
      scroll: () => sfx("whoosh"),
    };
  }, [sound, vibration]);
}

export type Feedback = ReturnType<typeof useFeedback>;
