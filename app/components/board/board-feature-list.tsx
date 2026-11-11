/**
 * Every part of the board a learner has to be able to name, with what it asks
 * of the driver. The words are the ones the trainer's Learn cards use
 * (`features.ts`), so the guide and the game always say the same thing.
 */
import { Link } from "react-router";

import { BOARD_FEATURES } from "~/lib/board/features";

export function BoardFeatureList() {
  return (
    <dl className="my-6 grid gap-4">
      {BOARD_FEATURES.map((feature) => (
        <div
          key={feature.id}
          id={feature.id}
          className="scroll-mt-20 border-l-2 border-rush pl-4"
        >
          <dt className="font-display text-[15px] font-extrabold uppercase leading-tight tracking-tight text-ink">
            {feature.name}
          </dt>
          <dd className="m-0 mt-1 text-[15.5px] leading-relaxed text-ink-2">
            {feature.note}
            {feature.sign && (
              <>
                {" "}
                <Link to={feature.sign.to}>
                  The {feature.sign.label} sign
                </Link>
                .
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
