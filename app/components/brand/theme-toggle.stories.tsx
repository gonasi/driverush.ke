import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThemeToggle } from "./theme-toggle";

const meta: Meta<typeof ThemeToggle> = {
  title: "Brand/ThemeToggle",
  component: ThemeToggle,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

/** Sun glyph — the resting state on a light page. */
export const Light: Story = {
  render: () => <ThemeToggle />,
};

/** Moon glyph — wrapped in `.dark` so CSS swaps the icon, as it does on <html>. */
export const Dark: Story = {
  render: () => (
    <div className="dark inline-flex bg-surface p-6">
      <ThemeToggle />
    </div>
  ),
};
