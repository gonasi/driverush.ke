import type { Meta, StoryObj } from "@storybook/react-vite";

import { Textarea } from "./textarea";
import { Label } from "./label";

const meta = {
  title: "Primitives/Textarea",
  component: Textarea,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid w-96 gap-1.5">
      <Label htmlFor="notes">Notes for this sign</Label>
      <Textarea
        id="notes"
        defaultValue="Watch out — this one always confuses me. Two arrows = give way to BOTH directions."
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="grid w-96 gap-1.5">
      <Label htmlFor="empty">Add a note</Label>
      <Textarea
        id="empty"
        placeholder="A note you'll see on the next review…"
      />
    </div>
  ),
};
