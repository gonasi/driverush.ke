/**
 * XML sitemap served at `/sitemap.xml` (see `routes.ts` and `public/robots.txt`).
 *
 * A resource route: it has a `loader` and no component, so React Router returns
 * the `Response` as-is. List the public, indexable pages here — leave out the
 * internal `/tools` and `/design` routes, which `robots.txt` also disallows.
 *
 * Static pages share `STATIC_LAST_MODIFIED`; bump it when those pages get a
 * meaningful content update. Blog posts use their own frontmatter `date` so
 * the sitemap's `lastmod` for each post tracks the source.
 */
import { absUrl } from "~/lib/site";
import { getAllPosts } from "~/lib/blog";

const STATIC_LAST_MODIFIED = "2026-05-15";

type Entry = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
  lastmod: string;
};

/**
 * Cornerstone blog slugs — the SEO landing hubs. Pulled from `app/blogs/` like
 * any other post (so they get the same chrome and BlogPosting LD) but listed
 * here so the sitemap can mark them higher-priority than ordinary posts.
 */
const CORNERSTONE_SLUGS = new Set([
  "learning-to-drive-in-kenya",
  "driving-schools-in-kenya",
  "ntsa-test-prep-kenya",
]);

const STATIC_PAGES: Entry[] = [
  {
    path: "/",
    changefreq: "weekly",
    priority: "1.0",
    lastmod: STATIC_LAST_MODIFIED,
  },
  {
    path: "/road-signs",
    changefreq: "weekly",
    priority: "0.9",
    lastmod: STATIC_LAST_MODIFIED,
  },
  {
    path: "/road-signs/pelican",
    changefreq: "weekly",
    priority: "0.7",
    lastmod: STATIC_LAST_MODIFIED,
  },
  {
    path: "/road-signs/3d",
    changefreq: "weekly",
    priority: "0.4",
    lastmod: STATIC_LAST_MODIFIED,
  },
  {
    path: "/courses",
    changefreq: "weekly",
    priority: "0.8",
    lastmod: STATIC_LAST_MODIFIED,
  },
  {
    // Cornerstone landing for the "driving schools in Kenya" cluster. Higher
    // priority than blog posts so Google indexes it first.
    path: "/driving-schools-kenya",
    changefreq: "weekly",
    priority: "0.9",
    lastmod: STATIC_LAST_MODIFIED,
  },
  {
    path: "/practice",
    changefreq: "weekly",
    priority: "0.8",
    lastmod: STATIC_LAST_MODIFIED,
  },
  {
    path: "/blogs",
    changefreq: "weekly",
    priority: "0.8",
    lastmod: STATIC_LAST_MODIFIED,
  },
];

function blogEntries(): Entry[] {
  return getAllPosts().map((p) => {
    const isCornerstone = CORNERSTONE_SLUGS.has(p.slug);
    return {
      path: `/blogs/${p.slug}`,
      // Cornerstones get crawled more often and outrank ordinary posts in the
      // sitemap's priority ordering — they're the SEO hubs we want indexed
      // first.
      changefreq: isCornerstone ? "weekly" : "monthly",
      priority: isCornerstone ? "0.9" : "0.6",
      lastmod: p.date,
    };
  });
}

export function loader() {
  const entries = [...STATIC_PAGES, ...blogEntries()];

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
