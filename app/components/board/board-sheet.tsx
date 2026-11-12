/**
 * The board's popups: stopped by the examiner, passed, watching the right
 * way, and the question before leaving. One dark card rising from the bottom
 * of the screen, so all of them look alike, sit in the same place, never grow
 * past what a phone can show, and leave the table free to be slid and zoomed
 * beside them.
 */
import * as React from "react";

import { cn } from "~/lib/utils";

type Tone = "fault" | "pass" | "watch" | "ask";

const STRIP: Record<Tone, string> = {
  fault: "bg-rush text-white",
  pass: "bg-kenya-green text-kenya-green-foreground",
  watch: "border-b-2 border-white/15 text-white/70",
  ask: "border-b-2 border-white/15 text-white/70",
};

export function BoardSheet({
  tone,
  strip,
  children,
  className,
  ...props
}: {
  tone: Tone;
  /** The line across the top that says what this is. */
  strip: React.ReactNode;
  children: React.ReactNode;
} & Omit<React.ComponentProps<"div">, "children">) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-8">
      <div
        {...props}
        className={cn(
          // Every popup in the game is one dark card. `dark` turns the brand's
          // own colours over inside it, so buttons and text made for paper
          // read correctly here whatever theme the site is in.
          "dark dr-sheet pointer-events-auto flex max-h-[62dvh] w-full max-w-md flex-col overflow-hidden rounded-md border-2 shadow-[0_6px_0_rgba(0,0,0,0.45)]",
          tone === "watch"
            ? "border-white/20 bg-[#101114]/95 text-white"
            : "border-white/20 bg-[#101114]/95 text-ink",
          className,
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-3 px-4 py-2 font-mono text-[10.5px] font-bold uppercase tracking-widest",
            STRIP[tone],
          )}
        >
          {strip}
        </div>
        <div className="grid min-h-0 gap-3 overflow-y-auto overscroll-contain p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
