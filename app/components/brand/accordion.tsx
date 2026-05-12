import * as React from "react";

import { cn } from "~/lib/utils";

/** Container for {@link AccordionItem}s — one bordered, stacked group. */
function Accordion({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="accordion"
      className={cn("border-2 border-ink bg-surface", className)}
      {...props}
    />
  );
}

type AccordionItemProps = Omit<React.ComponentProps<"details">, "title"> & {
  /** Summary line — always visible. */
  summary: React.ReactNode;
};

/**
 * One expandable row. Built on native <details>/<summary>, so it works without
 * JS; open state flips the summary to a rush band and swaps the +/− marker.
 */
function AccordionItem({
  className,
  summary,
  children,
  ...props
}: AccordionItemProps) {
  return (
    <details
      data-slot="accordion-item"
      className={cn(
        "border-b-2 border-ink last:border-b-0",
        "[&[open]>summary]:bg-rush [&[open]>summary]:text-white",
        "[&[open]>summary]:after:text-white [&[open]>summary]:after:content-['−']",
        className,
      )}
      {...props}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-[18px] py-3.5 font-display text-sm font-bold uppercase tracking-[0.04em] after:font-display after:text-[22px] after:font-extrabold after:leading-none after:text-rush after:content-['+'] [&::-webkit-details-marker]:hidden">
        {summary}
      </summary>
      <div className="border-t border-dashed border-ink px-[18px] py-4 font-serif text-base leading-normal text-ink-2">
        {children}
      </div>
    </details>
  );
}

export { Accordion, AccordionItem };
