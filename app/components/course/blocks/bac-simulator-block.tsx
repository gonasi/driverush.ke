import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertDiamondFreeIcons } from "@hugeicons/core-free-icons";

import type { BlockRendererProps, BacSimulatorData } from "~/lib/course-types";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";

const ALCOHOL_PER_DRINK_G = 14;
const TBW_MALE = 0.68;
const ELIM_PER_HOUR = 0.015;

function widmark(drinks: number, weightKg: number, hours: number) {
  const grams = drinks * ALCOHOL_PER_DRINK_G;
  const bac = (grams / (weightKg * 1000 * TBW_MALE)) * 100;
  const after = Math.max(0, bac - hours * ELIM_PER_HOUR);
  return Math.round(after * 100) / 100;
}

function effectsFor(bac: number): { tag: string; text: string }[] {
  if (bac >= 0.15)
    return [
      {
        tag: "Severe",
        text: "Major loss of motor control. Vomit risk. Likely blackout.",
      },
    ];
  if (bac >= 0.1)
    return [
      {
        tag: "Major",
        text: "Slurred speech, impaired reaction by 35-40%, poor coordination.",
      },
    ];
  if (bac >= 0.08)
    return [
      {
        tag: "Illegal in KE",
        text: "Reaction time 25% slower. Steering and braking impaired.",
      },
    ];
  if (bac >= 0.05)
    return [
      {
        tag: "Risky",
        text: "Mood loosens, vision narrows, multi-tasking degrades.",
      },
    ];
  if (bac >= 0.02)
    return [
      {
        tag: "Subtle",
        text: "Mild relaxation. Visual tracking starts to slip.",
      },
    ];
  return [{ tag: "Below threshold", text: "No measurable impairment." }];
}

/**
 * `bac_simulator` — informational. Inputs for drinks, weight, hours. Estimates
 * BAC with the Widmark formula (rough) and lists likely effects + a
 * "Drive now?" warning above the legal limit. Completes after at least one
 * adjustment.
 */
export function BacSimulatorBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as BacSimulatorData;
  const resolved = status === "complete";
  const limit = data.legalLimitKE ?? 0.08;
  const driveThreshold = data.driveSimPromptThreshold ?? 0.06;
  const { tap } = useFeedback();

  const [drinks, setDrinks] = React.useState(2);
  const [weight, setWeight] = React.useState(75);
  const [hours, setHours] = React.useState(1);
  const [touched, setTouched] = React.useState(resolved);

  const bac = widmark(drinks, weight, hours);
  const overLimit = bac >= limit;
  const showDrive = data.driveSimulation && bac >= driveThreshold;
  const effects = effectsFor(bac);

  function nudge(setter: (v: number) => void, value: number) {
    tap();
    setter(value);
    setTouched(true);
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 border-2 border-ink bg-paper-2 p-4 sm:grid-cols-3">
        <NumberRow
          label="Drinks (standard)"
          value={drinks}
          min={0}
          max={10}
          onChange={(v) => nudge(setDrinks, v)}
          disabled={resolved}
        />
        <NumberRow
          label="Weight (kg)"
          value={weight}
          min={40}
          max={130}
          step={5}
          onChange={(v) => nudge(setWeight, v)}
          disabled={resolved}
        />
        <NumberRow
          label="Hours since first"
          value={hours}
          min={0}
          max={8}
          onChange={(v) => nudge(setHours, v)}
          disabled={resolved}
        />
      </div>

      <div
        className={`grid gap-2 border-2 border-ink px-4 py-3 ${overLimit ? "bg-[color-mix(in_oklab,var(--rush)_14%,var(--surface))]" : "bg-paper"}`}
      >
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          Estimated BAC
        </span>
        <p
          className={`m-0 font-display text-3xl font-extrabold ${overLimit ? "text-rush" : "text-ink"}`}
        >
          {bac.toFixed(2)}%
        </p>
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
          Kenya limit: {limit.toFixed(2)}%
        </span>
      </div>

      {data.showEffectsList && (
        <ul className="grid gap-1.5">
          {effects.map((e, i) => (
            <li
              key={i}
              className="border-l-4 border-ink bg-paper-2 px-3 py-2 font-serif text-[14px] leading-snug text-ink-2"
            >
              <strong className="text-ink">{e.tag}:</strong> {e.text}
            </li>
          ))}
        </ul>
      )}

      {showDrive && (
        <div className="grid gap-1 border-2 border-ink bg-[color-mix(in_oklab,var(--rush)_14%,var(--surface))] px-4 py-3">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-rush">
            <HugeiconsIcon
              icon={AlertDiamondFreeIcons}
              size={12}
              strokeWidth={2.5}
            />
            Drive now?
          </span>
          <p className="m-0 font-serif text-[14.5px] leading-snug text-ink">
            At {bac.toFixed(2)}% you'd be{" "}
            {overLimit ? "over the legal limit" : "close enough to the limit"}{" "}
            for police to act on the ALCOBLOW. There is no safe drive at this
            level. Call a cab. Wait it out.
          </p>
        </div>
      )}

      {!resolved && touched && (
        <div>
          <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
        </div>
      )}
    </div>
  );
}

function NumberRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={disabled || value <= min}
          className="size-8 border-2 border-ink bg-surface font-display text-lg font-extrabold text-ink disabled:opacity-40"
        >
          −
        </button>
        <span className="flex-1 text-center font-display text-xl font-extrabold tabular-nums text-ink">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={disabled || value >= max}
          className="size-8 border-2 border-ink bg-surface font-display text-lg font-extrabold text-ink disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
