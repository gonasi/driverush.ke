import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlayFreeIcons,
  TickDouble02FreeIcons,
} from "@hugeicons/core-free-icons";

import type { BlockRendererProps, LottieBlockData } from "~/lib/course-types";
import { Button } from "~/components/ui/button";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";

/**
 * `lottie_block` — informational. Poster card that "plays" on tap (no real
 * Lottie runtime — assets aren't authored yet) and reveals the caption + any
 * hotspots so the learner can read them; completes after one play.
 */
export function LottieBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as LottieBlockData;
  const resolved = status === "complete";
  const { tap } = useFeedback();
  const [played, setPlayed] = React.useState(resolved);

  return (
    <div className="grid gap-4">
      <div className="grid justify-items-center gap-3 border-2 border-ink bg-paper-3 px-6 py-10 text-center">
        <span className="flex size-14 items-center justify-center border-2 border-ink bg-surface text-ink">
          <HugeiconsIcon
            icon={played ? TickDouble02FreeIcons : PlayFreeIcons}
            size={24}
            strokeWidth={2.25}
          />
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Animation · {data.lottieId ?? "lottie"}
        </span>
        {data.caption && (
          <p className="m-0 max-w-md font-serif text-[15px] leading-snug text-ink-2">
            {data.caption}
          </p>
        )}
        {data.altText && (
          <p className="m-0 max-w-md text-[12px] leading-relaxed text-ink-3">
            {data.altText}
          </p>
        )}
        {!resolved && !played && (
          <Button
            variant="paper"
            size="sm"
            onClick={() => {
              tap();
              setPlayed(true);
            }}
          >
            <HugeiconsIcon icon={PlayFreeIcons} size={14} strokeWidth={2.5} />
            Play animation
          </Button>
        )}
      </div>

      {(played || resolved) && data.hotspots && data.hotspots.length > 0 && (
        <ul className="grid gap-2 border-2 border-dashed border-ink p-4">
          {data.hotspots.map((h, i) => (
            <li
              key={i}
              className="flex gap-3 font-serif text-[14.5px] text-ink"
            >
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center border-2 border-ink bg-paper font-display text-[11px] font-extrabold">
                {i + 1}
              </span>
              <span className="leading-snug">{h.label}</span>
            </li>
          ))}
        </ul>
      )}

      {!resolved && played && (
        <div>
          <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
        </div>
      )}
    </div>
  );
}
