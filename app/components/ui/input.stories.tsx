import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "Primitives/Input",
  component: Input,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "e.g. Wanjiku Mwangi" },
  render: (args) => (
    <div className="grid w-80 gap-1.5">
      <Label htmlFor="name">Full name</Label>
      <Input id="name" {...args} />
    </div>
  ),
};

export const Filled: Story = {
  render: () => (
    <div className="grid w-80 gap-1.5">
      <Label htmlFor="centre">Test centre</Label>
      <Input id="centre" defaultValue="Likoni Road · Nairobi" />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="grid w-80 gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input id="email" defaultValue="not-an-email" aria-invalid />
      <p className="font-mono text-[10.5px] tracking-wide text-rush">
        ✕ That doesn't look like a valid email.
      </p>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Locked field" },
  render: (args) => <Input className="w-80" {...args} />,
};
