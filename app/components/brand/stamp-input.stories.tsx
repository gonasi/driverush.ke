import type { Meta, StoryObj } from "@storybook/react-vite";

import { StampInput } from "./stamp-input";
import { Label } from "../ui/label";

const meta = {
  title: "Brand/StampInput",
  component: StampInput,
  parameters: { layout: "padded" },
  args: { prefix: "+254" },
} satisfies Meta<typeof StampInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Phone: Story = {
  render: () => (
    <div className="grid w-96 gap-1.5">
      <Label htmlFor="mpesa">M-Pesa number</Label>
      <StampInput
        id="mpesa"
        prefix="+254"
        prefixTone="rush"
        defaultValue="722 410 880"
        suffix="VERIFY"
      />
      <p className="font-mono text-[10.5px] tracking-wide text-ink-3">
        We'll send a 4-digit code via SMS.
      </p>
    </div>
  ),
};

export const Category: Story = {
  render: () => (
    <div className="grid w-96 gap-1.5">
      <Label htmlFor="cat">NTSA category</Label>
      <StampInput
        id="cat"
        prefix="B"
        prefixTone="amber"
        defaultValue="Class B · light vehicle"
        suffix="CHANGE"
      />
    </div>
  ),
};

export const Currency: Story = {
  render: () => (
    <div className="grid w-96 gap-1.5">
      <Label htmlFor="amt">Amount</Label>
      <StampInput
        id="amt"
        prefix="KES"
        prefixTone="ink"
        defaultValue="1,200"
        type="number"
      />
    </div>
  ),
};
