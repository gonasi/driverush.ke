import { TabBar } from "~/components/brand/tab-bar";
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import * as React from "react";

import type { Route } from "./+types/root";
import "./app.css";
import "./motion.css";
import { Toaster } from "~/components/ui/sonner";
import { Button } from "~/components/ui/button";
import { NavigationProgressBar } from "~/components/brand/navigation-progress-bar";
import { RoadClosedScene, ScenePlate } from "~/components/brand/art/scenes";
import { THEME_INIT_SCRIPT, useThemeSync } from "~/lib/theme";
import { SITE, absUrl } from "~/lib/site";
import { getPostHog, initAnalytics, usePageviews } from "~/lib/analytics";
import { useLearnerAnalytics } from "~/lib/use-learner-analytics";
import { useUtmCapture } from "~/lib/utm";
import { AdProvider, RouteAdGate, useAdEngine } from "~/lib/ads/ad-context";
import { AdModal } from "~/components/brand/ad-modal";
import { AD_CLIENT, ADSENSE_LIVE, ADSENSE_SRC } from "~/lib/ads/ad-constants";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Montserrat:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap",
  },
  // Favicons. Explicit links so browsers and crawlers pick the right size
  // instead of guessing from /favicon.ico alone.
  { rel: "icon", href: "/favicon.ico", sizes: "any" },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/favicon-32x32.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    href: "/favicon-16x16.png",
  },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
];

/**
 * Site-wide meta defaults. Route-level `meta()` exports merge with these and
 * override by `name` / `property` / `title`. The default OG/Twitter image is
 * the DriveRush lockup; routes with a better card override `og:image`.
 */
export function meta() {
  const ogImage = absUrl(SITE.ogImage);
  return [
    { name: "theme-color", content: SITE.themeColor },
    { name: "robots", content: "index, follow" },
    { name: "format-detection", content: "telephone=no" },
    { property: "og:site_name", content: SITE.name },
    { property: "og:locale", content: SITE.locale },
    { property: "og:type", content: "website" },
    { property: "og:image", content: ogImage },
    { property: "og:image:width", content: String(SITE.ogImageWidth) },
    { property: "og:image:height", content: String(SITE.ogImageHeight) },
    { property: "og:image:alt", content: SITE.ogImageAlt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: ogImage },
    { name: "twitter:image:alt", content: SITE.ogImageAlt },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  // Track live OS changes / cross-tab choices. The toggle itself lives in the
  // main nav (see <AppBar>) — it used to float over every page, which got in
  // the way of the games on mobile.
  useThemeSync();
  const { pathname } = useLocation();
  // AdSense wants its code in the server-rendered <head> so the site review
  // crawler sees it. It also powers Auto ads. Never on the internal tools.
  const loadAdsense =
    ADSENSE_LIVE && import.meta.env.PROD && !pathname.startsWith("/tools");
  return (
    // The theme init script writes `style="color-scheme: …"` on <html> before
    // React hydrates (so light/dark settles without a flash). That edit comes
    // from outside React's tree, so suppress the hydration diff on this node.
    <html lang={SITE.lang} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Settle light/dark before first paint — no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <meta name="google-adsense-account" content={AD_CLIENT} />
        <Meta />
        <Links />
        {loadAdsense && (
          <script async src={ADSENSE_SRC} crossOrigin="anonymous" />
        )}
      </head>
      <body>
        <NavigationProgressBar />
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  const firstPath = React.useRef(location.pathname);
  const navigated = React.useRef(false);
  if (location.pathname !== firstPath.current) navigated.current = true;
  useUtmCapture();
  usePageviews();
  // Keeps PostHog person properties (signs mastered) in step with the local
  // progress stores. PostHog itself is initialised in
  // `entry.client.tsx`, before hydration.
  useLearnerAnalytics();
  return (
    // <AdProvider> wraps the route tree so the engine + modal survive route
    // transitions. <RouteAdGate /> reads each match's `handle.ads` and pushes
    // the interruptible flag into the engine. <AdModal /> is a portalled
    // sibling of the animated outlet — it doesn't unmount when the user
    // navigates away mid-impression.
    <AdProvider>
      <RouteAdGate />
      <AmbientAdTrigger />
      {/* Keyed so each new page gets a fresh entrance. There's no exit, so a tap
          never waits on the old page, and the first load isn't animated. */}
      <div
        key={location.pathname}
        className={navigated.current ? "dr-page" : undefined}
      >
        <Outlet />
      </div>
      <TabBar />
      <AdModal />
    </AdProvider>
  );
}

/**
 * Ambient ad trigger. Fires `route_change` on every SPA navigation. The
 * engine gates it by the active-session budget — most calls log
 * `session_budget_not_met` and do nothing; the call that lands after the
 * 5-min budget hits actually opens the modal. This is the "next action
 * fires the ad" mechanism for routes outside the game-specific trigger
 * sites (the trainers' `_toBetween`).
 */
function AmbientAdTrigger() {
  const location = useLocation();
  const { triggerAd } = useAdEngine();
  React.useEffect(() => {
    triggerAd("route_change");
  }, [location.pathname, triggerAd]);
  return null;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  React.useEffect(() => {
    void initAnalytics().then(() => {
      getPostHog()?.captureException(error);
    });
  }, [error]);

  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Road closed." : "Something broke.";
    details =
      error.status === 404
        ? "There is no page at this address. The board and the signs are still open."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto grid w-full max-w-xl gap-6 px-5 pb-16 pt-12 text-ink">
      <ScenePlate>
        <RoadClosedScene title="A road barrier with a number plate reading KDR 404" />
      </ScenePlate>
      <div className="grid gap-3">
        <h1 className="m-0 font-display text-[clamp(30px,7vw,48px)] font-extrabold uppercase leading-[0.95] tracking-tighter">
          {message}
        </h1>
        <p className="m-0 font-serif text-lg leading-snug text-ink-2">{details}</p>
        <Button variant="rush" size="lg" asChild className="mt-2 w-fit">
          <Link to="/model-town-board">Go to the Model Town Board</Link>
        </Button>
      </div>
      {stack && (
        <pre className="w-full overflow-x-auto border-2 border-ink bg-paper-3 p-4 text-xs">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
