import * as React from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const separatorVariants = cva("shrink-0 bg-ink", {
  variants: {
    weight: {
      thin: "data-[orientation=horizontal]:h-px data-[orientation=vertical]:w-px",
      bold: "data-[orientation=horizontal]:h-0.5 data-[orientation=vertical]:w-0.5",
    },
    style: {
      solid: "",
      // Render as a CSS background since Radix gives us a div, not an <hr>.
      dashed:
        "bg-transparent data-[orientation=horizontal]:bg-[repeating-linear-gradient(to_right,var(--ink)_0_6px,transparent_6px_10px)] data-[orientation=vertical]:bg-[repeating-linear-gradient(to_bottom,var(--ink)_0_6px,transparent_6px_10px)]",
    },
  },
  defaultVariants: {
    weight: "bold",
    style: "solid",
  },
});

type SeparatorProps = React.ComponentProps<typeof SeparatorPrimitive.Root> &
  VariantProps<typeof separatorVariants>;

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  weight,
  style,
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        separatorVariants({ weight, style }),
        "data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
