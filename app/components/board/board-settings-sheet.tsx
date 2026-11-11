/**
 * The board's settings: which side of the table you stand at, lane assist and
 * sound. Opened from the gear button while driving.
 */
import * as React from "react";

import { fullBoardSvg } from "~/lib/board/full-board";
import type { Seat } from "~/lib/board/joystick";
import { useBoardStore } from "~/lib/board-store";
import { cn } from "~/lib/utils";

import { RoadIcon, SoundIcon } from "~/components/brand/icons";
import { SettingSection, ToggleRow } from "~/components/brand/setting-controls";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";

const SEAT_LABEL: Record<Seat, string> = {
  north: "Top",
  west: "Left",
  east: "Right",
  south: "Bottom",
};

/** The board, small, as it lies on the table: the bottom side nearest. */
const TABLE = fullBoardSvg({ numbers: false });

function SeatButton({
  seat,
  current,
  onPick,
  className,
}: {
  seat: Seat;
  current: Seat;
  onPick: (seat: Seat) => void;
  className?: string;
}) {
  const active = seat === current;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onPick(seat)}
      className={cn(
        "border-2 border-ink px-3 py-2 font-display text-[12px] font-extrabold uppercase tracking-wider outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink",
        active
          ? "bg-kenya-gold text-kenya-gold-foreground shadow-stamp"
          : "bg-surface text-ink hover:bg-paper-3",
        className,
      )}
    >
      {SEAT_LABEL[seat]}
    </button>
  );
}

export function BoardSettingsSheet({
  open,
  onOpenChange,
  seat,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where the learner stands now, chosen or not. */
  seat: Seat;
}) {
  const settings = useBoardStore((s) => s.settings);
  const setSetting = useBoardStore((s) => s.setSetting);
  const pick = (next: Seat) => setSetting({ seat: next });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md p-0">
        <SheetHeader>
          <SheetTitle>Board settings</SheetTitle>
        </SheetHeader>

        <SheetBody className="space-y-4 p-4">
          <SettingSection
            title="Where you stand at the table"
            description={`Now: ${SEAT_LABEL[seat]}`}
          >
            <div className="grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-2.5">
              <SeatButton
                seat="north"
                current={seat}
                onPick={pick}
                className="col-start-2"
              />
              <SeatButton
                seat="west"
                current={seat}
                onPick={pick}
                className="col-start-1 row-start-2 justify-self-end"
              />
              <div
                aria-hidden
                className="col-start-2 row-start-2 w-24 border-2 border-ink [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: TABLE }}
              />
              <SeatButton
                seat="east"
                current={seat}
                onPick={pick}
                className="col-start-3 row-start-2 justify-self-start"
              />
              <SeatButton
                seat="south"
                current={seat}
                onPick={pick}
                className="col-start-2 row-start-3"
              />
            </div>
            <p className="m-0 text-[12.5px] leading-snug text-ink-2">
              You see the board from that side, like walking round the table. Up
              on the stick is always away from you.
            </p>
          </SettingSection>

          <SettingSection title="Driving">
            <ToggleRow
              label="Lane assist"
              description="Holds the car in the lane you are following. Point the stick at another lane or an exit and it lets go."
              icon={RoadIcon}
              checked={settings.assist ?? true}
              onCheckedChange={(assist) => setSetting({ assist })}
            />
            <ToggleRow
              label="Sound"
              icon={SoundIcon}
              checked={settings.sound}
              onCheckedChange={(sound) => setSetting({ sound })}
            />
          </SettingSection>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="rush"
            size="lg"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Back to the board
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
