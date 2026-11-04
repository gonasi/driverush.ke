import { SIGN_BRAND } from "~/lib/sign-credits";
import { cn } from "~/lib/utils";

/**
 * "Featuring Pelican Signs", with their logo. They agreed to this for the
 * promotion, so it's visible by design. Wording rules: `~/lib/sign-credits`.
 */
export function SignCredit({
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
        Featuring
      </span>
      <span className="inline-flex border-2 border-ink bg-white">
        <img
          src={SIGN_BRAND.logo}
          alt={SIGN_BRAND.name}
          width={SIGN_BRAND.logoWidth}
          height={SIGN_BRAND.logoHeight}
          className={cn("block w-auto", size === "md" ? "h-9" : "h-7")}
        />
      </span>
    </span>
  );
}
