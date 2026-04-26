import type { Meta, StoryObj } from "@storybook/react-vite";

import { Logo } from "./logo";

const meta: Meta<typeof Logo> = {
  title: "Brand/Logo",
  component: Logo,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Variants: Story = {
  render: () => (
    <div className="grid gap-0 border-2 border-ink md:grid-cols-2">
      <div className="flex h-48 items-center justify-center border-r-2 border-ink bg-white p-6">
        <Logo variant="main" height={120} priority />
      </div>
      <div className="flex h-48 items-center justify-center bg-paper-3 p-6">
        <Logo variant="plain" height={96} priority />
      </div>
    </div>
  ),
};

export const Knockout: Story = {
  render: () => (
    <div className="grid gap-0 border-2 border-ink md:grid-cols-3">
      <div className="flex h-40 items-center justify-center border-r-2 border-ink bg-ink p-6">
        <Logo variant="plain" height={72} knockout />
      </div>
      <div className="flex h-40 items-center justify-center border-r-2 border-ink bg-rush p-6">
        <Logo variant="plain" height={72} knockout />
      </div>
      <div className="flex h-40 items-center justify-center bg-kenya-green p-6">
        <Logo variant="plain" height={72} knockout />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6 bg-paper-3 p-6">
      <Logo variant="plain" height={24} />
      <Logo variant="plain" height={36} />
      <Logo variant="plain" height={48} />
      <Logo variant="plain" height={64} />
      <Logo variant="plain" height={96} />
    </div>
  ),
};
