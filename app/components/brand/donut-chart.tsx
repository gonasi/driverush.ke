import * as React from "react";

import { cn } from "~/lib/utils";

type DonutSegment = {
  label: React.ReactNode;
  value: number;
  /** CSS colour for the wedge + key swatch. */
  color: string;
};

type DonutChartProps = React.ComponentProps<"div"> & {
  segments: DonutSegment[];
  /** Big number in the hole, e.g. "14h". */
  centerValue?: React.ReactNode;
  /** Mono caption under it, e.g. "THIS MONTH". */
  centerLabel?: React.ReactNode;
};

/** Conic-gradient donut with a stamped key list. */
function DonutChart({
  className,
  segments,
  centerValue,
  centerLabel,
  ...props
}: DonutChartProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = segments
    .map((s) => {
      const start = (acc / total) * 100;
      acc += s.value;
      const end = (acc / total) * 100;
      return `${s.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    })
    .join(", ");

  return (
    <div
      data-slot="donut-chart"
      className={cn(
        "grid grid-cols-[auto_1fr] items-center gap-[22px] border-2 border-ink bg-surface p-[22px]",
        className,
      )}
      {...props}
    >
      <div
        className="relative flex size-[130px] items-center justify-center rounded-full border-2 border-ink after:absolute after:inset-[18px] after:rounded-full after:border-2 after:border-ink after:bg-surface"
        style={{ background: `conic-gradient(${stops})` }}
        aria-hidden
      >
        <div className="relative z-[1] text-center">
          {centerValue != null && (
            <div className="font-display text-[28px] font-extrabold leading-none text-rush">
              {centerValue}
            </div>
          )}
          {centerLabel != null && (
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest">
              {centerLabel}
            </div>
          )}
        </div>
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        {segments.map((s, i) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <li
              key={i}
              className="grid grid-cols-[14px_1fr_auto] items-center gap-2.5 border-b border-dashed border-ink pb-1.5 text-xs last:border-b-0"
            >
              <span
                className="size-3.5 border-2 border-ink"
                style={{ background: s.color }}
                aria-hidden
              />
              <span className="font-display text-xs font-bold uppercase tracking-[0.03em]">
                {s.label}
              </span>
              <span className="font-mono text-xs font-bold tabular-nums">
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { DonutChart };
export type { DonutSegment };
