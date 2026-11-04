import { SIGN_ART_BY } from "~/lib/sign-credits";
import { cn } from "~/lib/utils";

/**
 * Credits the sign artwork in plain text. DriveRush has no agreement with Pelican
 * Signs, so this must never read as a partnership or endorsement, and their logo
 * doesn't sit beside our headline.
 */
export function SignCredit({
  onInk = false,
  className,
}: {
  /** For the ink footer band, where the default colour disappears. */
  onInk?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block font-mono text-[10.5px] uppercase tracking-widest",
        onInk ? "text-paper/80" : "text-ink-3",
        className,
      )}
    >
      Sign art by {SIGN_ART_BY}
    </span>
  );
}
