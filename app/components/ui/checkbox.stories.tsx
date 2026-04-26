import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const States: Story = {
  render: () => (
    <div className="grid gap-3">
      <label className="inline-flex items-center gap-2.5 text-[14px] font-medium text-ink">
        <Checkbox />
        Daily streak reminders
      </label>
      <label className="inline-flex items-center gap-2.5 text-[14px] font-medium text-ink">
        <Checkbox defaultChecked />
        Weekly summary email
      </label>
      <label className="inline-flex items-center gap-2.5 text-[14px] font-medium text-ink">
        <Checkbox checked="indeterminate" />
        Some lessons selected
      </label>
      <label className="inline-flex items-center gap-2.5 text-[14px] font-medium text-ink opacity-60">
        <Checkbox disabled />
        Disabled
      </label>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2.5">
      <Checkbox id="terms" defaultChecked />
      <Label htmlFor="terms">I agree to the NTSA terms</Label>
    </div>
  ),
};
