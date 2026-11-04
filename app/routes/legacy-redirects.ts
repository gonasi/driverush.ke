/**
 * 301s for pages that no longer exist. The site used to carry a course, quizzes
 * and a schools directory; those URLs live on in search results and WhatsApp
 * forwards, so each lands somewhere useful rather than a 404.
 *
 * Campaign tags carry through so attribution survives the hop. Everything else
 * (like `?mode=test`) means nothing at the new address and is dropped.
 */
import { redirect, type LoaderFunctionArgs } from "react-router";

const TARGETS: Record<string, string> = {
  courses: "/road-signs",
  practice: "/road-signs",
  "driving-schools-kenya": "/blogs/driving-schools-in-kenya",
  design: "/",
};

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const target = TARGETS[url.pathname.split("/")[1] ?? ""] ?? "/";
  const utm = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (key.startsWith("utm_")) utm.append(key, value);
  }
  const query = utm.toString();
  throw redirect(query ? `${target}?${query}` : target, 301);
}
