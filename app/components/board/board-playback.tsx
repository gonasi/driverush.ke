/**
 * A route played back on the table, one step at a time: what to do, why, and
 * the controls to play, pause, step and scrub. Learn mode uses it for lessons,
 * and the driving tasks use it for "Show me" and "Watch the right way".
 */
import * as React from "react";

import { REVERSE_COLOR, ROUTE_COLOR } from "~/lib/board/lessons";
import { stepPoints, type Route, type RouteStep } from "~/lib/board/network";
import {
  PLAY_RATES,
  cam,
  play,
  useStage,
  type StageLine,
} from "~/lib/board/stage";
import { cn } from "~/lib/utils";

import { Icon } from "~/components/brand/icon";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
} from "~/components/brand/icons";

/** A route as lines for the table: the step in hand bright, the rest dimmed. */
export function routeLines(
  route: Route,
  active: number,
  color: string = ROUTE_COLOR,
): StageLine[] {
  return route.steps.map((step, i) => ({
    id: `${i}`,
    points: stepPoints(route, i),
    color: step.gear === "reverse" ? REVERSE_COLOR : color,
    width: i === active ? 2.4 : 1.8,
    opacity: i === active ? 1 : 0.55,
  }));
}

const CONTROL_LABEL = {
  stop: "Stop line",
  give_way: "Give way",
  crossing: "Crossing",
} as const;

/** The small labels over a step: reverse gear, paint to obey, a rule in doubt. */
export function StepTags({ step }: { step: RouteStep }) {
  return (
    <>
      {step.gear === "reverse" && (
        <span className="rounded-sm bg-rush px-1.5 py-0.5 text-white">
          Reverse
        </span>
      )}
      {step.control && (
        <span className="rounded-sm bg-white/15 px-1.5 py-0.5 text-white">
          {CONTROL_LABEL[step.control]}
        </span>
      )}
    </>
  );
}

/** Said wherever a step rests on a rule a driving school has not confirmed. */
export const UNSURE_NOTE = "Schools differ here. Ask your instructor.";

const iconButton =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-md border-2 border-white/15 bg-white/5 text-white outline-none transition-colors hover:bg-white/15 focus-visible:border-white disabled:opacity-35";

export function BoardPlayback({
  note,
  className,
}: {
  /** Said above the step, such as where a drive went wrong. */
  note?: string | null;
  className?: string;
}) {
  const route = useStage((s) => s.route);
  const playing = useStage((s) => s.playing);
  const rate = useStage((s) => s.rate);
  const index = useStage((s) => s.step);
  const ended = useStage((s) => s.ended);
  const setPlaying = useStage((s) => s.setPlaying);
  const setRate = useStage((s) => s.setRate);
  const seek = useStage((s) => s.seek);
  const toStep = useStage((s) => s.toStep);

  // The slider follows the car without re-rendering on every frame.
  const slider = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    let frame = 0;
    const follow = () => {
      if (slider.current) slider.current.value = String(play.distance);
      if (playing) frame = requestAnimationFrame(follow);
    };
    follow();
    return () => cancelAnimationFrame(frame);
  }, [playing, index, ended, route]);

  // Space plays and pauses, as in any player.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " ") return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName)) {
        return;
      }
      e.preventDefault();
      const stage = useStage.getState();
      stage.setPlaying(!stage.playing);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!route) return null;
  const step = route.steps[index];
  const total = route.steps.length;

  return (
    <div className={cn("grid gap-3", className)}>
      {step && (
        <div aria-live="polite">
          <p className="m-0 flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-kenya-gold">
            Step {index + 1} of {total}
            <StepTags step={step} />
          </p>
          {note && (
            <p className="m-0 mt-1.5 text-[12.5px] font-bold leading-snug text-[#ff9d8a]">
              {note}
            </p>
          )}
          <p className="m-0 mt-1.5 text-[15.5px] font-bold leading-snug text-white">
            {step.title}
          </p>
          <p className="m-0 mt-1 text-[13.5px] leading-snug text-white/80">
            {step.why}
          </p>
          {!step.confirmed && (
            <p className="m-0 mt-1.5 text-[12.5px] font-semibold leading-snug text-kenya-gold">
              {UNSURE_NOTE}
            </p>
          )}
        </div>
      )}

      <input
        ref={slider}
        type="range"
        min={0}
        max={route.length}
        step={0.5}
        defaultValue={0}
        aria-label="Where the car is along the route"
        className="h-6 w-full cursor-pointer accent-[#f6c416]"
        onChange={(e) => {
          setPlaying(false);
          seek(Number(e.target.value));
        }}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous step"
          className={iconButton}
          disabled={index === 0}
          onClick={() => toStep(index - 1)}
        >
          <Icon icon={ChevronLeftIcon} size={18} />
        </button>
        <button
          type="button"
          aria-label={ended ? "Play again" : playing ? "Pause" : "Play"}
          className="inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-md border-2 border-[#f6c416] bg-[#f6c416] text-[#17181b] outline-none transition-colors hover:bg-[#ffd84d] focus-visible:border-white"
          onClick={() => {
            cam.follow = true;
            setPlaying(!playing);
          }}
        >
          <Icon
            icon={ended ? RefreshIcon : playing ? PauseIcon : PlayIcon}
            size={18}
          />
          <span className="ml-2 font-mono text-[11px] font-bold uppercase tracking-widest">
            {ended ? "Again" : playing ? "Pause" : "Play"}
          </span>
        </button>
        <button
          type="button"
          aria-label="Next step"
          className={iconButton}
          disabled={index >= total - 1}
          onClick={() => toStep(index + 1)}
        >
          <Icon icon={ChevronRightIcon} size={18} />
        </button>
        <button
          type="button"
          aria-label={`Playback speed ${rate} times. Change speed.`}
          className={cn(iconButton, "w-14 font-mono text-[12px] font-bold")}
          onClick={() => {
            const next =
              PLAY_RATES[(PLAY_RATES.indexOf(rate as 1) + 1) % PLAY_RATES.length];
            setRate(next);
          }}
        >
          {rate}x
        </button>
      </div>
    </div>
  );
}
