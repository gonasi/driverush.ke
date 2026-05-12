import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import { AnimatePresence, motion } from "framer-motion";

import type { Route } from "./+types/root";
import "./app.css";
import { Toaster } from "~/components/ui/sonner";
import { NavigationProgressBar } from "~/components/brand/navigation-progress-bar";
import { THEME_INIT_SCRIPT, useThemeSync } from "~/lib/theme";
import { variants } from "~/lib/motion";
import { SITE, absUrl } from "~/lib/site";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Montserrat:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400;1,700&display=swap",
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
  return (
    <html lang={SITE.lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Settle light/dark before first paint — no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <Meta />
        <Links />
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
  return (
    // mode="wait" → outgoing route fully exits before the next enters, so
    // there's no overlap to fight with the page's stamped layout.
    // initial={false} → SSR's first paint isn't animated; subsequent client
    // navigations get the snap fade/slide.
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={variants.page}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
