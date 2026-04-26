import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "~/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative h-7 w-full grow overflow-hidden border-2 border-ink bg-paper-3 shadow-stamp-sm",
          // Tick gradient — matches the speedometer feel.
          "bg-[repeating-linear-gradient(90deg,var(--ink)_0_1px,transparent_1px_10%)] bg-[length:100%_100%]",
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-[repeating-linear-gradient(45deg,var(--rush)_0_6px,var(--rush-deep)_6px_12px)]"
        />
      </SliderPrimitive.Track>
      {_values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          data-slot="slider-thumb"
          className={cn(
            "block h-8 w-3.5 -translate-y-px border-2 border-ink bg-ink",
            "outline-none transition-shadow duration-100 ease-snap",
            "focus-visible:shadow-stamp-rush",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
