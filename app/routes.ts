import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("courses", "routes/courses.tsx"),
  route("practice", "routes/practice.tsx"),
  route("design", "routes/design.tsx"),
] satisfies RouteConfig;
