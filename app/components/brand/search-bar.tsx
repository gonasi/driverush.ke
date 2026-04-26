import * as React from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Search01FreeIcons } from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils";

type SearchBarProps = React.ComponentProps<"input"> & {
  /** Override the default search icon. */
  icon?: IconSvgElement;
  /** Right-side keyboard shortcut hint, e.g. "⌘ K". Set to null to hide. */
  kbd?: React.ReactNode | null;
  /** Wrapper className (the input itself uses `inputClassName`). */
  wrapperClassName?: string;
  inputClassName?: string;
};

/** Bordered search bar with a leading icon and trailing keyboard hint. */
function SearchBar({
  icon = Search01FreeIcons,
  kbd = "⌘ K",
  className,
  wrapperClassName,
  inputClassName,
  type = "search",
  ...props
}: SearchBarProps) {
  return (
    <div
      data-slot="search-bar"
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-2.5 border-2 border-ink bg-surface px-3.5",
        "shadow-[4px_4px_0_var(--line-soft)] transition-[transform,box-shadow] duration-100 ease-snap",
        "focus-within:-translate-x-px focus-within:-translate-y-px focus-within:shadow-stamp-rush",
        wrapperClassName,
        className,
      )}
    >
      <HugeiconsIcon
        icon={icon}
        size={18}
        strokeWidth={2.5}
        className="text-ink-3"
      />
      <input
        type={type}
        className={cn(
          "border-0 bg-transparent py-3.5 text-[14.5px] font-medium text-ink outline-none",
          "placeholder:text-ink-4",
          inputClassName,
        )}
        {...props}
      />
      {kbd && (
        <kbd className="border border-ink-4 bg-paper-3 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-ink-3">
          {kbd}
        </kbd>
      )}
    </div>
  );
}

export { SearchBar };
