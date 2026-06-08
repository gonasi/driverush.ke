import * as React from "react";

import type {
  BlockRendererProps,
  ParkingSimData,
  ParkingSimChallenge,
} from "~/lib/course-types";
import { Button } from "~/components/ui/button";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";

/**
 * `parking_sim` — informational. Lightweight 2D representation: for each
 * challenge, the learner adjusts two sliders (center / angle) until both land
 * inside the target window. Wrong attempts get a feedback banner; correct
 * unlocks the next challenge.
 */
export function ParkingSimBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as ParkingSimData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const [idx, setIdx] = React.useState(0);
  const [cleared, setCleared] = React.useState<Set<string>>(
    resolved ? new Set(data.challenges.map((c) => c.id)) : new Set(),
  );
  const [center, setCenter] = React.useState(20);
  const [angle, setAngle] = React.useState(45);
  const [attempts, setAttempts] = React.useState(0);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const c: ParkingSimChallenge | undefined = data.challenges[idx];
  const targetCenter = 50;
  const targetAngle = c?.type === "flush" ? 0 : 30;
  const centerScore = 1 - Math.min(1, Math.abs(center - targetCenter) / 50);
  const angleScore = 1 - Math.min(1, Math.abs(angle - targetAngle) / 90);
  const overall = (centerScore + angleScore) / 2;

  function tryPark() {
    if (!c) return;
    if (overall >= (c.successThreshold ?? 0.8)) {
      sCorrect();
      setCleared((s) => new Set(s).add(c.id));
      setFeedback("Clean parking. Bay markings respected.");
      window.setTimeout(() => {
        if (idx + 1 < data.challenges.length) {
          setIdx(idx + 1);
          setCenter(20);
          setAngle(45);
          setAttempts(0);
          setFeedback(null);
        }
      }, 1100);
    } else {
      sWrong();
      setAttempts((a) => a + 1);
      const hint =
        centerScore < angleScore
          ? "Centre is off — bring the car closer to the bay midline."
          : "Angle is off — square up with the bay markings.";
      setFeedback(hint);
    }
  }

  const allDone = cleared.size === data.challenges.length;
  const maxAttempts = data.maxAttempts ?? 3;
  const outOfAttempts = attempts >= maxAttempts;

  if (resolved) {
    return (
      <div className="grid gap-3 border-2 border-dashed border-ink bg-paper-3 px-5 py-6 text-center">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Parking sim · {data.mode ?? "challenge"}
        </span>
        <p className="m-0 font-display text-lg font-extrabold uppercase tracking-tight text-ink">
          {data.challenges.length} bays parked
        </p>
      </div>
    );
  }

  if (!c) return null;

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        <span>
          Bay {idx + 1} / {data.challenges.length} · {c.type}
        </span>
        <span>
          {cleared.size} parked · {attempts} / {maxAttempts} attempts
        </span>
      </div>

      <svg
        viewBox="0 0 320 160"
        role="img"
        aria-label="Top-down parking bay"
        className="w-full border-2 border-ink bg-paper"
      >
        <rect
          x="20"
          y="30"
          width="280"
          height="100"
          fill="var(--paper-3)"
          stroke="var(--ink)"
          strokeWidth="2"
        />
        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={i}
            x1={20 + (i + 1) * 56}
            y1={30}
            x2={20 + (i + 1) * 56}
            y2={130}
            stroke="var(--ink)"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
        ))}
        <g
          transform={`translate(${20 + (center / 100) * 280 - 30} 60) rotate(${
            c.type === "angle" ? angle - 30 : angle
          } 30 20)`}
        >
          <rect
            width="60"
            height="40"
            fill="var(--rush)"
            stroke="var(--ink)"
            strokeWidth="2"
          />
          <rect
            x="10"
            y="6"
            width="40"
            height="6"
            fill="var(--paper)"
            opacity="0.6"
          />
        </g>
      </svg>

      <div className="grid gap-3">
        <div>
          <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            <span>Centre offset</span>
            <span>{Math.round(center)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={center}
            onChange={(e) => setCenter(Number(e.target.value))}
            disabled={cleared.has(c.id) || outOfAttempts}
            className="w-full accent-rush"
            aria-label="Centre slider"
          />
        </div>
        <div>
          <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            <span>Angle</span>
            <span>{Math.round(angle)}°</span>
          </div>
          <input
            type="range"
            min={-90}
            max={90}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            disabled={cleared.has(c.id) || outOfAttempts}
            className="w-full accent-rush"
            aria-label="Angle slider"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="rush"
          size="lg"
          onClick={() => {
            tap();
            tryPark();
          }}
          disabled={cleared.has(c.id) || outOfAttempts}
        >
          Park
        </Button>
        {outOfAttempts &&
          !cleared.has(c.id) &&
          idx + 1 < data.challenges.length && (
            <Button
              variant="paper"
              size="sm"
              onClick={() => {
                setIdx(idx + 1);
                setCenter(20);
                setAngle(45);
                setAttempts(0);
                setFeedback(null);
              }}
            >
              Skip to next bay
            </Button>
          )}
      </div>

      {feedback && (
        <p className="m-0 border-l-4 border-ink bg-paper-2 px-4 py-2 font-serif text-[14px] leading-snug text-ink-2">
          {feedback}
        </p>
      )}

      {allDone && (
        <ResultBanner
          correct
          title="All bays parked"
          actions={
            <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
          }
        />
      )}

      {!allDone && cleared.size + attempts >= data.challenges.length * 3 && (
        <div>
          <BlockActionButton
            onClick={() => onAdvance()}
            isLast={isLast}
            label="Continue anyway"
          />
        </div>
      )}
    </div>
  );
}
