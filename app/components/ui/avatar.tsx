import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const avatarVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center overflow-visible",
    "border-2 border-ink shadow-stamp-sm",
    "font-display font-extrabold text-ink",
  ].join(" "),
  {
    variants: {
      tone: {
        cream: "bg-cream text-ink",
        rush: "bg-rush text-white",
        ink: "bg-ink text-paper",
        green: "bg-kenya-green text-white",
        blue: "bg-plate-blue text-white",
        amber: "bg-amber text-ink",
        cyan: "bg-route-cyan text-ink",
        magenta: "bg-magenta text-white",
        paper: "bg-surface text-ink",
      },
      size: {
        sm: "size-8 text-xs shadow-stamp-xs",
        default: "size-11 text-base",
        lg: "size-16 text-[22px] shadow-stamp",
      },
    },
    defaultVariants: { tone: "cream", size: "default" },
  },
);

type AvatarProps = React.ComponentProps<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants>;

function Avatar({ className, tone, size, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-tone={tone ?? "cream"}
      data-size={size ?? "default"}
      className={cn(avatarVariants({ tone, size }), className)}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("size-full object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center leading-none",
        className,
      )}
      {...props}
    />
  );
}

function AvatarStatus({
  className,
  tone = "green",
  ...props
}: React.ComponentProps<"span"> & {
  tone?: "green" | "amber" | "rush" | "ink";
}) {
  const toneClass = {
    green: "bg-kenya-green",
    amber: "bg-amber",
    rush: "bg-rush",
    ink: "bg-ink",
  }[tone];
  return (
    <span
      data-slot="avatar-status"
      className={cn(
        "absolute -bottom-0.5 -right-0.5 size-3 border-2 border-ink",
        toneClass,
        className,
      )}
      {...props}
    />
  );
}

function AvatarStack({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-stack"
      className={cn("inline-flex [&_>*+*]:-ml-2.5", className)}
      {...props}
    />
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarStatus,
  AvatarStack,
  avatarVariants,
};
