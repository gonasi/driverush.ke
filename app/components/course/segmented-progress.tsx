import { cn } from "~/lib/utils";

export type ProgressSegment = {
  id: string;
  /** Relative width (block weight). */
  weight: number;
  complete: boolean;
};

/**
 * Gonasi-style segmented progress — one tiny box per block, sized by weight.
 * Brutalist take: square ink-bordered cells, rush fill when done, a pulsing
 * cell for the active block, muted paper for locked-ahead blocks. Lives in the
 * player's sticky header.
 */
export function SegmentedProgress({
  segments,
  activeId,
  className,
}: {
  segments: ProgressSegment[];
  activeId?: string;
  className?: string;
}) {
  const done = segments.filter((s) => s.complete).length;
  return (
    <div
      role="progressbar"
      aria-label="Lesson progress"
      aria-valuemin={0}
      aria-valuemax={segments.length}
      aria-valuenow={done}
      className={cn("flex w-full items-stretch gap-1", className)}
    >
      {segments.map((seg) => {
        const active = seg.id === activeId && !seg.complete;
        return (
          <span
            key={seg.id}
            style={{ flexGrow: Math.max(1, seg.weight) }}
            className={cn(
              "h-2.5 border border-ink transition-colors duration-300",
              seg.complete
                ? "bg-rush"
                : active
                  ? "animate-pulse bg-ink/30"
                  : "bg-paper-3",
            )}
          />
        );
      })}
    </div>
  );
}
