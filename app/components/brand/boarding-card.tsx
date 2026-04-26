import * as React from "react";

import { cn } from "~/lib/utils";

type BoardingCardProps = Omit<React.ComponentProps<"article">, "title"> & {
  /** Big italic chapter number on the left stub. */
  num: React.ReactNode;
  /** Eyebrow above the title, e.g. "Chapter № 3 · NOW BOARDING". */
  eyebrow?: React.ReactNode;
  /** The chapter title. */
  title: React.ReactNode;
  /** Inline meta items (lessons, questions, percent). */
  meta?: React.ReactNode[];
  /** Right-side perforated stub. */
  stub?: {
    label?: React.ReactNode;
    value: React.ReactNode;
    code?: React.ReactNode;
  };
  /** Locked variant — opacity + neutral colors, no rush accent. */
  locked?: boolean;
};

/**
 * Boarding-pass chapter card. Three columns: number stub · body · perforated
 * value stub. Used for chapter lists in the Learn flow.
 */
function BoardingCard({
  className,
  num,
  eyebrow,
  title,
  meta,
  stub,
  locked = false,
  ...props
}: BoardingCardProps) {
  return (
    <article
      data-slot="boarding-card"
      data-locked={locked || undefined}
      className={cn(
        // Mobile: tighter stubs (56px / 88px) so a 320px viewport gets ~140px
        // of body. sm+ : original boarding-pass proportions (80px / 140px).
        "relative grid w-full grid-cols-[56px_minmax(0,1fr)_88px] items-stretch border-2 border-ink bg-surface",
        "sm:grid-cols-[80px_minmax(0,1fr)_140px]",
        locked && "opacity-55",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-center justify-center border-r-2 border-dashed border-ink",
          // Number font scales with the stub width.
          "font-display text-[40px] font-extrabold italic leading-none tracking-[-0.04em] text-white sm:text-[56px]",
          locked ? "bg-ink-3" : "bg-rush",
        )}
        aria-hidden
      >
        {num}
      </div>

      {/* min-w-0 is the load-bearing fix: without it a long uppercase title
          with tight tracking pushes the 1fr column past the viewport. */}
      <div className="min-w-0 px-3 py-3 sm:px-5 sm:py-4">
        {eyebrow && (
          <div className="font-mono text-[9.5px] uppercase tracking-widest text-ink-3 sm:text-[10px]">
            {eyebrow}
          </div>
        )}
        <div className="mt-1.5 mb-2 font-display text-[15px] font-extrabold uppercase leading-tight tracking-tight text-ink wrap-anywhere sm:text-xl">
          {title}
        </div>
        {meta && (
          <div className="flex flex-wrap gap-x-2.5 gap-y-1 font-mono text-[10px] uppercase tracking-wide text-ink-2 sm:gap-x-3.5 sm:text-[11px]">
            {meta.map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        )}
      </div>

      {stub && (
        <div className="flex flex-col items-center justify-center border-l-2 border-dashed border-ink bg-paper-3 p-2 text-center sm:p-4">
          {stub.label && (
            <span className="font-mono text-[9.5px] uppercase tracking-widest text-ink-3 sm:text-[10px]">
              {stub.label}
            </span>
          )}
          <span
            className={cn(
              "font-display text-lg font-extrabold leading-none sm:text-[26px]",
              locked ? "text-ink-3" : "text-rush",
            )}
          >
            {stub.value}
          </span>
          {stub.code && (
            <span className="mt-1.5 font-mono text-[9.5px] uppercase tracking-widest text-ink-3 sm:text-[10px]">
              {stub.code}
            </span>
          )}
        </div>
      )}
    </article>
  );
}

export { BoardingCard };
