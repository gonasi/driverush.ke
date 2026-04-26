import type { Meta, StoryObj } from "@storybook/react-vite";

import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const meta = {
  title: "Primitives/ToggleGroup",
  component: ToggleGroup,
  parameters: { layout: "centered" },
  args: { type: "single" },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TimeWindow: Story = {
  args: { type: "single", defaultValue: "week" },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
      <ToggleGroupItem value="all">All time</ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const MultiSelect: Story = {
  args: { type: "multiple", defaultValue: ["b"] },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="a">A · Bike</ToggleGroupItem>
      <ToggleGroupItem value="b">B · Car</ToggleGroupItem>
      <ToggleGroupItem value="c">C · Goods</ToggleGroupItem>
      <ToggleGroupItem value="d">D · PSV</ToggleGroupItem>
    </ToggleGroup>
  ),
};
