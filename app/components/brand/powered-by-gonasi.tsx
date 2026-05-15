import * as React from "react";

import { GONASI } from "~/lib/site";
import { addUtm } from "~/lib/utm";
import { cn } from "~/lib/utils";

/**
 * Tone of the surrounding band. Drives which Gonasi logo variant renders:
 *  - `auto`     — track the page theme (on-light in light mode, on-dark in dark).
 *                 Pick this on any theme-aware surface (`bg-surface`, `bg-paper`).
 *  - `on-dark`  — always render the white-wordmark logo. Pick this on bands that
 *                 are dark regardless of theme (`bg-ink`).
 *  - `on-light` — always render the dark-wordmark logo. Pick this on bands that
 *                 are paper-coloured regardless of theme (rare; mostly for
 *                 print-style or fixed-light surfaces).
 */
type Tone = "auto" | "on-dark" | "on-light";

type Variant = "lockup" | "stamp" | "inline";

type PoweredByGonasiProps = {
  /** Visual variant — see comments on each branch in the component. */
  variant?: Variant;
  /** Tone of the surrounding band. See {@link Tone}. Default `auto`. */
  tone?: Tone;
  /**
   * `utm_medium` for the outbound link — Gonasi's analytics can then split
   * referrer traffic by where on DriveRush the user clicked. Default
   * `powered_by`.
   */
  utmMedium?: string;
  className?: string;
};

/**
 * Tiny `<img>` that always shows the Gonasi mark. Renders both files in the
 * tree and toggles visibility with `dark:` so the SSR'd HTML doesn't depend on
 * the runtime theme — no hydration flash and no theme-detection JS needed.
 *
 * For non-`auto` tones we still emit a single img (no toggle), so this just
 * picks the right asset.
 */
function GonasiMark({ tone, className }: { tone: Tone; className?: string }) {
  const sharedAlt = `${GONASI.name} logo`;
  if (tone === "on-dark") {
    return (
      <img
        src={GONASI.logoOnDark}
        alt={sharedAlt}
        loading="lazy"
        className={className}
      />
    );
  }
  if (tone === "on-light") {
    return (
      <img
        src={GONASI.logoOnLight}
        alt={sharedAlt}
        loading="lazy"
        className={className}
      />
    );
  }
  // `auto` — emit both; tailwind's `dark:` swaps them. The hidden variant has
  // empty alt so screen readers don't announce the duplicate. Toggle classes
  // go LAST so twMerge keeps them when callers pass a conflicting `block` in
  // `className` — otherwise the dark-only img leaks into light mode.
  return (
    <>
      <img
        src={GONASI.logoOnLight}
        alt={sharedAlt}
        loading="lazy"
        className={cn(className, "block dark:hidden")}
      />
      <img
        src={GONASI.logoOnDark}
        alt=""
        aria-hidden
        loading="lazy"
        className={cn(className, "hidden dark:block")}
      />
    </>
  );
}

/**
 * "Powered by Gonasi" credit, used wherever we surface the parent-company
 * relationship (footer lockup, hero stamp, mobile menu, etc.). Always an
 * outbound link to gonasi.com with a UTM tag so the parent's analytics can
 * attribute referral traffic back to which DriveRush surface the click came
 * from.
 *
 * Pick `tone` to match the surrounding band — see {@link Tone}.
 */
export function PoweredByGonasi({
  variant = "lockup",
  tone = "auto",
  utmMedium = "powered_by",
  className,
}: PoweredByGonasiProps) {
  const href = addUtm(GONASI.url, {
    source: "driverush",
    medium: utmMedium,
    campaign: "powered_by_gonasi",
  });
  const aria = `Powered by ${GONASI.name}. Opens gonasi.com in a new tab.`;

  if (variant === "lockup") {
    // Footer-grade credit. The logo is a square asset with its own field
    // colour, so it's the dominant visual on its own. The caption is a small
    // mono eyebrow alongside, no nested colour wrappers.
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={aria}
        className={cn(
          "group/gonasi inline-flex items-center gap-3 border-2 border-ink",
          "outline-none transition-[transform,box-shadow] duration-100 ease-snap",
          "hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp",
          "active:translate-x-[2px] active:translate-y-[2px] active:shadow-stamp-sm",
          "focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush",
          className,
        )}
      >
        <span className="pl-3 pr-1 font-mono text-[10px] font-bold uppercase tracking-widest opacity-80">
          Powered by
        </span>
        <GonasiMark
          tone={tone}
          className="block h-14 w-14 shrink-0 object-contain"
        />
      </a>
    );
  }

  if (variant === "stamp") {
    // Maker's-mark for a hero corner. Logo big enough to read, caption small
    // beside it. No tilt, no dashed wrapper; the logo's own field carries the
    // visual weight.
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={aria}
        className={cn(
          "group/gonasi inline-flex items-center gap-2.5 border-2 border-ink",
          "outline-none transition-[transform,box-shadow] duration-100 ease-snap",
          "hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-sm",
          "focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush",
          className,
        )}
      >
        <span className="pl-2.5 pr-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-3">
          Powered by{" "}
          <span className="text-ink group-hover/gonasi:text-rush">
            {GONASI.name}
          </span>
        </span>
        <GonasiMark
          tone={tone}
          className="block h-10 w-10 shrink-0 object-contain"
        />
      </a>
    );
  }

  // `inline` — flat text-link with a small logo. For mobile menu footer and
  // similar inline contexts.
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={aria}
      className={cn(
        "inline-flex items-center gap-2",
        "outline-none transition-opacity hover:opacity-80 focus-visible:opacity-80",
        className,
      )}
    >
      <GonasiMark
        tone={tone}
        className="block h-8 w-8 shrink-0 object-contain"
      />
      <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
        Powered by <span className="font-bold text-ink">{GONASI.name}</span>
      </span>
    </a>
  );
}
