import * as React from "react";

import type { BlockRendererProps, StepRevealData } from "~/lib/course-types";
import { cn } from "~/lib/utils";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";

/**
 * `step_by_step_reveal` — tap-to-reveal cards (informational, non-assessment).
 * Each card flips front↔back on tap with a flip sound; once every card has been
 * turned over, the synthesis + Continue appear. Resolved blocks render every
 * card already flipped.
 */
export function StepRevealBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as StepRevealData;
  const resolved = status === "complete";
  const { flip } = useFeedback();

  const [back, setBack] = React.useState<Record<string, boolean>>(() =>
    resolved ? Object.fromEntries(data.cards.map((c) => [c.id, true])) : {},
  );
  const [seen, setSeen] = React.useState<Set<string>>(() =>
    resolved ? new Set(data.cards.map((c) => c.id)) : new Set(),
  );

  const allFlipped = data.cards.every((c) => seen.has(c.id));
  const showSynthesis = (resolved || allFlipped) && !!data.synthesis;

  function toggle(id: string) {
    if (resolved) return;
    const wasBack = !!back[id];
    setBack((b) => ({ ...b, [id]: !b[id] }));
    if (!wasBack) flip();
    setSeen((s) => {
      if (s.has(id)) return s;
      const next = new Set(s);
      next.add(id);
      return next;
    });
  }

  return (
    <div className="grid gap-5">
      <p className="m-0 font-display text-[clamp(18px,2.6vw,24px)] font-extrabold uppercase leading-tight tracking-tight text-ink">
        {data.title}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.cards.map((card, i) => {
          const isBack = !!back[card.id];
          return (
            <button
              key={card.id}
              type="button"
              aria-pressed={isBack}
              disabled={resolved}
              onClick={() => toggle(card.id)}
              className={cn(
                "flex min-h-36 flex-col gap-2 border-2 border-ink p-4 text-left outline-none transition-[transform,box-shadow] duration-100 ease-snap",
                "focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-stamp-rush",
                isBack
                  ? "bg-ink text-paper"
                  : "bg-surface text-ink hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-sm",
                resolved && "cursor-default",
              )}
            >
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">
                {isBack ? "Answer" : `Card ${i + 1} of ${data.cards.length}`}
              </span>
              <p className="m-0 font-serif text-[15px] leading-snug">
                {isBack ? card.back : card.front}
              </p>
              {!resolved && (
                <span className="mt-auto font-mono text-[10px] uppercase tracking-widest opacity-60">
                  {isBack ? "Tap to flip back" : "Tap to reveal"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showSynthesis && (
        <div className="border-2 border-ink bg-paper-2 px-5 py-4">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            In short
          </div>
          <p className="m-0 font-serif text-[16px] leading-snug text-ink">
            {data.synthesis}
          </p>
        </div>
      )}

      {!resolved && allFlipped && (
        <div>
          <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
        </div>
      )}
    </div>
  );
}
