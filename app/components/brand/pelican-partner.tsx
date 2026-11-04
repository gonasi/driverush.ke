import { PELICAN } from "~/lib/partners";
import { cn } from "~/lib/utils";

/**
 * "In partnership with Pelican Signs", with their logo. The partnership is half
 * the moat, so it sits by the headline on every signs page, not just the footer.
 */
export function PelicanPartner({
  size = "md",
  onInk = false,
  className,
}: {
  size?: "sm" | "md";
  /** For the ink footer band, where the default label colour disappears. */
  onInk?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "font-mono text-[10.5px] uppercase tracking-widest",
          onInk ? "text-paper/80" : "text-ink-3",
        )}
      >
        In partnership with
      </span>
      <span className="inline-flex border-2 border-ink bg-white">
        <img
          src={PELICAN.logo}
          alt={PELICAN.name}
          width={PELICAN.logoWidth}
          height={PELICAN.logoHeight}
          className={cn("block w-auto", size === "md" ? "h-9" : "h-7")}
        />
      </span>
    </span>
  );
}
