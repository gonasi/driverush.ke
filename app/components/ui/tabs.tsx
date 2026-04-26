import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "~/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("inline-flex border-2 border-ink bg-surface", className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center gap-2 border-r-2 border-ink last:border-r-0",
        "px-4 py-2.5 font-display text-[12px] font-bold uppercase tracking-wider text-ink-2",
        "outline-none transition-colors duration-100 ease-snap",
        "hover:text-ink",
        "data-[state=active]:bg-ink data-[state=active]:text-paper",
        "focus-visible:bg-paper-3 focus-visible:text-ink data-[state=active]:focus-visible:bg-ink data-[state=active]:focus-visible:text-paper",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
