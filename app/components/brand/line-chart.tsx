import * as React from "react";

import { cn } from "~/lib/utils";

type LineSeries = {
  label: React.ReactNode;
  /** Stroke colour — any CSS colour or var(). */
  color: string;
  /** Dash the line and use a hollow legend swatch. */
  dashed?: boolean;
  /** Y values; the chart spaces them evenly across the x-axis. */
  data: number[];
};

type LineChartProps = React.ComponentProps<"div"> & {
  series: LineSeries[];
  /** Y-axis max; defaults to the largest value across all series. */
  max?: number;
};

const W = 320;
const H = 200;

/** Stamped line chart — grid-ruled card, polylines with dots, mono legend. */
function LineChart({ className, series, max, ...props }: LineChartProps) {
  const gridId = `dr-grid-${React.useId().replace(/[:]/g, "")}`;
  const peak = max ?? Math.max(1, ...series.flatMap((s) => s.data));

  const coord = (data: number[], i: number) => {
    const x = data.length <= 1 ? 0 : (i / (data.length - 1)) * W;
    const y = H - (Math.max(0, data[i]) / peak) * H;
    return [x, y] as const;
  };
  const points = (data: number[]) =>
    data
      .map((_, i) =>
        coord(data, i)
          .map((n) => n.toFixed(1))
          .join(","),
      )
      .join(" ");

  return (
    <div
      data-slot="line-chart"
      className={cn(
        "border-2 border-ink bg-surface p-[22px] text-ink",
        className,
      )}
      {...props}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-[200px] w-full"
        aria-hidden
      >
        <defs>
          <pattern
            id={gridId}
            width="32"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.2"
            />
          </pattern>
        </defs>
        <rect width={W} height={H} fill={`url(#${gridId})`} />
        {series.map((s, i) => (
          <polyline
            key={`l-${i}`}
            points={points(s.data)}
            fill="none"
            stroke={s.color}
            strokeWidth={s.dashed ? 2 : 3}
            strokeDasharray={s.dashed ? "4 4" : undefined}
            opacity={s.dashed ? 0.6 : 1}
          />
        ))}
        {series
          .filter((s) => !s.dashed)
          .flatMap((s, i) =>
            s.data.map((_, j) => {
              const [x, y] = coord(s.data, j);
              return (
                <circle
                  key={`c-${i}-${j}`}
                  cx={x}
                  cy={y}
                  r={4}
                  fill={s.color}
                  stroke="currentColor"
                  strokeWidth={2}
                />
              );
            }),
          )}
      </svg>
      {series.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-3.5 font-mono text-[10.5px] uppercase tracking-wider">
          {series.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-1 w-3.5 border border-ink"
                style={
                  s.dashed
                    ? { borderStyle: "dashed", background: "transparent" }
                    : { background: s.color }
                }
                aria-hidden
              />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export { LineChart };
export type { LineSeries };
