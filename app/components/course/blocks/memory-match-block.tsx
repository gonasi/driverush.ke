import * as React from "react";

import type { BlockRendererProps, MemoryMatchData } from "~/lib/course-types";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";

const PAIR_POOLS: Record<string, { left: string; right: string }[]> = {
  warning_signs: [
    { left: "Triangle, point up", right: "Warning ahead" },
    { left: "Bend ahead", right: "Curve coming — slow down" },
    { left: "Steep downhill", right: "Lower gear, gentle brake" },
    { left: "Pedestrian crossing", right: "Yield to pedestrians" },
    { left: "Slippery road", right: "Smooth steering only" },
    { left: "Road narrows", right: "Width reduces ahead" },
    { left: "School ahead", right: "Children near road" },
    { left: "Junction ahead", right: "Side road joins your route" },
    { left: "Roundabout ahead", right: "Yield to traffic from the right" },
    { left: "Traffic signals ahead", right: "Be ready to stop" },
  ],
  regulatory_signs: [
    { left: "Stop", right: "Full stop required" },
    { left: "Give way", right: "Yield to priority traffic" },
    { left: "No entry", right: "Do not enter from this side" },
    { left: "No overtaking", right: "Overtaking prohibited" },
    { left: "Speed limit 50", right: "Maximum 50 km/h" },
    { left: "No U-turn", right: "U-turn prohibited" },
    { left: "Keep left", right: "Pass obstacle on left" },
    { left: "No parking", right: "Parking prohibited" },
    { left: "One way", right: "Single direction of travel" },
    { left: "No waiting", right: "No stopping to wait" },
  ],
  default: [
    { left: "Clutch", right: "Left pedal" },
    { left: "Brake", right: "Centre pedal" },
    { left: "Accelerator", right: "Right pedal" },
    { left: "Indicator", right: "Communicate a turn" },
    { left: "Mirror check", right: "MSM step 1" },
    { left: "Signal", right: "MSM step 2" },
    { left: "Manoeuvre", right: "MSM step 3" },
    { left: "Horn", right: "Warn while moving" },
    { left: "Triangle", right: "60m behind a breakdown" },
    { left: "Hazards", right: "Stationary danger" },
  ],
};

type Card = {
  id: string;
  pairKey: string;
  side: "L" | "R";
  text: string;
};

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * `memory_match` — informational. Tap two cards; matching pair locks in.
 * Mismatches flip back. Complete when all pairs are matched.
 */
export function MemoryMatchBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as MemoryMatchData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const cards = React.useMemo<Card[]>(() => {
    const pool = PAIR_POOLS[data.cardSet] ?? PAIR_POOLS.default;
    const picks = shuffle(pool).slice(0, Math.min(data.pairs, pool.length));
    const out: Card[] = [];
    for (let i = 0; i < picks.length; i++) {
      const key = `p${i}`;
      out.push({
        id: `${key}-l`,
        pairKey: key,
        side: "L",
        text: picks[i].left,
      });
      out.push({
        id: `${key}-r`,
        pairKey: key,
        side: "R",
        text: picks[i].right,
      });
    }
    return shuffle(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  const allKeys = React.useMemo(
    () => Array.from(new Set(cards.map((c) => c.pairKey))),
    [cards],
  );

  const [matched, setMatched] = React.useState<Set<string>>(
    resolved ? new Set(allKeys) : new Set(),
  );
  const [openIds, setOpenIds] = React.useState<string[]>([]);
  const [moves, setMoves] = React.useState(0);

  const isMatched = (key: string) => matched.has(key);
  const isOpen = (id: string) => openIds.includes(id);

  function flip(card: Card) {
    if (resolved) return;
    if (openIds.length === 2) return;
    if (isOpen(card.id)) return;
    if (isMatched(card.pairKey)) return;
    tap();
    const next = [...openIds, card.id];
    setOpenIds(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [aId, bId] = next;
      const a = cards.find((c) => c.id === aId);
      const b = cards.find((c) => c.id === bId);
      if (a && b && a.pairKey === b.pairKey) {
        sCorrect();
        window.setTimeout(() => {
          setMatched((s) => {
            const ns = new Set(s);
            ns.add(a.pairKey);
            return ns;
          });
          setOpenIds([]);
        }, 380);
      } else {
        sWrong();
        window.setTimeout(() => setOpenIds([]), 700);
      }
    }
  }

  const allMatched = matched.size === allKeys.length;
  const cols = cards.length >= 16 ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        <span>Memory match · {allKeys.length} pairs</span>
        <span>
          {matched.size} ✓ · {moves} moves
        </span>
      </div>

      <div className={cn("grid gap-2", cols)}>
        {cards.map((c) => {
          const open = isOpen(c.id) || isMatched(c.pairKey);
          return (
            <button
              key={c.id}
              type="button"
              disabled={resolved}
              onClick={() => flip(c)}
              className={cn(
                "flex min-h-20 items-center justify-center border-2 border-ink p-2 text-center font-serif text-[12.5px] leading-snug transition-[transform,box-shadow,background] duration-150 ease-snap",
                open
                  ? isMatched(c.pairKey)
                    ? "bg-[color-mix(in_oklab,var(--kenya-green)_18%,var(--surface))] text-ink"
                    : "bg-surface text-ink"
                  : "bg-ink text-paper hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-sm",
              )}
            >
              {open ? c.text : "?"}
            </button>
          );
        })}
      </div>

      {!resolved && allMatched && (
        <ResultBanner
          correct
          title={`All matched in ${moves} moves`}
          actions={
            <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
          }
        />
      )}
    </div>
  );
}
