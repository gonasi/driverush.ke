import * as React from "react";
import { Link } from "react-router";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowRight02FreeIcons } from "@hugeicons/core-free-icons";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const accentBg = {
  rush: "bg-rush text-white",
  ink: "bg-ink text-paper",
  amber: "bg-amber text-ink",
  green: "bg-kenya-green text-white",
  blue: "bg-plate-blue text-white",
  cyan: "bg-route-cyan text-ink",
} as const;

const tileVariants = cva(
  [
    "group/tile relative flex h-full w-full flex-col items-start gap-3 border-2 border-ink bg-surface p-5 text-left",
    "outline-none transition-[transform,box-shadow] duration-100 ease-snap",
    "shadow-stamp hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-lg",
    "active:translate-x-[3px] active:translate-y-[3px] active:shadow-stamp-sm",
    "focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush",
  ].join(" "),
  {
    variants: {
      density: { default: "min-h-44 sm:min-h-52", compact: "min-h-36" },
    },
    defaultVariants: { density: "default" },
  },
);

type QuickActionProps = Omit<React.ComponentProps<"a">, "title"> &
  VariantProps<typeof tileVariants> & {
    /** Internal route path. */
    to: string;
    /** Hugeicons icon for the stamp block. */
    icon: IconSvgElement;
    /** Tile title — short, action-oriented. */
    title: React.ReactNode;
    /** One-line description below the title. */
    copy: React.ReactNode;
    /** Right-side meta tag, e.g. "5 questions". */
    meta?: React.ReactNode;
    /** Accent color for the icon stamp. */
    accent?: keyof typeof accentBg;
  };

/**
 * Action tile for the homepage quick-action grid. Large tap target, stamp
 * shadow that lifts on hover and presses on active. Wraps a React Router
 * <Link> for client-side navigation.
 */
function QuickAction({
  to,
  icon,
  title,
  copy,
  meta,
  accent = "rush",
  density,
  className,
  ...props
}: QuickActionProps) {
  return (
    <Link
      to={to}
      data-slot="quick-action"
      data-accent={accent}
      className={cn(tileVariants({ density }), className)}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-12 items-center justify-center border-2 border-ink",
          accentBg[accent],
        )}
      >
        <HugeiconsIcon icon={icon} size={22} strokeWidth={2.25} />
      </span>

      <span className="font-display text-[18px] font-extrabold uppercase tracking-tight text-ink">
        {title}
      </span>
      <span className="text-[13px] leading-relaxed text-ink-3">{copy}</span>

      <span className="mt-auto flex w-full items-center justify-between pt-2">
        {meta ? (
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            {meta}
          </span>
        ) : (
          <span />
        )}
        <span
          aria-hidden
          className="flex size-8 items-center justify-center border-2 border-ink bg-paper-3 text-ink transition-colors group-hover/tile:bg-ink group-hover/tile:text-paper"
        >
          <HugeiconsIcon
            icon={ArrowRight02FreeIcons}
            size={14}
            strokeWidth={2.5}
          />
        </span>
      </span>
    </Link>
  );
}

export { QuickAction };
