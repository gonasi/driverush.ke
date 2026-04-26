import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  HugeiconsIcon,
  type HugeiconsProps,
  type IconSvgElement,
} from "@hugeicons/react";
import {
  InformationCircleFreeIcons,
  AlertCircleFreeIcons,
  Cancel01FreeIcons,
  Tick02FreeIcons,
} from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils";

const alertVariants = cva(
  "grid grid-cols-[48px_1fr_auto] items-center gap-3.5 border-2 border-ink px-4 py-3.5 shadow-stamp",
  {
    variants: {
      variant: {
        info: "bg-[color-mix(in_oklab,var(--plate-blue)_8%,var(--surface))]",
        warn: "bg-[color-mix(in_oklab,var(--amber)_14%,var(--surface))]",
        error: "bg-[color-mix(in_oklab,var(--rush)_10%,var(--surface))]",
        ok: "bg-[color-mix(in_oklab,var(--kenya-green)_12%,var(--surface))]",
        neutral: "bg-surface",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

const iconBoxVariants = cva(
  "flex size-11 items-center justify-center border-2 border-ink",
  {
    variants: {
      variant: {
        info: "bg-plate-blue text-white",
        warn: "bg-amber text-ink",
        error: "bg-rush text-white",
        ok: "bg-kenya-green text-white",
        neutral: "bg-paper-3 text-ink",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

const defaultIcon: Record<
  NonNullable<VariantProps<typeof alertVariants>["variant"]>,
  IconSvgElement
> = {
  info: InformationCircleFreeIcons,
  warn: AlertCircleFreeIcons,
  error: Cancel01FreeIcons,
  ok: Tick02FreeIcons,
  neutral: InformationCircleFreeIcons,
};

type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    icon?: HugeiconsProps["icon"];
  };

function Alert({ className, variant, icon, children, ...props }: AlertProps) {
  const v = variant ?? "neutral";
  return (
    <div
      role="alert"
      data-slot="alert"
      data-variant={v}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <span className={cn(iconBoxVariants({ variant }))} aria-hidden>
        <HugeiconsIcon
          icon={icon ?? defaultIcon[v]}
          size={20}
          strokeWidth={2.5}
        />
      </span>
      {children}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-title"
      className={cn(
        "font-display text-[14px] font-extrabold uppercase tracking-wide text-ink",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-description"
      className={cn("text-[13px] leading-relaxed text-ink-2", className)}
      {...props}
    />
  );
}

function AlertBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-body"
      className={cn("min-w-0", className)}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="alert-action"
      className={cn(
        "border-2 border-ink bg-transparent px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink",
        "outline-none transition-colors duration-100 hover:bg-ink hover:text-paper",
        "focus-visible:bg-ink focus-visible:text-paper",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertBody, AlertAction };
