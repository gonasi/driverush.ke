import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("courses", "routes/courses.tsx"),
  // Interactive course engine — overview + the lesson player. Content lives in
  // `app/courses/<courseSlug>/...`; the manifest is built in `app/lib/course.ts`.
  route("courses/:courseSlug", "routes/course-overview.tsx"),
  route(
    "courses/:courseSlug/:chapterSlug/:lessonSlug",
    "routes/course-lesson.tsx",
  ),
  route("driving-schools-kenya", "routes/driving-schools-kenya.tsx"),
  route("road-signs", "routes/road-signs.tsx"),
  route("road-signs/pelican", "routes/road-signs-pelican.tsx"),
  route("road-signs/3d", "routes/road-signs-3d.tsx"),
  route("practice", "routes/practice.tsx"),
  route("design", "routes/design.tsx"),

  // Blog — index + dynamic per-post route. MDX bodies live in `app/blogs/`.
  // Cornerstone SEO posts (learning-to-drive-in-kenya, driving-schools-in-kenya,
  // ntsa-test-prep-kenya) live here too — they get the same chrome and ship
  // FAQPage JSON-LD via per-post frontmatter.
  route("blogs", "routes/blogs.tsx"),
  route("blogs/:slug", "routes/blogs-post.tsx"),

  // Where shared achievement links land (`/s?k=quiz&…`). Deliberately short:
  // the URL travels through WhatsApp forwards. Renders a useful page for any
  // payload, including one that's broken or missing, and never 404s.
  route("s", "routes/share-landing.tsx"),

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
