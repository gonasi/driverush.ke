import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02FreeIcons, Sun03FreeIcons } from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils";
import { toggleTheme } from "~/lib/theme";

import { Button } from "~/components/ui/button";

/**
 * Light/dark switcher — a single stamped icon button sized to sit beside the
 * `sm` buttons in {@link AppBar}. Shows the sun in light mode, the moon in
 * dark; one tap flips it. Both glyphs are rendered and CSS reveals the live
 * one off the `dark` class on <html> (set by `THEME_INIT_SCRIPT`), so there's
 * no hydration flash and no React state to keep in sync. See `lib/theme`.
 */
function ThemeToggle({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="paper"
      size="sm"
      data-slot="theme-toggle"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      onClick={() => toggleTheme()}
      className={cn("w-8 px-0", className)}
    >
      <HugeiconsIcon
        icon={Sun03FreeIcons}
        size={16}
        strokeWidth={2.25}
        className="dark:hidden"
      />
      <HugeiconsIcon
        icon={Moon02FreeIcons}
        size={16}
        strokeWidth={2.25}
        className="hidden dark:block"
      />
    </Button>
  );
}

export { ThemeToggle };
