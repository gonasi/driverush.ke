/**
 * Shown when the referee stops the learner: the rule that was broken and what
 * to do instead. The board's twin of `brand/miss-tip.tsx`, in the same clothes.
 */
import { RULES_SOURCE, type FaultTip } from "~/lib/board/board-rules";

const LABEL = "m-0 font-mono text-[10px] uppercase tracking-widest text-ink-3";

export function BoardFaultTip({ tip }: { tip: FaultTip }) {
  return (
    <div className="space-y-3 border-2 border-ink bg-paper-2 p-3 text-left">
      <div className="space-y-1">
        <p className={LABEL}>Why you were stopped</p>
        <p className="m-0 text-[13.5px] leading-snug text-ink">{tip.reason}</p>
      </div>
      <div className="space-y-1">
        <p className={LABEL}>The rule</p>
        <p className="m-0 text-[13.5px] font-semibold leading-snug text-ink">
          {tip.rule}
        </p>
        <p className="m-0 text-[11.5px] leading-snug text-ink-3">
          From the {RULES_SOURCE}.
        </p>
      </div>
    </div>
  );
}
