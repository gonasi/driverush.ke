/**
 * XML sitemap served at `/sitemap.xml` (see `routes.ts` and `public/robots.txt`).
 *
 * A resource route: it has a `loader` and no component, so React Router returns
 * the `Response` as-is. List the public, indexable pages here — leave out the
 * internal `/tools` routes, which `robots.txt` also disallows.
 *
 * Static pages share `STATIC_LAST_MODIFIED`; bump it when those pages get a
 * meaningful content update. Blog posts use their own frontmatter `date` so
 * the sitemap's `lastmod` for each post tracks the source.
 */
import { absUrl } from "~/lib/site";
import { getAllPosts } from "~/lib/blog";
import { SIGN_CLASS_PAGES } from "~/lib/sign-class-pages";
import {
  isSignConfirmed,
  SIGN_PAGES,
  signPagePath,
} from "~/lib/road-sign-pages";

const STATIC_LAST_MODIFIED = "2026-11-05";

type Entry = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
  lastmod: string;
};

/** The post that still works as a hub. These get crawled first. */
const CORNERSTONE_SLUGS = new Set(["learning-to-drive-in-kenya"]);

function page(
  path: string,
  priority: string,
  changefreq: Entry["changefreq"] = "monthly",
): Entry {
  return { path, priority, changefreq, lastmod: STATIC_LAST_MODIFIED };
}

const STATIC_PAGES: Entry[] = [
  page("/", "1.0", "weekly"),
  page("/road-signs", "0.9", "weekly"),
  page("/ntsa-test", "0.9"),
  page("/model-town-board", "0.9"),
  page("/driving-schools-kenya", "0.9"),
  ...SIGN_CLASS_PAGES.map((p) => page(p.path, "0.8")),
  page("/road-signs/pelican", "0.7", "weekly"),
  page("/road-signs/3d", "0.7", "weekly"),
  page("/blogs", "0.7", "weekly"),
  page("/derevaprep-alternative", "0.5"),
  page("/about", "0.4", "yearly"),
  page("/privacy", "0.2", "yearly"),
];

/**
 * Only the signs confirmed against an official source. The others have pages but
 * are marked noindex until they're checked: see `CONFIRMED_CODES`.
 */
function signEntries(): Entry[] {
  return SIGN_PAGES.filter(isSignConfirmed).map((sign) =>
    page(signPagePath(sign), "0.6"),
  );
}

function blogEntries(): Entry[] {
  return getAllPosts().map((p) => {
    const isCornerstone = CORNERSTONE_SLUGS.has(p.slug);
    return {
      path: `/blogs/${p.slug}`,
      changefreq: isCornerstone ? "weekly" : "monthly",
      priority: isCornerstone ? "0.8" : "0.6",
      lastmod: p.updated ?? p.date,
    };
  });
}

export function loader() {
  const entries = [...STATIC_PAGES, ...signEntries(), ...blogEntries()];

  const urls = entries
    .map(
      (p) =>
        `  <url>\n` +
        `    <loc>${absUrl(p.path)}</loc>\n` +
        `    <lastmod>${p.lastmod}</lastmod>\n` +
        `    <changefreq>${p.changefreq}</changefreq>\n` +
        `    <priority>${p.priority}</priority>\n` +
        `  </url>`,
    )
    .join("\n");

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
