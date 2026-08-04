/**
 * Client entry. React Router ships a default version of this file; we own it
 * so PostHog can be initialised *before* hydration — autocapture, session
 * replay, `$pageview` / `$pageleave` and exception capture all need to be
 * running from the first paint, not from an effect somewhere in the tree.
 *
 * `<PostHogProvider>` then makes the same client available to components via
 * `usePostHog()` / feature-flag hooks. It renders children even when PostHog
 * is unconfigured, so a missing token degrades to "no analytics", never to a
 * blank page.
 */
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { PostHogProvider } from "@posthog/react";

import { initPostHog } from "~/lib/posthog";

const posthog = initPostHog();

const app = (
  <StrictMode>
    <HydratedRouter />
  </StrictMode>
);

startTransition(() => {
  hydrateRoot(
    document,
    // No client (PostHog unconfigured) → mount the app without the provider
    // rather than handing it an uninitialised instance.
    posthog ? <PostHogProvider client={posthog}>{app}</PostHogProvider> : app,
  );
});
