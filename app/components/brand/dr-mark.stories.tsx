import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  DrMark,
  DrWordmark,
  DrVertical,
  DrStamp,
  DrPlate,
  DrRacing,
} from "./dr-mark";

const meta = {
  title: "Brand/DR Mark",
  component: DrMark,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DrMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sizes: Story = {
  render: () => (
    <div className="flex items-baseline gap-6">
      <DrMark size="xs" />
      <DrMark size="sm" />
      <DrMark size="md" />
      <DrMark size="lg" />
      <DrMark size="xl" />
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-0 border-2 border-ink">
      <div className="flex h-32 items-center justify-center border-r-2 border-ink bg-paper-3">
        <DrMark size="lg" />
      </div>
      <div className="flex h-32 items-center justify-center bg-ink">
        <DrMark size="lg" tone="knockout" />
      </div>
      <div className="flex h-32 items-center justify-center border-r-2 border-t-2 border-ink bg-rush">
        <DrMark size="lg" tone="knockout" />
      </div>
      <div className="flex h-32 items-center justify-center border-t-2 border-ink bg-cream">
        <DrMark size="lg" tone="allink" />
      </div>
    </div>
  ),
};

export const Wordmark: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <DrWordmark size="sm" />
      <DrWordmark size="md" />
      <DrWordmark size="lg" />
      <DrWordmark size="xl" />
    </div>
  ),
};

export const VerticalLockup: Story = {
  render: () => (
    <div className="flex justify-center bg-cream p-10">
      <DrVertical />
    </div>
  ),
};

export const Stamp: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex size-40 items-center justify-center border-2 border-ink bg-paper-3">
        <DrStamp className="text-ink" />
      </div>
      <div className="flex size-40 items-center justify-center border-2 border-ink bg-ink">
        <DrStamp className="text-paper" />
      </div>
    </div>
  ),
};

export const Plate: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <DrPlate />
      <DrPlate region="UG" code="DR" year="2026" />
      <DrPlate region="TZ" code="DR" year="2026" />
    </div>
  ),
};

export const Racing: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <DrRacing size="sm" />
      <DrRacing size="md" />
      <DrRacing size="lg" />
    </div>
  ),
};
