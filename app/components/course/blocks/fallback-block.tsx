import { HugeiconsIcon } from "@hugeicons/react";
import { Configuration01FreeIcons } from "@hugeicons/core-free-icons";

import type { BlockRendererProps } from "~/lib/course-types";
import { BlockActionButton } from "../block-action-button";

/** Pull a human-readable prompt off an arbitrary block's data, if present. */
function pickText(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;
  const v = d.prompt ?? d.title ?? d.question ?? d.opening;
  return typeof v === "string" ? v : undefined;
}

/**
 * Placeholder for any block type without a real renderer yet — the weight-10
 * simulators, the sign games, etc. Shows what's coming and a Continue button so
 * the lesson still plays through end-to-end while the real module is built.
 */
export function FallbackBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const resolved = status === "complete";
  const text = pickText(block.data);

  return (
    <div className="grid gap-4">
      <div className="grid justify-items-center gap-3 border-2 border-dashed border-ink bg-paper-3 px-6 py-10 text-center">
        <span className="flex size-12 items-center justify-center border-2 border-ink bg-surface text-ink-3">
          <HugeiconsIcon
            icon={Configuration01FreeIcons}
            size={22}
            strokeWidth={2.25}
          />
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          {block.type.replace(/_/g, " ")} · interactive module
        </span>
        <p className="m-0 font-display text-lg font-extrabold uppercase tracking-tight text-ink">
          Coming soon
        </p>
        {text && (
          <p className="m-0 max-w-md font-serif text-[15px] leading-snug text-ink-2">
            {text}
          </p>
        )}
        <p className="m-0 max-w-md text-[13px] leading-relaxed text-ink-3">
          This interactive block is still in the workshop. Carry on with the
          lesson — it'll light up here once it's built.
        </p>
      </div>
      {!resolved && (
        <div>
          <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
        </div>
      )}
    </div>
  );
}
