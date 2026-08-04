/**
 * Themed banner above each unit's slice of the learning path. The theme token
 * (e.g. `kenya-green`, `plate-blue`) drives the bg + paired foreground. Shows
 * the unit number, title, and a compact progress chip (lessons complete /
 * total). Kept short so the path nodes below it remain the focal point.
 */
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02FreeIcons } from "@hugeicons/core-free-icons";

import type { UnitTheme } from "~/lib/course-types";
import { cn } from "~/lib/utils";

export const UNIT_THEME_CLASSES: Record<UnitTheme, string> = {
  "kenya-green": "bg-kenya-green text-kenya-green-foreground",
  "kenya-gold": "bg-kenya-gold text-kenya-gold-foreground",
  "plate-blue": "bg-plate-blue text-plate-blue-foreground",
  amber: "bg-amber text-amber-foreground",
  rush: "bg-rush text-white",
  "route-cyan": "bg-route-cyan text-route-cyan-foreground",
  magenta: "bg-magenta text-magenta-foreground",
  olive: "bg-olive text-white",
};

export function UnitHeader({
  number,
  title,
  theme,
  lessonsComplete,
  lessonsTotal,
}: {
  number: number;
  title: string;
  theme: UnitTheme;
  lessonsComplete: number;
  lessonsTotal: number;
}) {
  const allDone = lessonsTotal > 0 && lessonsComplete === lessonsTotal;
  return (
    <header
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-2 border-ink px-5 py-4 shadow-stamp-sm",
        UNIT_THEME_CLASSES[theme],
      )}
    >
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] uppercase tracking-widest opacity-80 tabular-nums">
          Unit {String(number).padStart(2, "0")}
        </span>
        <h2 className="m-0 font-display text-[clamp(20px,3vw,28px)] font-extrabold uppercase leading-none tracking-tight">
          {title}
        </h2>
      </div>
      <span className="inline-flex items-center gap-1.5 border-2 border-current bg-transparent px-2 py-1 font-mono text-[10.5px] font-bold uppercase tracking-widest tabular-nums">
        {allDone && (
          <HugeiconsIcon
            icon={CheckmarkCircle02FreeIcons}
            size={12}
            strokeWidth={2.75}
          />
        )}
        {lessonsComplete} / {lessonsTotal} done
      </span>
    </header>
  );
}
