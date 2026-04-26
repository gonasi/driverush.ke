import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "~/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center border-2 border-ink",
        "shadow-stamp-sm outline-none transition-[background] duration-150 ease-snap",
        "bg-paper-3 data-[state=checked]:bg-kenya-green",
        "focus-visible:shadow-stamp-rush",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-[22px] bg-ink",
          "transition-transform duration-150 ease-snap",
          "translate-x-px",
          "data-[state=checked]:translate-x-[28px] data-[state=checked]:bg-white",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
