import * as React from "react";
import type { Preview } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import { MemoryRouter } from "react-router";

import "../app/app.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "paper",
      values: [
        { name: "paper", value: "#f2ede3" },
        { name: "ink", value: "#0e1014" },
        { name: "surface", value: "#ffffff" },
        { name: "rush", value: "#e11d2e" },
      ],
    },
    a11y: {
      test: "todo",
    },
  },
  decorators: [
    // Router context so components that render <Link> (e.g. SignGameCard) work
    // in isolation.
    (Story) =>
      React.createElement(MemoryRouter, null, React.createElement(Story)),
    withThemeByClassName({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
