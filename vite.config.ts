import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

export default defineConfig({
  plugins: [
    // MDX must run before reactRouter so .mdx files are JSX by the time the
    // router plugin sees them. `frontmatter` is exported as a named export so
    // routes can pluck `title`, `description`, `slug`, etc.
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [
          remarkGfm,
          remarkFrontmatter,
          [remarkMdxFrontmatter, { name: "frontmatter" }],
        ],
        providerImportSource: "~/components/brand/mdx-components",
      }),
    },
    tailwindcss(),
    reactRouter(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
