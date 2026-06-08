import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertDiamondFreeIcons,
  CheckmarkCircle02FreeIcons,
} from "@hugeicons/core-free-icons";

import type {
  BlockRendererProps,
  InspectionChecklistData,
} from "~/lib/course-types";
import { cn } from "~/lib/utils";
import { useFeedback } from "~/lib/use-feedback";
import { BlockActionButton } from "../block-action-button";
import { ResultBanner } from "../result-banner";

/**
 * `inspection_checklist` — informational. Tap each point to reveal its status
 * (OK or fault) and the inspector's note. Completes when every point has been
 * tapped at least once.
 */
export function InspectionChecklistBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const data = block.data as InspectionChecklistData;
  const resolved = status === "complete";
  const { tap, correct: sCorrect, wrong: sWrong } = useFeedback();

  const [tapped, setTapped] = React.useState<Set<string>>(
    resolved ? new Set(data.inspectionPoints.map((p) => p.id)) : new Set(),
  );

  function reveal(id: string, isFault: boolean) {
    if (resolved || tapped.has(id)) return;
    if (isFault) sWrong();
    else sCorrect();
    setTapped((s) => {
      const ns = new Set(s);
      ns.add(id);
      return ns;
    });
  }

  React.useEffect(() => {
    if (tapped.size === 0) tap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allTapped = tapped.size === data.inspectionPoints.length;
  const faults = data.inspectionPoints.filter((p) => p.status === "fault");
  const found = faults.filter((p) => tapped.has(p.id));

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        <span>
          Walk-around · {data.view ?? "exterior"} · {data.vehicle ?? "vehicle"}
        </span>
        <span>
          {tapped.size} / {data.inspectionPoints.length}
        </span>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {data.inspectionPoints.map((p) => {
          const isFault = p.status === "fault";
          const open = tapped.has(p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => reveal(p.id, isFault)}
                disabled={resolved}
                className={cn(
                  "grid w-full gap-1.5 border-2 border-ink p-4 text-left transition-[background,box-shadow,transform] duration-100 ease-snap",
                  open
                    ? isFault
                      ? "bg-[color-mix(in_oklab,var(--rush)_14%,var(--surface))]"
                      : "bg-[color-mix(in_oklab,var(--kenya-green)_14%,var(--surface))]"
                    : "bg-surface hover:-translate-x-px hover:-translate-y-px hover:shadow-stamp-sm",
                )}
              >
                <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                  {open ? (
                    <>
                      <HugeiconsIcon
                        icon={
                          isFault
                            ? AlertDiamondFreeIcons
                            : CheckmarkCircle02FreeIcons
                        }
                        size={12}
                        strokeWidth={2.5}
                      />
                      {isFault ? "Fault found" : "OK"}
                    </>
                  ) : (
                    "Tap to inspect"
                  )}
                </span>
                <span className="font-display text-[15px] font-extrabold uppercase tracking-tight text-ink">
                  {p.label}
                </span>
                {open && (
                  <p className="m-0 font-serif text-[14px] leading-snug text-ink-2">
                    {isFault ? p.faultDescription : p.okDescription}
                  </p>
                )}
                {open && isFault && p.safetyNote && (
                  <p className="m-0 mt-1 border-l-4 border-rush pl-2 font-serif text-[13px] leading-snug text-ink-2">
                    {p.safetyNote}
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {(resolved || allTapped) && data.feedbackOnComplete && (
        <div className="border-2 border-ink bg-paper-2 px-5 py-4">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Inspection summary
          </div>
          <p className="m-0 font-serif text-[15px] leading-snug text-ink">
            {data.feedbackOnComplete}
          </p>
          {faults.length > 0 && (
            <p className="m-0 mt-2 font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
              Faults found: {found.length} / {faults.length}
            </p>
          )}
        </div>
      )}

      {!resolved && allTapped && (
        <ResultBanner
          correct
          title="Walk-around complete"
          actions={
            <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
          }
        />
      )}
    </div>
  );
}
