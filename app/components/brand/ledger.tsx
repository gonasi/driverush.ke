import * as React from "react";

import { cn } from "~/lib/utils";

type LedgerColumn = {
  key: string;
  label: React.ReactNode;
  /** Right-align this column (for numbers). */
  align?: "left" | "right";
};

type LedgerRow = Record<string, React.ReactNode>;

type LedgerProps = React.ComponentProps<"table"> & {
  columns: LedgerColumn[];
  rows: LedgerRow[];
};

/**
 * Ledger-style data table — ink header band, dashed perforations, zebra rows.
 * Cell content is whatever you pass; wrap a cell in {@link LedgerName} for the
 * display-cased "name" column or {@link LedgerDelta} for a ±-vs-average value.
 */
function Ledger({ className, columns, rows, ...props }: LedgerProps) {
  return (
    <table
      data-slot="ledger"
      className={cn(
        "w-full border-collapse border-2 border-ink bg-surface text-[13px]",
        className,
      )}
      {...props}
    >
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              className={cn(
                "border-r border-dashed border-paper bg-ink px-3.5 py-2.5 font-display text-[11px] font-extrabold uppercase tracking-[0.14em] text-paper last:border-r-0",
                c.align === "right" ? "text-right" : "text-left",
              )}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={i}
            className="border-b border-dashed border-ink last:border-b-0 even:bg-paper-3 dark:even:bg-paper-2"
          >
            {columns.map((c) => (
              <td
                key={c.key}
                className={cn(
                  "border-r border-dashed border-line-soft px-3.5 py-3 font-mono font-semibold last:border-r-0 dark:border-paper-2",
                  c.align === "right" && "text-right",
                )}
              >
                {r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Display-cased cell, for the "name" column of a {@link Ledger}. */
function LedgerName({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "font-display text-[13px] font-bold uppercase tracking-[0.02em]",
        className,
      )}
      {...props}
    />
  );
}

/** Coloured Δ-vs-average value — green for up, rush for down. */
function LedgerDelta({
  dir,
  className,
  ...props
}: React.ComponentProps<"span"> & { dir: "up" | "down" }) {
  return (
    <span
      className={cn(
        dir === "up" ? "text-signal-green" : "text-rush",
        className,
      )}
      {...props}
    />
  );
}

export { Ledger, LedgerName, LedgerDelta };
export type { LedgerColumn, LedgerRow };
