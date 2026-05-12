import * as React from "react";

import { cn } from "~/lib/utils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type CalendarProps = React.ComponentProps<"div"> & {
  /** 1–12. */
  month: number;
  /** Full year, e.g. 2026. */
  year: number;
  /** Right-side mono note, e.g. "EXAM IN 18 DAYS". */
  note?: React.ReactNode;
  /** Day-of-month numbers (this month) that count toward a streak. */
  streakDays?: number[];
  /** Today's day-of-month (this month). */
  today?: number;
  /** Day-of-month marked as the exam (this month). */
  examDay?: number;
};

/**
 * Static month calendar — streak days in amber, today in rush, an exam marker
 * in ink. Monday-first, with prev/next-month spillover dimmed. Read-only; this
 * is the "exam countdown" surface, not a date picker.
 */
function Calendar({
  className,
  month,
  year,
  note,
  streakDays = [],
  today,
  examDay,
  ...props
}: CalendarProps) {
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrev = new Date(year, month - 1, 0).getDate();
  // JS getDay(): 0=Sun … 6=Sat. We want Monday=0 … Sunday=6.
  const lead = (first.getDay() + 6) % 7;

  const cells: { n: number; dim: boolean }[] = [];
  for (let i = lead - 1; i >= 0; i--)
    cells.push({ n: daysInPrev - i, dim: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ n: d, dim: false });
  while (cells.length % 7 !== 0)
    cells.push({ n: cells.length - lead - daysInMonth + 1, dim: true });

  const streak = new Set(streakDays);

  return (
    <div
      data-slot="calendar"
      className={cn("border-2 border-ink bg-surface p-[18px]", className)}
      {...props}
    >
      <div className="mb-3.5 flex items-center justify-between border-b-2 border-ink pb-2 font-display text-base font-extrabold uppercase">
        <span>
          {MONTHS[month - 1]} · {year}
        </span>
        {note != null && (
          <span className="font-mono text-[10.5px] tracking-wider text-rush">
            {note}
          </span>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div
            key={i}
            className="border-b border-dashed border-ink py-1.5 text-center font-mono text-[9.5px] uppercase tracking-wider text-ink-3"
          >
            {d}
          </div>
        ))}
        {cells.map((c, i) => {
          const isToday = !c.dim && c.n === today;
          const isExam = !c.dim && c.n === examDay;
          const isStreak = !c.dim && streak.has(c.n);
          return (
            <div
              key={i}
              className={cn(
                "relative flex aspect-square items-center justify-center border-2 border-ink bg-surface font-mono text-xs font-bold tabular-nums",
                c.dim && "border-line-soft text-ink-4",
                isStreak && "bg-amber text-ink",
                isExam && "bg-ink text-paper",
                isToday && "bg-rush text-white shadow-[3px_3px_0_var(--ink)]",
              )}
            >
              {c.n}
              {isExam && (
                <span
                  aria-hidden
                  className="absolute bottom-0.5 right-[3px] text-[8px]"
                >
                  ★
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { Calendar };
