import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertDiamondFreeIcons,
  PlayFreeIcons,
  RefreshFreeIcons,
} from "@hugeicons/core-free-icons";

import type {
  BlockRendererProps,
  HazardPerceptionClipData,
} from "~/lib/course-types";
import { Button } from "~/components/ui/button";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";

const SCENARIO_COPY: Record<string, string> = {
  parked_car_pedestrian:
    "Quiet street. Cars parked tight on the left. The pedestrian appears between two of them.",
  child_at_school:
    "Approaching a school zone. Several pupils on the kerb. One steps off without looking.",
  truck_blind_spot:
    "Trailing a lorry on a single carriage. A motorbike is creeping up its blind side.",
  fog_brake:
    "Rural road, patchy fog. Brake lights appear and disappear in the murk ahead.",
};

/**
 * `hazard_perception_clip` — informational. No real video — we time the
 * scenario in text, then ask the learner to tap when they "see" the hazard. A
 * tap inside the score window is a clean spot; too early is a guess; too late
 * (or missed) is a fail.
 */
export function HazardPerceptionClipBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as HazardPerceptionClipData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const [playing, setPlaying] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [tappedAt, setTappedAt] = React.useState<number | null>(null);
  const [ended, setEnded] = React.useState(resolved);

  const blurb =
    SCENARIO_COPY[data.scenario] ??
    "A road scene unfolds. Watch for the hazard.";

  React.useEffect(() => {
    if (!playing || ended) return;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const e = (performance.now() - start) / 1000;
      setElapsed(e);
      if (e >= data.durationSeconds) {
        setPlaying(false);
        setEnded(true);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, ended, data.durationSeconds]);

  function flag() {
    if (!playing || tappedAt !== null) return;
    setTappedAt(elapsed);
    const diff = elapsed - data.hazardAppearsAt;
    if (diff >= 0 && diff <= data.scoreWindowSeconds) sCorrect();
    else sWrong();
  }

  function replay() {
    tap();
    setPlaying(true);
    setElapsed(0);
    setTappedAt(null);
    setEnded(false);
  }

  if (resolved) {
    return (
      <div className="grid gap-3 border-2 border-dashed border-ink bg-paper-3 px-5 py-6 text-center">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Hazard perception · {data.scenario}
        </span>
        <p className="m-0 font-serif text-[15px] leading-snug text-ink">
          {blurb}
        </p>
      </div>
    );
  }

  const progressPct = Math.min(100, (elapsed / data.durationSeconds) * 100);
  const inWindow =
    tappedAt !== null &&
    tappedAt - data.hazardAppearsAt >= 0 &&
    tappedAt - data.hazardAppearsAt <= data.scoreWindowSeconds;
  const tooEarly = tappedAt !== null && tappedAt < data.hazardAppearsAt;
  const missed = ended && tappedAt === null;

  return (
    <div className="grid gap-4">
      <div className="grid gap-2 border-2 border-ink bg-paper-2 p-4">
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Scenario · {data.durationSeconds}s
        </span>
        <p className="m-0 font-serif text-[15px] leading-snug text-ink">
          {blurb}
        </p>
      </div>

      <div className="h-2 w-full border-2 border-ink bg-paper">
        <div
          className="h-full bg-rush"
          style={{ width: `${progressPct}%`, transition: "width 80ms linear" }}
        />
      </div>

      {!playing && !ended && (
        <Button
          variant="rush"
          size="lg"
          onClick={() => {
            tap();
            setPlaying(true);
          }}
        >
          <HugeiconsIcon icon={PlayFreeIcons} size={14} strokeWidth={2.5} />
          Start clip
        </Button>
      )}

      {playing && (
        <Button
          variant="paper"
          size="lg"
          onClick={flag}
          disabled={tappedAt !== null}
        >
          <HugeiconsIcon
            icon={AlertDiamondFreeIcons}
            size={14}
            strokeWidth={2.5}
          />
          {tappedAt !== null
            ? `Flagged at ${tappedAt.toFixed(1)}s`
            : "Tap when you see the hazard"}
        </Button>
      )}

      {ended && (
        <>
          {inWindow && (
            <ResultBanner
              correct
              title={`Spotted at ${tappedAt!.toFixed(1)}s`}
              description={`Hazard appeared at ${data.hazardAppearsAt}s. Average driver reacts in ${data.averageReactionSeconds ?? 2.1}s.`}
              actions={
                <BlockActionButton
                  onClick={() => onAdvance()}
                  isLast={isLast}
                />
              }
            />
          )}
          {tooEarly && (
            <ResultBanner
              correct={false}
              title="Too early"
              description="You flagged before the hazard appeared. Try the clip again — wait for the moment."
              actions={
                <Button variant="paper" size="sm" onClick={replay}>
                  <HugeiconsIcon
                    icon={RefreshFreeIcons}
                    size={14}
                    strokeWidth={2.5}
                  />
                  Replay
                </Button>
              }
            />
          )}
          {!inWindow && !tooEarly && (
            <ResultBanner
              correct={false}
              title={missed ? "Missed it" : "Outside the window"}
              description={`Hazard appeared at ${data.hazardAppearsAt}s. You had ${data.scoreWindowSeconds}s.`}
              actions={
                <Button variant="paper" size="sm" onClick={replay}>
                  <HugeiconsIcon
                    icon={RefreshFreeIcons}
                    size={14}
                    strokeWidth={2.5}
                  />
                  Replay
                </Button>
              }
            />
          )}
          {!inWindow && !tooEarly && !missed && (
            <div>
              <BlockActionButton
                onClick={() => onAdvance()}
                isLast={isLast}
                label="Continue anyway"
              />
            </div>
          )}
          {missed && (
            <div>
              <BlockActionButton
                onClick={() => onAdvance()}
                isLast={isLast}
                label="Continue anyway"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
