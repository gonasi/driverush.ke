import * as React from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { AlertCircleFreeIcons } from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils";

type CalloutProps = React.ComponentProps<"div"> & {
  icon?: IconSvgElement;
  iconLabel?: string;
};

/** Cream highlight box with an ink icon stamp — for guidance copy. */
function Callout({
  className,
  icon = AlertCircleFreeIcons,
  iconLabel,
  children,
  ...props
}: CalloutProps) {
  return (
    <div
      data-slot="callout"
      className={cn(
        "grid grid-cols-[auto_1fr] items-center gap-4 border-2 border-ink bg-cream px-5 py-4",
        className,
      )}
      {...props}
    >
      <span
        aria-label={iconLabel}
        className="flex size-14 items-center justify-center border-2 border-ink bg-ink text-cream"
      >
        <HugeiconsIcon icon={icon} size={26} strokeWidth={2.5} />
      </span>
      <div className="font-serif text-lg leading-snug text-ink">{children}</div>
    </div>
  );
}

export { Callout };
