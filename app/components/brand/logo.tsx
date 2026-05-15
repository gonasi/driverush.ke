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
  /**
   * Auto-inverts the asset to match a theme-aware surface, so the same file
   * renders correctly in both light and dark mode. SSR-safe — toggled by
   * Tailwind's `dark:` variant off the `dark` class on <html>, no runtime
   * theme detection needed.
   *
   * - `"on-paper"` (or `true`) — for surfaces that are paper-coloured in light
   *   mode and ink-coloured in dark mode (e.g. `bg-surface`, the default app
   *   background). Inverts in dark mode.
   * - `"on-ink"` — for surfaces that are ink-coloured in light mode and
   *   paper-coloured in dark mode (e.g. `bg-ink`, the footer band). Inverts in
   *   light mode.
   */
  themed?: boolean | "on-paper" | "on-ink";
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
  themed = false,
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
        (themed === true || themed === "on-paper") &&
          "dark:filter-[brightness(0)_invert(1)]",
        themed === "on-ink" &&
          "filter-[brightness(0)_invert(1)] dark:filter-none",
        className,
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

export { Logo };
export type { LogoProps };
