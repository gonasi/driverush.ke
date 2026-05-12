import * as React from "react";

import { cn } from "~/lib/utils";

type Theme = "light" | "dark";

const STORAGE_KEY = "dr-theme";

/**
 * Inline script for the document <head>. Runs before first paint so the theme
 * is settled with no flash. Honours a saved choice, otherwise the OS setting.
 *
 * @example
 *   // in root.tsx <head>:
 *   <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
 */
const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('${STORAGE_KEY}');var d=t?t==='dark':matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}`;

/**
 * Light/dark switcher — a stamped pill. Reads the current theme off the <html>
 * class (set by {@link THEME_INIT_SCRIPT}), writes the choice to localStorage,
 * and toggles the `dark` class so the brand tokens flip.
 */
function ThemeToggle({ className, ...props }: React.ComponentProps<"div">) {
  const [theme, setTheme] = React.useState<Theme>("light");

  React.useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, []);

  const apply = (next: Theme) => {
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private mode / storage disabled — keep going, just won't persist.
    }
  };

  const btn =
    "inline-flex items-center gap-1.5 px-3.5 py-2 outline-none transition-colors duration-100 ease-snap";

  return (
    <div
      data-slot="theme-toggle"
      role="group"
      aria-label="Theme"
      className={cn(
        "inline-flex overflow-hidden rounded-full border-2 border-ink bg-surface font-display text-[11px] font-extrabold uppercase tracking-wider shadow-stamp",
        className,
      )}
      {...props}
    >
      <button
        type="button"
        aria-pressed={theme === "light"}
        onClick={() => apply("light")}
        className={cn(
          btn,
          theme === "light" ? "bg-ink text-paper" : "text-ink hover:bg-paper-3",
        )}
      >
        ☼ Light
      </button>
      <button
        type="button"
        aria-pressed={theme === "dark"}
        onClick={() => apply("dark")}
        className={cn(
          btn,
          theme === "dark" ? "bg-ink text-paper" : "text-ink hover:bg-paper-3",
        )}
      >
        ☾ Dark
      </button>
    </div>
  );
}

export { ThemeToggle, THEME_INIT_SCRIPT };
