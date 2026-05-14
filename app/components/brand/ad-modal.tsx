import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02FreeIcons } from "@hugeicons/core-free-icons";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from "~/components/ui/dialog";
import { useAdEngine } from "~/lib/ads/ad-context";
import { MIN_DISPLAY_MS } from "~/lib/ads/ad-constants";

import { AdRenderer } from "./ad-renderer";

import "./ad-modal.css";

/**
 * The single ad surface in the app. Subscribes to the engine; opens when
 * `state.isOpen`. Built on the existing Dialog primitive so it inherits the
 * house look (DR titlebar, 2px border, stamped shadow, motion).
 *
 * Policy-shaped:
 *  - "DR · SPONSORED" titlebar so the modal is clearly distinguishable from
 *    app dialogs.
 *  - Adjacent "Advertisement" label inside the body (rendered by AdRenderer).
 *  - For the first MIN_DISPLAY_MS the X is *hidden*, the Continue button is
 *    replaced by a live countdown ("Continue in 9s"), and Escape /
 *    pointer-outside dismissal are blocked. After the grace, full normal
 *    dismissibility (X, Continue, Escape, click-outside) returns.
 *  - Continue is physically separated from the ad surface (dashed footer
 *    rule) so a stray click on the ad can't accidentally close.
 */

const GRACE_SECONDS = Math.ceil(MIN_DISPLAY_MS / 1000);
/** Tick at ~4Hz — smoother visual countdown without burning a frame. */
const COUNTDOWN_INTERVAL_MS = 250;

export function AdModal() {
  const { state, dismiss } = useAdEngine();
  const isOpen = state.isOpen;

  // Whole-second display for the countdown chip. Starts at GRACE_SECONDS,
  // ticks down to 0; when it hits 0 the controls flip to their active form.
  const [secondsLeft, setSecondsLeft] = React.useState(GRACE_SECONDS);

  React.useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(GRACE_SECONDS);
      return;
    }
    setSecondsLeft(GRACE_SECONDS);
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remainingMs = Math.max(0, MIN_DISPLAY_MS - elapsed);
      const remainingS = Math.ceil(remainingMs / 1000);
      setSecondsLeft(remainingS);
      if (remainingMs <= 0) window.clearInterval(id);
    }, COUNTDOWN_INTERVAL_MS);
    return () => window.clearInterval(id);
    // Re-run per impression so the grace resets cleanly on each open.
  }, [isOpen, state.triggerSeq]);

  const canDismiss = secondsLeft === 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (next) return;
        // Block dismiss attempts (Escape, X, click-outside) during the grace.
        // After the grace this delegates to the engine like normal.
        if (!canDismiss) return;
        dismiss();
      }}
    >
      {isOpen && state.currentSlot ? (
        <DialogContent
          titlebarLabel="DR · SPONSORED"
          closeAriaLabel="Close advertisement"
          // Hide the titlebar X entirely until the grace elapses. The
          // visible countdown chip in the footer carries the affordance.
          showCloseButton={canDismiss}
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => {
            if (!canDismiss) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (!canDismiss) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (!canDismiss) e.preventDefault();
          }}
        >
          {/* Screen-reader-only title so Radix can satisfy its a11y
              requirement without showing a duplicate heading. The visible
              "DR · SPONSORED" titlebar is decorative; this is the semantic
              name announced to assistive tech. */}
          <DialogTitle className="sr-only">Advertisement</DialogTitle>
          {/* Visible grace-period progress bar. Drains left-to-right over
              MIN_DISPLAY_MS so the wait reads as bounded and intentional —
              not as the modal being broken. Keyed on triggerSeq so each
              new impression restarts the animation cleanly. Hidden once
              the grace elapses to avoid a stale 0%-width line. */}
          {!canDismiss && <GraceProgressBar key={state.triggerSeq} />}
          <DialogBody className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
            <AdRenderer
              slot={state.currentSlot}
              triggerSeq={state.triggerSeq}
            />
          </DialogBody>
          <DialogFooter>
            {canDismiss ? (
              <Button variant="rush" size="lg" onClick={() => dismiss()}>
                Continue
                <HugeiconsIcon
                  icon={ArrowRight02FreeIcons}
                  size={16}
                  strokeWidth={2.5}
                />
              </Button>
            ) : (
              <CountdownChip seconds={secondsLeft} />
            )}
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

/**
 * Thin draining bar pinned under the titlebar. CSS animation drives the
 * smooth scaleX(1 → 0) transition over MIN_DISPLAY_MS so we don't pay
 * render cost for the animation itself. Inline `animationDuration` keeps
 * the visual in lockstep with the JS `MIN_DISPLAY_MS` constant — change
 * one, both move together.
 */
function GraceProgressBar() {
  return (
    <div
      className="dr-ad-grace"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Continue available in a moment"
    >
      <div
        className="dr-ad-grace__fill"
        style={{ animationDuration: `${MIN_DISPLAY_MS}ms` }}
      />
    </div>
  );
}

/**
 * Inert button-shaped countdown that occupies the Continue slot during the
 * grace window. Same height/typography as the real Continue button so the
 * footer doesn't reflow when the grace ends.
 *
 * `aria-live="polite"` lets assistive tech announce the remaining seconds
 * without preempting other speech. We rely on the screen-reader cadence
 * rather than a hidden timer — it's accurate enough for "wait a moment".
 */
function CountdownChip({ seconds }: { seconds: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={[
        "inline-flex h-11 items-center justify-center gap-2",
        "border-2 border-ink bg-ink/5 px-5",
        "font-mono text-[11px] font-bold uppercase tracking-widest text-ink-3",
        "select-none",
      ].join(" ")}
    >
      <span aria-hidden className="tabular-nums">
        {String(seconds).padStart(2, "0")}s
      </span>
      <span>Continue in a moment</span>
    </div>
  );
}
