import type { Meta, StoryObj } from "@storybook/react-vite";

import { Switch } from "./switch";

const meta = {
  title: "Primitives/Switch",
  component: Switch,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const States: Story = {
  render: () => (
    <div className="grid gap-4">
      <label className="inline-flex items-center gap-3 text-[14px] font-medium text-ink">
        <Switch defaultChecked />
        <span>Sound effects</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
          ON
        </span>
      </label>
      <label className="inline-flex items-center gap-3 text-[14px] font-medium text-ink">
        <Switch />
        <span>Hard mode</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
          OFF
        </span>
      </label>
      <label className="inline-flex items-center gap-3 text-[14px] font-medium text-ink opacity-60">
        <Switch disabled />
        <span>Disabled</span>
      </label>
    </div>
  ),
};
