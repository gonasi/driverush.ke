import type { StorybookConfig } from "@storybook/react-vite";
import type { Plugin, PluginOption } from "vite";
import { mergeConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Strip the React Router Vite plugin from any plugin tree it appears in.
// Storybook's vite builder loads the project's vite.config.ts before our
// viteFinal hook runs, and the React Router plugin throws if it's present
// outside a real RR build. Tailwind we re-add ourselves below.
function stripIncompatiblePlugins(
  plugins: PluginOption[] | undefined,
): PluginOption[] {
  if (!plugins) return [];
  return plugins.flat(Infinity).filter((p): p is Plugin => {
    if (!p || typeof p !== "object") return false;
    const name = (p as Plugin).name ?? "";
    return !name.startsWith("react-router") && !name.startsWith("@tailwindcss");
  });
}

const config: StorybookConfig = {
  stories: ["../app/**/*.stories.@(ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
  async viteFinal(config) {
    const cleanedPlugins = stripIncompatiblePlugins(config.plugins);
    return mergeConfig(
      { ...config, plugins: cleanedPlugins },
      {
        plugins: [tailwindcss()],
        resolve: {
          alias: {
            "~": new URL("../app", import.meta.url).pathname,
          },
        },
      },
    );
  },
};

export default config;
