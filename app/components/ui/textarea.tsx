import * as React from "react";

import { cn } from "~/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full resize-y border-2 border-ink bg-surface px-3.5 py-2.5 text-[14.5px] font-medium text-ink",
        "shadow-[4px_4px_0_var(--line-soft)] outline-none transition-[transform,box-shadow] duration-100 ease-snap",
        "placeholder:text-ink-4 placeholder:font-normal",
        "selection:bg-rush selection:text-white",
        "focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush",
        "disabled:pointer-events-none disabled:opacity-50",
        "aria-invalid:bg-[color-mix(in_oklab,var(--rush)_6%,var(--surface))] aria-invalid:shadow-stamp-rush",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
