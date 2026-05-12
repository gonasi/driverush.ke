import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "~/lib/utils";

const choiceVariants = cva(
  [
    "relative grid w-full grid-cols-[44px_1fr_auto] items-center gap-3.5 border-2 border-ink bg-surface px-4 py-3.5 text-left",
    "font-medium text-[14.5px] text-ink",
    "transition-[transform,box-shadow,background] duration-100 ease-snap",
    "outline-none focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush",
  ].join(" "),
  {
    variants: {
      state: {
        idle: "hover:shadow-stamp-sm hover:-translate-x-px hover:-translate-y-px",
        selected: "shadow-stamp-sm -translate-x-px -translate-y-px",
        correct:
          "bg-[color-mix(in_oklab,var(--kenya-green)_14%,var(--surface))]",
        wrong: "bg-[color-mix(in_oklab,var(--rush)_14%,var(--surface))]",
        disabled: "opacity-60 pointer-events-none",
      },
    },
    defaultVariants: { state: "idle" },
  },
);

const keyVariants = cva(
  "inline-flex size-9 items-center justify-center border-2 border-ink font-display text-sm font-extrabold",
  {
    variants: {
      state: {
        idle: "bg-paper-3 text-ink",
        selected: "bg-ink text-paper",
        correct: "bg-kenya-green text-kenya-green-foreground",
        wrong: "bg-rush text-white",
        disabled: "bg-paper-3 text-ink-3",
      },
    },
    defaultVariants: { state: "idle" },
  },
);

type ChoiceCardProps = Omit<React.ComponentProps<"button">, "onSelect"> &
  VariantProps<typeof choiceVariants> & {
    /** Letter or number shown in the key block. */
    keyLabel: React.ReactNode;
    /** Right-side meta — % picked, ✓/✕ correctness, etc. */
    meta?: React.ReactNode;
    /** Render as another element (e.g. <label>). */
    asChild?: boolean;
  };

/**
 * Quiz answer card. Letter key + label + optional meta. State drives the
 * key color and background tint: idle / selected / correct / wrong / disabled.
 */
function ChoiceCard({
  className,
  state,
  keyLabel,
  meta,
  asChild = false,
  children,
  ...props
}: ChoiceCardProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      type={asChild ? undefined : "button"}
      data-slot="choice-card"
      data-state={state ?? "idle"}
      className={cn(choiceVariants({ state }), className)}
      {...props}
    >
      <span className={keyVariants({ state })} aria-hidden>
        {keyLabel}
      </span>
      <span className="min-w-0">{children}</span>
      {meta && (
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
          {meta}
        </span>
      )}
    </Comp>
  );
}

export { ChoiceCard, choiceVariants };
