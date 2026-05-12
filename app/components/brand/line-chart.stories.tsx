import type { Meta, StoryObj } from "@storybook/react-vite";

import { LineChart } from "./line-chart";

const meta: Meta<typeof LineChart> = {
  title: "Brand/LineChart",
  component: LineChart,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof LineChart>;

export const AccuracyTrend: Story = {
  render: () => (
    <div className="max-w-md">
      <LineChart
        max={100}
        series={[
          {
            label: "You · 84%",
            color: "#E11D2E",
            data: [20, 30, 25, 45, 60, 55, 73, 80, 85],
          },
          {
            label: "Class avg · 67%",
            color: "currentColor",
            dashed: true,
            data: [10, 15, 18, 23, 30, 35, 41, 46, 50],
          },
        ]}
      />
    </div>
  ),
};
