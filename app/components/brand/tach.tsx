import * as React from "react";

import { cn } from "~/lib/utils";

/* =============================================================
   Tach progress variants beyond the standard Progress primitive.
   - TachCircle:   conic-gradient circular dial
   - TachSegments: discrete segment cells (X / N done)
   - TachSteps:    dot-and-bar stepper for multi-step flows
   ============================================================= */

type TachCircleProps = React.ComponentProps<"div"> & {
  /** Percent complete, 0–100. */
  value: number;
  /** Pixel size of the dial; default 96. */
  size?: number;
  /** Custom value renderer (default shows N%). Pass `{value === 100 ? <CheckIcon/> : `${value}%`}`. */
  children?: React.ReactNode;
};

/** Conic-gradient circular progress dial. */
function TachCircle({
  className,
  value,
  size = 96,
  children,
  style,
  ...props
}: TachCircleProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      data-slot="tach-circle"
      className={cn(
        "relative inline-flex items-center justify-center font-display text-[22px] font-extrabold text-ink",
        "before:absolute before:inset-0 before:rounded-full",
        "after:absolute after:inset-2 after:rounded-full after:border-2 after:border-ink after:bg-surface",
        className,
      )}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      {...props}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(var(--rush) ${v}%, var(--paper-3) 0)`,
        }}
        aria-hidden
      />
      <span
        className="absolute inset-2 rounded-full border-2 border-ink bg-surface"
        aria-hidden
      />
      <span className="relative z-[1] tabular-nums">
        {children ?? (
          <>
            {v}
            <span className="ml-0.5 font-mono text-[10px] text-ink-3">%</span>
          </>
        )}
      </span>
    </div>
  );
}

type TachSegmentsProps = React.ComponentProps<"div"> & {
  /** Total number of segments. */
  total: number;
  /** Currently-completed segments (0–total). */
  done: number;
  /** Whether to show the trailing "X / N" counter. */
  showCounter?: boolean;
};

/** Discrete segment cells — done · current · pending. */
function TachSegments({
  className,
  total,
  done,
  showCounter = true,
  ...props
}: TachSegmentsProps) {
  const segs = Array.from({ length: total }, (_, i) => {
    const state = i < done ? "done" : i === done ? "curr" : "pending";
    return (
      <span
        key={i}
        data-state={state}
        className={cn(
          "h-6 w-4 border-2 border-ink",
          state === "done" && "bg-rush",
          state === "curr" && "bg-ink",
          state === "pending" && "bg-paper-3",
        )}
      />
    );
  });
  return (
    <div
      data-slot="tach-segments"
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[11px] tabular-nums",
        className,
      )}
      {...props}
    >
      {segs}
      {showCounter && (
        <span className="ml-2 text-ink-3">
          {String(done).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}

type TachStepsProps = React.ComponentProps<"div"> & {
  /** Total steps. */
  total: number;
  /** Currently active step (1-indexed). */
  current: number;
};

/** Dot-and-bar stepper. Done = ink, current = rush halo, pending = outline. */
function TachSteps({ className, total, current, ...props }: TachStepsProps) {
  const items: React.ReactNode[] = [];
  for (let i = 1; i <= total; i++) {
    const isDone = i < current;
    const isCurr = i === current;
    items.push(
      <span
        key={`d-${i}`}
        data-state={isDone ? "done" : isCurr ? "curr" : "pending"}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-full border-2 border-ink font-display text-xs font-extrabold",
          isDone && "bg-ink text-paper",
          isCurr && "bg-rush text-white shadow-[0_0_0_4px_var(--rush-soft)]",
          !isDone && !isCurr && "bg-surface text-ink",
        )}
      >
        {isDone ? "✓" : i}
      </span>,
    );
    if (i < total) {
      const barDone = i < current;
      items.push(
        <span
          key={`b-${i}`}
          aria-hidden
          className={cn(
            "h-0.5 flex-1",
            barDone
              ? "bg-ink"
              : "bg-[repeating-linear-gradient(90deg,var(--ink)_0_4px,transparent_4px_8px)]",
          )}
        />,
      );
    }
  }

  return (
    <div
      data-slot="tach-steps"
      className={cn(
        "flex items-center gap-1.5 font-mono text-[11px]",
        className,
      )}
      {...props}
    >
      {items}
    </div>
  );
}

export { TachCircle, TachSegments, TachSteps };
