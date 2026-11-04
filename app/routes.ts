import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("road-signs", "routes/road-signs.tsx"),
  route("road-signs/pelican", "routes/road-signs-pelican.tsx"),
  route("road-signs/3d", "routes/road-signs-3d.tsx"),
  // One page per sign. The two trainers above take priority over the slug.
  route("road-signs/:slug", "routes/road-sign.tsx"),
  route("model-town-board", "routes/model-town-board.tsx"),

  // Permanent guides. MDX bodies live in `app/guides/`.
  route("ntsa-test", "routes/ntsa-test.tsx"),
  route("driving-schools-kenya", "routes/driving-schools-kenya.tsx"),
  route("derevaprep-alternative", "routes/derevaprep-alternative.tsx"),
  route("about", "routes/about.tsx"),
  route("privacy", "routes/privacy.tsx"),

  // Blog: index + dynamic per-post route. MDX bodies live in `app/blogs/`.
  route("blogs", "routes/blogs.tsx"),
  route("blogs/:slug", "routes/blogs-post.tsx"),
  // Became permanent guides. These outrank the `:slug` route above.
  route("blogs/ntsa-test-prep-kenya", "routes/legacy-redirects.ts", {
    id: "legacy-blog-ntsa",
  }),
  route("blogs/driving-schools-in-kenya", "routes/legacy-redirects.ts", {
    id: "legacy-blog-schools",
  }),

  // Where shared achievement links land (`/s?k=quiz&…`). Deliberately short:
  // the URL travels through WhatsApp forwards. Renders a useful page for any
  // payload, including one that's broken or missing, and never 404s.
  route("s", "routes/share-landing.tsx"),

  // Retired pages, permanently redirected. See the route file for the targets.
  route("courses/*", "routes/legacy-redirects.ts", { id: "legacy-courses" }),
  route("practice", "routes/legacy-redirects.ts", { id: "legacy-practice" }),
  route("ntsa", "routes/legacy-redirects.ts", { id: "legacy-ntsa" }),
  route("design", "routes/legacy-redirects.ts", { id: "legacy-design" }),

  // SEO resource route — XML sitemap at /sitemap.xml (referenced by robots.txt).
  route("sitemap.xml", "routes/sitemap-xml.ts"),

  // Internal authoring tools — own dashboard layout (sidebar + mobile sheet).
  ...prefix("tools", [
    layout("routes/layouts/tools-layout.tsx", [
      index("routes/tools/index.tsx"),
      route("image-coords", "routes/tools/image-coords.tsx"),
      route("sign-3d", "routes/tools/sign-3d.tsx"),
      route("share", "routes/tools/share.tsx"),
    ]),
    // Outside the dashboard layout on purpose: `?card=<id>` must render the
    // card alone so a 1200×630 screenshot contains nothing else.
    route("og", "routes/tools/og.tsx"),
  ]),
] satisfies RouteConfig;
