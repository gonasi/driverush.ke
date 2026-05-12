import * as React from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import { cn } from "~/lib/utils";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";

/**
 * Shared brutalist settings widgets — used by `/tools/image-coords`'s playback
 * panel and the Pelican trainer's settings sheet. Sharp 2px-ink borders,
 * mono/display type, dim-when-disabled.
 */

/** A titled, bordered group of settings rows. */
export function SettingSection({
  title,
  description,
  icon,
  action,
  disabled = false,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: IconSvgElement;
  /** Right-aligned control in the header (e.g. a master toggle). */
  action?: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("border-2 border-ink bg-surface", className)}
      data-disabled={disabled || undefined}
    >
      <header className="flex items-start justify-between gap-3 border-b-2 border-ink bg-paper-3 px-3.5 py-2.5">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-display text-[12px] font-extrabold uppercase tracking-wider text-ink">
            {icon && <HugeiconsIcon icon={icon} size={14} strokeWidth={2.25} />}
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-widest text-ink-3">
              {description}
            </p>
          )}
        </div>
        {action}
      </header>
      <div
        className={cn(
          "space-y-2.5 p-3.5 transition-opacity duration-150",
          disabled && "pointer-events-none opacity-40",
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** Label + optional description (+ icon) on the left, a `Switch` on the right. */
export function ToggleRow({
  label,
  description,
  icon,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: IconSvgElement;
  checked: boolean;
  onCheckedChange: (b: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 border-2 border-ink bg-surface px-3 py-2.5",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <span className="flex min-w-0 items-start gap-2.5">
        {icon && (
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center border-2 border-ink bg-paper-3 text-ink">
            <HugeiconsIcon icon={icon} size={14} strokeWidth={2.25} />
          </span>
        )}
        <span className="min-w-0">
          <span className="block font-display text-[11.5px] font-bold uppercase tracking-wider text-ink-2">
            {label}
          </span>
          {description && (
            <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-3">
              {description}
            </span>
          )}
        </span>
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </label>
  );
}

/** Label + current-value readout, a `Slider` beneath. */
export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  format,
  onValueChange,
  disabled = false,
}: {
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  /** Override the readout, e.g. `(v) => `${Math.round(v * 100)}%``. */
  format?: (v: number) => string;
  onValueChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-1.5",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="font-mono text-[10.5px] tracking-widest text-ink-3">
          {format ? format(value) : `${value}${unit ?? ""}`}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([n]) => onValueChange(n ?? value)}
        className="py-2"
      />
    </div>
  );
}

/** Label + a shadcn `Select`. */
export function SelectRow<T extends string>({
  label,
  value,
  options,
  onValueChange,
  disabled = false,
}: {
  label: React.ReactNode;
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onValueChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-1.5",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => onValueChange(v as T)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Label + a numeric `Input`. */
export function NumberRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  onValueChange,
  disabled = false,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-1.5",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <Label>
        {label}
        {hint && (
          <span className="ml-1.5 font-mono text-[9.5px] font-normal normal-case tracking-normal text-ink-3">
            {hint}
          </span>
        )}
      </Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return;
          onValueChange(Number(v));
        }}
      />
    </div>
  );
}

/** Small pill toggle — used for multi-select chips (e.g. category pickers). */
export function ChipToggle({
  active,
  onToggle,
  disabled = false,
  children,
}: {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "border-2 border-ink px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-widest outline-none transition-colors",
        "focus-visible:shadow-stamp-rush",
        "disabled:pointer-events-none disabled:opacity-40",
        active
          ? "bg-ink text-paper"
          : "bg-surface text-ink-3 hover:bg-paper-3 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
