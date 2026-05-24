import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01FreeIcons, Tick02FreeIcons } from "@hugeicons/core-free-icons";

import type { McqOption } from "~/lib/course-types";
import { cn } from "~/lib/utils";

/** "Why?" sheet body for choice questions — each option, marked, with its reason. */
export function McqWhy({
  options,
  note,
}: {
  options: McqOption[];
  note?: string;
}) {
  return (
    <div className="grid gap-3">
      {note && (
        <p className="m-0 font-serif text-[15px] leading-relaxed text-ink-2">
          {note}
        </p>
      )}
      <div className="grid gap-2.5">
        {options.map((o) => (
          <div
            key={o.id}
            className={cn(
              "grid grid-cols-[18px_1fr] gap-2.5 border-l-2 pl-3",
              o.correct ? "border-kenya-green" : "border-line-soft",
            )}
          >
            <span
              className={cn(
                "mt-0.5",
                o.correct ? "text-kenya-green" : "text-ink-3",
              )}
            >
              <HugeiconsIcon
                icon={o.correct ? Tick02FreeIcons : Cancel01FreeIcons}
                size={15}
                strokeWidth={2.75}
              />
            </span>
            <div>
              <p className="m-0 font-semibold text-[14.5px] text-ink">
                {o.text}
              </p>
              {o.feedback && (
                <p className="m-0 mt-0.5 font-serif text-[14px] leading-snug text-ink-2">
                  {o.feedback}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
