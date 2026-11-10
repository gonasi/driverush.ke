/**
 * Shown in a trainer's answer sheet after "Missed it": how to remember the sign
 * and the one it's confused with, or the class rule when the sign has no guide.
 * Shared by both trainers.
 */
import { Link } from "react-router";

import type { MissTip as Tip } from "~/lib/miss-tips";
import { signPagePath } from "~/lib/road-sign-pages";

import { SignImage } from "~/components/brand/sign-image";

const LABEL = "m-0 font-mono text-[10px] uppercase tracking-widest text-ink-3";

export function MissTip({ tip }: { tip: Tip }) {
  return (
    <div className="space-y-3 border-2 border-ink bg-paper-2 p-3">
      {tip.remember ? (
        <div className="space-y-1">
          <p className={LABEL}>How to remember it</p>
          <p className="m-0 text-[13.5px] leading-snug text-ink">
            {tip.remember}
          </p>
        </div>
      ) : (
        tip.classRule && (
          <div className="space-y-1">
            <p className={LABEL}>Read the shape first</p>
            <p className="m-0 text-[13.5px] leading-snug text-ink">
              {tip.classRule}
            </p>
          </div>
        )
      )}
      {tip.lookAlike && (
        <div className="space-y-1.5">
          <p className={LABEL}>Don't mix it up with</p>
          <div className="flex items-start gap-2.5">
            <SignImage
              sign={tip.lookAlike.sign}
              label={tip.lookAlike.sign.name}
              className="size-12 shrink-0 border-2 border-ink"
            />
            <div className="min-w-0 space-y-0.5">
              <p className="m-0 text-[13px] leading-snug">
                <Link
                  to={signPagePath(tip.lookAlike.sign)}
                  target="_blank"
                  className="font-semibold text-ink underline underline-offset-2"
                >
                  {tip.lookAlike.sign.name}
                </Link>
                {tip.lookAlike.sign.code && (
                  <span className="ml-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-3">
                    {tip.lookAlike.sign.code}
                  </span>
                )}
              </p>
              <p className="m-0 text-[13px] leading-snug text-ink-2">
                {tip.lookAlike.how}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
