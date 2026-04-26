import type { Meta, StoryObj } from "@storybook/react-vite";

import { ChoiceCard } from "./choice-card";

const meta = {
  title: "Brand/ChoiceCard",
  component: ChoiceCard,
  parameters: { layout: "padded" },
  args: { keyLabel: "A", children: "Yield to oncoming traffic" },
} satisfies Meta<typeof ChoiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const QuizFlow: Story = {
  render: () => (
    <div className="grid w-[480px] gap-2.5">
      <ChoiceCard keyLabel="A" meta="42% picked">
        Yield to oncoming traffic
      </ChoiceCard>
      <ChoiceCard keyLabel="B" state="correct" meta="✓ correct">
        Stop completely, then proceed when safe
      </ChoiceCard>
      <ChoiceCard keyLabel="C" state="wrong" meta="✕ wrong">
        No entry for all vehicles
      </ChoiceCard>
      <ChoiceCard keyLabel="D" state="selected" meta="Picked">
        Roundabout ahead — give way to right
      </ChoiceCard>
      <ChoiceCard keyLabel="E" state="disabled" meta="—">
        Locked answer
      </ChoiceCard>
    </div>
  ),
};
