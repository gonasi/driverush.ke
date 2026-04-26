import * as React from "react";

import { cn } from "~/lib/utils";

const SOURCES = {
  main: "/images/driverush-logo-main.png", // Full lockup. White background — light surfaces only.
  plain: "/images/driverush-logo-plain.png", // DR monogram. Transparent — safe on any colour.
} as const;

const ALT = {
  main: "DriveRush",
  plain: "DriveRush",
} as const;

// Both source files are 1536×1024 = 3:2.
const ASPECT = 1.5;

type LogoProps = Omit<
  React.ComponentProps<"img">,
  "src" | "width" | "height" | "alt"
> & {
  /** "main" = full lockup with wordmark + tagline. "plain" = DR monogram only. */
  variant?: "main" | "plain";
  /** Height in pixels. Width auto-computed from the 3:2 aspect ratio. */
  height?: number;
  /**
   * Inverts ink → paper for use on dark surfaces. The red R turns paper too —
   * accept that trade-off; the alternative would be a separate dark-mode asset.
   */
  knockout?: boolean;
  /** Mark as LCP / eager load — set on hero / above-the-fold uses. */
  priority?: boolean;
  /** Override the default "DriveRush" alt text. */
  alt?: string;
};

/**
 * The official DriveRush logo. Always prefer this over CSS-drawn marks for
 * brand placements (nav, footer, marketing pages). Use `variant="plain"` for
 * tight slots and dark surfaces; `variant="main"` for the full lockup on
 * light backgrounds.
 */
function Logo({
  variant = "plain",
  height = variant === "main" ? 80 : 36,
  knockout = false,
  priority = false,
  alt,
  className,
  style,
  ...props
}: LogoProps) {
  const width = Math.round(height * ASPECT);
  return (
    <img
      src={SOURCES[variant]}
      alt={alt ?? ALT[variant]}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      // fetchpriority is valid HTML — React 19 passes it through; the cast keeps TS happy.
      {...({ fetchpriority: priority ? "high" : "auto" } as Record<
        string,
        string
      >)}
      data-slot="logo"
      data-variant={variant}
      className={cn(
        "block select-none",
        knockout && "filter-[brightness(0)_invert(1)]",
        className,
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

export { Logo };
export type { LogoProps };
