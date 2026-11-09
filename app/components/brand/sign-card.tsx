import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Icon } from "~/components/brand/icon";
import type { IconDef } from "~/components/brand/icons";
import { SignIcon } from "~/components/brand/art/sign-glyphs";

import { cn } from "~/lib/utils";

const signFrameVariants = cva(
  "flex size-28 shrink-0 items-center justify-center border-2 border-ink",
  {
    variants: {
      shape: {
        square: "",
        circle: "rounded-full",
        // Octagon (Stop). clip-path approximation.
        octagon: "",
        triangle: "",
        diamond: "rotate-45",
      },
      tone: {
        rush: "bg-rush text-white",
        amber: "bg-amber text-amber-foreground",
        blue: "bg-plate-blue text-plate-blue-foreground",
        green: "bg-kenya-green text-kenya-green-foreground",
        white: "bg-white text-ink-900",
        ink: "bg-ink text-paper",
      },
    },
    compoundVariants: [
      {
        shape: "octagon",
        className:
          "[clip-path:polygon(30%_0,70%_0,100%_30%,100%_70%,70%_100%,30%_100%,0_70%,0_30%)]",
      },
      {
        shape: "triangle",
        className: "[clip-path:polygon(50%_0,100%_100%,0_100%)]",
      },
    ],
    defaultVariants: { shape: "square", tone: "rush" },
  },
);

type SignCardProps = Omit<React.ComponentProps<"figure">, "title"> &
  VariantProps<typeof signFrameVariants> & {
    /** Icon for the sign. One with a `sign` twin renders as the real sign. */
    icon: IconDef;
    /** Caption — primary name (e.g. "Mandatory · Stop"). */
    name: React.ReactNode;
    /** Sub caption — classification (e.g. "Octagon · 200 mm"). */
    classification?: React.ReactNode;
    /** Override the icon's pixel size. */
    iconSize?: number;
  };

/**
 * Bordered sign reference card. Hugeicons-based sign sits inside a colored
 * frame (Stop = rush octagon, Warning = amber triangle, Info = blue circle,
 * Mandatory = blue circle, etc.). Caption + classification under the frame.
 */
function SignCard({
  className,
  shape,
  tone,
  icon,
  name,
  classification,
  iconSize = 56,
  ...props
}: SignCardProps) {
  // Triangles get the icon translated down so it sits in the lower half.
  const iconOffset = shape === "triangle" ? "translate-y-3" : "";
  const iconRotate = shape === "diamond" ? "-rotate-45" : "";

  return (
    <figure
      data-slot="sign-card"
      className={cn(
        "flex flex-col items-center gap-3 border-2 border-ink bg-surface px-5 py-6 text-center",
        className,
      )}
      {...props}
    >
      {icon.sign ? (
        <div className="flex size-28 shrink-0 items-center justify-center">
          <SignIcon name={icon.sign} size={iconSize * 2} />
        </div>
      ) : (
        <div className={cn(signFrameVariants({ shape, tone }))}>
          <Icon
            icon={icon}
            size={iconSize}
            className={cn(iconOffset, iconRotate)}
          />
        </div>
      )}
      <figcaption className="space-y-1">
        <div className="font-display text-[13px] font-extrabold uppercase tracking-wide text-ink">
          {name}
        </div>
        {classification && (
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
            {classification}
          </div>
        )}
      </figcaption>
    </figure>
  );
}

export { SignCard, signFrameVariants };
