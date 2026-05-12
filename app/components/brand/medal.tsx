import * as React from "react";

import { cn } from "~/lib/utils";

type MedalTone = "rush" | "gold" | "green" | "blue";

// Domed-disc fills — a soft top-left highlight melting into the brand colour.
// Kept as inline CSS strings (like Tach's conic dials) rather than arbitrary
// Tailwind values so the color-mix() reads cleanly.
const MEDAL_FILL: Record<MedalTone, { bg: string; fg: string }> = {
  rush: {
    bg: "radial-gradient(circle at 30% 30%, color-mix(in oklab, white 30%, var(--rush)), var(--rush) 70%)",
    fg: "#fff",
  },
  gold: {
    bg: "radial-gradient(circle at 30% 30%, color-mix(in oklab, white 40%, var(--amber)), var(--amber) 70%)",
    fg: "var(--ink)",
  },
  green: {
    bg: "radial-gradient(circle at 30% 30%, color-mix(in oklab, white 30%, var(--kenya-green)), var(--kenya-green) 70%)",
    fg: "#fff",
  },
  blue: {
    bg: "radial-gradient(circle at 30% 30%, color-mix(in oklab, white 30%, var(--plate-blue)), var(--plate-blue) 70%)",
    fg: "#fff",
  },
};

const RIBBON_BG: Record<MedalTone, string> = {
  rush: "bg-rush",
  gold: "bg-amber",
  green: "bg-kenya-green",
  blue: "bg-plate-blue",
};

type MedalProps = React.ComponentProps<"div"> & {
  /** Centre glyph — a letter, ★, ✓, etc. */
  glyph: React.ReactNode;
  /** Mono caption under the ribbon. Use `<br/>` for two lines. */
  label?: React.ReactNode;
  tone?: MedalTone;
};

/** Achievement medal — domed disc with a notched ribbon and a mono caption. */
function Medal({
  className,
  glyph,
  label,
  tone = "rush",
  ...props
}: MedalProps) {
  const fill = MEDAL_FILL[tone];
  return (
    <div
      data-slot="medal"
      data-tone={tone}
      className={cn("inline-flex w-24 flex-col items-center", className)}
      {...props}
    >
      <span
        className="relative z-[1] flex size-[88px] items-center justify-center rounded-full border-4 border-ink font-display text-[32px] font-extrabold italic shadow-[4px_4px_0_var(--ink)]"
        style={{ background: fill.bg, color: fill.fg }}
      >
        {glyph}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative z-0 -mt-2 h-[22px] w-[60px] border-2 border-ink [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)]",
          RIBBON_BG[tone],
        )}
      />
      {label != null && (
        <span className="mt-1 text-center font-mono text-[10px] uppercase leading-tight tracking-wider text-ink-3">
          {label}
        </span>
      )}
    </div>
  );
}

/** Flex wrapper that lays a row of <Medal>s out with consistent gaps. */
function MedalGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="medal-grid"
      className={cn("flex flex-wrap gap-3.5", className)}
      {...props}
    />
  );
}

export { Medal, MedalGrid };
export type { MedalTone };
