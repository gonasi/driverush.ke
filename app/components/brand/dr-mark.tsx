import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

/* =============================================================
   DR mark family — the only sanctioned variants of the brand
   mark. Anything not on this page is a violation. New variants
   need brand sign-off and a new entry here before they ship.
   ============================================================= */

const drMarkVariants = cva(
  "inline-flex items-baseline font-display font-extrabold italic leading-none tracking-[-0.06em] select-none",
  {
    variants: {
      size: {
        xs: "text-2xl",
        sm: "text-4xl",
        md: "text-[56px]",
        lg: "text-[84px]",
        xl: "text-[120px]",
      },
      tone: {
        default: "[--dr-d:var(--ink)] [--dr-r:var(--rush)]",
        knockout: "[--dr-d:var(--paper)] [--dr-r:var(--paper)]",
        allred: "[--dr-d:var(--rush)] [--dr-r:var(--rush)]",
        allink: "[--dr-d:var(--ink)] [--dr-r:var(--ink)]",
        rushOnly: "[--dr-d:var(--ink)] [--dr-r:var(--rush)]",
      },
    },
    defaultVariants: { size: "md", tone: "default" },
  },
);

type DrMarkProps = React.ComponentProps<"span"> &
  VariantProps<typeof drMarkVariants>;

/** The DR monogram — italic D + R. Use for app icons, favicons, condensed lockups. */
function DrMark({ className, size, tone, ...props }: DrMarkProps) {
  return (
    <span
      data-slot="dr-mark"
      aria-label="DriveRush"
      className={cn(drMarkVariants({ size, tone }), className)}
      {...props}
    >
      <span style={{ color: "var(--dr-d)" }}>D</span>
      <span style={{ color: "var(--dr-r)" }}>R</span>
    </span>
  );
}

const drWordVariants = cva(
  "inline-block font-display font-extrabold italic uppercase leading-none tracking-[-0.04em] select-none",
  {
    variants: {
      size: {
        sm: "text-base",
        md: "text-2xl",
        lg: "text-4xl",
        xl: "text-6xl",
      },
      tone: {
        default: "[--dr-base:var(--ink)] [--dr-accent:var(--rush)]",
        knockout: "[--dr-base:var(--paper)] [--dr-accent:var(--paper)]",
        allink: "[--dr-base:var(--ink)] [--dr-accent:var(--ink)]",
      },
    },
    defaultVariants: { size: "md", tone: "default" },
  },
);

type DrWordmarkProps = React.ComponentProps<"span"> &
  VariantProps<typeof drWordVariants>;

/** Full DRIVE·RUSH wordmark. */
function DrWordmark({ className, size, tone, ...props }: DrWordmarkProps) {
  return (
    <span
      data-slot="dr-wordmark"
      aria-label="DriveRush"
      className={cn(drWordVariants({ size, tone }), className)}
      {...props}
    >
      <span style={{ color: "var(--dr-base)" }}>Drive</span>
      <span style={{ color: "var(--dr-accent)" }}>Rush</span>
    </span>
  );
}

/** Vertical lockup — mark over wordmark over tagline. */
function DrVertical({
  size = "md",
  tone = "default",
  tagline = "Learn · Drive · Succeed",
  className,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof drMarkVariants> & {
    tagline?: string;
  }) {
  return (
    <div
      data-slot="dr-vertical"
      className={cn(
        "inline-flex flex-col items-center gap-1.5 leading-none",
        className,
      )}
      {...props}
    >
      <DrMark size={size} tone={tone} />
      <DrWordmark
        size="sm"
        tone={tone === "knockout" ? "knockout" : "default"}
      />
      <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-3">
        {tagline}
      </span>
    </div>
  );
}

/** Circular EST · 2026 · KE stamp. Inherits color from `currentColor`. */
function DrStamp({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dr-stamp"
      aria-label="DriveRush stamp"
      className={cn(
        "relative flex size-24 flex-col items-center justify-center rounded-full border-[3px] border-current text-center",
        // The two side dots
        "before:absolute before:left-1.5 before:top-1/2 before:size-2 before:-translate-y-1/2 before:rounded-full before:border-2 before:border-current",
        "after:absolute after:right-1.5 after:top-1/2 after:size-2 after:-translate-y-1/2 after:rounded-full after:border-2 after:border-current",
        className,
      )}
      {...props}
    >
      <span className="font-display text-[32px] font-extrabold italic leading-none tracking-[-0.06em]">
        <span>D</span>
        <span className="text-rush">R</span>
      </span>
      <span className="mt-1 font-mono text-[7px] uppercase tracking-[0.3em]">
        EST · 2026 · KE
      </span>
    </div>
  );
}

/** Number-plate variant. KE · DR · 2026 on amber. */
function DrPlate({
  className,
  region = "KE",
  code = "DR",
  year = "2026",
  ...props
}: React.ComponentProps<"div"> & {
  region?: string;
  code?: string;
  year?: string;
}) {
  return (
    <div
      data-slot="dr-plate"
      aria-label={`DriveRush plate ${region} ${code} ${year}`}
      className={cn(
        "inline-flex items-center gap-1 border-2 border-ink bg-amber px-2.5 py-1.5 text-amber-foreground",
        "font-display text-xl font-extrabold tracking-wide",
        "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]",
        className,
      )}
      {...props}
    >
      <span>{region}</span>
      <span className="text-rush">·</span>
      <span>{code}</span>
      <span className="text-rush">·</span>
      <span>{year}</span>
    </div>
  );
}

/** Racing trim — speed-line bars next to the DR mark. */
function DrRacing({
  className,
  size = "md",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof drMarkVariants>) {
  return (
    <div
      data-slot="dr-racing"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <span className="block h-1 w-7 bg-rush" />
        <span className="block h-1 w-5 bg-ink" />
        <span className="block h-1 w-3 bg-rush" />
      </div>
      <DrMark size={size} />
    </div>
  );
}

export {
  DrMark,
  DrWordmark,
  DrVertical,
  DrStamp,
  DrPlate,
  DrRacing,
  drMarkVariants,
  drWordVariants,
};
