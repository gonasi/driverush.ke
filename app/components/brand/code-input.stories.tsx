import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { CodeInput } from "./code-input";
import { Label } from "../ui/label";

const meta = {
  title: "Brand/CodeInput",
  component: CodeInput,
  parameters: { layout: "padded" },
  args: { length: 4 },
} satisfies Meta<typeof CodeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OTP: Story = {
  render: () => {
    const [code, setCode] = useState("48");
    return (
      <div className="grid gap-1.5">
        <Label htmlFor="otp">Verification code</Label>
        <CodeInput length={4} value={code} onValueChange={setCode} />
        <p className="font-mono text-[10.5px] tracking-wide text-ink-3">
          Code expires in 02:48
        </p>
      </div>
    );
  },
};

export const Plate: Story = {
  render: () => (
    <div className="grid gap-1.5">
      <Label>Plate code</Label>
      <CodeInput length={7} defaultValue="KCB241B" inputMode="text" />
    </div>
  ),
};
