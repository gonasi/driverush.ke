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

| Event                     | Fires when                                | Key properties                                     |
| ------------------------- | ----------------------------------------- | -------------------------------------------------- |
| `sign_challenge_started`  | Homepage hero sign game starts a question | `sign_id`, `category`                              |
| `sign_challenge_answered` | Visitor picks an option in the hero game  | `correct`, `question_index`, `sign_id`, `category` |

### Practice

| Event                    | Fires when                                       | Key properties                             |
| ------------------------ | ------------------------------------------------ | ------------------------------------------ |
| `practice_mode_selected` | Learner picks a mode                             | `mode`, `source`                           |
| `quiz_started`           | A quiz mounts with a non-empty bank              | `mode`, `total`                            |
| `quiz_question_answered` | Each answer                                      | `question_id`, `correct`, `question_index` |
| `quiz_completed`         | Result screen reached                            | `score_pct`, `passed`, `correct`, `total`  |
| `quiz_abandoned`         | Quiz unmounts after ≥1 answer, before the result | `answered`, `correct`, `total`             |
| `save_progress_clicked`  | "Save progress" tapped — signup-intent proxy     | —                                          |

### Course

| Event                                                            | Fires when                         | Key properties                                      |
| ---------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------- |
| `lesson_started`                                                 | An unlocked lesson opens           | `entry` (`fresh`/`resume`/`review`), `blocks_total` |
| `lesson_block_completed`                                         | Each block advance                 | `block_type`, `score`                               |
| `lesson_completed`                                               | Final block of a lesson            | `blocks_total`, `xp_earned`                         |
| `lesson_replayed`                                                | Learner restarts a finished lesson | `lesson_id`                                         |
| `lesson_locked_tapped`                                           | Learner taps a locked path node    | `unit_index`, `lesson_index`                        |
| `placement_test_started` / `_completed` / `_retaken` / `_passed` | Placement-test flow                | `target_lesson_id`, `passed`, `lessons_unlocked`    |

### Habit loop

| Event             | Fires when                           | Key properties                    |
| ----------------- | ------------------------------------ | --------------------------------- |
| `streak_extended` | Daily streak ticks up                | `days`, `longest`, `freeze_spent` |
| `daily_goal_met`  | Daily XP goal crossed (once per day) | `goal`, `xp_earned`, `streak`     |

### Sign trainers

`pelican_started` / `pelican_completed` / `signs3d_started` / `signs3d_completed`
— each with `signs_total`, `knew_first_try`, `miss_count`.

### Monetisation and contact

| Event                                                                         | Fires when                                                    |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `partner_clicked`                                                             | Outbound click to a partner (name + url)                      |
| `contact_clicked`                                                             | Footer phone/email tapped (`channel`, `location`)             |
| `ad_shown` / `ad_closed` / `ad_failed` / `ad_skipped` / `ad_blocked_by_rules` | Every decision the ad engine makes — see `docs/ads-system.md` |

## Learner profile

The project runs `person_profiles: 'identified_only'` and there is no
`identify()` yet, so a profile is created by the first `setPersonProperties`
call — which `use-learner-analytics.ts` deliberately withholds until
`learner_stage` moves past `visitor`. Drive-by SEO traffic therefore stays
anonymous (materially cheaper per event, and the person list stays meaningful);
anyone who answers a sign, practises, or opens a lesson gets a profile.

On mount, route change and tab focus, once past `visitor`, it writes:

`lessons_started`, `lessons_completed`, `courses_started`, `course_xp`,
`practice_answered`, `practice_correct`, `practice_accuracy`,
`signs_mastered_pelican`, `signs_mastered_3d`, `current_streak`,
`longest_streak`, `daily_goal`, `daily_xp_earned`, `streak_freezes`,
`learner_stage`, and `first_seen_at` (set once).

`learner_stage` is also a **super property**, registered for _everyone_
including anonymous visitors (super properties don't create a profile), so any
trend or funnel can be broken down by it without a join:

`visitor` → `sampler` → `practising` → `learning` → `committed`

The properties are read from the same localStorage the app already uses. If a
store's persisted shape changes, update the readers in that file.

## Insights worth building first

Nothing below exists yet — these are the dashboards to create once the MCP
connector is authorised (or by hand in the UI).

**Activation funnel** (the core question: does the hero game convert?)
`$pageview` (`/`) → `sign_challenge_started` → `sign_challenge_answered` →
`quiz_started` OR `lesson_started`. Break down by `utm_source` and device.

**Course completion funnel**
`lesson_started` → `lesson_block_completed` → `lesson_completed`, broken down by
`lesson_id`. The lessons with the worst started→completed ratio are the ones to
rewrite.

**Practice quality**
`quiz_question_answered` where `correct = false`, broken down by `question_id`.
That is the "which questions does Kenya get wrong" report — feeds both content
fixes and the course syllabus.

**Retention**
PostHog retention on `lesson_started` (or `quiz_started`), split by cohort on
`current_streak ≥ 3` and on `learner_stage`. The habit mechanics only earn
their complexity if these curves separate.

**Friction**

- `lesson_locked_tapped` by `lesson_index` — are the unlock rules blocking people?
- `quiz_abandoned` by `mode` and `answered` — where quizzes lose people mid-run.
- `$rageclick` and `$dead_click` trends by URL.

**Reach and money**
`partner_clicked`, `contact_clicked`, `ad_shown` → `ad_closed` dwell, and
`ad_blocked_by_rules` by `reason` (why ads didn't show).

**Error tracking**
Watch the `$exception` issue list; the ones on `/courses/*` matter most because
they interrupt a paid-attention flow.

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
