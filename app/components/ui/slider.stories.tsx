import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slider } from "./slider";

const meta = {
  title: "Primitives/Slider",
  component: Slider,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Speedometer: Story = {
  render: () => (
    <div className="grid w-[480px] gap-6">
      <div>
        <Slider defaultValue={[64]} max={100} step={1} />
        <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-ink-3">
          <span>Quiz difficulty</span>
          <span className="text-rush">Rush · 64</span>
        </div>
      </div>
      <div>
        <Slider defaultValue={[15]} max={60} step={5} />
        <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-ink-3">
          <span>Daily goal · min</span>
          <span>15 / 60</span>
        </div>
      </div>
      <div>
        <Slider defaultValue={[20, 80]} max={100} step={1} />
        <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-ink-3">
          <span>Score range</span>
          <span>20 — 80</span>
        </div>
      </div>
    </div>
  ),
};
