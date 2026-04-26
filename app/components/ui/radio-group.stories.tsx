import type { Meta, StoryObj } from "@storybook/react-vite";

import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const meta = {
  title: "Primitives/RadioGroup",
  component: RadioGroup,
  parameters: { layout: "centered" },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const License: Story = {
  render: () => (
    <RadioGroup defaultValue="b" className="grid gap-2.5">
      {[
        { value: "a", label: "Class A · Motorbike" },
        { value: "b", label: "Class B · Light vehicle" },
        { value: "c", label: "Class C · Light goods" },
      ].map((opt) => (
        <label
          key={opt.value}
          className="inline-flex items-center gap-2.5 text-[14px] font-medium text-ink"
        >
          <RadioGroupItem value={opt.value} id={`license-${opt.value}`} />
          <Label
            htmlFor={`license-${opt.value}`}
            className="cursor-pointer normal-case tracking-normal text-ink font-sans font-medium text-sm"
          >
            {opt.label}
          </Label>
        </label>
      ))}
    </RadioGroup>
  ),
};
