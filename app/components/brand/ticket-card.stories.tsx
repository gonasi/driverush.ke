import type { Meta, StoryObj } from "@storybook/react-vite";

import { TicketCard } from "./ticket-card";

const meta: Meta<typeof TicketCard> = {
  title: "Brand/TicketCard",
  component: TicketCard,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof TicketCard>;

export const Principles: Story = {
  render: () => (
    <div className="grid max-w-5xl gap-0 border-2 border-ink md:grid-cols-3">
      <TicketCard
        passLabel="Pass № 01"
        seat="A·01"
        title={
          <>
            Fast over <em>fancy</em>
          </>
        }
        description="Two taps to learning. Cut transitions. Kill loaders. Default to the action — students don't have time, and neither do we."
        className="border-r-0 border-t-0 border-b-0 border-dashed border-ink md:border-r-2"
      />
      <TicketCard
        passLabel="Pass № 02"
        seat="B·02"
        title={
          <>
            Earned, not <em>given</em>
          </>
        }
        description="Streaks, XP and badges only land if work was done. We never inflate. Confidence has to come from a real win or it's not confidence."
        className="border-l-0 border-t-0 border-b-0 border-dashed border-ink md:border-r-2"
      />
      <TicketCard
        passLabel="Pass № 03"
        seat="C·03"
        title={
          <>
            Kenya, not <em>generic</em>
          </>
        }
        description="NTSA categories. Real Nairobi junctions. KES, M-Pesa, Kiswahili — woven in, never bolted on. Made here, not localised here."
      />
    </div>
  ),
};
