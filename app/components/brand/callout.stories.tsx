import type { Meta, StoryObj } from "@storybook/react-vite";
import { Fire02FreeIcons } from "@hugeicons/core-free-icons";

import { Callout } from "./callout";

const meta = {
  title: "Brand/Callout",
  component: Callout,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="max-w-3xl">
      <Callout>
        If a feature can't be defended under one of the three house rules, it
        doesn't ship. Pretty isn't a defence. Familiar isn't a defence.
      </Callout>
    </div>
  ),
};

export const CustomIcon: Story = {
  render: () => (
    <div className="max-w-3xl">
      <Callout icon={Fire02FreeIcons}>
        12-day streak. Don't break it tomorrow.
      </Callout>
    </div>
  ),
};
