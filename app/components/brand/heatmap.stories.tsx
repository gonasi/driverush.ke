import type { Meta, StoryObj } from "@storybook/react-vite";

import { Heatmap } from "./heatmap";

const meta: Meta<typeof Heatmap> = {
  title: "Brand/Heatmap",
  component: Heatmap,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Heatmap>;

// Deterministic pseudo-random series so the story is stable across renders.
const data = Array.from({ length: 100 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const r = seed / 233280;
  return i > 87 && i < 100 ? 3 + Math.round(r) : Math.round(r * 4);
});

export const DailyActivity: Story = {
  render: () => (
    <div className="max-w-md">
      <Heatmap title="Last 100 days" meta="12-day streak" data={data} />
    </div>
  ),
};
