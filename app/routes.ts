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
  // Class guides. One file, three routes: the path picks the class.
  route("road-signs/warning-signs", "routes/road-sign-class.tsx", {
    id: "sign-class-warning",
  }),
  route("road-signs/mandatory-signs", "routes/road-sign-class.tsx", {
    id: "sign-class-mandatory",
  }),
  route("road-signs/prohibitory-signs", "routes/road-sign-class.tsx", {
    id: "sign-class-prohibitory",
  }),
  // One page per sign. The trainers and class guides above take priority.
  route("road-signs/:slug", "routes/road-sign.tsx"),
  route("model-town-board", "routes/model-town-board.tsx"),
  // The game alone, with no page under it. Every way into driving links here.
  route("model-town-board/play", "routes/board-play.tsx"),
  // Every level as a picture to pick from, and the pictures themselves.
  route("model-town-board/levels", "routes/board-levels.tsx"),
  route("model-town-board/levels/:file", "routes/board-level-picture.ts"),
  // The board's guides. One file, one route each: the path picks the guide.
  route("model-town-board/diagram", "routes/board-guide.tsx", {
    id: "board-guide-diagram",
  }),
  route("model-town-board/lane-options", "routes/board-guide.tsx", {
    id: "board-guide-lane-options",
  }),
  route("model-town-board/questions", "routes/board-guide.tsx", {
    id: "board-guide-questions",
  }),
  route("model-town-board/roundabout", "routes/board-guide.tsx", {
    id: "board-guide-roundabout",
  }),
  route("model-town-board/rules", "routes/board-guide.tsx", {
    id: "board-guide-rules",
  }),
  route("model-town-board/parking", "routes/board-guide.tsx", {
    id: "board-guide-parking",
  }),

  // Permanent guides. MDX bodies live in `app/guides/`.
  route("guides", "routes/guides.tsx"),
  route("ntsa-test", "routes/ntsa-test.tsx"),
  route("ntsa-test/questions", "routes/ntsa-questions.tsx"),
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
      route("board-network", "routes/tools/board-network.tsx"),
    ]),
    // Outside the dashboard layout on purpose: `?card=<id>` must render the
    // card alone so a 1200×630 screenshot contains nothing else.
    route("og", "routes/tools/og.tsx"),
  ]),
] satisfies RouteConfig;
