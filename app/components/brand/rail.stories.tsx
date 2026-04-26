import type { Meta, StoryObj } from "@storybook/react-vite";

import { Rail } from "./rail";

const meta = {
  title: "Brand/Rail",
  component: Rail,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Rail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="bg-paper">
      <Rail />
      <div className="p-12">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
          Page content sits below the rail with breathing room for the 5-color
          flag underbar.
        </p>
      </div>
    </div>
  ),
};
