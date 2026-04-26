import * as React from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Folder01FreeIcons } from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils";

type EmptyStateProps = React.ComponentProps<"div"> & {
  icon?: IconSvgElement;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

/** Dashed-border empty state with a circular icon glyph. */
function EmptyState({
  className,
  icon = Folder01FreeIcons,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-3 border-2 border-dashed border-ink bg-surface px-6 py-7 text-center",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="flex size-14 items-center justify-center rounded-full border-2 border-ink bg-paper-3 text-ink"
      >
        <HugeiconsIcon icon={icon} size={24} strokeWidth={2.25} />
      </span>
      <p className="font-display text-base font-extrabold uppercase tracking-wide text-ink">
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-[13px] text-ink-3">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { EmptyState };
