import * as React from "react";

import { cn } from "~/lib/utils";

/**
 * Racing pinstripe rail — repeating ink dashes with a 5-color flag bar
 * beneath. Used at page top and as a section divider.
 */
function Rail({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="presentation"
      aria-hidden
      data-slot="rail"
      className={cn(
        "relative h-7 w-full border-b-2 border-ink",
        "bg-[repeating-linear-gradient(90deg,var(--ink)_0_14px,transparent_14px_26px)]",
        // The 5-color flag underbar that hangs under the rail
        "after:absolute after:left-0 after:right-0 after:-bottom-2 after:h-2",
        "after:bg-[linear-gradient(90deg,var(--rush)_0_20%,var(--ink)_20%_40%,var(--paper-3)_40%_60%,var(--kenya-green)_60%_80%,var(--amber)_80%_100%)]",
        className,
      )}
      {...props}
    />
  );
}

export { Rail };
