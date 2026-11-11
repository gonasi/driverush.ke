/**
 * Frames a second, in a corner, for checking the board on a real phone. Off
 * unless the page was opened with `?fps=1`. It counts the browser's own
 * frames, so it reads low when the phone cannot keep up with the table.
 */
import * as React from "react";

export function BoardFps() {
  const [on, setOn] = React.useState(false);
  const label = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    setOn(new URLSearchParams(window.location.search).get("fps") === "1");
  }, []);

  React.useEffect(() => {
    if (!on) return;
    let frame = 0;
    let count = 0;
    let since = performance.now();
    let worst = 0;
    let last = since;
    const tick = (now: number) => {
      count += 1;
      worst = Math.max(worst, now - last);
      last = now;
      if (now - since >= 500) {
        if (label.current) {
          const fps = Math.round((count * 1000) / (now - since));
          label.current.textContent = `${fps} fps · slowest frame ${Math.round(worst)} ms`;
        }
        count = 0;
        worst = 0;
        since = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [on]);

  if (!on) return null;
  return (
    <span
      ref={label}
      aria-hidden
      className="pointer-events-none absolute bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-2 z-40 rounded-sm bg-black/75 px-2 py-1 font-mono text-[11px] font-bold tabular-nums text-[#7dffa0]"
    >
      measuring
    </span>
  );
}
