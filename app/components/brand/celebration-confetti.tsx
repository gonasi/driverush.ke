import Confetti from "react-confetti-boom";

/**
 * Celebration confetti — DriveRush's house "you did it" burst, ported from the
 * old gonasi completion screens. A handful of staggered booms fired from just
 * above centre in the brand palette.
 *
 * It renders an absolutely-positioned, `pointer-events-none` `<canvas>` that
 * fills its nearest positioned ancestor, so drop it inside the scrim / overlay
 * you're celebrating over. Canvas-only by nature, so it's a no-op on the server
 * and safe to render on first client paint; the burst plays a few times
 * (`effectCount` × `effectInterval`) then settles. Remount it (bump a `key`) to
 * fire again.
 */

/** Brand palette — bright enough to pop on the trainer's near-black overlay. */
export const CONFETTI_COLORS: string[] = [
  "#e11d2e", // rush
  "#1fb6c1", // route-cyan
  "#1e8449", // kenya-green
  "#34c779", // kenya-green (bright)
  "#e6a100", // amber
  "#d4a017", // kenya-gold
  "#1640b6", // plate-blue
  "#5c82ff", // plate-blue (bright)
  "#b6177f", // magenta
  "#ff7a1a", // hazard
  "#ffeec4", // cream
  "#ffffff", // paper white
];

export function CelebrationConfetti({
  className,
  bursts = 4,
}: {
  className?: string;
  /** How many staggered booms to fire (default 4). Use fewer for a lighter win. */
  bursts?: number;
}) {
  return (
    <Confetti
      mode="boom"
      className={className}
      colors={CONFETTI_COLORS}
      particleCount={170}
      x={0.5}
      y={0.32}
      deg={270}
      shapeSize={13}
      spreadDeg={70}
      effectCount={Math.max(1, bursts)}
      effectInterval={750}
      launchSpeed={1.3}
      opacityDeltaMultiplier={1.1}
    />
  );
}
