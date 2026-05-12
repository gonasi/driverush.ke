import type { Meta, StoryObj } from "@storybook/react-vite";

import { BarChart } from "./bar-chart";

const meta: Meta<typeof BarChart> = {
  title: "Brand/BarChart",
  component: BarChart,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof BarChart>;

export const WeeklyXp: Story = {
  render: () => (
    <div className="max-w-md">
      <BarChart
        title="XP this week"
        meta="+1,840 total"
        data={[
          { label: "Mon", value: 120 },
          { label: "Tue", value: 240, tone: "ink" },
          { label: "Wed", value: 180 },
          { label: "Thu", value: 320, tone: "ink" },
          { label: "Fri", value: 160 },
          { label: "Sat", value: 410, tone: "green" },
          { label: "Sun", value: 280, tone: "ink" },
        ]}
      />
    </div>
  ),
};
