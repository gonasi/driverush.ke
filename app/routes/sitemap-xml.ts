/**
 * XML sitemap served at `/sitemap.xml` (see `routes.ts` and `public/robots.txt`).
 *
 * A resource route: it has a `loader` and no component, so React Router returns
 * the `Response` as-is. List the public, indexable pages here — leave out the
 * internal `/tools` and `/design` routes, which `robots.txt` also disallows.
 *
 * `LAST_MODIFIED` is a hand-maintained date; bump it when the listed pages get
 * a meaningful content update so crawlers know to re-fetch.
 */
import { absUrl } from "~/lib/site";

const LAST_MODIFIED = "2026-05-12";

type Entry = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
};

const PAGES: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/road-signs", changefreq: "weekly", priority: "0.9" },
  { path: "/road-signs/pelican", changefreq: "weekly", priority: "0.7" },
  { path: "/road-signs/3d", changefreq: "weekly", priority: "0.4" },
  { path: "/courses", changefreq: "weekly", priority: "0.8" },
  { path: "/practice", changefreq: "weekly", priority: "0.8" },
];

export function loader() {
  const urls = PAGES.map(
    (p) =>
      `  <url>\n` +
      `    <loc>${absUrl(p.path)}</loc>\n` +
      `    <lastmod>${LAST_MODIFIED}</lastmod>\n` +
      `    <changefreq>${p.changefreq}</changefreq>\n` +
      `    <priority>${p.priority}</priority>\n` +
      `  </url>`,
  ).join("\n");

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
