import * as React from "react";

import { cn } from "~/lib/utils";

type CodeInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange"
> & {
  /** Number of cells (e.g. 4 for OTP, 7 for plates). */
  length: number;
  /** Controlled value. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  /** Called whenever the value changes. */
  onValueChange?: (value: string) => void;
  /** className for the outer wrapper. */
  className?: string;
  /** className for each cell. */
  cellClassName?: string;
};

/**
 * Stamped code-input cells — used for OTP entry, plate codes, etc.
 * The underlying <input> is visually hidden but stays focused, so cell
 * highlighting reflects real cursor position. Mobile keyboards still pop.
 */
function CodeInput({
  length,
  value,
  defaultValue,
  onValueChange,
  className,
  cellClassName,
  inputMode = "numeric",
  autoComplete = "one-time-code",
  ...props
}: CodeInputProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = (isControlled ? value : internal) ?? "";
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [focused, setFocused] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value.replace(/\s/g, "").slice(0, length);
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  };

  const cells = Array.from({ length }, (_, i) => {
    const char = current[i];
    const isActive = focused && i === current.length;
    const isFilled = char !== undefined;
    return (
      <span
        key={i}
        aria-hidden
        className={cn(
          "flex h-14 w-11 items-center justify-center border-2 border-ink",
          "font-display text-2xl font-extrabold",
          "shadow-[3px_3px_0_var(--line-soft)] transition-shadow duration-100 ease-snap",
          isFilled ? "bg-ink text-paper" : "bg-surface text-ink",
          isActive && "shadow-[3px_3px_0_var(--rush)]",
          cellClassName,
        )}
      >
        {char ?? (isActive ? "_" : "")}
      </span>
    );
  });

  return (
    <div
      data-slot="code-input"
      className={cn("relative inline-flex gap-2", className)}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={length}
        value={current}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="absolute inset-0 cursor-pointer opacity-0"
        {...props}
      />
      {cells}
    </div>
  );
}

export { CodeInput };
