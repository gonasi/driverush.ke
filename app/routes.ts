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
  route("road-signs", "routes/road-signs.tsx"),
  route("road-signs/pelican", "routes/road-signs-pelican.tsx"),
  route("road-signs/3d", "routes/road-signs-3d.tsx"),
  route("practice", "routes/practice.tsx"),
  route("design", "routes/design.tsx"),

  // Internal authoring tools — own dashboard layout (sidebar + mobile sheet).
  ...prefix("tools", [
    layout("routes/layouts/tools-layout.tsx", [
      index("routes/tools/index.tsx"),
      route("image-coords", "routes/tools/image-coords.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
