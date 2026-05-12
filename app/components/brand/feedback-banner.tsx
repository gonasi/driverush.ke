import * as React from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Tick02FreeIcons, Cancel01FreeIcons } from "@hugeicons/core-free-icons";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const bannerVariants = cva(
  "grid grid-cols-[64px_1fr_auto] items-center gap-3.5 border-2 border-ink px-4 py-3.5",
  {
    variants: {
      tone: {
        win: "bg-kenya-green text-kenya-green-foreground",
        fail: "bg-rush text-white",
        info: "bg-plate-blue text-plate-blue-foreground",
        neutral: "bg-surface text-ink",
      },
    },
    defaultVariants: { tone: "win" },
  },
);

const iconBoxVariants = cva(
  "flex size-14 items-center justify-center border-2 border-ink",
  {
    variants: {
      tone: {
        win: "bg-paper text-kenya-green",
        fail: "bg-paper text-rush",
        info: "bg-paper text-plate-blue",
        neutral: "bg-paper-3 text-ink",
      },
    },
    defaultVariants: { tone: "win" },
  },
);

const defaultIcon: Record<
  NonNullable<VariantProps<typeof bannerVariants>["tone"]>,
  IconSvgElement
> = {
  win: Tick02FreeIcons,
  fail: Cancel01FreeIcons,
  info: Tick02FreeIcons,
  neutral: Tick02FreeIcons,
};

type FeedbackBannerProps = Omit<React.ComponentProps<"div">, "title"> &
  VariantProps<typeof bannerVariants> & {
    /** Override the default icon. */
    icon?: IconSvgElement;
    /** Banner heading (e.g. "SAWA SAWA · CORRECT"). */
    title: React.ReactNode;
    /** Sub copy. */
    description?: React.ReactNode;
    /** Trailing CTA — typically a Button. */
    action?: React.ReactNode;
  };

/** Full-width win/fail banner with a stamped icon block and optional CTA. */
function FeedbackBanner({
  className,
  tone,
  icon,
  title,
  description,
  action,
  ...props
}: FeedbackBannerProps) {
  const t = tone ?? "win";
  return (
    <div
      role="status"
      data-slot="feedback-banner"
      data-tone={t}
      className={cn(bannerVariants({ tone }), className)}
      {...props}
    >
      <span className={cn(iconBoxVariants({ tone }))} aria-hidden>
        <HugeiconsIcon
          icon={icon ?? defaultIcon[t]}
          size={26}
          strokeWidth={2.5}
        />
      </span>
      <div className="min-w-0">
        <p className="m-0 font-display text-lg font-extrabold uppercase tracking-wide">
          {title}
        </p>
        {description && (
          <p className="m-0 mt-0.5 text-[13px] opacity-90">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export { FeedbackBanner };
