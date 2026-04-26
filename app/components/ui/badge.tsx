import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 border-2 border-ink",
    "font-mono text-[10.5px] font-bold uppercase leading-none tracking-widest",
    "px-2 py-1 select-none whitespace-nowrap",
    "[&_svg]:size-3 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-surface text-ink",
        rush: "bg-rush text-white",
        ink: "bg-ink text-paper",
        amber: "bg-amber text-ink",
        green: "bg-kenya-green text-white",
        cyan: "bg-route-cyan text-ink",
        magenta: "bg-magenta text-white",
        blue: "bg-plate-blue text-white",
        cream: "bg-cream text-ink",
        outline: "bg-transparent text-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  };

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="badge"
      data-variant={variant ?? "default"}
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
