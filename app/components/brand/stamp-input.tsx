import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const prefixVariants = cva(
  "flex items-center justify-center border-r-2 border-ink px-3.5 font-display text-base font-extrabold",
  {
    variants: {
      tone: {
        ink: "bg-ink text-paper",
        rush: "bg-rush text-white",
        amber: "bg-amber text-ink",
        green: "bg-kenya-green text-white",
        blue: "bg-plate-blue text-white",
      },
    },
    defaultVariants: { tone: "ink" },
  },
);

type StampInputProps = React.ComponentProps<"input"> & {
  /** Block content rendered to the left of the input (e.g. "+254", "B"). */
  prefix: React.ReactNode;
  /** Tone of the prefix block. */
  prefixTone?: VariantProps<typeof prefixVariants>["tone"];
  /** Right-side suffix block (e.g. "VERIFY", "CHANGE", "KES"). */
  suffix?: React.ReactNode;
  wrapperClassName?: string;
  inputClassName?: string;
};

/** Input with a prefix stamp block — used for phone (+254), category (B), KES, etc. */
function StampInput({
  prefix,
  prefixTone,
  suffix,
  className,
  wrapperClassName,
  inputClassName,
  ...props
}: StampInputProps) {
  return (
    <div
      data-slot="stamp-input"
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-stretch border-2 border-ink bg-surface",
        "shadow-[4px_4px_0_var(--line-soft)] transition-[transform,box-shadow] duration-100 ease-snap",
        "focus-within:-translate-x-px focus-within:-translate-y-px focus-within:shadow-stamp-rush",
        wrapperClassName,
        className,
      )}
    >
      <span className={prefixVariants({ tone: prefixTone })}>{prefix}</span>
      <input
        className={cn(
          "border-0 bg-transparent px-3.5 py-3 text-[14.5px] font-medium text-ink outline-none",
          "placeholder:text-ink-4",
          inputClassName,
        )}
        {...props}
      />
      {suffix && (
        <span className="flex items-center border-l-2 border-ink bg-paper-3 px-3 font-mono text-[11px] font-bold uppercase tracking-wide text-ink-3">
          {suffix}
        </span>
      )}
    </div>
  );
}

export { StampInput };
