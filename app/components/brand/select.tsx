import * as React from "react";

import { cn } from "~/lib/utils";

/**
 * Stamped native `<select>` — the same recipe as {@link Input}: 2px ink border,
 * soft-line shadow at rest, flips to a rush stamp + small nudge on focus. Keeps
 * the platform disclosure arrow. Set `aria-invalid` for the error state.
 */
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "block w-full min-w-0 cursor-pointer border-2 border-ink bg-surface px-3.5 py-2.5 text-[14.5px] font-medium text-ink",
        "shadow-[4px_4px_0_var(--line-soft)] outline-none transition-[transform,box-shadow] duration-100 ease-snap",
        "focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-invalid:bg-[color-mix(in_oklab,var(--rush)_6%,var(--surface))] aria-invalid:shadow-stamp-rush",
        className,
      )}
      {...props}
    />
  );
}

export { Select };
