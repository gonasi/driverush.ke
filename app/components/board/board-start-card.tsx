/**
 * The way into the trainer from a board guide: a still of the board and one
 * button, which opens the list of levels.
 */
import { Link } from "react-router";

import { BOARD_LEVELS_PATH } from "~/lib/board-guides";

import { BoardThumb } from "~/components/board/board-thumb";
import { Icon } from "~/components/brand/icon";
import { PlayIcon } from "~/components/brand/icons";

export function BoardStartCard() {
  return (
    <Link
      to={BOARD_LEVELS_PATH}
      className="group grid border-2 border-ink bg-surface shadow-stamp outline-none transition-colors hover:bg-paper-3 focus-visible:bg-paper-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,260px)]"
    >
      <span className="grid content-center gap-2 p-4 sm:p-5">
        <span className="font-display text-[clamp(18px,3vw,24px)] font-extrabold uppercase leading-none tracking-tight text-ink">
          Practise it on the board
        </span>
        <span className="text-[14px] leading-snug text-ink-2">
          Learn the Model Town Board level by level, then drive it and get told
          which rule you broke. Free, no signup.
        </span>
        <span className="mt-1 inline-flex w-fit items-center gap-2 border-2 border-ink bg-rush px-3 py-2 font-display text-[12.5px] font-extrabold uppercase tracking-wider text-white">
          <Icon icon={PlayIcon} size={14} />
          See the levels
        </span>
      </span>
      <BoardThumb
        line={null}
        className="order-first aspect-[5/2] border-b-2 border-ink sm:order-none sm:aspect-auto sm:border-b-0 sm:border-l-2"
      />
    </Link>
  );
}
