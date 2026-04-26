import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const gaugeNumVariants = cva(
  "font-display text-4xl font-extrabold leading-none tracking-tight",
  {
    variants: {
      tone: {
        rush: "text-rush",
        ink: "text-ink",
        green: "text-kenya-green",
        amber: "text-amber",
        blue: "text-plate-blue",
      },
    },
    defaultVariants: { tone: "rush" },
  },
);

type GaugeProps = Omit<React.ComponentProps<"div">, "title"> &
  VariantProps<typeof gaugeNumVariants> & {
    /** Top-left mono caps label, e.g. "STREAK". */
    label: React.ReactNode;
    /** Top-right mono caps meta, e.g. "·12d", "·LIVE". */
    meta?: React.ReactNode;
    /** Big numeric value. */
    value: React.ReactNode;
    /** Trailing unit, e.g. "DAYS", "PTS", "/5". */
    unit?: React.ReactNode;
  };

/** Petrol-gauge stat block — head bar (label/meta) + numeric body. */
function Gauge({
  className,
  tone,
  label,
  meta,
  value,
  unit,
  ...props
}: GaugeProps) {
  return (
    <div
      data-slot="gauge"
      className={cn(
        "inline-flex min-w-[180px] flex-col border-2 border-ink bg-surface",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between bg-ink px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-paper">
        <span>{label}</span>
        {meta && <span>{meta}</span>}
      </div>
      <div className="flex items-baseline gap-2 px-4 py-3.5">
        <span className={cn(gaugeNumVariants({ tone }), "tabular-nums")}>
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

type StatTileProps = React.ComponentProps<"div"> & {
  /** Mono caps label. */
  label: React.ReactNode;
  /** Big display value. */
  value: React.ReactNode;
  /** Tone applied to the value text. */
  tone?: VariantProps<typeof gaugeNumVariants>["tone"];
  /** Optional change indicator. */
  delta?: { dir: "up" | "down"; copy: React.ReactNode };
};

/** Compact stat tile — label + big value + optional ±delta. */
function StatTile({
  className,
  label,
  value,
  tone = "ink",
  delta,
  ...props
}: StatTileProps) {
  return (
    <div
      data-slot="stat-tile"
      className={cn(
        "grid min-w-[160px] gap-1 border-2 border-ink bg-surface p-3.5",
        className,
      )}
      {...props}
    >
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
        {label}
      </span>
      <span
        className={cn(
          "font-display text-3xl font-extrabold leading-none tracking-tight tabular-nums",
          tone === "rush" && "text-rush",
          tone === "ink" && "text-ink",
          tone === "green" && "text-kenya-green",
          tone === "amber" && "text-amber",
          tone === "blue" && "text-plate-blue",
        )}
      >
        {value}
      </span>
      {delta && (
        <span
          className={cn(
            "font-mono text-[11px] font-bold uppercase tracking-wide",
            delta.dir === "up" ? "text-kenya-green" : "text-rush",
          )}
        >
          {delta.dir === "up" ? "▲" : "▼"} {delta.copy}
        </span>
      )}
    </div>
  );
}

export { Gauge, StatTile };
