import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "~/lib/utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-2.5", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "peer inline-flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 border-ink bg-surface",
        "shadow-stamp-sm outline-none transition-[transform,box-shadow] duration-100 ease-snap",
        "focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-rush aria-invalid:shadow-stamp-rush",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex items-center justify-center"
      >
        <span className="size-2.5 rounded-full bg-rush" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
