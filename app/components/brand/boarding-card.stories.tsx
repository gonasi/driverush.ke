import type { Meta, StoryObj } from "@storybook/react-vite";

import { BoardingCard } from "./boarding-card";

const meta: Meta<typeof BoardingCard> = {
  title: "Brand/BoardingCard",
  component: BoardingCard,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof BoardingCard>;

export const NowBoarding: Story = {
  render: () => (
    <div className="grid w-[640px] gap-3.5">
      <BoardingCard
        num={3}
        eyebrow="Chapter № 3 · Now boarding"
        title="Traffic Lights & Signals"
        meta={[
          "6 lessons",
          "24 questions",
          <span key="pct" className="text-rush">
            40% complete
          </span>,
        ]}
        stub={{ label: "XP", value: "+240", code: "B/03/L04" }}
      />
      <BoardingCard
        num={4}
        eyebrow="Chapter № 4 · Locked"
        title="Hazard Perception"
        meta={["10 lessons", "30 clips", "Finish 03 to board"]}
        stub={{ label: "XP", value: "—", code: "B/04/—" }}
        locked
      />
    </div>
  ),
};
