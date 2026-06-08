import * as React from "react";

import type {
  BlockRendererProps,
  StoppingDistanceLabData,
} from "~/lib/course-types";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";

const CAR_LENGTH_M = 4;
const REACTION_S = 1.0;

function stoppingFromSpeed(speedKmh: number) {
  const speedMs = speedKmh / 3.6;
  const thinking = speedMs * REACTION_S;
  const braking = (speedMs * speedMs) / (2 * 7);
  const total = thinking + braking;
  return {
    thinking: Math.round(thinking),
    braking: Math.round(braking),
    total: Math.round(total),
    carLengths: Math.round(total / CAR_LENGTH_M),
  };
}

/**
 * `stopping_distance_lab` — informational. Slider for speed; updates thinking,
 * braking, and total stopping distance live with car-length count. Highlights
 * key speeds. Completes after the learner has nudged the slider through at
 * least two highlight speeds.
 */
export function StoppingDistanceLabBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as StoppingDistanceLabData;
  const resolved = status === "complete";
  const highlights = data.highlightSpeeds ?? [30, 50, 80, 100];
  const { tap } = useFeedback();

  const [speed, setSpeed] = React.useState(highlights[0] ?? 50);
  const [touched, setTouched] = React.useState<Set<number>>(
    resolved ? new Set(highlights) : new Set(),
  );
  const sd = stoppingFromSpeed(speed);
  const canAdvance = resolved || touched.size >= 2;

  function onChange(v: number) {
    setSpeed(v);
    if (highlights.includes(v)) {
      setTouched((s) => {
        if (s.has(v)) return s;
        tap();
        const ns = new Set(s);
        ns.add(v);
        return ns;
      });
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-3 gap-3 border-2 border-ink bg-paper-2 p-4">
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Thinking
          </span>
          <p className="m-0 font-display text-2xl font-extrabold text-ink">
            {sd.thinking}m
          </p>
        </div>
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Braking
          </span>
          <p className="m-0 font-display text-2xl font-extrabold text-ink">
            {sd.braking}m
          </p>
        </div>
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Total
          </span>
          <p className="m-0 font-display text-2xl font-extrabold text-rush">
            {sd.total}m
          </p>
        </div>
      </div>

      {data.showCarLengths && (
        <div className="border-2 border-dashed border-ink bg-paper px-4 py-3">
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            Car lengths
          </span>
          <p className="m-0 font-display text-lg font-extrabold text-ink">
            ≈ {sd.carLengths} cars long
          </p>
        </div>
      )}

      <div className="grid gap-2">
        <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          <span>Speed</span>
          <span>
            {speed} {data.unit ?? "km/h"}
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={130}
          step={5}
          value={speed}
          disabled={resolved}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-rush"
          aria-label="Speed slider"
        />
        <div className="flex flex-wrap gap-1 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          {highlights.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onChange(h)}
              disabled={resolved}
              className={`border-2 border-ink px-2 py-1 ${touched.has(h) ? "bg-kenya-green text-kenya-green-foreground" : "bg-surface text-ink"}`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {data.showFormula && (
        <p className="m-0 font-mono text-[11px] leading-snug text-ink-3">
          braking ≈ v² / (2·μ·g) with μ·g ≈ 7 m/s². Thinking = 1s reaction. Real
          conditions add to both.
        </p>
      )}

      {!resolved && canAdvance && (
        <div>
          <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
        </div>
      )}
    </div>
  );
}
