import * as React from "react";

import { cn } from "~/lib/utils";

type BarTone = "rush" | "ink" | "green" | "amber" | "blue";

const BAR_BG: Record<BarTone, string> = {
  rush: "bg-rush",
  ink: "bg-ink",
  green: "bg-kenya-green",
  amber: "bg-amber",
  blue: "bg-plate-blue",
};

type BarChartDatum = {
  label: React.ReactNode;
  value: number;
  tone?: BarTone;
};

type BarChartProps = React.ComponentProps<"div"> & {
  data: BarChartDatum[];
  /** Header title, e.g. "XP THIS WEEK". */
  title?: React.ReactNode;
  /** Header meta, e.g. "+1,840 TOTAL". */
  meta?: React.ReactNode;
  /** Normalise heights against this; defaults to the largest value. */
  max?: number;
  /** Show the numeric value above each bar. Default true. */
  showValues?: boolean;
  /** Plot area height in px. Default 160. */
  height?: number;
};

/** Stamped bar chart — bordered card, ink baseline, mono axis labels. */
function BarChart({
  className,
  data,
  title,
  meta,
  max,
  showValues = true,
  height = 160,
  ...props
}: BarChartProps) {
  const peak = max ?? Math.max(1, ...data.map((d) => d.value));
  const cols = { gridTemplateColumns: `repeat(${data.length}, 1fr)` };
  return (
    <div
      data-slot="bar-chart"
      className={cn(
        "border-2 border-ink bg-surface px-[22px] pb-3.5 pt-[22px]",
        className,
      )}
      {...props}
    >
      {(title != null || meta != null) && (
        <div className="mb-[18px] flex items-baseline justify-between border-b border-dashed border-ink pb-2.5">
          <span className="font-display text-sm font-extrabold uppercase tracking-wider">
            {title}
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            {meta}
          </span>
        </div>
      )}
      <div
        className="grid items-end gap-2 border-b-2 border-ink pb-1.5"
        style={{ ...cols, height }}
      >
        {data.map((d, i) => (
          <div
            key={i}
            className={cn(
              "relative min-h-1.5 border-2 border-b-0 border-ink",
              BAR_BG[d.tone ?? "rush"],
            )}
            style={{
              height: `${Math.max(0, Math.min(100, (d.value / peak) * 100))}%`,
            }}
          >
            {showValues && (
              <span className="absolute inset-x-0 -top-4 text-center font-mono text-[9.5px] font-bold tabular-nums text-ink">
                {d.value}
              </span>
            )}
          </div>
        ))}
      </div>
      <div
        className="mt-1.5 grid gap-2 text-center font-mono text-[10px] uppercase tracking-wider text-ink-3"
        style={cols}
      >
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export { BarChart };
export type { BarChartDatum, BarTone };
