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
import { variants } from "~/lib/motion";
import { SITE } from "~/lib/site";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=DM+Serif+Display&display=swap",
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
 * override by `name` / `property` / `title`.
 */
export function meta() {
  return [
    { name: "theme-color", content: SITE.themeColor },
    { name: "robots", content: "index, follow" },
    { name: "format-detection", content: "telephone=no" },
    { property: "og:site_name", content: SITE.name },
    { property: "og:locale", content: SITE.locale },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE.lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
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
