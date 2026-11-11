/**
 * Reading that is folded away until asked for, so a page that is for doing
 * something stays short. It is a native <details>: the text is in the server's
 * HTML whether open or not, which is what search engines read, and it opens
 * without JavaScript.
 *
 * A link to a heading inside a fold opens the fold first (`useHashOpens`),
 * so nothing that used to be reachable by `#anchor` is lost.
 */
import * as React from "react";

import { cn } from "~/lib/utils";

/** Open every fold around the element the address's `#hash` names. */
function openHashTarget() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  let changed = false;
  for (let el: HTMLElement | null = target; el; el = el.parentElement) {
    if (el instanceof HTMLDetailsElement && !el.open) {
      el.open = true;
      changed = true;
    }
  }
  // The browser tried to scroll before the fold was open, and got nowhere.
  if (changed) target.scrollIntoView({ block: "start" });
}

/** Call once on a page that has folds. */
export function useHashOpens() {
  React.useEffect(() => {
    openHashTarget();
    window.addEventListener("hashchange", openHashTarget);
    return () => window.removeEventListener("hashchange", openHashTarget);
  }, []);
}

export function GuideFold({
  title,
  hint,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"details">, "title"> & {
  /** What is inside, as a learner would ask for it. */
  title: React.ReactNode;
  /** A few words beside the title, such as how long the reading is. */
  hint?: React.ReactNode;
}) {
  return (
    <details
      data-slot="guide-fold"
      className={cn(
        "group scroll-mt-20 border border-ink/25 bg-surface",
        className,
      )}
      {...props}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 outline-none transition-colors hover:bg-paper-2 focus-visible:bg-paper-2 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-display text-[15px] font-extrabold uppercase leading-tight tracking-tight text-ink">
            {title}
          </span>
          {hint && (
            <span className="mt-0.5 block text-[13px] leading-snug text-ink-2">
              {hint}
            </span>
          )}
        </span>
        <span
          aria-hidden
          className="shrink-0 font-display text-[22px] font-extrabold leading-none text-rush before:content-['+'] group-open:before:content-['−']"
        />
      </summary>
      <div className="border-t border-ink/15 px-4 pb-5 pt-1">{children}</div>
    </details>
  );
}
