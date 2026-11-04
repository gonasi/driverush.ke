import * as React from "react";

import { cn } from "~/lib/utils";

/** DR monogram. Transparent, so it's safe on any colour. */
const SRC = "/images/driverush-logo-plain.png";

/** The source file is 3:2. */
const ASPECT = 1.5;

type LogoProps = Omit<
  React.ComponentProps<"img">,
  "src" | "width" | "height" | "alt"
> & {
  /** Only the DR monogram exists now. Kept so call sites read clearly. */
  variant?: "plain";
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

/** The DriveRush logo. Always prefer this over CSS-drawn marks. */
function Logo({
  variant = "plain",
  height = 36,
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
      src={SRC}
      alt={alt ?? "DriveRush"}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      // React 19 owns this one: the camelCase prop is what it recognises, and
      // it renders the lowercase `fetchpriority` attribute. Passing the
      // lowercase spelling in logs "Invalid DOM property" on every render.
      fetchPriority={priority ? "high" : "auto"}
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
