import type { Meta, StoryObj } from "@storybook/react-vite";

import { Progress, ProgressIndeterminate } from "./progress";

const meta = {
  title: "Primitives/Progress",
  component: Progress,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tach: Story = {
  render: () => (
    <div className="grid w-[480px] gap-5 border-2 border-ink bg-surface p-5">
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Quiz · 03 of 05
          </span>
          <span className="font-display text-[22px] font-extrabold text-rush">
            60%
          </span>
        </div>
        <Progress value={60} />
      </div>
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-3">
            Course · Class B
          </span>
          <span className="font-display text-[22px] font-extrabold text-rush">
            34%
          </span>
        </div>
        <Progress value={34} />
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-3">
          Determinate · 78%
        </p>
        <Progress value={78} tone="green" showTicks={false} className="h-4" />
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-3">
          Indeterminate · loading
        </p>
        <ProgressIndeterminate />
      </div>
    </div>
  ),
};
