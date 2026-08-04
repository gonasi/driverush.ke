/**
 * One of the three primary paths from the homepage launchpad: Train / Test /
 * Master. Brutalist box card with a voice-tinted icon tile, a one-line
 * description, and a metadata strip (estimated time + free). The full card is
 * a single click target.
 */
import { Link } from "react-router";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowRight02FreeIcons } from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils";

type Voice = "rush" | "amber" | "kenya-green" | "plate-blue" | "ink";

const VOICE_BG: Record<Voice, string> = {
  rush: "bg-rush text-white",
  amber: "bg-amber text-amber-foreground",
  "kenya-green": "bg-kenya-green text-kenya-green-foreground",
  "plate-blue": "bg-plate-blue text-plate-blue-foreground",
  ink: "bg-ink text-paper",
};

export function PathCard({
  to,
  voice,
  icon,
  eyebrow,
  title,
  description,
  metaLeft,
  metaRight = "Free",
  className,
}: {
  to: string;
  voice: Voice;
  icon: IconSvgElement;
  eyebrow: string;
  title: string;
  description: string;
  metaLeft: string;
  metaRight?: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group grid gap-3 border-2 border-ink bg-surface p-5 shadow-stamp outline-none transition-[transform,box-shadow] duration-100 ease-snap",
        "hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-lg",
        "focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex size-12 shrink-0 items-center justify-center border-2 border-ink",
            VOICE_BG[voice],
          )}
          aria-hidden="true"
        >
          <HugeiconsIcon icon={icon} size={22} strokeWidth={2.25} />
        </span>
        <HugeiconsIcon
          icon={ArrowRight02FreeIcons}
          size={18}
          strokeWidth={2.5}
          className="text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink"
        />
      </div>
      <div>
        <p className="m-0 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          {eyebrow}
        </p>
        <h3 className="m-0 mt-1.5 font-display text-[clamp(20px,2.4vw,26px)] font-extrabold uppercase leading-[1] tracking-tight text-ink">
          {title}
        </h3>
      </div>
      <p className="m-0 max-w-sm text-[14px] leading-snug text-ink-2">
        {description}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2 border-t border-line-soft pt-3 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        <span>{metaLeft}</span>
        <span>{metaRight}</span>
      </div>
    </Link>
  );
}
