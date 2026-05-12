import { cn } from "~/lib/utils";

/** Brutalist loading spinner — a spinning ink-bordered square + a mono caption. */
export function Spinner({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="size-8 animate-spin border-2 border-ink border-t-transparent" />
      {label && (
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          {label}
        </span>
      )}
    </div>
  );
}
