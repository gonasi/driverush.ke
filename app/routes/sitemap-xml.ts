/**
 * XML sitemap served at `/sitemap.xml` (see `routes.ts` and `public/robots.txt`).
 *
 * A resource route: it has a `loader` and no component, so React Router returns
 * the `Response` as-is. List the public, indexable pages here — leave out the
 * internal `/tools` routes, which `robots.txt` also disallows.
 *
 * Board pages take `BOARD_CHECKED` and sign class pages their own checked
 * date. Other static pages share `STATIC_LAST_MODIFIED`; bump it when those
 * pages get a meaningful content update. Blog posts use their own frontmatter `date` so
 * the sitemap's `lastmod` for each post tracks the source.
 */
import { absUrl } from "~/lib/site";
import { getAllPosts } from "~/lib/blog";
import {
  BOARD_CHECKED,
  BOARD_LEVELS_PATH,
  BOARD_GUIDES,
  BOARD_PATH,
  BOARD_QUESTIONS_PDF,
} from "~/lib/board-guides";
import {
  NTSA_QUESTIONS_CHECKED,
  NTSA_QUESTIONS_PATH,
} from "~/lib/ntsa-questions-page";
import { SIGN_CLASS_PAGES } from "~/lib/sign-class-pages";
import {
  isSignConfirmed,
  SIGN_PAGES,
  signHeading,
  signImagePath,
  signPagePath,
} from "~/lib/road-sign-pages";

const STATIC_LAST_MODIFIED = "2026-11-11";

type Entry = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
  lastmod: string;
  /** A picture on the page, for image search. */
  image?: { loc: string; title: string };
};

/** The post that still works as a hub. These get crawled first. */
const CORNERSTONE_SLUGS = new Set(["learning-to-drive-in-kenya"]);

function page(
  path: string,
  priority: string,
  changefreq: Entry["changefreq"] = "monthly",
  lastmod: string = STATIC_LAST_MODIFIED,
): Entry {
  return { path, priority, changefreq, lastmod };
}

const STATIC_PAGES: Entry[] = [
  page("/", "1.0", "weekly"),
  // The Model Town Board is what most learners come for.
  page(BOARD_PATH, "1.0", "weekly", BOARD_CHECKED),
  page(BOARD_LEVELS_PATH, "0.7", "weekly", BOARD_CHECKED),
  ...BOARD_GUIDES.map((guide) =>
    page(guide.path, "0.8", "monthly", BOARD_CHECKED),
  ),
  // The free questions PDF, for "model town board pdf" searches.
  page(BOARD_QUESTIONS_PDF, "0.5", "monthly", BOARD_CHECKED),
  page("/road-signs", "0.9", "weekly"),
  page("/guides", "0.6"),
  page("/ntsa-test", "0.9"),
  page(NTSA_QUESTIONS_PATH, "0.8", "monthly", NTSA_QUESTIONS_CHECKED),
  page("/driving-schools-kenya", "0.9"),
  ...SIGN_CLASS_PAGES.map((p) => page(p.path, "0.8", "monthly", p.checked)),
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
  return SIGN_PAGES.filter(isSignConfirmed).map((sign) => ({
    ...page(signPagePath(sign), "0.6"),
    image: {
      loc: signImagePath(sign),
      title: `${signHeading(sign.name!)}, Kenyan road sign ${sign.code}`,
    },
  }));
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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
        (p.image
          ? `    <image:image>\n` +
            `      <image:loc>${absUrl(p.image.loc)}</image:loc>\n` +
            `      <image:title>${escapeXml(p.image.title)}</image:title>\n` +
            `    </image:image>\n`
          : "") +
        `  </url>`,
    )
    .join("\n");

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    `${urls}\n` +
    `</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
