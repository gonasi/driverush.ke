/**
 * PostHog browser client — one init, one accessor.
 *
 * Initialised from `entry.client.tsx` before hydration so autocapture, replay,
 * pageviews and exception capture are live from the first paint. Everything
 * else in the app reads the client through {@link getPostHog} (or the typed
 * dispatcher in `analytics.ts`) and must tolerate `undefined`: a missing
 * PostHog config is never allowed to break the app.
 *
 * Config is read from Vite env:
 *   VITE_PUBLIC_POSTHOG_PROJECT_TOKEN   project write key
 *   VITE_PUBLIC_POSTHOG_HOST            https://us.i.posthog.com | eu…
 *
 * In DEV a missing variable throws loudly (silently-missed events are worse
 * than a red screen while wiring things up). In PROD it is a no-op.
 */
import posthog, { type PostHog } from "posthog-js";

const TOKEN = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

/**
 * Routes that exist for us, not for learners: the internal authoring tools and
 * the design-system page. Their traffic would otherwise inflate every
 * top-of-funnel number we look at.
 */
const INTERNAL_PATH_RE = /^\/(tools|design)(\/|$)/;

/**
 * Stamped on every event so localhost and preview traffic can be excluded in
 * PostHog with a single `app_env = production` filter (or kept, when you want
 * to verify an integration).
 */
export const APP_ENV = import.meta.env.PROD ? "production" : "development";

let client: PostHog | undefined;

/**
 * Initialise the browser client. Safe to call repeatedly; returns the same
 * instance, or `undefined` when PostHog isn't configured or we're on the
 * server.
 */
export function initPostHog(): PostHog | undefined {
  if (typeof window === "undefined") return undefined;
  if (client) return client;

  if (!TOKEN || !HOST) {
    if (import.meta.env.DEV) {
      const missing = !TOKEN
        ? "VITE_PUBLIC_POSTHOG_PROJECT_TOKEN"
        : "VITE_PUBLIC_POSTHOG_HOST";
      throw new Error(
        `${missing} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missing} is configured`,
      );
    }
    return undefined;
  }

  posthog.init(TOKEN, {
    api_host: HOST,
    // Pins the SDK's default behaviours (SPA pageviews via history_change,
    // strict replay minimum duration, head script injection so SSR hydration
    // stays clean). Bumping this date changes defaults — do it deliberately.
    defaults: "2026-01-30",
    // Most traffic here is SEO drive-by that never touches a lesson, and
    // person-profile events cost several times what anonymous ones do. So:
    // stay anonymous by default, and let `use-learner-analytics.ts` create a
    // profile (via `setPersonProperties`) the moment someone shows real
    // learner intent. Retention and cohorts still work for everyone who
    // matters, without paying for bounces.
    person_profiles: "identified_only",
    // Error tracking for uncaught errors + unhandled rejections. The root
    // ErrorBoundary additionally reports React render errors.
    capture_exceptions: true,
    capture_dead_clicks: true,
    enable_heatmaps: true,
    capture_performance: { web_vitals: true },
    session_recording: {
      // Learners type free text into practice inputs; mask by default and
      // opt individual nodes out with `data-ph-mask` if anything slips.
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
    },
    debug: import.meta.env.DEV,
    before_send: (event) => {
      if (!event) return event;
      const path =
        typeof window !== "undefined" ? window.location.pathname : "/";
      // Drop internal-tool traffic entirely rather than filtering it in every
      // insight later.
      if (INTERNAL_PATH_RE.test(path)) return null;
      return event;
    },
    loaded: (ph) => {
      ph.register({ app_env: APP_ENV });
    },
  });

  client = posthog;
  return client;
}

/** The initialised client, or `undefined` when PostHog isn't configured. */
export function getPostHog(): PostHog | undefined {
  return client;
}
