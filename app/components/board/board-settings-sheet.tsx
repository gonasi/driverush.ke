/**
 * The board's settings: which side of the table you stand at, which car you
 * drive, how sharp the picture is, lane assist and sound. Opened from the gear button while driving.
 */
import * as React from "react";

import {
  BOARD_CARS,
  type BoardCarId,
  type BoardCarSetting,
} from "~/lib/board/cars";
import { fullBoardSvg } from "~/lib/board/full-board";
import type { Seat } from "~/lib/board/joystick";
import { useBoardStore, type BoardQuality } from "~/lib/board-store";
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

const CAR_CHOICES: { value: BoardCarSetting; label: string }[] = [
  { value: "random", label: "Surprise me" },
  ...BOARD_CARS.map((car) => ({ value: car.id, label: car.label })),
];
const CAR_LABEL = Object.fromEntries(
  BOARD_CARS.map((car) => [car.id, car.label]),
) as Record<BoardCarId, string>;

const PICTURE_CHOICES: { value: BoardQuality; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "low", label: "Smooth" },
  { value: "high", label: "Sharp" },
];

const CHOICE =
  "min-h-11 min-w-[5.5rem] border-2 border-ink px-3 py-2 font-display text-[13px] font-extrabold uppercase tracking-wider outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink";
const CHOICE_ON = "bg-kenya-gold text-kenya-gold-foreground shadow-stamp";
const CHOICE_OFF = "bg-surface text-ink hover:bg-paper-3";

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
      className={cn(CHOICE, active ? CHOICE_ON : CHOICE_OFF, className)}
    >
      {SEAT_LABEL[seat]}
    </button>
  );
}

export function BoardSettingsSheet({
  open,
  onOpenChange,
  seat,
  car,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where the learner stands now, chosen or not. */
  seat: Seat;
  /** The car on the table now, chosen or drawn for this visit. */
  car: BoardCarId;
}) {
  const settings = useBoardStore((s) => s.settings);
  const setSetting = useBoardStore((s) => s.setSetting);
  const pick = (next: Seat) => setSetting({ seat: next });
  const carChoice = settings.car ?? "random";

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

          <SettingSection
            title="Your car"
            description={`Now: ${CAR_LABEL[car]}`}
          >
            <div className="grid grid-cols-2 gap-2.5">
              {CAR_CHOICES.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  aria-pressed={choice.value === carChoice}
                  onClick={() => setSetting({ car: choice.value })}
                  className={cn(
                    CHOICE,
                    choice.value === carChoice ? CHOICE_ON : CHOICE_OFF,
                  )}
                >
                  {choice.label}
                </button>
              ))}
            </div>
            <p className="m-0 text-[12.5px] leading-snug text-ink-2">
              The cars only look different. They are the same size and drive
              the same way. Surprise me picks one each time you visit.
            </p>
          </SettingSection>

          <SettingSection title="Picture">
            <div className="grid grid-cols-3 gap-2.5">
              {PICTURE_CHOICES.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  aria-pressed={choice.value === settings.quality}
                  onClick={() => setSetting({ quality: choice.value })}
                  className={cn(
                    CHOICE,
                    "min-w-0",
                    choice.value === settings.quality ? CHOICE_ON : CHOICE_OFF,
                  )}
                >
                  {choice.label}
                </button>
              ))}
            </div>
            <p className="m-0 text-[12.5px] leading-snug text-ink-2">
              Smooth drops the shadows and the fine detail, for a phone that
              stutters. Sharp keeps them. Auto picks for your phone.
            </p>
          </SettingSection>

          <SettingSection title="Driving">
            <ToggleRow
              label="Lane assist"
              description="Holds the car in the lane you are following, and steers it into or out of a parking bay when you reverse. Point the stick somewhere else and it lets go."
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
