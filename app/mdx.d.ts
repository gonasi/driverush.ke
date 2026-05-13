/**
 * Ambient module declaration for `.mdx` blog posts. The vite MDX plugin
 * compiles each `.mdx` file to a React component (default export) and lifts
 * its YAML frontmatter onto a named `frontmatter` export via
 * `remark-mdx-frontmatter`. Keep this typed loose — per-post frontmatter is
 * validated when we build the blog manifest in `~/lib/blog`.
 */
declare module "*.mdx" {
  import type { ComponentType } from "react";

  export const frontmatter: Record<string, unknown>;
  const Component: ComponentType;
  export default Component;
}
