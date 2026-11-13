/**
 * 301s for pages that no longer exist. The site used to carry a course and
 * quizzes, and two blog posts have since become permanent guides; those URLs live
 * on in search results and WhatsApp forwards, so each lands somewhere useful
 * rather than a 404.
 *
 * Campaign tags carry through so attribution survives the hop. Everything else
 * (like `?mode=test`) means nothing at the new address and is dropped.
 */
import { redirect, type LoaderFunctionArgs } from "react-router";

/** Whole paths, checked first. */
const EXACT_TARGETS: Record<string, string> = {
  "/blogs/ntsa-test-prep-kenya": "/ntsa-test",
  "/blogs/driving-schools-in-kenya": "/driving-schools-kenya",
};

/** By first path segment. */
const TARGETS: Record<string, string> = {
  courses: "/road-signs",
  practice: "/ntsa-test",
  ntsa: "/ntsa-test",
  design: "/",
};

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const target =
    EXACT_TARGETS[url.pathname] ?? TARGETS[url.pathname.split("/")[1] ?? ""] ?? "/";
  const utm = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (key.startsWith("utm_")) utm.append(key, value);
  }
  const query = utm.toString();
  throw redirect(query ? `${target}?${query}` : target, 301);
}
