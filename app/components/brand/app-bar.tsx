import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "~/lib/utils";

import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

type AppBarProps = React.ComponentProps<"header"> & {
  /** Override the brand mark; defaults to the official DriveRush lockup. */
  brand?: React.ReactNode;
  /** Desktop nav slot — typically <AppBarLink>s. Hidden below `md`. */
  nav?: React.ReactNode;
  /** Right-side slot — primary action, mobile menu trigger, avatar, etc. */
  trailing?: React.ReactNode;
  /** Show the light/dark switcher in the trailing cluster. Default `true`. */
  themeToggle?: boolean;
};

/**
 * Sticky top navigation. A full-bleed bar pinned to the viewport top with a
 * single 2px ink underline — no boxed border. Brand, nav and trailing actions
 * sit in a centered max-width row. The `nav` slot is desktop-only; pass a
 * mobile menu trigger through `trailing` for small screens.
 *
 * Override `position` via `className` (e.g. `static`) when embedding in a
 * showcase rather than at the top of a page.
 *
 * Carries the light/dark switcher on the right by default — it's the one place
 * it lives now, so it stays out of the games. Pass `themeToggle={false}` to
 * drop it.
 */
function AppBar({
  className,
  brand,
  nav,
  trailing,
  themeToggle = true,
  ...props
}: AppBarProps) {
  return (
    <header
      data-slot="app-bar"
      className={cn(
        "sticky top-0 z-40 w-full border-b-2 border-ink bg-surface",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-5 sm:px-9">
        <div className="flex flex-1 items-center">
          {brand ?? <Logo variant="plain" height={40} themed priority />}
        </div>
        {nav && <nav className="hidden items-center gap-1 md:flex">{nav}</nav>}
        <div className="flex flex-1 items-center justify-end gap-2">
          {themeToggle && <ThemeToggle />}
          {trailing}
        </div>
      </div>
    </header>
  );
}

type AppBarLinkProps = React.ComponentProps<"a"> & {
  /** Render the styling onto the child element (e.g. a router <Link>). */
  asChild?: boolean;
  /** Current-page styling — drops a rush rail under the item. */
  active?: boolean;
};

/**
 * Nav link for use inside `<AppBar nav={…}>`. The active state renders a 3px
 * rush rail flush with the AppBar's bottom ink border, so the indicator reads
 * as a tab marker on the bar rather than a coloured block over the link.
 */
function AppBarLink({
  className,
  asChild = false,
  active = false,
  ...props
}: AppBarLinkProps) {
  const Comp = asChild ? Slot.Root : "a";
  return (
    <Comp
      data-slot="app-bar-link"
      data-active={active || undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex items-center border-2 border-transparent px-3 py-2",
        "font-display text-[11px] font-bold uppercase tracking-wider text-ink-2",
        "outline-none transition-colors duration-100 ease-snap",
        "hover:text-ink focus-visible:border-ink focus-visible:bg-paper-3 focus-visible:text-ink",
        // Active rail: bottom-edge bar in rush red, inset to the text padding
        // (`inset-x-3`) and dropped 2px below the link so it meets the
        // AppBar's own `border-b-2 border-ink` flush.
        active &&
          "text-ink after:pointer-events-none after:absolute after:inset-x-3 after:-bottom-[10px] after:h-[3px] after:bg-rush",
        className,
      )}
      {...props}
    />
  );
}

export { AppBar, AppBarLink };
