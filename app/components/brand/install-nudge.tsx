/**
 * "Add to home screen", offered once a learner has shown they will come back.
 * It only appears on browsers that hand over an install prompt (Chrome on
 * Android, mostly), and never again once it has been used or closed.
 */
import * as React from "react";

import { Button } from "~/components/ui/button";

const KEY = "driverush:install";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function settled(): boolean {
  try {
    return window.localStorage.getItem(KEY) != null;
  } catch {
    return true;
  }
}

function settle(how: string): void {
  try {
    window.localStorage.setItem(KEY, how);
  } catch {
    // Private mode: it may be offered again, which is harmless.
  }
}

export function InstallNudge({ className }: { className?: string }) {
  const [event, setEvent] = React.useState<InstallEvent | null>(null);

  React.useEffect(() => {
    if (settled()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => {
      settle("installed");
      setEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!event) return null;
  return (
    <div
      className={
        "flex flex-wrap items-center justify-between gap-3 border border-ink/25 bg-surface px-4 py-3 " +
        (className ?? "")
      }
    >
      <p className="m-0 min-w-0 flex-1 text-[14px] font-semibold leading-snug text-ink">
        Keep DriveRush on your home screen, one tap from your next level.
      </p>
      <span className="flex items-center gap-1">
        <Button
          variant="ink"
          onClick={async () => {
            await event.prompt();
            const choice = await event.userChoice;
            settle(choice.outcome);
            setEvent(null);
          }}
        >
          Add it
        </Button>
        <button
          type="button"
          onClick={() => {
            settle("closed");
            setEvent(null);
          }}
          className="min-h-11 px-3 text-[13.5px] font-semibold text-ink-2 underline underline-offset-4 outline-none hover:text-ink focus-visible:text-ink"
        >
          Not now
        </button>
      </span>
    </div>
  );
}
