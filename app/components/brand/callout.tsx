import * as React from "react";
import { Icon } from "~/components/brand/icon";
import { InfoIcon, type IconDef } from "~/components/brand/icons";
import { SignIcon } from "~/components/brand/art/sign-glyphs";

import { cn } from "~/lib/utils";

type CalloutProps = React.ComponentProps<"div"> & {
  icon?: IconDef;
  iconLabel?: string;
};

/**
 * Cream highlight box with a dark icon stamp, for guidance copy.
 *
 * The cream surface stays light in both themes, so its border, icon block and
 * text are pinned to the fixed ink ramp (`ink-900` / `cream-foreground`) rather
 * than the theme-flipping `ink` token — otherwise dark mode would put light
 * text and a light icon block on the light cream.
 */
function Callout({
  className,
  icon = InfoIcon,
  iconLabel,
  children,
  ...props
}: CalloutProps) {
  return (
    <div
      data-slot="callout"
      className={cn(
        "grid grid-cols-[auto_1fr] items-center gap-4 border-2 border-ink-900 bg-cream px-5 py-4",
        className,
      )}
      {...props}
    >
      <span
        aria-label={iconLabel}
        className="flex size-14 items-center justify-center border-2 border-ink-900 bg-ink-900 text-cream"
      >
        {icon.sign ? (
          <SignIcon name={icon.sign} size={34} />
        ) : (
          <Icon icon={icon} size={26} />
        )}
      </span>
      <div className="font-serif text-lg leading-snug text-cream-foreground">
        {children}
      </div>
    </div>
  );
}

export { Callout };
