import type { Meta, StoryObj } from "@storybook/react-vite";

import { KeyValue } from "./key-value";

const meta: Meta<typeof KeyValue> = {
  title: "Brand/KeyValue",
  component: KeyValue,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof KeyValue>;

export const LearnerSpec: Story = {
  render: () => (
    <div className="max-w-sm">
      <KeyValue
        rows={[
          { k: "User ID", v: "DR-2410-887", mono: true },
          { k: "Class", v: "B · Driver" },
          { k: "Region", v: "Nairobi" },
          { k: "Streak", v: "12 days", accent: true },
          { k: "XP", v: "2,410", mono: true },
          { k: "Exam date", v: "28 · May · 2026" },
        ]}
      />
    </div>
  ),
};
