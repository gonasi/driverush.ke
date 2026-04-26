import type { Meta, StoryObj } from "@storybook/react-vite";

import { TachCircle, TachSegments, TachSteps } from "./tach";

const meta: Meta<typeof TachCircle> = {
  title: "Brand/Tach Variants",
  component: TachCircle,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof TachCircle>;

export const Circles: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <TachCircle value={72} />
      <TachCircle value={34} />
      <TachCircle value={100}>
        <span>✓</span>
      </TachCircle>
    </div>
  ),
};

export const Segments: Story = {
  render: () => (
    <div className="grid gap-4">
      <TachSegments total={7} done={4} />
      <TachSegments total={10} done={7} showCounter={false} />
    </div>
  ),
};

export const Steps: Story = {
  render: () => (
    <div className="grid w-[480px] gap-6">
      <TachSteps total={5} current={3} />
      <TachSteps total={4} current={1} />
      <TachSteps total={6} current={6} />
    </div>
  ),
};
