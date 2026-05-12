import type { Meta, StoryObj } from "@storybook/react-vite";

import { Calendar } from "./calendar";

const meta: Meta<typeof Calendar> = {
  title: "Brand/Calendar",
  component: Calendar,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const ExamCountdown: Story = {
  render: () => (
    <div className="max-w-xs">
      <Calendar
        month={5}
        year={2026}
        note="Exam in 18 days"
        today={10}
        examDay={28}
        streakDays={[3, 4, 5, 6, 7, 8, 9]}
      />
    </div>
  ),
};
