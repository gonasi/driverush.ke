import * as React from "react";

import { cn } from "~/lib/utils";

type LicenseField = { label: React.ReactNode; value: React.ReactNode };

type LicenseCardProps = React.ComponentProps<"div"> & {
  /** Holder name. */
  name: React.ReactNode;
  /** Initials / glyph shown in the photo block. */
  photoText: React.ReactNode;
  /** Field rows; each inner array is one mono line of label·value pairs. */
  rows: LicenseField[][];
  /** The round wax-style seal. Omit to hide it. */
  seal?: { big: React.ReactNode; sm: React.ReactNode };
  /** Top-left micro stamp. */
  caption?: React.ReactNode;
};

/**
 * Credential card — diagonal-stripe "security paper", a split-tone photo block,
 * field rows, and a rotated double-ruled seal. Used for the licence / pass
 * artefact shown after a course completes.
 */
function LicenseCard({
  className,
  name,
  photoText,
  rows,
  seal,
  caption = "★ DriveRush certified ★",
  ...props
}: LicenseCardProps) {
  return (
    <div
      data-slot="license-card"
      className={cn(
        "relative grid grid-cols-[auto_1fr_auto] items-center gap-[18px] border-2 border-ink p-[22px]",
        "bg-[repeating-linear-gradient(45deg,var(--paper-3)_0_8px,var(--paper-2)_8px_16px)]",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 top-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
        {caption}
      </span>
      <div className="flex h-[110px] w-[88px] items-center justify-center border-2 border-ink bg-[linear-gradient(135deg,var(--rush)_0_50%,var(--ink)_50%_100%)] font-display text-[38px] font-extrabold italic text-white">
        {photoText}
      </div>
      <div className="min-w-0">
        <div className="mb-1 font-display text-[22px] font-extrabold uppercase tracking-[-0.01em]">
          {name}
        </div>
        {rows.map((row, i) => (
          <div
            key={i}
            className="mt-[3px] flex flex-wrap gap-[18px] font-mono text-[11px] uppercase tracking-wider text-ink-2"
          >
            {row.map((f, j) => (
              <span key={j}>
                <b className="text-ink">{f.label}</b> {f.value}
              </span>
            ))}
          </div>
        ))}
      </div>
      {seal && (
        <div className="flex size-20 -rotate-[8deg] flex-col items-center justify-center rounded-full border-[3px] border-double border-rush text-center font-display font-extrabold italic leading-none text-rush">
          <span className="text-[22px]">{seal.big}</span>
          <span className="mt-[3px] text-[9px] tracking-widest">{seal.sm}</span>
        </div>
      )}
    </div>
  );
}

export { LicenseCard };
export type { LicenseField };
