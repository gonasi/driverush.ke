import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("courses", "routes/courses.tsx"),
  route("road-signs", "routes/road-signs.tsx"),
  route("road-signs/pelican", "routes/road-signs-pelican.tsx"),
  route("road-signs/3d", "routes/road-signs-3d.tsx"),
  route("practice", "routes/practice.tsx"),
  route("design", "routes/design.tsx"),
] satisfies RouteConfig;
