import { cn } from "~/lib/utils";

/**
 * The recall timer: a thin bar pinned to the top of the trainer. The drain is a
 * single CSS animation, so nothing re-renders while it runs. It mounts when the
 * timer starts and unmounts on pause or reveal, so it always starts full.
 */
export function RevealCountdown({
  seconds,
  live = true,
}: {
  seconds: number;
  /** False while the 3D sign is still loading: hold a full bar until it appears. */
  live?: boolean;
}) {
  return (
    <div
      role="timer"
      aria-label="Time left to recall this sign"
      className="pointer-events-none absolute inset-x-0 top-0 z-30 h-1.5 bg-ink/25"
    >
      <div
        className={cn("h-full bg-rush", live && "dr-drain")}
        style={{ animationDuration: `${seconds}s` }}
      />
    </div>
  );
}
