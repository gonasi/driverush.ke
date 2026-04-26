import * as React from "react";

import { cn } from "~/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Stamped, bordered. Soft-line shadow at rest; flips to rush + small
        // translation on focus — the lane-change moment.
        "flex h-11 w-full min-w-0 border-2 border-ink bg-surface px-3.5 py-2.5 text-[14.5px] font-medium text-ink",
        "shadow-[4px_4px_0_var(--line-soft)] outline-none transition-[transform,box-shadow] duration-100 ease-snap",
        "placeholder:text-ink-4 placeholder:font-normal",
        "selection:bg-rush selection:text-white",
        "focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush",
        "disabled:pointer-events-none disabled:opacity-50",
        // Invalid state — react-hook-form / aria
        "aria-invalid:bg-[color-mix(in_oklab,var(--rush)_6%,var(--surface))] aria-invalid:shadow-stamp-rush",
        // File inputs need a different baseline
        "file:mr-3 file:border-0 file:bg-transparent file:text-[13px] file:font-display file:font-bold file:uppercase file:tracking-wider file:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
