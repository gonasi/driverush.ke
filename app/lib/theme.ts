import * as React from "react";

/**
 * Light/dark theme — a deliberately tiny system. There's no provider and no
 * library: the active theme is just a `dark` class on <html>, stamped before
 * the first paint by {@link THEME_INIT_SCRIPT} so there's never a flash. The
 * OS setting is the default; the moment the user picks a side we remember it
 * in localStorage and stop following the OS.
 */

export type Theme = "light" | "dark";

/** localStorage key holding the user's explicit choice (`"light"` | `"dark"`). */
export const THEME_STORAGE_KEY = "dr-theme";

const MEDIA = "(prefers-color-scheme: dark)";

/**
 * Inline `<head>` script. Runs synchronously before the first paint: honours a
 * saved choice, otherwise the OS `prefers-color-scheme`, then stamps both the
 * `dark` class and `color-scheme` onto <html> so the brand tokens flip *and*
 * native chrome (scrollbars, date pickers) matches.
 *
 * @example
 *   // in root.tsx <head>:
 *   <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
 */
export const THEME_INIT_SCRIPT = `try{var k='${THEME_STORAGE_KEY}',s=localStorage.getItem(k),d=s?s==='dark':matchMedia('${MEDIA}').matches,e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}`;

/** The theme currently applied to the document (read off the <html> class). */
export function getActiveTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** The OS preference, or `"light"` when it can't be read. */
function systemTheme(): Theme {
  return typeof window !== "undefined" && window.matchMedia(MEDIA).matches
    ? "dark"
    : "light";
}

/** True once the user has explicitly chosen — then we stop tracking the OS. */
function hasStoredTheme(): boolean {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) != null;
  } catch {
    return false;
  }
}

/** Apply a theme to the document. `persist: false` skips writing localStorage. */
export function applyTheme(theme: Theme, { persist = true } = {}) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.classList.toggle("dark", theme === "dark");
  el.style.colorScheme = theme;
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // private mode / storage off — the choice just won't survive a reload.
    }
  }
}

/** Flip light↔dark, remember the new choice, and return it. */
export function toggleTheme(): Theme {
  const next: Theme = getActiveTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

/**
 * Keep the document theme in step with the world while a page is open: follow
 * live OS changes (until the user makes a choice) and mirror choices made in
 * other tabs. Mount once, high in the tree — see `root.tsx`.
 */
export function useThemeSync() {
  React.useEffect(() => {
    const mq = window.matchMedia(MEDIA);

    const onOSChange = () => {
      if (!hasStoredTheme()) {
        applyTheme(mq.matches ? "dark" : "light", { persist: false });
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== THEME_STORAGE_KEY) return;
      const v = e.newValue;
      applyTheme(v === "dark" || v === "light" ? v : systemTheme(), {
        persist: false,
      });
    };

    mq.addEventListener("change", onOSChange);
    window.addEventListener("storage", onStorage);
    return () => {
      mq.removeEventListener("change", onOSChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
}
