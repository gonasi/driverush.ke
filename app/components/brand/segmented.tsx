import * as React from "react";

import { cn } from "~/lib/utils";

type SegmentedOption<T extends string> = {
  label: React.ReactNode;
  value: T;
};

type SegmentedProps<T extends string> = Omit<
  React.ComponentProps<"div">,
  "onChange"
> & {
  options: SegmentedOption<T>[];
  value: T;
  onValueChange?: (value: T) => void;
};

/**
 * Inset-track segmented control — a `paper-3` rail with a 3px inset, mono caps
 * options, and a rush pill on the active one. Distinct from a {@link Tabs}
 * strip (those invert to ink). Controlled: pass `value` + `onValueChange`.
 */
function Segmented<T extends string>({
  className,
  options,
  value,
  onValueChange,
  ...props
}: SegmentedProps<T>) {
  return (
    <div
      data-slot="segmented"
      role="group"
      className={cn(
        "inline-flex gap-[3px] border-2 border-ink bg-paper-3 p-[3px]",
        className,
      )}
      {...props}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            data-state={active ? "active" : undefined}
            aria-pressed={active}
            onClick={() => onValueChange?.(opt.value)}
            className={cn(
              "px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-wider outline-none transition-colors duration-100 ease-snap",
              active ? "bg-rush text-white" : "text-ink-2 hover:text-ink",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export { Segmented };
export type { SegmentedOption };
