# DriveRush Analytics (PostHog)

**Audience:** whoever is looking at the numbers, and engineers adding events.

**Status:** active. PostHog is the system of record for product analytics; GA4
still runs alongside it for the legacy reports. There are no user accounts yet,
so every learner is anonymous — person profiles carry the learner state instead
(see [Learner profile](#learner-profile)).

---

## Table of contents

1. [How it's wired](#how-its-wired)
2. [What comes for free](#what-comes-for-free)
3. [Event taxonomy](#event-taxonomy)
4. [Learner profile](#learner-profile)
5. [Insights worth building first](#insights-worth-building-first)
6. [Adding an event](#adding-an-event)
7. [Local development](#local-development)
8. [Known gaps](#known-gaps)

---

## How it's wired

| Piece                     | File                                                    | Notes                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client init + config      | `app/lib/posthog.ts`                                    | One init, one accessor. Missing env = no-op in prod, loud throw in dev.                                                                                           |
| Provider + hydration      | `app/entry.client.tsx`                                  | Init runs **before** `hydrateRoot`, so autocapture/replay/pageviews cover the first paint. `<PostHogProvider>` exposes `usePostHog()` and the feature-flag hooks. |
| Typed event dispatcher    | `app/lib/analytics.ts`                                  | One method per event. Also mirrors to GA4 and console-logs in dev.                                                                                                |
| Learner person properties | `app/lib/use-learner-analytics.ts`                      | Syncs localStorage progress → PostHog person properties. Mounted in `app/root.tsx`.                                                                               |
| Error capture             | `app/root.tsx` (`ErrorBoundary`) + `capture_exceptions` | React render errors, uncaught errors, unhandled rejections.                                                                                                       |
| SSR bundling              | `vite.config.ts` (`ssr.noExternal`)                     | Keeps the browser-only SDK out of Node's resolver.                                                                                                                |

Environment (`.env`, and whatever hosts production):

```
VITE_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_…
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## What comes for free

Configured in `app/lib/posthog.ts`, no call sites needed:

- `$pageview` / `$pageleave` on SPA navigation (`defaults: '2026-01-30'` → `history_change`)
- `$autocapture` — clicks, form interactions, so every link and button is already measurable
- `$rageclick` and `$dead_click` — where the UI looks tappable and isn't
- `$web_vitals` — LCP/CLS/INP per route
- `$exception` — uncaught errors and unhandled rejections
- Session replay and heatmaps (both must also be enabled in PostHog project settings)

Two filters are applied at the source:

- `/tools/*` and `/design` traffic is dropped in `before_send` — internal surfaces never inflate funnels.
- Every event carries `app_env` (`production` | `development`), so localhost can be excluded with one filter.

## Event taxonomy

All custom events are declared in `app/lib/analytics.ts`. Adding one anywhere
else is a bug — the file _is_ the taxonomy.

### Top of funnel

| Event                     | Fires when                                  | Key properties                                     |
| ------------------------- | ------------------------------------------- | -------------------------------------------------- |
| `sign_challenge_started`  | Homepage sign check shows a question        | `sign_id`, `category`                              |
| `sign_challenge_answered` | Visitor picks an option in the sign check   | `correct`, `question_index`, `sign_id`, `category` |
| `sign_check_completed`    | Visitor reaches the sign check's score card | `correct`, `total`                                 |

### Sign trainers

| Event                                     | Fires when                     | Key properties                                                                                  |
| ----------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `pelican_started` / `signs3d_started`     | A run starts                   | `signs_total`, `categories`, `scope` (`round`/`chart`/`drill`)                                   |
| `pelican_completed` / `signs3d_completed` | A run finishes                 | `scope`, `self_graded`, `signs_total`; when self-graded also `knew_first_try`, `miss_count`     |
| `sign_graded`                             | "Knew it" or "Missed it" tapped | `trainer`, `sign_code`, `category`, `result`, `box_before`, `box_after`, `first_try`, `scope`   |

`sign_graded` by `sign_code` where `result = missed` is the "which signs does Kenya
get wrong" report.

### Monetisation and contact

| Event                                                                         | Fires when                                                    |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `partner_clicked`                                                             | Outbound click to a credited source (name + url)              |
| `contact_clicked`                                                             | Footer phone/email tapped (`channel`, `location`)             |

## Learner profile

The project runs `person_profiles: 'identified_only'` and there is no
`identify()` yet, so a profile is created by the first `setPersonProperties`
call — which `use-learner-analytics.ts` deliberately withholds until
`learner_stage` moves past `visitor`. Drive-by SEO traffic therefore stays
anonymous (materially cheaper per event, and the person list stays meaningful);
anyone who gets a sign into mastery gets a profile.

On mount, route change and tab focus, once past `visitor`, it writes:

`signs_mastered_pelican`, `signs_mastered_3d`, `learner_stage`, and
`first_seen_at` (set once).

`learner_stage` is also a **super property**, registered for _everyone_
including anonymous visitors (super properties don't create a profile), so any
trend or funnel can be broken down by it without a join:

`visitor` → `sampler` → `practising` → `committed`

The properties are read from the same localStorage the app already uses. If a
store's persisted shape changes, update the readers in that file.

## Insights worth building first

Nothing below exists yet — these are the dashboards to create once the MCP
connector is authorised (or by hand in the UI).

**Activation funnel** (the core question: does a visitor start memorising?)
`$pageview` (`/`) → `pelican_started` OR `signs3d_started` → `pelican_completed`
OR `signs3d_completed`. Break down by `utm_source` and device.

**Which signs are hardest**
`sign_graded` where `result = missed`, broken down by `sign_code`.

**Chart versus 3D**
Compare `pelican_started` and `signs3d_started` volumes, and retention on each.

**Retention**
PostHog retention on `pelican_started` OR `signs3d_started`, split by
`learner_stage`.

**Model Town Board demand**
`$pageview` on `/model-town-board`.

**Friction**

- `$rageclick` and `$dead_click` trends by URL.

**Reach**
`partner_clicked` and `contact_clicked`.

**Error tracking**
Watch the `$exception` issue list; the ones on `/road-signs/*` matter most because
they interrupt a run.

## Adding an event

1. Add a method to `analytics` in `app/lib/analytics.ts` with a typed argument
   object and snake_case event/property names.
2. Call it from the component or store where the action completes.
3. Prefer semantics autocapture can't infer (correctness, progress, state).
   Don't hand-instrument ordinary link/button clicks — autocapture has them.
4. Document it in the table above.

## Local development

Dev builds capture too, with `debug: true` — every event is logged as
`[analytics] <name>` and `[PostHog.js] send "<name>"` in the console. They land
in the same project tagged `app_env: development`; filter them out in PostHog
(or exclude localhost under project settings → "Filter out internal and test
users") when reading production numbers.

## Known gaps

- **No server-side SDK.** There are no auth endpoints, API routes, actions, or
  webhooks — server work is read-only page data, so `posthog-node` would only
  duplicate the client's pageviews. Add it (and `tracing_headers`) the day a
  real server mutation ships.
- **No `identify()`.** Nothing identifies a learner yet. When accounts land,
  call `identify()` at login/signup; the anonymous history links automatically.
- **Bundle cost.** PostHog is ~76 kB gzipped in its own chunk, loaded eagerly so
  the first paint is measured.
- **Feature flags / experiments** are available through the provider
  (`useFeatureFlagEnabled`) but nothing uses them yet.
- **Replay volume is a project setting.** The client records every session;
  cap the cost with a sampling rate / minimum duration in PostHog project
  settings rather than in code, so it can be tuned without a deploy. Replay
  and heatmaps must also be switched on there before data appears.
