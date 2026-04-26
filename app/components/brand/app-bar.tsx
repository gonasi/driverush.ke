import * as React from "react";

import { cn } from "~/lib/utils";

import { Logo } from "./logo";

type AppBarProps = React.ComponentProps<"header"> & {
  /** Override the brand mark; defaults to the official DR monogram logo. */
  brand?: React.ReactNode;
  /** Center nav slot — typically <NavLink>s. */
  nav?: React.ReactNode;
  /** Right-side slot — streak/XP tags, avatar, etc. */
  trailing?: React.ReactNode;
};

/** Top navigation shell. Brand mark · nav · trailing actions. */
function AppBar({ className, brand, nav, trailing, ...props }: AppBarProps) {
  return (
    <header
      data-slot="app-bar"
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-3.5 border-2 border-ink bg-surface px-3.5 py-2.5",
        className,
      )}
      {...props}
    >
      <div className="shrink-0">
        {brand ?? <Logo variant="main" height={72} priority />}
      </div>
      {nav && (
        <nav className="inline-flex items-center gap-1 justify-self-center">
          {nav}
        </nav>
      )}
      {trailing && (
        <div className="inline-flex items-center gap-2 justify-self-end">
          {trailing}
        </div>
      )}
    </header>
  );
}

type AppBarLinkProps = React.ComponentProps<"a"> & {
  active?: boolean;
};

/** Nav link for use inside <AppBar nav={…}>. Active inverts to ink/paper. */
function AppBarLink({ className, active = false, ...props }: AppBarLinkProps) {
  return (
    <a
      data-slot="app-bar-link"
      data-active={active || undefined}
      className={cn(
        "border-2 border-transparent px-3 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-ink-2",
        "outline-none transition-colors duration-100 ease-snap",
        "hover:text-ink focus-visible:bg-paper-3 focus-visible:text-ink",
        active && "bg-ink text-paper hover:text-paper",
        className,
      )}
      {...props}
    />
  );
}

export { AppBar, AppBarLink };
