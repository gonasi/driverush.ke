import * as React from "react";

import { cn } from "~/lib/utils";

import "./traffic-loader.css";

/**
 * Traffic-light loader — the house loading indicator (use this, not a spinner).
 *
 * A hanging signal head rendered in SVG: the lenses cycle red → red+amber →
 * green → amber on a loop, the housing sways like wind on the cable, and a
 * faint glint walks down the casing. Everything animation-y lives in
 * `app.css` under the "Traffic-light loader" section — keep the two in sync
 * with the brand "Traffic Light Loader" HTML they were ported from.
 *
 * Honours `prefers-reduced-motion` automatically (settles on a lit amber).
 */

export type TrafficLoaderSize = "sm" | "md" | "lg" | "xl";

type TrafficLoaderProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Lockup width preset — 28 / 56 / 96 / 160 px. Height follows at 2.55×. */
  size?: TrafficLoaderSize;
  /** Override one full red→green→red signal cycle, in seconds. */
  cycle?: number;
};

/** One signal lens — visor, dark off-disc, glow halo and the animated lit core. */
function SignalLens({
  uid,
  color,
  cy,
}: {
  uid: string;
  color: "red" | "amber" | "green";
  cy: number;
}) {
  const haloFill = {
    red: "rgba(238,42,28,0.55)",
    amber: "rgba(245,166,35,0.55)",
    green: "rgba(43,182,115,0.55)",
  }[color];
  // the lit centre's tiny specular dot reads a touch brighter on amber/green
  const specular = color === "red" ? 0.85 : 0.95;

  return (
    <g transform={`translate(40 ${cy})`}>
      {/* visor / hood + its top highlight */}
      <path
        d="M -16 0 a 16 16 0 0 1 32 0 v 4 h -3 a 13 13 0 0 0 -26 0 h -3 z"
        fill={`url(#${uid}-visor)`}
        stroke="#000"
        strokeWidth="0.6"
      />
      <path
        d="M -13 0 a 13 13 0 0 1 26 0"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="0.6"
      />

      {/* lens recess: black ring, tinted off-disc, faint LED grid, inner shadow */}
      <circle r="13.5" fill="#000" />
      <circle r="12.6" fill={`url(#${uid}-off-${color})`} />
      <circle r="12.6" fill={`url(#${uid}-leds-off)`} />
      <circle r="12.6" fill={`url(#${uid}-recess)`} />

      {/* glow halo (sits outside the disc) */}
      <circle
        className={cn("dr-traffic-halo", `dr-traffic-halo--${color}`)}
        r="22"
        fill={haloFill}
        filter={`url(#${uid}-glow)`}
      />

      {/* the lit lens — opacity animated on/off through the cycle */}
      <g className={cn("dr-traffic-lens", `dr-traffic-lens--${color}`)}>
        <circle r="12" fill={`url(#${uid}-on-${color})`} />
        <circle
          r="12"
          fill={`url(#${uid}-leds-${color})`}
          clipPath={`url(#${uid}-lens-clip)`}
          opacity="0.9"
        />
        <circle r="12" fill={`url(#${uid}-on-${color})`} opacity="0.55" />
        <ellipse
          cx="-3"
          cy="-3"
          rx="4.5"
          ry="2.5"
          fill="rgba(255,255,255,0.55)"
        />
        <ellipse
          cx="-3"
          cy="-3"
          rx="2"
          ry="1"
          fill={`rgba(255,255,255,${specular})`}
        />
      </g>

      {/* rim glint */}
      <circle
        r="12.6"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.6"
      />
    </g>
  );
}

function TrafficLoader({
  size = "md",
  cycle,
  className,
  style,
  role = "status",
  "aria-label": ariaLabel = "Loading",
  ...props
}: TrafficLoaderProps) {
  // Unique per instance so duplicate <defs> ids don't collide across loaders
  // on the same page (gradients, the LED patterns, the glow filter, clips).
  const uid = `dr-traffic-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div
      data-slot="traffic-loader"
      role={role}
      aria-label={ariaLabel}
      className={cn("dr-traffic", `dr-traffic--${size}`, className)}
      style={
        cycle != null
          ? ({
              ...style,
              "--dr-traffic-cycle": `${cycle}s`,
            } as React.CSSProperties)
          : style
      }
      {...props}
    >
      <svg viewBox="0 0 80 204" aria-hidden="true">
        <defs>
          {/* casing + post metalwork */}
          <linearGradient id={`${uid}-housing`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1f2530" />
            <stop offset="14%" stopColor="#363c47" />
            <stop offset="50%" stopColor="#11151c" />
            <stop offset="86%" stopColor="#262b35" />
            <stop offset="100%" stopColor="#0c0f15" />
          </linearGradient>
          <linearGradient id={`${uid}-visor`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#161a22" />
            <stop offset="100%" stopColor="#05070b" />
          </linearGradient>
          <linearGradient id={`${uid}-post`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3a3a3a" />
            <stop offset="50%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#2c2c2c" />
          </linearGradient>

          {/* off-state lens discs — dark, faintly tinted by their colour */}
          <radialGradient id={`${uid}-off-red`} cx="0.4" cy="0.35" r="0.8">
            <stop offset="0%" stopColor="#3a0a0a" />
            <stop offset="60%" stopColor="#1a0408" />
            <stop offset="100%" stopColor="#08020a" />
          </radialGradient>
          <radialGradient id={`${uid}-off-amber`} cx="0.4" cy="0.35" r="0.8">
            <stop offset="0%" stopColor="#3a2b07" />
            <stop offset="60%" stopColor="#1a1305" />
            <stop offset="100%" stopColor="#0a0703" />
          </radialGradient>
          <radialGradient id={`${uid}-off-green`} cx="0.4" cy="0.35" r="0.8">
            <stop offset="0%" stopColor="#062a1c" />
            <stop offset="60%" stopColor="#03150f" />
            <stop offset="100%" stopColor="#020807" />
          </radialGradient>

          {/* lit-state lens discs — glowing centre falling off to a dark rim */}
          <radialGradient id={`${uid}-on-red`} cx="0.4" cy="0.4" r="0.55">
            <stop offset="0%" stopColor="#ffeae8" />
            <stop offset="10%" stopColor="#ff8a82" />
            <stop offset="55%" stopColor="#ee2a1c" />
            <stop offset="100%" stopColor="#8a0e07" />
          </radialGradient>
          <radialGradient id={`${uid}-on-amber`} cx="0.4" cy="0.4" r="0.55">
            <stop offset="0%" stopColor="#fff5d6" />
            <stop offset="10%" stopColor="#ffd073" />
            <stop offset="55%" stopColor="#f5a623" />
            <stop offset="100%" stopColor="#8c540a" />
          </radialGradient>
          <radialGradient id={`${uid}-on-green`} cx="0.4" cy="0.4" r="0.55">
            <stop offset="0%" stopColor="#e3ffe9" />
            <stop offset="10%" stopColor="#7be8a2" />
            <stop offset="55%" stopColor="#2bb673" />
            <stop offset="100%" stopColor="#0c5a37" />
          </radialGradient>

          {/* LED matrices tiled inside each lens — unlit grid + colour-lit grids */}
          <pattern
            id={`${uid}-leds-off`}
            patternUnits="userSpaceOnUse"
            width="3"
            height="3"
          >
            <circle cx="1.5" cy="1.5" r="0.7" fill="rgba(255,255,255,0.05)" />
            <circle cx="1.5" cy="1.5" r="0.35" fill="rgba(255,255,255,0.09)" />
          </pattern>
          <pattern
            id={`${uid}-leds-red`}
            patternUnits="userSpaceOnUse"
            width="3"
            height="3"
          >
            <circle cx="1.5" cy="1.5" r="0.85" fill="#ff6a5a" />
            <circle cx="1.4" cy="1.35" r="0.42" fill="#fff3f1" />
          </pattern>
          <pattern
            id={`${uid}-leds-amber`}
            patternUnits="userSpaceOnUse"
            width="3"
            height="3"
          >
            <circle cx="1.5" cy="1.5" r="0.85" fill="#ffc56b" />
            <circle cx="1.4" cy="1.35" r="0.42" fill="#fffaee" />
          </pattern>
          <pattern
            id={`${uid}-leds-green`}
            patternUnits="userSpaceOnUse"
            width="3"
            height="3"
          >
            <circle cx="1.5" cy="1.5" r="0.85" fill="#5ee695" />
            <circle cx="1.4" cy="1.35" r="0.42" fill="#eefff4" />
          </pattern>

          {/* clips the lit LED grid to the lens disc */}
          <clipPath id={`${uid}-lens-clip`}>
            <circle r="12" />
          </clipPath>

          {/* moving casing glint + soft blur for the halos + lens inner shadow */}
          <linearGradient id={`${uid}-glint`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter
            id={`${uid}-glow`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <radialGradient id={`${uid}-recess`} cx="0.5" cy="0.42" r="0.6">
            <stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </radialGradient>
        </defs>

        {/* ground shadow */}
        <ellipse cx="40" cy="200" rx="22" ry="2.5" fill="rgba(0,0,0,0.22)" />

        {/* post + base flange */}
        <rect
          x="36.5"
          y="138"
          width="7"
          height="62"
          rx="1.5"
          fill={`url(#${uid}-post)`}
        />
        <rect x="30" y="196" width="20" height="5" rx="1" fill="#1a1a1a" />
        <rect
          x="30"
          y="196"
          width="20"
          height="1"
          fill="rgba(255,255,255,0.15)"
        />

        <g className="dr-traffic-housing">
          {/* backing plate halo */}
          <rect
            x="6"
            y="4"
            width="68"
            height="138"
            rx="8"
            fill="#0a0c11"
            opacity="0.6"
          />
          {/* casing body, edge highlight, centre seam */}
          <rect
            x="8"
            y="6"
            width="64"
            height="134"
            rx="7"
            fill={`url(#${uid}-housing)`}
            stroke="#000"
            strokeWidth="0.7"
          />
          <rect
            x="9.5"
            y="7.5"
            width="61"
            height="131"
            rx="6"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.6"
          />
          <line
            x1="40"
            y1="9"
            x2="40"
            y2="138"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.6"
          />
          {/* hanger eye */}
          <rect x="36" y="2" width="8" height="6" rx="1.5" fill="#10131a" />
          <rect
            x="36.5"
            y="2.5"
            width="7"
            height="1"
            fill="rgba(255,255,255,0.18)"
          />

          {/* the three signals */}
          <SignalLens uid={uid} color="red" cy={32} />
          <SignalLens uid={uid} color="amber" cy={73} />
          <SignalLens uid={uid} color="green" cy={114} />

          {/* side cooling vents */}
          <g opacity="0.8">
            <rect
              x="11"
              y="20"
              width="2"
              height="6"
              rx="0.5"
              fill="rgba(0,0,0,0.6)"
            />
            <rect
              x="67"
              y="20"
              width="2"
              height="6"
              rx="0.5"
              fill="rgba(0,0,0,0.6)"
            />
            <rect
              x="11"
              y="61"
              width="2"
              height="6"
              rx="0.5"
              fill="rgba(0,0,0,0.6)"
            />
            <rect
              x="67"
              y="61"
              width="2"
              height="6"
              rx="0.5"
              fill="rgba(0,0,0,0.6)"
            />
            <rect
              x="11"
              y="102"
              width="2"
              height="6"
              rx="0.5"
              fill="rgba(0,0,0,0.6)"
            />
            <rect
              x="67"
              y="102"
              width="2"
              height="6"
              rx="0.5"
              fill="rgba(0,0,0,0.6)"
            />
          </g>

          {/* maker's stamp */}
          <text
            x="40"
            y="132"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="3.4"
            fill="rgba(255,255,255,0.25)"
            letterSpacing="0.5"
          >
            DRIVERUSH.KE
          </text>

          {/* glint that walks down the casing */}
          <g clipPath="inset(0 round 7px)">
            <rect
              className="dr-traffic-glint"
              x="10"
              y="6"
              width="60"
              height="20"
              fill={`url(#${uid}-glint)`}
              opacity="0"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

/**
 * Loader caption — Sora caps with a stepped `...` that animates alongside the
 * loader. Defaults to ink type; pass `text-*` via `className` (or use
 * {@link LoadingPanel}'s `onDark`) for always-dark surfaces.
 */
function TrafficLoaderStatus({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="traffic-loader-status"
      className={cn("dr-loader-status text-ink", className)}
      {...props}
    >
      {children}
    </span>
  );
}

type LoadingPanelProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Caption under the loader. Pass an empty value to show the loader alone. */
  label?: React.ReactNode;
  /** Loader size — see {@link TrafficLoader}. Defaults to `"md"`. */
  size?: TrafficLoaderSize;
  /** Light caption type, for a loader on an always-dark surface. */
  onDark?: boolean;
};

/**
 * Drop-in loading block: a centred {@link TrafficLoader} with an animated
 * caption underneath. Use this where a spinner-in-a-box used to go.
 */
function LoadingPanel({
  label = "Loading",
  size = "md",
  onDark = false,
  className,
  ...props
}: LoadingPanelProps) {
  return (
    <div
      data-slot="loading-panel"
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12",
        className,
      )}
      {...props}
    >
      <TrafficLoader size={size} aria-hidden />
      {label ? (
        <TrafficLoaderStatus className={onDark ? "text-[#f4efe2]" : undefined}>
          {label}
        </TrafficLoaderStatus>
      ) : null}
    </div>
  );
}

export { TrafficLoader, TrafficLoaderStatus, LoadingPanel };
