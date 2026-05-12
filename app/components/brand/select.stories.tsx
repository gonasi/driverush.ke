import type { Meta, StoryObj } from "@storybook/react-vite";

import { Select } from "./select";

const meta: Meta<typeof Select> = {
  title: "Brand/Select",
  component: Select,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Select>;

const options = (
  <>
    <option>Likoni Road · Nairobi</option>
    <option>Nyali · Mombasa</option>
    <option>Eldoret town</option>
    <option>Kisumu · Milimani</option>
  </>
);

export const States: Story = {
  render: () => (
    <div className="grid max-w-xs gap-4">
      <label className="grid gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
          Test centre
        </span>
        <Select defaultValue="Likoni Road · Nairobi">{options}</Select>
      </label>
      <label className="grid gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
          Test centre · invalid
        </span>
        <Select aria-invalid defaultValue="Eldoret town">
          {options}
        </Select>
      </label>
    </div>
  ),
};
