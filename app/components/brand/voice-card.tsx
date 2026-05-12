import * as React from "react";

import { cn } from "~/lib/utils";

type VoiceCardProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** Card heading, e.g. "Write like this" / "Not like this". */
  title: React.ReactNode;
  /** Editorial mode — Do (approved) vs Don't (rejected). */
  mode: "do" | "dont";
  /** List of voice examples. */
  examples: React.ReactNode[];
};

/** Editorial do/dont card — bordered with a tilted approval/rejected stamp. */
function VoiceCard({
  className,
  title,
  mode,
  examples,
  ...props
}: VoiceCardProps) {
  const isDo = mode === "do";
  return (
    <div
      data-slot="voice-card"
      data-mode={mode}
      className={cn("border-2 border-ink bg-surface p-6", className)}
      {...props}
    >
      <div className="mb-4 flex items-center justify-between border-b border-ink pb-3">
        <p className="font-display text-lg font-extrabold uppercase text-ink">
          {title}
        </p>
        <span
          className={cn(
            "border-2 border-ink px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-widest",
            isDo
              ? "rotate-2 bg-kenya-green text-kenya-green-foreground"
              : "-rotate-2 bg-rush text-white",
          )}
        >
          {isDo ? "★ Approved" : "✗ Rejected"}
        </span>
      </div>
      <ul className="m-0 list-none p-0">
        {examples.map((ex, i) => (
          <li
            key={i}
            className={cn(
              "relative border-b border-dashed border-ink py-3 pl-7 font-serif text-[19px] leading-snug last:border-b-0",
              "before:absolute before:left-0 before:top-3 before:font-display before:font-extrabold before:text-rush",
              isDo
                ? "text-ink before:content-['→']"
                : "text-ink-3 line-through decoration-rush before:content-['✕'] before:text-rush",
            )}
          >
            {ex}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { VoiceCard };
