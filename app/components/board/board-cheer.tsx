/**
 * What is said when a level is finished: how far through the course that
 * leaves the learner, and, when it was the last level of its unit, that the
 * unit is done. Kept small on purpose: a tick and a line. The one exception is
 * the whole course, which is finished once and gets its burst of confetti.
 */
import * as React from "react";

import {
  COURSE_LEVELS,
  UNITS,
  doneCount,
  levelDone,
  readiness,
  unitOf,
  type Level,
} from "~/lib/board/curriculum";
import { useBoardStore } from "~/lib/board-store";
import { cn } from "~/lib/utils";

import { Icon } from "~/components/brand/icon";
import { CheckIcon } from "~/components/brand/icons";

// Only a learner who finishes the course ever downloads it.
const Confetti = React.lazy(() =>
  import("~/components/brand/celebration-confetti").then((mod) => ({
    default: mod.CelebrationConfetti,
  })),
);

export function LevelCheer({
  level,
  className,
}: {
  level: Level;
  className?: string;
}) {
  const learned = useBoardStore((s) => s.learned);
  const bestStars = useBoardStore((s) => s.bestStars);
  const saved = { learned, bestStars };
  const unit = unitOf(level);
  const unitDone = unit.levels.every((one) => levelDone(one, saved));
  const done = doneCount(saved);
  const total = COURSE_LEVELS.length;
  const whole = done >= total;
  const count = `${done} of ${total} levels done · Board ready ${readiness(saved)}%`;

  // The burst plays the first time the course is finished, and never again.
  const [burst] = React.useState(
    () => whole && !useBoardStore.getState().courseCheered,
  );
  React.useEffect(() => {
    if (burst) useBoardStore.setState({ courseCheered: true });
  }, [burst]);

  if (!unitDone) {
    return (
      <p
        className={cn(
          "m-0 font-mono text-[10.5px] font-bold uppercase tracking-widest opacity-70",
          className,
        )}
      >
        {count}
      </p>
    );
  }
  const n = UNITS.indexOf(unit) + 1;
  return (
    <div
      role="status"
      className={cn(
        "dr-pop flex items-center gap-3 rounded-md border-2 border-kenya-gold bg-kenya-gold/15 p-3",
        className,
      )}
    >
      {burst && (
        <div className="pointer-events-none fixed inset-0 z-50">
          <React.Suspense fallback={null}>
            <Confetti bursts={1} />
          </React.Suspense>
        </div>
      )}
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-kenya-gold text-kenya-gold-foreground">
        <Icon icon={CheckIcon} size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold leading-snug">
          {whole ? "Course done." : `Unit ${n} done: ${unit.title}.`}
        </span>
        {whole && (
          <span className="mt-0.5 block text-[13.5px] leading-snug opacity-85">
            Every level of the board is behind you. The mock test mixes five
            tasks from all of it.
          </span>
        )}
        <span className="mt-1 block font-mono text-[10.5px] font-bold uppercase tracking-widest opacity-70">
          {count}
        </span>
      </span>
    </div>
  );
}
