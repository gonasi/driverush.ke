import * as React from "react";

import { cn } from "~/lib/utils";

type WizardState = "done" | "active" | "pending";

type WizardStep = {
  /** Big italic number; defaults to the 1-indexed position, zero-padded. */
  num?: React.ReactNode;
  name: React.ReactNode;
  /** Mono status line, e.g. "DONE · 64%", "IN PROGRESS", "UNLOCKS NEXT". */
  sub?: React.ReactNode;
  state?: WizardState;
};

type WizardProps = React.ComponentProps<"div"> & {
  steps: WizardStep[];
};

/** Horizontal multi-step flow — done in green, active in rush, pending muted. */
function Wizard({ className, steps, ...props }: WizardProps) {
  return (
    <div
      data-slot="wizard"
      className={cn("grid border-2 border-ink bg-surface", className)}
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0,1fr))` }}
      {...props}
    >
      {steps.map((s, i) => {
        const state = s.state ?? "pending";
        return (
          <div
            key={i}
            data-state={state}
            className={cn(
              "border-r-2 border-ink p-3.5 px-4 last:border-r-0",
              state === "done" && "bg-kenya-green text-white",
              state === "active" && "bg-rush text-white",
            )}
          >
            <div
              className={cn(
                "font-display text-[28px] font-extrabold italic leading-none",
                state === "pending" ? "text-ink-4" : "text-white/85",
              )}
            >
              {s.num ?? String(i + 1).padStart(2, "0")}
            </div>
            <div className="mt-1.5 font-display text-xs font-bold uppercase tracking-[0.04em]">
              {s.name}
            </div>
            {s.sub != null && (
              <div
                className={cn(
                  "mt-[3px] font-mono text-[10px] uppercase tracking-wider",
                  state === "pending" ? "text-ink-3" : "text-white/85",
                )}
              >
                {s.sub}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { Wizard };
export type { WizardStep, WizardState };
