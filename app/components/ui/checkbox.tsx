import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02FreeIcons,
  MinusSignFreeIcons,
} from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer inline-flex size-[22px] shrink-0 items-center justify-center border-2 border-ink bg-surface",
        "shadow-stamp-sm outline-none transition-[transform,box-shadow,background] duration-100 ease-snap",
        "focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-rush data-[state=checked]:text-white",
        "data-[state=indeterminate]:bg-ink data-[state=indeterminate]:text-paper",
        "aria-invalid:shadow-stamp-rush aria-invalid:border-rush",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center"
      >
        {props.checked === "indeterminate" ? (
          <HugeiconsIcon icon={MinusSignFreeIcons} size={14} strokeWidth={3} />
        ) : (
          <HugeiconsIcon icon={Tick02FreeIcons} size={14} strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
