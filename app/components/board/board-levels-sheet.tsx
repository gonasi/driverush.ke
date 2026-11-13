/**
 * Every level, over the game: the same picker as the levels page, opened from
 * inside a level so a learner can move to any other without leaving. The
 * level before and the level after are one tap away at the top. Picking a
 * level takes the place of the one that was open, so Close still leaves the
 * game in one step.
 */
import { Link } from "react-router";

import { BOARD_PLAY_PATH, levelHref } from "~/lib/board-guides";
import {
  COURSE_LEVELS,
  levelAfter,
  levelBefore,
  type Level,
} from "~/lib/board/curriculum";
import { cn } from "~/lib/utils";

import { LevelPicker } from "~/components/board/level-picker";
import { Icon } from "~/components/brand/icon";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from "~/components/brand/icons";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";

const step =
  "inline-flex min-h-11 min-w-0 flex-1 items-center gap-1.5 rounded-soft border border-ink/25 bg-surface px-3 text-[13px] font-bold text-ink no-underline outline-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2";

const hrefOf = (level: Level) =>
  level.kind === "mock" ? BOARD_PLAY_PATH : levelHref(level.id);

export default function BoardLevelsSheet({
  open,
  onOpenChange,
  level,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The level the game is on. */
  level: Level;
}) {
  const before = levelBefore(level);
  const after = levelAfter(level);
  const close = () => onOpenChange(false);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        aria-describedby={undefined}
        // `dark` turns the brand's colours over, as on every popup in the game.
        className="dark h-[92dvh] max-h-[92dvh] border-x-0 border-b-0 border-white/20 bg-background text-ink shadow-none"
      >
        <header className="flex items-center justify-between gap-3 border-b border-ink/15 px-4 py-2.5">
          <div className="min-w-0">
            <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-3">
              {level.kind === "mock"
                ? "Mock test"
                : `Level ${level.n} of ${COURSE_LEVELS.length}`}
            </p>
            <SheetTitle className="text-[19px] leading-tight tracking-tight text-ink">
              All levels
            </SheetTitle>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-soft border border-ink/25 text-ink outline-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2"
          >
            <Icon icon={CloseIcon} size={20} />
          </button>
        </header>
        {(before || after) && (
          <nav
            aria-label="The level before and the level after"
            className="flex gap-2 border-b border-ink/15 px-4 py-2.5"
          >
            {before ? (
              <Link to={hrefOf(before)} replace onClick={close} className={step}>
                <Icon icon={ChevronLeftIcon} size={16} className="shrink-0" />
                <span className="truncate">
                  {before.n}. {before.title}
                </span>
              </Link>
            ) : (
              <span className="flex-1" />
            )}
            {after ? (
              <Link
                to={hrefOf(after)}
                replace
                onClick={close}
                className={cn(step, "justify-end text-right")}
              >
                <span className="truncate">
                  {after.kind === "mock"
                    ? "Mock test"
                    : `${after.n}. ${after.title}`}
                </span>
                <Icon icon={ChevronRightIcon} size={16} className="shrink-0" />
              </Link>
            ) : (
              <span className="flex-1" />
            )}
          </nav>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <LevelPicker
            current={level.id}
            replace
            reveal
            onPick={close}
            className="mx-auto max-w-5xl"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
