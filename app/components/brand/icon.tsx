import type * as React from "react";

import type { IconDef } from "~/components/brand/icons";

type IconProps = Omit<React.SVGProps<SVGSVGElement>, "strokeWidth"> & {
  icon: IconDef;
  size?: number;
  /**
   * Line weight in 24-grid units. Left out, it thickens as the icon shrinks so
   * small marks still read on cheap phone screens.
   */
  strokeWidth?: number;
};

function defaultWeight(size: number) {
  if (size <= 14) return 2.25;
  if (size <= 18) return 2;
  return 1.75;
}

/**
 * The quiet tier of the DriveRush icon set: one colour, follows
 * `currentColor`. For the full-colour road and status marks use `SignIcon`.
 */
export function Icon({ icon, size = 20, strokeWidth, ...props }: IconProps) {
  const sw = strokeWidth ?? defaultWeight(size);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
      {...props}
    >
      {icon.brand ? (
        <path d={icon.brand} fill="currentColor" />
      ) : (
        <>
          {icon.b && <path d={icon.b} fill="currentColor" opacity={0.18} />}
          {icon.s && (
            <path
              d={icon.s}
              stroke="currentColor"
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {icon.f && <path d={icon.f} fill="currentColor" />}
        </>
      )}
    </svg>
  );
}
