/**
 * The road sign for the paint ahead, shown while it matters. As the car comes
 * up to a give way line, a stop line or a pedestrian crossing on its task's
 * route, the sign and what it means appear, and they stay until the car has
 * gone by.
 *
 * It reads the car a few times a second, not every frame: a sign does not need
 * to be quicker than that, and the drive stays out of React.
 */
import * as React from "react";

import type { BoardChallenge } from "~/lib/board/challenges";
import { challengeRoute } from "~/lib/board/lessons";
import { distanceNear, type Control } from "~/lib/board/network";
import { car } from "~/lib/board/runtime";
import { signPageBySlug } from "~/lib/road-sign-pages";

import { SignImage } from "~/components/brand/sign-image";

const CUES: Record<Control, { slug: string; name: string; means: string }> = {
  give_way: {
    slug: "give-way",
    name: "Give way",
    means:
      "Slow down. Traffic on the road you are joining goes first. Stop only if you need to.",
  },
  stop: {
    slug: "stop",
    name: "Stop",
    means:
      "Stop at the line every time, even when the road is clear. Go when it is safe.",
  },
  crossing: {
    slug: "pedestrian-crossing",
    name: "Pedestrian crossing",
    means: "Slow down and be ready to stop. People on the crossing go first.",
  },
};

/** The sign shows from this far before the paint, in metres. */
const AHEAD = 18;
/** Further from the route than this, the car is not coming up to it at all. */
const NEARBY = 7;

function cueFor(challenge: BoardChallenge): Control | null {
  const route = challengeRoute(challenge);
  if (!route) return null;
  const at = distanceNear(route, car);
  const here = route.points.reduce(
    (best, p) => Math.min(best, Math.hypot(p.x - car.x, p.z - car.z)),
    Infinity,
  );
  if (here > NEARBY) return null;
  const step = route.steps.find(
    (s) => s.control && at > s.from - AHEAD && at < s.to,
  );
  return step?.control ?? null;
}

export function BoardSignCue({
  challenge,
  active,
}: {
  challenge: BoardChallenge;
  /** The learner is driving. */
  active: boolean;
}) {
  const [control, setControl] = React.useState<Control | null>(null);
  React.useEffect(() => {
    if (!active) {
      setControl(null);
      return;
    }
    const read = () => setControl(cueFor(challenge));
    read();
    const id = window.setInterval(read, 200);
    return () => window.clearInterval(id);
  }, [active, challenge]);

  if (!control) return null;
  const cue = CUES[control];
  const sign = signPageBySlug(cue.slug);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[15.5rem] z-20 flex justify-center px-3 sm:bottom-[16.5rem]">
      <div
        key={control}
        role="status"
        className="dr-rise flex max-w-sm items-center gap-3 rounded-md border-2 border-white/25 bg-[#101114]/92 px-3 py-2.5 text-white shadow-[0_4px_0_rgba(0,0,0,0.45)]"
      >
        {sign && (
          <SignImage
            sign={sign}
            className="size-16 shrink-0 overflow-hidden rounded-sm"
          />
        )}
        <div className="min-w-0">
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-widest text-kenya-gold">
            Sign ahead
          </p>
          <p className="m-0 mt-0.5 text-[15px] font-bold leading-snug">
            {cue.name}
          </p>
          <p className="m-0 mt-0.5 text-[13px] leading-snug text-white/85">
            {cue.means}
          </p>
        </div>
      </div>
    </div>
  );
}
