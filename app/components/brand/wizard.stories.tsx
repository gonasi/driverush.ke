import type { Meta, StoryObj } from "@storybook/react-vite";

import { Wizard } from "./wizard";

const meta: Meta<typeof Wizard> = {
  title: "Brand/Wizard",
  component: Wizard,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Wizard>;

export const Onboarding: Story = {
  render: () => (
    <div className="max-w-3xl">
      <Wizard
        steps={[
          { name: "Pick your class", sub: "Done", state: "done" },
          { name: "Diagnostic", sub: "Done · 64%", state: "done" },
          { name: "Build a plan", sub: "In progress", state: "active" },
          { name: "Mock exam", sub: "Unlocks next", state: "pending" },
        ]}
      />
    </div>
  ),
};
