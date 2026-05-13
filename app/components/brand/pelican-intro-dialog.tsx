import { HugeiconsIcon } from "@hugeicons/react";
import {
  Configuration01FreeIcons,
  FocusPointFreeIcons,
  PlayFreeIcons,
  ShuffleFreeIcons,
  TrafficLightFreeIcons,
} from "@hugeicons/core-free-icons";

import { usePelicanStore } from "~/lib/pelican-store";

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
 * One-time "make it yours" nudge shown the first time a player taps Start on
 * the Pelican trainer. Persisted via `settings.hasSeenIntro`; both CTAs flip
 * the flag through `dismissIntro` so it never shows again on this device.
 */
export function PelicanIntroDialog() {
  const open = usePelicanStore((s) => s.introOpen);
  const setIntroOpen = usePelicanStore((s) => s.setIntroOpen);
  const dismissIntro = usePelicanStore((s) => s.dismissIntro);
  const setSettingsOpen = usePelicanStore((s) => s.setSettingsOpen);
  const start = usePelicanStore((s) => s.start);

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
            Tweak the trainer first if you want to drill a specific corner of
            the deck, or jump straight in.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ul className="m-0 grid list-none gap-3 p-0">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center border-2 border-ink bg-paper-3 text-ink">
                <HugeiconsIcon
                  icon={TrafficLightFreeIcons}
                  size={14}
                  strokeWidth={2.5}
                />
              </span>
              <span className="leading-snug">
                <strong className="text-ink">Focus a category.</strong> Practise
                warning signs only, or just the prohibitory circles you keep
                mixing up.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center border-2 border-ink bg-paper-3 text-ink">
                <HugeiconsIcon
                  icon={FocusPointFreeIcons}
                  size={14}
                  strokeWidth={2.5}
                />
              </span>
              <span className="leading-snug">
                <strong className="text-ink">Pace yourself.</strong> Slow the
                reveal timer, or switch to tap-to-reveal for an open-book pass.
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
                run reorders the deck so you learn the signs, not the positions.
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
