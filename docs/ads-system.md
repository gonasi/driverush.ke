# DriveRush Ads System

**Audience:** stakeholders (to understand what the system does and why) and engineers onboarding (to operate, debug, and extend it).

**Status:** active. AdSense integration is wired but ad-unit slot IDs are placeholders — the system runs against a Mock provider in DEV and until slot IDs are populated. Premium / subscription path is stubbed for the future.

---

## Table of contents

1. [TL;DR](#tldr)
2. [Why this system exists](#why-this-system-exists)
3. [Mental model](#mental-model)
4. [Architecture overview](#architecture-overview)
5. [Active-session tracker — the only pacing knob](#active-session-tracker--the-only-pacing-knob)
6. [The ad engine](#the-ad-engine)
7. [Where ads can fire (trigger sites)](#where-ads-can-fire-trigger-sites)
8. [The ad modal — UX & policy](#the-ad-modal--ux--policy)
9. [Route-level controls](#route-level-controls)
10. [Storage & persistence](#storage--persistence)
11. [Analytics events](#analytics-events)
12. [Premium tier (future)](#premium-tier-future)
13. [AdSense compliance checklist](#adsense-compliance-checklist)
14. [Local development & debugging](#local-development--debugging)
15. [Tuning knobs](#tuning-knobs)
16. [How to extend](#how-to-extend)
17. [FAQ](#faq)
18. [Known limitations](#known-limitations)

---

## TL;DR

DriveRush is a free Kenyan learn-to-drive web app. Until we ship subscriptions, ads are the sole revenue source. The system shows interstitial ads (Google AdSense) inside a controlled modal at natural break points in the user's flow.

- **One pacing knob:** the user must accumulate **5 minutes of active time** (tab visible + not idle + on content) before any ad can fire.
- **Trigger sites:** route navigation, quiz completion, pelican sign cycles, pelican run completion. The trigger only _announces_ a natural break — the budget decides whether an ad actually shows.
- **One modal:** the same Radix-based modal handles every ad. 10-second grace window with hidden dismiss buttons + a visible draining progress bar; full dismissibility (X, Continue, Escape, click-outside) after that.
- **Route opt-out:** internal tools (`/tools/*`) and any future onboarding/forms can declare themselves uninterruptible via a `handle` export. The accumulator pauses while on those routes too.
- **Cross-tab:** localStorage + `storage` event keeps the budget consistent across all tabs in the same browser.
- **Premium path:** a single constant flips ads off for paying users when auth ships.

---

## Why this system exists

We made three architectural choices early that this doc explains in depth:

1. **Centralised orchestration over inline `<ins>` tags.** Every ad in the app goes through one engine. Components don't render AdSense markup directly. This means policy enforcement (labelling, dismiss grace, accidental-click prevention) lives in one place; we can swap AdSense for another provider by editing one file; and we can add premium opt-out by flipping one constant.

2. **Time-based pacing over count-based.** Earlier iterations gated ads by event counts (every Nth pelican sign, every quiz completion, etc.) and per-event cooldowns. That created unequal ad load — a user who plays 8 signs in 30 min sees one ad, a user who runs a full 85-sign session sees five. Time-based pacing gives every minute of engagement equal weight regardless of the game shape.

3. **No daily/session caps, just cooldowns.** Ads are our sole revenue source. We don't artificially cap; we pace. Cooldowns + the 5-min active-time budget produce a polite cadence without leaving inventory on the table.

---

## Mental model

> _Active time accumulates while the user engages with content. Once 5 minutes have accumulated, the next "natural break" in the user's flow fires an ad. Budget resets to 0. Repeat._

What counts as **active time**:

- Tab is visible (Page Visibility API: `visibilityState === "visible"`)
- AND user has had mouse/keyboard/touch/scroll input within the last 30 seconds
- AND the current route is interruptible (most are; `/tools/*` is not)

What counts as a **natural break**:

- Any SPA navigation (`route_change` — fires app-wide)
- Quiz completion in `/practice` (`lesson_complete`)
- Between two signs in the pelican trainer (`gameplay_milestone`)
- End of a pelican run (`chapter_complete`)

Other rules:

- Tab backgrounded → accumulator pauses; resumes when foregrounded.
- User idle > 30s → pauses; resumes on any input.
- Tab closed, returns > 1 hour later → wall-clock TTL triggers; accumulator resets to 0 (treat as a fresh session).
- Another tab fires an ad → all open tabs reset to 0 via localStorage `storage` event.
- Premium tier (when it exists) short-circuits everything before the budget is even checked.

---

## Architecture overview

```
┌────────────────────────────────────────────────────────────────┐
│ Trigger sites (call triggerAd(...) at natural break points)    │
│  • app/root.tsx           → "route_change" on every nav         │
│  • quiz-flow.tsx          → "lesson_complete" on result screen │
│  • pelican-store.ts       → "gameplay_milestone" at _toBetween │
│                           → "chapter_complete" at run end      │
└──────────────────────────┬─────────────────────────────────────┘
                           │ event
                           ▼
                  ┌────────────────────┐  isBudgetMet?  ┌──────────────────────┐
                  │     AdEngine       ├───────────────►│  ActiveSessionTracker │
                  │   (ad-engine.ts)   │                │  (active-session.ts)  │
                  │                    │◄───────────────┤                       │
                  │  evaluate() rules  │  consumeBudget │  • heartbeat (1s)     │
                  │  pacing decision   │                │  • visibility        │
                  └─────────┬──────────┘                │  • idle (30s)        │
                            │ openModal                  │  • localStorage      │
                            ▼                            │  • storage event     │
                  ┌──────────────────┐                   │  • TTL (1h)          │
                  │ AdContext (React)│                   └──────────────────────┘
                  │ useSyncExternalStore                          ▲ singleton
                  └────────┬─────────┘                            │
                           │ state                                │
                           ▼                                      │
                  ┌──────────────────┐                            │
                  │  AdModal + AdRenderer                         │
                  │  Radix Dialog + provider <ins>                │
                  └──────────────────┘                            │
                                                                  │
                                                ┌─────────────────┘
                                                │ paints into el
                                                ▼
                                       ┌─────────────────────┐
                                       │   AdProvider        │
                                       │ (adsense-provider)  │
                                       │  • real AdSense     │
                                       │  • or Mock for DEV  │
                                       └─────────────────────┘
```

### File map

| Path                                        | Responsibility                                                                                                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/lib/ads/ad-types.ts`                   | Shared types: `AdTriggerEvent`, `AdSlotId`, `AdProvider`, `AdRouteHandle`.                                                                      |
| `app/lib/ads/ad-constants.ts`               | All tunable values: 5-min budget, idle threshold, AdSense publisher ID, slot map.                                                               |
| `app/lib/ads/ad-rules.ts`                   | Pure `evaluate(state, event, ctx)` decision function. No I/O.                                                                                   |
| `app/lib/ads/active-session.ts`             | The singleton tracker. localStorage + `storage` event for cross-tab.                                                                            |
| `app/lib/ads/ad-engine.ts`                  | `AdEngine` class. Framework-agnostic. Singleton bridge for non-React callers.                                                                   |
| `app/lib/ads/ad-context.tsx`                | React adapter: `<AdProvider>`, `useAdEngine`, `RouteAdGate`.                                                                                    |
| `app/lib/ads/providers/adsense-provider.ts` | The only file in the app that knows `adsbygoogle` exists. Returns Mock in DEV.                                                                  |
| `app/components/brand/ad-modal.tsx`         | The single ad surface. Radix Dialog + dismiss grace UX.                                                                                         |
| `app/components/brand/ad-modal.css`         | Drain-bar keyframes.                                                                                                                            |
| `app/components/brand/ad-renderer.tsx`      | Provider-agnostic surface that calls `provider.renderInto(...)`.                                                                                |
| `app/components/brand/ad-renderer.css`      | Renderer-internal styles (ad surface frame).                                                                                                    |
| `app/root.tsx`                              | Mounts `<AdProvider>` + `<RouteAdGate>` + `<AmbientAdTrigger>` + `<AdModal>`.                                                                   |
| `app/components/brand/quiz-flow.tsx`        | Calls `triggerAd("lesson_complete")` after `analytics.quizCompleted`.                                                                           |
| `app/lib/pelican-store.ts`                  | Calls `triggerAdAndAwaitClose("gameplay_milestone", resume)` at `_toBetween` and `triggerAdFromNonReact("chapter_complete")` at run completion. |
| `app/routes/layouts/tools-layout.tsx`       | Exports `handle: AdRouteHandle = { ads: { interruptible: false } }` for `/tools/*`.                                                             |
| `app/lib/analytics.ts`                      | `analytics.adShown / adClosed / adFailed / adSkipped / adBlockedByRules`.                                                                       |

**Layering rule:** files in `app/lib/ads/` are pure / framework-agnostic, except `ad-context.tsx` which is the thin React adapter. UI lives in `app/components/brand/ad-*`. The AdSense SDK is referenced only inside `providers/adsense-provider.ts`.

---

## Active-session tracker — the only pacing knob

The tracker is the heart of the system. It lives at `app/lib/ads/active-session.ts` and is exported as a singleton: `import { activeSession } from "~/lib/ads/active-session"`.

### Lifecycle

```ts
activeSession.start(); // called by <AdProvider> on mount
activeSession.stop(); // called by <AdProvider> on unmount
```

`start()` is idempotent and SSR-safe (no-op without `window`). It loads persisted state from `localStorage["dr-ad-session-v1"]`, attaches event listeners, and begins the 1-second tick.

### What it tracks

```ts
type Persisted = {
  accumulatedMs: number; // how much active time has been earned toward the budget
  lastTickAt: number; // wall-clock of the last tick — used for TTL
  lastFireAt: number; // wall-clock of the last successful ad fire
};
```

### How the tick works

Each tick (every `TICK_MS = 1000` ms):

```
delta = now - lastTickAt

if (delta > ACCUMULATOR_TTL_MS):    # 1 hour of wall-clock gap
    reset accumulator to 0          # treat as fresh session
    return

if (visible AND not idle AND routeInterruptible):
    accumulator += delta
    persist to localStorage
    notify subscribers
```

A delta-based approach (vs. naive `++` per tick) makes the accumulator robust to clock skew, throttling, and any setInterval imprecision.

### Activity listeners

Attached on `start()`:

- `mousemove` (throttled to once/sec)
- `keydown`, `touchstart`, `pointerdown`
- `scroll`, `wheel` (also throttled)
- `visibilitychange` — resets `lastTickAt` so the just-elapsed background time isn't credited
- `storage` — cross-tab sync (see below)

### Cross-tab sync

When one tab calls `consumeBudget()` (after a successful fire), it writes the new `accumulatedMs: 0` to localStorage. Every _other_ tab listening for the `storage` event sees it, re-loads its state, and resets its in-memory accumulator. This is built-in browser behaviour — no BroadcastChannel, no cookies needed.

### Public API

| Method                     | Purpose                                                                         |
| -------------------------- | ------------------------------------------------------------------------------- |
| `start()` / `stop()`       | Lifecycle. Called by `<AdProvider>`.                                            |
| `isBudgetMet()`            | `accumulatedMs >= ACTIVE_SESSION_BUDGET_MS`. Read by `AdEngine.trigger()`.      |
| `getAccumulatedMs()`       | Current accumulator. Useful for UI ("X seconds until next ad").                 |
| `consumeBudget()`          | Reset to 0. Called by `AdEngine` after a successful fire.                       |
| `setRouteInterruptible(v)` | Pause / resume accumulator based on current route's `handle.ads.interruptible`. |
| `subscribe(listener)`      | React hook integration point.                                                   |
| `getSnapshot()`            | `{ accumulatedMs, budgetMet }` for `useSyncExternalStore`.                      |

---

## The ad engine

`AdEngine` lives in `app/lib/ads/ad-engine.ts`. It's a plain TypeScript class — no React imports, no `window` access. The React layer (`ad-context.tsx`) wraps it.

### Public method surface

```ts
engine.bootstrap(): Promise<void>          // load provider SDK; idempotent
engine.trigger(event: AdTriggerEvent): void
engine.dismiss(): void                      // user closed the modal
engine.markFailed(reason: string): void     // renderer couldn't paint an ad
engine.setRouteInterruptible(v: boolean): void
engine.setUserTier(tier: UserAdTier): void  // "free" | "premium"
engine.subscribe(listener): () => void      // useSyncExternalStore integration
engine.getSnapshot(): AdState
```

### `trigger(event)` flow

1. If a modal is already open → log `ad_skipped` and return (no stacking).
2. Run `evaluate(state, event, ctx)` from `ad-rules.ts`. This is a pure function — read it like a guard ladder:
   1. `ads_disabled` (kill switch in `AD_RULES`)
   2. `premium` (user tier short-circuit)
   3. `route_uninterruptible` (route opt-out)
   4. `no_slot_for_event` (event has no slot mapping in `EVENT_SLOT_MAP`)
   5. `session_budget_not_met` (active-session budget not yet 5 min)
   6. `provider_not_ready` (AdSense script not loaded yet)
3. If blocked → emit `ad_blocked_by_rules` analytics with the reason; return.
4. If allowed → call `activeSession.consumeBudget()`, open the modal, emit `ad_shown`.

### Why a class, not Zustand?

The engine has external dependencies (provider, rules function, clock) that benefit from DI for testability. Most of its behaviour isn't UI state — it's a small state machine with side effects. Zustand's strength is reactive UI state; a class with a `subscribe/getSnapshot` API is the right primitive here, and it plugs into React via `useSyncExternalStore`.

### Non-React callers

Some triggers fire from non-React code (the Zustand pelican store, plain modules). Two exports handle this:

```ts
// Fire and forget
triggerAdFromNonReact(event: AdTriggerEvent): void

// Fire and get notified when the user dismisses (so the game can pause/resume)
triggerAdAndAwaitClose(event: AdTriggerEvent, onClose: () => void): boolean
```

Both are silent no-ops if `<AdProvider>` hasn't mounted yet (the singleton isn't registered) — they never throw into game logic.

---

## Where ads can fire (trigger sites)

Each call site below calls `triggerAd(...)` or one of its variants. **None of them decides whether an ad fires** — they only announce a natural break.

### `route_change` — `app/root.tsx`

```tsx
function AmbientAdTrigger() {
  const location = useLocation();
  const { triggerAd } = useAdEngine();
  React.useEffect(() => {
    triggerAd("route_change");
  }, [location.pathname, triggerAd]);
  return null;
}
```

Fires on every SPA navigation. Most calls are blocked silently with `session_budget_not_met` — this is by design and not a bug. The one that lands after the 5-min budget hits opens the modal.

### `lesson_complete` — `app/components/brand/quiz-flow.tsx`

Inside `handleNext`, after `analytics.quizCompleted(...)`:

```tsx
analytics.quizCompleted({ ... })
triggerAd("lesson_complete")
setDone(true)
```

Order is deliberate: analytics fires first so a provider failure can't suppress the GA event.

### `gameplay_milestone` — `app/lib/pelican-store.ts`

Inside `_toBetween` (after each sign cycle ends, not at run completion):

```ts
const opened = triggerAdAndAwaitClose("gameplay_milestone", () => {
  get().resume();
});
if (opened) {
  get().pause(); // freezes timers + audio while the ad is up
  return;
}
```

`triggerAdAndAwaitClose` returns `true` only if the engine actually opened the modal (budget met + all guards passed). The store pauses gameplay only in that case; otherwise the trainer continues.

### `chapter_complete` — `app/lib/pelican-store.ts`

At the end of a pelican run (still inside `_toBetween`, in the completion branch):

```ts
triggerAdFromNonReact("chapter_complete");
set({ phase: "complete", running: false, inProgressRun: null });
```

Fire-and-forget — there's no in-game state to pause/resume; the run is over.

### Why have multiple trigger sites if the budget is the gate?

Because users spend time in different shapes. A user grinding `/practice` quizzes hits `lesson_complete` regularly. A user reading blogs hits `route_change` only on nav. A user deep in a pelican run hits `gameplay_milestone` between every sign. We want the natural-break event to be there whenever the budget happens to hit, regardless of which surface the user is on.

---

## The ad modal — UX & policy

Built on the existing Radix Dialog at `app/components/ui/dialog.tsx`. Single file: `app/components/brand/ad-modal.tsx`.

### Visual structure

```
┌──────────────────────────────────────────┐
│ DR · SPONSORED                       [X] │  ← titlebar (X hidden during grace)
├──────────────────────────────────────────┤
│ ████████████████░░░░░░░░░░░░░░░░░░░░     │  ← draining progress bar (10s, hidden after)
├──────────────────────────────────────────┤
│   ADVERTISEMENT                          │  ← required visible label
│                                          │
│   [    Ad content paints here    ]       │  ← AdRenderer host
│                                          │
├──────────────────────────────────────────┤
│                       [ Continue in 8s ] │  ← chip during grace
│                       [   Continue →  ]  │  ← active button after grace
└──────────────────────────────────────────┘
```

### Dismiss grace (10 seconds)

For `MIN_DISPLAY_MS = 10_000`:

- **X button hidden** (`showCloseButton={canDismiss}`)
- **Continue button replaced** with an inert "`08s` Continue in a moment" chip (same height, no layout shift)
- **Escape blocked** (`onEscapeKeyDown(e => e.preventDefault())`)
- **Click-outside blocked** (`onPointerDownOutside` + `onInteractOutside`)
- **`onOpenChange(false)` blocked** at the parent `<Dialog>` level
- **Draining bar** under the titlebar visibly empties left-to-right via CSS `scaleX(1)→scaleX(0)` over the same duration

After 10 seconds: full normal dismissibility returns.

### Why hidden, not disabled?

A disabled-but-visible close button looks broken. The visible draining bar + countdown chip communicates "this is on a timer, please wait" without making the user wonder if the X is supposed to do something.

### Accessibility

- `aria-live="polite"` on the countdown chip so screen readers announce remaining time
- `<DialogTitle className="sr-only">Advertisement</DialogTitle>` satisfies Radix's a11y requirement; the visible titlebar is decorative
- `prefers-reduced-motion` honoured by the drain animation (settles empty immediately; the JS grace still enforces the wait)

---

## Route-level controls

Any route can opt out of ads by exporting a `handle`:

```tsx
import type { AdRouteHandle } from "~/lib/ads/ad-types";

export const handle: AdRouteHandle = {
  ads: { interruptible: false },
};
```

`<RouteAdGate>` in `app/lib/ads/ad-context.tsx` reads every match's handle via `useMatches()`. If _any_ match has `interruptible: false`, both the engine AND the accumulator pause. Nested routes inherit (the layout's handle covers all child routes).

Currently uninterruptible:

- `/tools/*` — internal authoring tools (mapping signs, share-link builder)

When to add more:

- Onboarding flows where every screen matters
- Long-form forms (payment, profile setup when auth ships)
- Time-sensitive interactions (live tests with proctoring, if we ever add them)
- Anything where an interruption would lose user data

---

## Storage & persistence

### `localStorage["dr-ad-session-v1"]`

The active-session tracker's persistence. Shape:

```ts
{
  accumulatedMs: number; // how much active time toward the 5-min budget
  lastTickAt: number; // for the 1-hour TTL check
  lastFireAt: number; // when the last ad opened
}
```

- Persists across tab close, browser restart.
- Resets to `{ accumulatedMs: 0, ... }` if `now - lastTickAt > ACCUMULATOR_TTL_MS` (1 hour).
- Cross-tab synced via `storage` event.
- Old `dr-ads-v1` key from the previous (cooldown-based) era is orphaned but harmless; nothing reads it.

### `localStorage["driverush:pelican"]`

Zustand persist for the pelican trainer. Includes `inProgressRun` (saved mid-run state for "Resume run" CTA). Independent of the ad system; the two persistent slices coexist.

### Why localStorage and not cookies?

Ad decisions are purely client-side — the server never gates ads. Cookies would add HTTP overhead, have a 4KB limit, and a more awkward API, with no benefit. The `storage` event gives us cross-tab sync for free.

### Why not sessionStorage?

A page refresh should not reset the budget. The user shouldn't be able to dodge the 5-min pacing by F5-ing. localStorage survives refresh; sessionStorage doesn't.

---

## Analytics events

All ad events flow through `app/lib/analytics.ts` → `emit()` → ReactGA. Each `emit` also auto-attaches UTM session attribution and (in DEV) logs to the console.

| Event                 | When                                     | Params                      |
| --------------------- | ---------------------------------------- | --------------------------- |
| `ad_shown`            | Modal opens                              | `event`, `slot`, `provider` |
| `ad_closed`           | User dismisses                           | `slot`, `dwell_ms`          |
| `ad_failed`           | Provider couldn't paint in time          | `slot`, `reason`            |
| `ad_skipped`          | Trigger arrived while modal already open | `slot`                      |
| `ad_blocked_by_rules` | `evaluate()` returned `allow: false`     | `event`, `reason`           |

The `reason` taxonomy is a discriminated union: `ads_disabled`, `premium`, `route_uninterruptible`, `no_slot_for_event`, `session_budget_not_met`, `provider_not_ready`.

Use `ad_blocked_by_rules` filtered by reason in GA to answer questions like:

- _"Are users running out of budget often?"_ — high `session_budget_not_met` is **expected**, not a problem.
- _"Are users hitting uninterruptible routes when an ad was due?"_ — `route_uninterruptible` count tells you.
- _"Are ads failing to load?"_ — `ad_failed` count vs `ad_shown` is the fill rate.

---

## Premium tier (future)

The architecture is ready; the auth layer isn't. Today:

```ts
// app/lib/ads/ad-constants.ts
export const currentUserTier: UserAdTier = "free";
```

`evaluate()` short-circuits on `tier === "premium"` _before_ any other check. When auth ships:

1. Derive `tier` from the auth context.
2. Pipe it into the engine on auth state change: `engine.setUserTier(tier)`.
3. (Optional) Have `activeSession` skip ticking for premium users — minor perf win, no behaviour change.

No other code touches.

---

## AdSense compliance checklist

Each item is enforced by the modal/renderer; this list is for review and incident response.

- ✅ **Clear "Advertisement" label** — visible inside the modal adjacent to the ad surface (in `AdRenderer`).
- ✅ **"DR · SPONSORED" titlebar** — distinct from app dialogs (avoids any "fake UI" complaint).
- ✅ **Visible close button** — top-right X with `aria-label="Close advertisement"`, returns after the 10s grace.
- ✅ **Multiple dismiss paths after grace** — X, Continue button, Escape, click-outside, all work.
- ✅ **No deceptive close** — close button is hidden, not styled to look "off" or fake. Returns after 10s.
- ✅ **No accidental clicks** — Continue button physically separated from ad surface by a `border-t-2` dashed rule.
- ✅ **No fake UI** — modal styling clearly distinct from app's content surfaces.
- ✅ **No auto-refresh** — each open mounts a fresh `<ins>` (keyed on `triggerSeq`), never re-pushes the same node.
- ✅ **Reasonable frequency** — 5-min active-time budget is the only pacing knob; no spam.
- ✅ **Respects focused work** — `/tools/*` is uninterruptible; future onboarding/forms can opt out the same way.
- ✅ **No Auto-Ads** — we use manual ad units only. The AdSense loader is injected, but we never enable Auto-Ads overlays.

---

## Local development & debugging

### DEV vs PROD provider

`createAdProvider()` in `providers/adsense-provider.ts` picks based on `import.meta.env.PROD && hasAnyRealSlot`. In DEV (or without slot IDs populated), it returns a `MockAdProvider` that paints a striped placeholder where the real ad would go. The orchestration logic runs identically — the only difference is what gets painted.

### Browser console handles (DEV only)

`<AdProvider>` exposes two globals when `import.meta.env.DEV`:

```js
window.__adEngine; // the AdEngine instance
window.__activeSession; // the ActiveSessionTracker singleton
```

Useful incantations:

```js
// Force an ad even when budget isn't met — careful, the engine respects rules
__adEngine.trigger("route_change"); // will likely return session_budget_not_met
__adEngine.getSnapshot(); // current engine state

__activeSession.getSnapshot(); // { accumulatedMs, budgetMet }
__activeSession.consumeBudget(); // reset accumulator to 0
```

To test the budget gate quickly, you can temporarily lower `ACTIVE_SESSION_BUDGET_MS` in `app/lib/ads/ad-constants.ts` to e.g. `10_000` (10s). Don't commit it.

### DevTools inspection

- **Application → Local Storage → `dr-ad-session-v1`** — watch `accumulatedMs` climb in real time.
- **Application → Local Storage → `driverush:pelican`** — pelican state; check `inProgressRun` survives refresh.
- **Console** — DEV mode logs `[analytics] ad_blocked_by_rules { reason: ... }` for every blocked trigger. Most `session_budget_not_met` entries are expected.

### Reproducing common scenarios

| Scenario               | Steps                                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cross-tab sync         | Open `/road-signs/pelican` in tab A and tab B. Lower budget to 10s. Interact in A until ad fires. Switch to B → `accumulatedMs` should be 0.         |
| Idle pause             | Open trainer. Stop touching keyboard/mouse. After ~30s `accumulatedMs` stops climbing. Touch the mouse — resumes.                                    |
| Visibility pause       | Open trainer. Switch to another tab for 30s. Switch back — accumulator didn't grow during the absence.                                               |
| TTL reset              | Set `accumulatedMs` to a non-zero value in DevTools localStorage. Set `lastTickAt` to `Date.now() - 2 * 60 * 60 * 1000`. Reload. Accumulator resets. |
| Route opt-out          | Navigate to `/tools/image-coords` and interact for a while. `accumulatedMs` doesn't grow.                                                            |
| Resume mid-pelican-run | Play 5+ signs. Refresh. Click "Resume run" on the ready card. Verify run state is intact AND `accumulatedMs` is intact.                              |

### Common debugging mistakes

- **"Why isn't an ad firing?"** Check `__activeSession.getAccumulatedMs()`. If it's < 5 min, the budget gate is doing its job.
- **"Why is the cross-tab sync not working?"** `storage` events don't fire in the _originating_ tab — they only notify _other_ tabs. Test with two windows, not by listening in the same tab.
- **"Why is `route_change` firing on every render?"** It shouldn't — the effect is keyed on `location.pathname`. If you see it on every render, look for a re-render storm elsewhere.

---

## Tuning knobs

All knobs are in `app/lib/ads/ad-constants.ts` unless noted.

| Constant                              | Value               | Effect of increasing                                                            | Effect of decreasing                              |
| ------------------------------------- | ------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| `ACTIVE_SESSION_BUDGET_MS`            | 5 min               | Fewer ads, smoother feel, less revenue                                          | More ads, more revenue, risks feeling spammy      |
| `IDLE_THRESHOLD_MS`                   | 30 s                | Stricter "active" — fewer false positives from open-tab-while-AFK; less revenue | Looser "active" — more accumulation, more revenue |
| `TICK_MS`                             | 1 s                 | Lower CPU; less precise budget                                                  | More precise budget; trivially higher CPU         |
| `ACCUMULATOR_TTL_MS`                  | 1 h                 | Long-absent users keep their budget on return                                   | Aggressive resets after short gaps                |
| `MIN_DISPLAY_MS`                      | 10 s                | Longer forced viewing → more revenue per impression, more annoyance             | Shorter wait → less revenue, friendlier           |
| `PROVIDER_LOAD_TIMEOUT_MS`            | 5 s                 | More patience for slow ads                                                      | Faster fallback to "Ad unavailable"               |
| `AD_RULES.enabled` (in `ad-rules.ts`) | `true`              | n/a                                                                             | Kill switch — disables ALL ads globally           |
| `currentUserTier`                     | `"free"`            | n/a                                                                             | Set to `"premium"` to disable ads for testing     |
| `AD_SLOTS.*`                          | `""` (placeholders) | Filling in real slot IDs flips the factory from Mock to live AdSense per slot   | Empty = stay on Mock                              |

---

## How to extend

### Adding a new trigger site

1. If it's a new semantic event, add it to `AdTriggerEvent` in `app/lib/ads/ad-types.ts`.
2. Map it to a slot in `EVENT_SLOT_MAP` in `app/lib/ads/ad-rules.ts` (or reuse an existing slot).
3. At the trigger site, call:
   - `triggerAd("your_event")` if you're inside a React component (use `useAdEngine`).
   - `triggerAdFromNonReact("your_event")` if you're in a module/store.
   - `triggerAdAndAwaitClose("your_event", onClose)` if you need to pause game state while the ad is open.

That's it. The engine handles gating, the modal handles display, the renderer handles provider details.

### Adding a new ad provider (e.g., house ads, affiliates)

1. Create a new file in `app/lib/ads/providers/`, e.g. `house-ads-provider.ts`.
2. Implement the `AdProvider` interface from `ad-types.ts`:
   ```ts
   interface AdProvider {
     readonly id: string;
     initialize(): Promise<void>;
     canShow(slot: AdSlotId): boolean;
     renderInto(el: HTMLElement, slot: AdSlotId): () => void;
   }
   ```
3. Update `createAdProvider()` in `providers/adsense-provider.ts` to choose between providers, OR refactor that factory into its own file if you want chained fallback (try house ads → fall back to AdSense).
4. `AdRenderer` and `AdModal` are provider-agnostic — no changes needed there.

### Splitting a slot for AdSense reporting

If you want, say, `route_change` to use a different ad unit than `lesson_complete` in the AdSense dashboard:

1. Add a new slot ID to `AdSlotId` in `ad-types.ts` (e.g., `"ambient"`).
2. Add an entry to `AD_SLOTS` in `ad-constants.ts` with the AdSense slot ID.
3. Change the mapping in `EVENT_SLOT_MAP` in `ad-rules.ts`: `route_change: "ambient"`.

No engine, modal, or provider changes needed.

### Adding a new route opt-out

In the route file:

```tsx
import type { AdRouteHandle } from "~/lib/ads/ad-types";

export const handle: AdRouteHandle = {
  ads: { interruptible: false },
};
```

Use the layout file if you want it to apply to a whole subtree (as `tools-layout.tsx` does for `/tools/*`).

---

## FAQ

**"How many ads should a typical user see?"**

Depends entirely on session length. A user who spends 5 minutes on the site sees 0 or 1 ads. A 20-minute session sees ~3–4 ads. The pacing is deliberately tied to engagement, not session count.

**"What if a user just leaves the trainer open and walks away?"**

Idle detection pauses the accumulator after 30 seconds of no input. The Page Visibility API pauses it if the tab is backgrounded. So passively-open-but-unused tabs don't earn ads.

**"What if a user opens 3 tabs?"**

One shared budget across all tabs (via `storage` event). When one tab fires an ad, the others reset to 0. The accumulator advances in whichever tab is active — but at most one tab can be active at a time anyway (visibility check).

**"What happens when the user is on premium?"**

`evaluate()` returns `{ allow: false, reason: "premium" }` for every trigger, before any other check. No ad ever opens. The active-session tracker still ticks (cheap), but it never matters.

**"Why does `ad_blocked_by_rules` log so often in DEV?"**

That's the engine doing its job. Most triggers (especially `route_change` on every navigation) arrive when the budget isn't yet met — they're blocked silently with `session_budget_not_met`. Only DEV-mode logs them via `console.log`. In PROD, GA receives the events but doesn't make any noise.

**"Why is the daily/session cap gone?"**

Earlier iterations had `maxAdsPerSession: 4` and `maxAdsPerDay: 12`. They produced unequal ad load (some user flows ate the cap with no ads to spare for completions) and capped revenue unnecessarily. Cooldowns alone weren't enough either — too predictable. The 5-min active-time budget paces every flow identically and removes the need for either cap.

**"Why is the AdSense loader script loaded even in DEV?"**

It isn't. `createAdProvider()` returns the Mock provider in DEV (or when no real slots are configured), and the Mock provider doesn't inject any script. Real AdSense only kicks in when both `import.meta.env.PROD === true` AND at least one `AD_SLOTS.*` is non-empty.

**"Where do I put a new ad on the homepage?"**

You don't — at least, not as a separate placement. The system uses one centralised interstitial modal, fired at natural break points. If you want ad inventory on a specific surface, the path is to:

1. Add a new trigger site there (e.g., a "Get started" CTA that fires `triggerAd("homepage_cta")`).
2. Wire it into `EVENT_SLOT_MAP`.
3. Let the engine decide.

Inline banner ads scattered through pages would defeat the centralised orchestration and break the policy story. If product wants those, that's a separate architectural conversation.

---

## Known limitations

- **AdSense slot IDs are placeholders.** Until populated in `AD_SLOTS`, the system runs Mock-only. Filling them in (post-AdSense approval) flips the factory to live, no code change required.
- **No SSR-aware gating.** The server doesn't know whether a user is "due for an ad." We could pass a cookie reflection of the budget to enable server-rendered ad units, but our current architecture is fully client-side and that's fine for now.
- **No per-event slot reporting in AdSense.** Currently `route_change` and `lesson_complete` share a slot. If product wants distinct CTR / fill data per event, see "Splitting a slot for AdSense reporting" above.
- **`gameplay_milestone` fires every sign cycle when in pelican.** This is intentional (the engine decides via the budget), but the analytics noise from `ad_blocked_by_rules` events is high during long runs. Filter your dashboards accordingly.
- **No A/B testing hooks.** The system has the seam for it (`evaluate()` is pure and takes a `ctx` arg), but no experiment integration exists yet.
- **Cross-device sync is impossible without auth.** A user on phone + laptop accumulates two separate budgets. Acceptable until subscriptions ship — at that point, the same auth that gates premium can sync the budget if we want.

---

_Last updated: this document is the source of truth for the ads system. When you change behaviour, update this file in the same PR._
