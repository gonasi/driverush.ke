import * as React from "react";

import { cn } from "~/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "h-3.5 border-2 border-line-soft",
        "bg-[linear-gradient(90deg,var(--paper-3)_0%,var(--paper-2)_50%,var(--paper-3)_100%)]",
        "bg-[length:200%_100%]",
        "animate-[dr-shimmer_1.4s_linear_infinite]",
        className,
      )}
      style={{
        // Define the keyframes inline so Skeleton works without extra Tailwind
        // config plumbing. Names are namespaced (dr-) to avoid collisions.
        ...(props.style ?? {}),
      }}
      {...props}
    />
  );
}

export { Skeleton };
