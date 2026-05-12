import * as React from "react";

import { cn } from "~/lib/utils";

// 5-step red scale, from "no activity" to "max". Empty cell flips paper tone
// in dark mode so the grid still reads against the deep-ink surface.
const LEVEL_BG = [
  "bg-paper-2 dark:bg-paper-3",
  "bg-[color-mix(in_oklab,var(--rush)_30%,var(--paper-3))]",
  "bg-[color-mix(in_oklab,var(--rush)_55%,var(--paper-3))]",
  "bg-[color-mix(in_oklab,var(--rush)_80%,var(--paper-3))]",
  "bg-rush",
];

function bucket(v: number, max: number) {
  if (v <= 0 || max <= 0) return 0;
  return Math.min(4, Math.ceil((v / max) * 4));
}

type HeatmapProps = React.ComponentProps<"div"> & {
  /** Raw activity counts, oldest → newest. Bucketed into 4 intensity levels. */
  data: number[];
  /** Cells per row. Default 20. */
  columns?: number;
  title?: React.ReactNode;
  meta?: React.ReactNode;
};

/** Daily-activity heatmap — a grid of stamped cells in a 5-step red scale. */
function Heatmap({
  className,
  data,
  columns = 20,
  title,
  meta,
  ...props
}: HeatmapProps) {
  const max = Math.max(1, ...data);
  return (
    <div
      data-slot="heatmap"
      className={cn("border-2 border-ink bg-surface p-[18px]", className)}
      {...props}
    >
      {(title != null || meta != null) && (
        <div className="mb-3.5 flex items-baseline justify-between border-b border-dashed border-ink pb-2">
          <span className="font-display text-[13px] font-extrabold uppercase tracking-wider">
            {title}
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            {meta}
          </span>
        </div>
      )}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {data.map((v, i) => (
          <span
            key={i}
            className={cn(
              "aspect-square border border-ink",
              LEVEL_BG[bucket(v, max)],
            )}
            aria-hidden
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
        <span>Less</span>
        <span className="flex gap-1">
          {LEVEL_BG.map((bg, i) => (
            <span
              key={i}
              className={cn("inline-block size-3.5 border border-ink", bg)}
              aria-hidden
            />
          ))}
        </span>
        <span>More</span>
      </div>
    </div>
  );
}

export { Heatmap };
