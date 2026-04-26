import * as React from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

import { cn } from "~/lib/utils";

function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        "inline-flex gap-[3px] border-2 border-ink bg-paper-3 p-[3px]",
        className,
      )}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 px-3.5 py-2",
        "font-mono text-[11px] font-bold uppercase tracking-wider text-ink-2",
        "outline-none transition-colors duration-100 ease-snap",
        "hover:text-ink",
        "data-[state=on]:bg-rush data-[state=on]:text-white",
        "focus-visible:bg-surface focus-visible:text-ink data-[state=on]:focus-visible:bg-rush data-[state=on]:focus-visible:text-white",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:size-3.5 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
