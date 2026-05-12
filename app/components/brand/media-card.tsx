import * as React from "react";

import { cn } from "~/lib/utils";

type MediaCardProps = React.ComponentProps<"div"> & {
  /** Mono caps eyebrow, e.g. "★ HAZARD PERCEPTION". */
  category?: React.ReactNode;
  title: React.ReactNode;
  /** Mono caps sub-line, e.g. "12 CLIPS · 4 MIN AVG". */
  sub?: React.ReactNode;
  /** Duration chip, e.g. "04:32". */
  duration?: React.ReactNode;
  /** Glyph inside the play button. Default "▶". */
  playGlyph?: React.ReactNode;
  /** Optional thumbnail (an <img/>); falls back to the brand split-tone block. */
  thumb?: React.ReactNode;
};

/** Video-lesson card — split-tone thumb with a stamped play button + duration. */
function MediaCard({
  className,
  category,
  title,
  sub,
  duration,
  playGlyph = "▶",
  thumb,
  ...props
}: MediaCardProps) {
  return (
    <div
      data-slot="media-card"
      className={cn(
        "overflow-hidden border-2 border-ink bg-surface",
        className,
      )}
      {...props}
    >
      <div className="relative aspect-video border-b-2 border-ink bg-[linear-gradient(135deg,var(--ink)_0_50%,var(--rush)_50%_100%)]">
        {thumb != null && (
          <div className="absolute inset-0 [&_img]:size-full [&_img]:object-cover">
            {thumb}
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.04)_0_1px,transparent_1px_30px),repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0_1px,transparent_1px_20px)]"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-16 items-center justify-center rounded-full border-[3px] border-ink bg-paper text-[22px] text-ink shadow-[5px_5px_0_var(--ink)]">
            {playGlyph}
          </span>
        </div>
        {duration != null && (
          <span className="absolute bottom-2.5 right-2.5 border-2 border-paper bg-ink px-2 py-[3px] font-mono text-[11px] font-bold uppercase tracking-wider text-paper">
            {duration}
          </span>
        )}
      </div>
      <div className="px-4 py-3.5">
        {category != null && (
          <div className="font-mono text-[10.5px] font-bold uppercase tracking-widest text-rush">
            {category}
          </div>
        )}
        <div className="my-1 font-display text-base font-extrabold uppercase leading-tight tracking-[0.02em]">
          {title}
        </div>
        {sub != null && (
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export { MediaCard };
