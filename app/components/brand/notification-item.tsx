import * as React from "react";

import { cn } from "~/lib/utils";

type NotifTone = "rush" | "amber" | "green" | "blue" | "ink";

const ICON_BG: Record<NotifTone, string> = {
  rush: "bg-rush text-white",
  amber: "bg-amber text-amber-foreground",
  green: "bg-kenya-green text-kenya-green-foreground",
  blue: "bg-plate-blue text-plate-blue-foreground",
  ink: "bg-ink text-paper",
};

type NotificationItemProps = React.ComponentProps<"div"> & {
  /** Icon glyph — !, ★, ✓, an SVG, etc. */
  icon: React.ReactNode;
  /** Tint on the stamped icon block. */
  tone?: NotifTone;
  /** Headline. */
  title: React.ReactNode;
  /** Sub copy. */
  description?: React.ReactNode;
  /** Right-aligned mono timestamp, e.g. "04 H", "2 D". */
  timestamp?: React.ReactNode;
  /** Render as unread — rush-tinted background + a dot on the left edge. */
  unread?: boolean;
};

/** Inbox notification row — stamped icon block, title/sub, timestamp. */
function NotificationItem({
  className,
  icon,
  tone = "rush",
  title,
  description,
  timestamp,
  unread,
  ...props
}: NotificationItemProps) {
  return (
    <div
      data-slot="notification-item"
      data-unread={unread || undefined}
      className={cn(
        "relative grid grid-cols-[56px_1fr_auto] items-start gap-3.5 border-2 border-ink bg-surface px-4 py-3.5",
        unread && "bg-[color-mix(in_oklab,var(--rush)_8%,var(--surface))]",
        className,
      )}
      {...props}
    >
      {unread && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rush"
        />
      )}
      <span
        className={cn(
          "flex size-14 items-center justify-center border-2 border-ink font-display text-[22px] font-extrabold",
          ICON_BG[tone],
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="font-display text-sm font-extrabold uppercase tracking-[0.04em]">
          {title}
        </div>
        {description != null && (
          <div className="mt-1 text-[13px] leading-snug text-ink-3">
            {description}
          </div>
        )}
      </div>
      {timestamp != null && (
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
          {timestamp}
        </span>
      )}
    </div>
  );
}

/** Stacks notification rows with the standard gap. */
function NotificationList({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="notification-list"
      className={cn("grid gap-2.5", className)}
      {...props}
    />
  );
}

export { NotificationItem, NotificationList };
export type { NotifTone };
