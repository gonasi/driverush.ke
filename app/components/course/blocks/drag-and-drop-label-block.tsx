import * as React from "react";

import type {
  BlockRendererProps,
  DragAndDropLabelData,
} from "~/lib/course-types";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * `drag_and_drop_label` — informational. Simplified list version (no real
 * image canvas yet): chips on top, labelled hotspot slots below. Tap a chip,
 * tap its slot. Wrong drops shake; correct drops lock in.
 */
export function DragAndDropLabelBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as DragAndDropLabelData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const labels = React.useMemo(
    () => shuffle(data.labels),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [block.id],
  );

  const [placed, setPlaced] = React.useState<Record<string, string>>(
    resolved
      ? Object.fromEntries(data.labels.map((l) => [l.hotspot, l.id]))
      : {},
  );
  const [picked, setPicked] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = React.useState<string | null>(null);

  const remaining = labels.filter((l) => !Object.values(placed).includes(l.id));
  const allPlaced =
    Object.keys(placed).length === labels.length &&
    labels.every((l) => placed[l.hotspot] === l.id);

  function pick(id: string) {
    if (resolved || allPlaced) return;
    tap();
    setPicked((p) => (p === id ? null : id));
    setFeedback(null);
  }

  function drop(hotspot: string) {
    if (!picked || resolved) return;
    const label = labels.find((l) => l.id === picked);
    if (!label) return;
    if (label.hotspot === hotspot) {
      sCorrect();
      setPlaced((m) => ({ ...m, [hotspot]: label.id }));
      setPicked(null);
      setFeedback(null);
    } else {
      sWrong();
      setWrongFlash(hotspot);
      if (label.incorrectFeedback) setFeedback(label.incorrectFeedback);
      window.setTimeout(() => setWrongFlash(null), 320);
    }
  }

  const labelById = new Map(labels.map((l) => [l.id, l]));

  return (
    <div className="grid gap-5">
      {data.imageAlt && (
        <div className="grid justify-items-center gap-1 border-2 border-dashed border-ink bg-paper-2 px-4 py-3 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
          Diagram · {data.imageAlt}
        </div>
      )}

      {!resolved && remaining.length > 0 && (
        <>
          <p className="m-0 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Pick a label, then tap its hotspot
          </p>
          <ul className="flex flex-wrap gap-2 border-2 border-dashed border-ink bg-paper-3 p-3">
            {remaining.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => pick(l.id)}
                  className={cn(
                    "border-2 border-ink bg-surface px-3 py-2 font-serif text-[14px] text-ink transition-[transform,box-shadow] duration-100 ease-snap",
                    picked === l.id
                      ? "-translate-x-px -translate-y-px shadow-stamp-rush"
                      : "hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-sm",
                  )}
                >
                  {l.text}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <ul className="grid gap-2 sm:grid-cols-2">
        {data.hotspots.map((h) => {
          const labelId = placed[h.id];
          const label = labelId ? labelById.get(labelId) : undefined;
          const isFlash = wrongFlash === h.id;
          return (
            <li key={h.id}>
              <button
                type="button"
                disabled={resolved || !picked || !!label}
                onClick={() => drop(h.id)}
                className={cn(
                  "grid w-full gap-1.5 border-2 border-ink p-4 text-left transition-[background,box-shadow,transform] duration-150 ease-snap",
                  label
                    ? "bg-[color-mix(in_oklab,var(--kenya-green)_14%,var(--surface))]"
                    : isFlash
                      ? "bg-[color-mix(in_oklab,var(--rush)_14%,var(--surface))]"
                      : "bg-paper-2",
                  picked && !label && !resolved && "shadow-stamp-sm",
                )}
              >
                <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                  Hotspot · {h.id}
                </span>
                <span className="font-display text-[15px] font-extrabold uppercase tracking-tight text-ink">
                  {label ? label.text : "Empty"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {!resolved && feedback && (
        <p className="m-0 border-l-4 border-rush bg-paper-2 px-4 py-2 font-serif text-[13.5px] leading-snug text-ink-2">
          {feedback}
        </p>
      )}

      {!resolved && picked && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              tap();
              setPicked(null);
            }}
          >
            Cancel pick
          </Button>
        </div>
      )}

      {(resolved || allPlaced) && data.feedbackOnComplete && (
        <div className="border-2 border-ink bg-paper-2 px-5 py-4">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            In short
          </div>
          <p className="m-0 font-serif text-[16px] leading-snug text-ink">
            {data.feedbackOnComplete}
          </p>
        </div>
      )}

      {!resolved && allPlaced && (
        <ResultBanner
          correct
          title="All labels placed"
          actions={
            <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
          }
        />
      )}
    </div>
  );
}
