/**
 * Shown when the referee stops the learner: the rule that was broken and what
 * to do instead. The board's twin of `brand/miss-tip.tsx`, in the same clothes.
 * A drive that left its route broke no rule, so there it says where the car
 * left and what the task asked for.
 */
import { RULES_SOURCE, type FaultTip } from "~/lib/board/board-rules";

const LABEL = "m-0 font-mono text-[10px] uppercase tracking-widest text-ink-3";

export function BoardFaultTip({
  tip,
  offRoute,
}: {
  tip: FaultTip;
  /** The car left the task's route. Nobody stopped it, and no rule was broken. */
  offRoute?: boolean;
}) {
  return (
    <div className="space-y-3 border-2 border-ink bg-paper-2 p-3 text-left">
      <div className="space-y-1">
        <p className={LABEL}>
          {offRoute ? "Where you left the route" : "Why you were stopped"}
        </p>
        <p className="m-0 text-[13.5px] leading-snug text-ink">{tip.reason}</p>
      </div>
      <div className="space-y-1">
        <p className={LABEL}>{offRoute ? "What to do" : "The rule"}</p>
        <p className="m-0 text-[13.5px] font-semibold leading-snug text-ink">
          {tip.rule}
        </p>
        <p className="m-0 text-[11.5px] leading-snug text-ink-3">
          {tip.source ? `${tip.source}.` : `From the ${RULES_SOURCE}.`}
        </p>
      </div>
    </div>
  );
}
