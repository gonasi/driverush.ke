import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  [
    // Base — stamped, bordered, Sora caps. Press recipe in CSS so any
    // <button> or [role=button] gets the lane-change tactile feel without JS.
    "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap select-none",
    "border-2 border-ink font-display font-extrabold uppercase tracking-wider",
    "bg-clip-padding outline-none transition-[transform,box-shadow] duration-75 ease-snap",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rush",
    "active:translate-x-[3px] active:translate-y-[3px]",
    "disabled:pointer-events-none disabled:cursor-default disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary action — red, white type
        rush: "bg-rush text-white shadow-stamp active:shadow-stamp-sm",
        // Confirming neutral action — ink block, paper type
        ink: "bg-ink text-paper shadow-stamp active:shadow-stamp-sm",
        // Cautionary, save-for-later
        amber: "bg-amber text-ink shadow-stamp active:shadow-stamp-sm",
        // Pass / sawa / success
        green: "bg-kenya-green text-white shadow-stamp active:shadow-stamp-sm",
        // Quiet outline default
        paper: "bg-surface text-ink shadow-stamp active:shadow-stamp-sm",
        // No border, no shadow — for in-text cancel / skip
        ghost:
          "border-transparent bg-transparent text-ink hover:bg-paper-3 active:translate-x-0 active:translate-y-0",
        // Inline link styling
        link: "border-transparent bg-transparent text-rush underline-offset-4 hover:underline normal-case tracking-normal active:translate-x-0 active:translate-y-0",
      },
      size: {
        sm: "h-8 px-3.5 text-[11px] shadow-stamp-sm active:shadow-stamp-xs",
        default: "h-11 px-5 text-[13px]",
        lg: "h-14 px-7 text-[15px] shadow-stamp-lg active:shadow-stamp",
        // Circular icon stamp
        stamp:
          "size-14 rounded-full p-0 text-lg [&_svg]:size-5 active:shadow-stamp-sm",
        "stamp-sm":
          "size-10 rounded-full p-0 text-base [&_svg]:size-4 shadow-stamp-sm active:shadow-stamp-xs",
      },
    },
    compoundVariants: [
      // sm + ghost/link shouldn't carry shadow utilities from sm
      { variant: "ghost", size: "sm", className: "shadow-none" },
      { variant: "link", size: "sm", className: "shadow-none" },
      { variant: "ghost", size: "lg", className: "shadow-none" },
      { variant: "link", size: "lg", className: "shadow-none" },
    ],
    defaultVariants: {
      variant: "paper",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "paper"}
      data-size={size ?? "default"}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
