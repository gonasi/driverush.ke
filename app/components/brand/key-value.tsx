import * as React from "react";

import { cn } from "~/lib/utils";

type KeyValueEntry = {
  /** Mono caps label. */
  k: React.ReactNode;
  /** Value (display caps by default). */
  v: React.ReactNode;
  /** Render the value in rush red. */
  accent?: boolean;
  /** Render the value in the mono face (for IDs, plates, codes). */
  mono?: boolean;
};

type KeyValueProps = React.ComponentProps<"div"> & {
  rows: KeyValueEntry[];
};

/** Spec / metadata list — bordered, dashed-ruled key·value rows. */
function KeyValue({ className, rows, ...props }: KeyValueProps) {
  return (
    <div
      data-slot="key-value"
      className={cn("border-2 border-ink bg-surface", className)}
      {...props}
    >
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-dashed border-ink px-4 py-[11px] last:border-b-0"
        >
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
            {r.k}
          </span>
          <span
            className={cn(
              "text-[13px]",
              r.mono
                ? "font-mono font-bold"
                : "font-display font-bold uppercase tracking-[0.02em]",
              r.accent && "text-rush",
            )}
          >
            {r.v}
          </span>
        </div>
      ))}
    </div>
  );
}

export { KeyValue };
export type { KeyValueEntry };
