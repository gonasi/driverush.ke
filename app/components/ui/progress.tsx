import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "~/lib/utils";

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  /** Show 25/50/75% tick marks across the rail. */
  showTicks?: boolean;
  /** Render the diagonal-stripe rush fill (default) or a flat green fill. */
  tone?: "rush" | "green";
};

function Progress({
  className,
  value,
  showTicks = true,
  tone = "rush",
  ...props
}: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={pct}
      className={cn(
        "relative h-[22px] w-full overflow-hidden border-2 border-ink bg-paper-3",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full transition-[width] duration-300 ease-snap",
          tone === "rush"
            ? "bg-[repeating-linear-gradient(45deg,var(--rush)_0_8px,var(--rush-deep)_8px_16px)]"
            : "bg-kenya-green",
        )}
        style={{ width: `${pct}%` }}
      />
      {showTicks && (
        <>
          <span className="pointer-events-none absolute inset-y-0 left-1/4 w-px bg-ink/40" />
          <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-ink/40" />
          <span className="pointer-events-none absolute inset-y-0 left-3/4 w-px bg-ink/40" />
        </>
      )}
    </ProgressPrimitive.Root>
  );
}

function ProgressIndeterminate({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="progress-indeterminate"
      role="progressbar"
      aria-busy
      className={cn(
        "relative h-4 w-full overflow-hidden border-2 border-ink bg-paper-3",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full",
          "bg-[repeating-linear-gradient(45deg,var(--ink)_0_8px,var(--ink-3)_8px_16px)]",
          "animate-[dr-stripe-move_1.4s_linear_infinite]",
        )}
      />
    </div>
  );
}

export { Progress, ProgressIndeterminate };
