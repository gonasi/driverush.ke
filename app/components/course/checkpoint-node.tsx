/**
 * Unit-end checkpoint node — bigger and more prominent than a lesson node so
 * it reads as "the gate at the end of this section." Locked until every
 * lesson in the unit is complete. Once unlocked it pulses to draw the eye.
 *
 * In PR-1 the node is decorative (the actual checkpoint runner lands in PR-2);
 * clicking an unlocked checkpoint takes the learner back to the path with a
 * "coming soon" hint, so we don't introduce a half-finished route now.
 */
import { HugeiconsIcon } from "@hugeicons/react";
import { Flag03FreeIcons, LockFreeIcons } from "@hugeicons/core-free-icons";

import type { UnitTheme } from "~/lib/course-types";
import { cn } from "~/lib/utils";

import { UNIT_THEME_CLASSES } from "./unit-header";

export function CheckpointNode({
  unitTitle,
  theme,
  unlocked,
}: {
  unitTitle: string;
  theme: UnitTheme;
  unlocked: boolean;
}) {
  return (
    <div
      className={cn(
        "flex max-w-[300px] items-center gap-3 outline-none",
        !unlocked && "opacity-90",
      )}
      title={
        unlocked
          ? "Checkpoint ready"
          : `Finish every lesson in ${unitTitle} to unlock the checkpoint`
      }
      aria-disabled={!unlocked}
    >
      <span
        className={cn(
          "inline-flex size-[104px] shrink-0 items-center justify-center border-2 border-ink shadow-stamp",
          unlocked
            ? UNIT_THEME_CLASSES[theme]
            : "bg-paper-3 text-ink-3 shadow-none",
          unlocked && "animate-[dr-pulse_2.4s_ease-in-out_infinite]",
        )}
        aria-hidden="true"
      >
        <HugeiconsIcon
          icon={unlocked ? Flag03FreeIcons : LockFreeIcons}
          size={36}
          strokeWidth={2.25}
        />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3 tabular-nums">
          Checkpoint
        </span>
        <span className="font-display text-[16px] font-extrabold uppercase leading-tight tracking-tight text-ink">
          {unitTitle}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
          {unlocked ? "Ready when you are" : "Locked"}
        </span>
      </span>
    </div>
  );
}
