import { HugeiconsIcon } from "@hugeicons/react";
import {
  Configuration01FreeIcons,
  Drag01FreeIcons,
  PlayFreeIcons,
  ShuffleFreeIcons,
  ThreeDViewFreeIcons,
} from "@hugeicons/core-free-icons";

import { useSigns3DStore } from "~/lib/signs-3d-store";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

/**
 * One-time "make it yours" nudge shown the first time a player taps Start on the
 * 3D trainer. Persisted via `settings.hasSeenIntro`; both CTAs flip the flag
 * through `dismissIntro` so it never shows again on this device.
 */
export function Sign3DIntroDialog() {
  const open = useSigns3DStore((s) => s.introOpen);
  const setIntroOpen = useSigns3DStore((s) => s.setIntroOpen);
  const dismissIntro = useSigns3DStore((s) => s.dismissIntro);
  const setSettingsOpen = useSigns3DStore((s) => s.setSettingsOpen);
  const start = useSigns3DStore((s) => s.start);

  const onOpenSettings = () => {
    dismissIntro();
    setSettingsOpen(true);
  };
  const onStart = () => {
    dismissIntro();
    start();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? setIntroOpen(true) : dismissIntro())}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Make it yours</DialogTitle>
          <DialogDescription>
            Each sign appears as a 3D model on its post. Spin it, name it before
            the timer drops, then mark whether you knew it.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ul className="m-0 grid list-none gap-3 p-0">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center border-2 border-ink bg-paper-3 text-ink">
                <HugeiconsIcon
                  icon={Drag01FreeIcons}
                  size={14}
                  strokeWidth={2.5}
                />
              </span>
              <span className="leading-snug">
                <strong className="text-ink">Read it from any angle.</strong>{" "}
                Drag to look around the sign the way you'd see it half-turned on
                the road.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center border-2 border-ink bg-paper-3 text-ink">
                <HugeiconsIcon
                  icon={ThreeDViewFreeIcons}
                  size={14}
                  strokeWidth={2.5}
                />
              </span>
              <span className="leading-snug">
                <strong className="text-ink">Focus a category.</strong> Drill
                the prohibitory circles or the warning triangles on their own.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center border-2 border-ink bg-paper-3 text-ink">
                <HugeiconsIcon
                  icon={ShuffleFreeIcons}
                  size={14}
                  strokeWidth={2.5}
                />
              </span>
              <span className="leading-snug">
                <strong className="text-ink">Shuffled by default.</strong> Every
                run reorders the deck so you learn the signs, not the order.
              </span>
            </li>
          </ul>
          <p className="mt-4 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            You can reopen settings any time from the trainer.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="paper" size="sm" onClick={onOpenSettings}>
            <HugeiconsIcon
              icon={Configuration01FreeIcons}
              size={14}
              strokeWidth={2.5}
            />
            Open settings
          </Button>
          <Button variant="rush" size="sm" onClick={onStart}>
            <HugeiconsIcon icon={PlayFreeIcons} size={14} strokeWidth={2.5} />
            Start practicing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
