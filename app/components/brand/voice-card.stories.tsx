import type { Meta, StoryObj } from "@storybook/react-vite";

import { VoiceCard } from "./voice-card";

const meta = {
  title: "Brand/VoiceCard",
  component: VoiceCard,
  parameters: { layout: "padded" },
  args: { title: "Write like this", mode: "do", examples: [] },
} satisfies Meta<typeof VoiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DoVsDont: Story = {
  render: () => (
    <div className="grid max-w-5xl gap-5 md:grid-cols-2">
      <VoiceCard
        title="Write like this"
        mode="do"
        examples={[
          "Sawa sawa. You're moving fast.",
          "Don't sweat it. Review and try again.",
          "Stop completely, then proceed when safe.",
          "12-day streak. Don't break it tomorrow.",
          "Built for Kenya. Real signs. Real junctions.",
        ]}
      />
      <VoiceCard
        title="Not like this"
        mode="dont"
        examples={[
          "Congratulations on your achievement! 🎉🎉🎉",
          "Oops! Looks like you got that one wrong.",
          "Please ensure that you come to a complete stop.",
          "You're on a roll, champ! Keep up the great work!",
          "Welcome to our comprehensive learning platform.",
        ]}
      />
    </div>
  ),
};
