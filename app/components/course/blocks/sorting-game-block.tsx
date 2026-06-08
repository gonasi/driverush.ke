import * as React from "react";

import type {
  BlockRendererProps,
  SortingGameData,
  SortingGameItem,
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

type ItemState = "tray" | "placed";

/**
 * `sorting_game` — informational. Tap-to-pick an item from the tray, tap a
 * bucket to drop it. Wrong drops buzz and bounce the item back. When every
 * item is in its correct bucket the synthesis appears with Continue.
 */
export function SortingGameBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as SortingGameData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const items = React.useMemo(
    () => (data.shuffleItems ? shuffle(data.items) : data.items),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [block.id],
  );

  const initial: Record<string, string> = resolved
    ? Object.fromEntries(items.map((it) => [it.id, it.bucketId]))
    : {};
  const [placed, setPlaced] = React.useState<Record<string, string>>(initial);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = React.useState<string | null>(null);

  const trayItems = items.filter((it) => placed[it.id] !== it.bucketId);
  const placedItems = items.filter((it) => placed[it.id] === it.bucketId);
  const allCorrect = placedItems.length === items.length;

  function pick(id: string) {
    if (resolved || allCorrect) return;
    tap();
    setPicked((p) => (p === id ? null : id));
  }

  function drop(bucketId: string) {
    if (!picked || resolved) return;
    const item = items.find((it) => it.id === picked);
    if (!item) return;
    if (item.bucketId === bucketId) {
      sCorrect();
      setPlaced((m) => ({ ...m, [item.id]: bucketId }));
      setPicked(null);
    } else {
      sWrong();
      setWrongFlash(bucketId);
      window.setTimeout(() => setWrongFlash(null), 320);
    }
  }

  return (
    <div className="grid gap-5">
      <p className="m-0 font-display text-[clamp(18px,2.6vw,24px)] font-extrabold uppercase leading-tight tracking-tight text-ink wrap-anywhere">
        {data.prompt}
      </p>

      {!resolved && (
        <p className="m-0 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Tap an item, then tap its bucket
        </p>
      )}

      {!resolved && trayItems.length > 0 && (
        <ul className="flex flex-wrap gap-2 border-2 border-dashed border-ink bg-paper-2 p-3">
          {trayItems.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => pick(it.id)}
                className={cn(
                  "border-2 border-ink bg-surface px-3 py-2 text-left font-serif text-[14px] leading-snug text-ink transition-[transform,box-shadow] duration-100 ease-snap",
                  picked === it.id
                    ? "-translate-x-px -translate-y-px shadow-stamp-rush"
                    : "hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-sm",
                )}
              >
                {it.text}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {data.buckets.map((b) => {
          const inBucket = items.filter((it) => placed[it.id] === b.id);
          const isFlash = wrongFlash === b.id;
          return (
            <button
              key={b.id}
              type="button"
              disabled={resolved || !picked}
              onClick={() => drop(b.id)}
              className={cn(
                "grid min-h-32 gap-2 border-2 border-ink p-4 text-left transition-[background,box-shadow,transform] duration-150 ease-snap",
                isFlash
                  ? "bg-[color-mix(in_oklab,var(--rush)_14%,var(--surface))]"
                  : "bg-paper-2",
                picked && !resolved && "shadow-stamp-sm",
              )}
            >
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                Bucket
              </span>
              <span className="font-display text-[15px] font-extrabold uppercase leading-tight tracking-tight text-ink">
                {b.label}
              </span>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {inBucket.map((it) => (
                  <li
                    key={it.id}
                    className="inline-block border-2 border-ink bg-kenya-green px-2 py-1 font-serif text-[12.5px] leading-tight text-kenya-green-foreground"
                  >
                    {it.text}
                  </li>
                ))}
                {inBucket.length === 0 && (
                  <li className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
                    Empty
                  </li>
                )}
              </ul>
            </button>
          );
        })}
      </div>

      {!resolved && picked && (
        <div className="flex justify-start">
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

      {(resolved || allCorrect) && data.feedbackOnComplete && (
        <div className="border-2 border-ink bg-paper-2 px-5 py-4">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            In short
          </div>
          <p className="m-0 font-serif text-[16px] leading-snug text-ink">
            {data.feedbackOnComplete}
          </p>
        </div>
      )}

      {!resolved && allCorrect && (
        <ResultBanner
          correct
          title="Sorted · Sawa sawa"
          actions={
            <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
          }
        />
      )}
    </div>
  );
}

export type { SortingGameItem };
