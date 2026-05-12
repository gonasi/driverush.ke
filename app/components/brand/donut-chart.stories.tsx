import type { Meta, StoryObj } from "@storybook/react-vite";

import { DonutChart } from "./donut-chart";

const meta: Meta<typeof DonutChart> = {
  title: "Brand/DonutChart",
  component: DonutChart,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof DonutChart>;

export const TimeByTopic: Story = {
  render: () => (
    <div className="max-w-md">
      <DonutChart
        centerValue="14h"
        centerLabel="This month"
        segments={[
          { label: "Highway code", value: 62, color: "var(--rush)" },
          { label: "Junctions", value: 18, color: "var(--amber)" },
          { label: "Signs", value: 15, color: "var(--kenya-green)" },
          { label: "Other", value: 5, color: "var(--paper-2)" },
        ]}
      />
    </div>
  ),
};
