import type { Meta, StoryObj } from "@storybook/react-vite";

import { Leaderboard } from "./leaderboard";

const meta: Meta<typeof Leaderboard> = {
  title: "Brand/Leaderboard",
  component: Leaderboard,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Leaderboard>;

export const Weekly: Story = {
  render: () => (
    <div className="max-w-md">
      <Leaderboard
        entries={[
          {
            rank: 1,
            name: "Wanjiru K.",
            meta: "Nairobi · Class B",
            side: "12d",
            points: "3,420 XP",
            medal: "gold",
          },
          {
            rank: 2,
            name: "Otieno M.",
            meta: "Kisumu · Class B",
            side: "9d",
            points: "3,180 XP",
            medal: "silver",
          },
          {
            rank: 3,
            name: "Achieng L.",
            meta: "Mombasa · Class A",
            side: "7d",
            points: "2,940 XP",
            medal: "bronze",
          },
          {
            rank: 4,
            name: "You · Brian",
            meta: "Nairobi · Class B",
            side: "12d",
            points: "2,410 XP",
            you: true,
          },
          {
            rank: 5,
            name: "Kamau N.",
            meta: "Nakuru · Class C",
            side: "5d",
            points: "2,210 XP",
          },
        ]}
      />
    </div>
  ),
};
