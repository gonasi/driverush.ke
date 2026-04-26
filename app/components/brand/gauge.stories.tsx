import type { Meta, StoryObj } from "@storybook/react-vite";

import { Gauge, StatTile } from "./gauge";

const meta: Meta<typeof Gauge> = {
  title: "Brand/Gauge",
  component: Gauge,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Gauge>;

export const Gauges: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      <Gauge label="Streak" meta="·12d" value="12" unit="DAYS" />
      <Gauge label="XP Total" meta="·24h" value="2,410" unit="PTS" tone="ink" />
      <Gauge label="Hearts" meta="·LIVE" value="5" unit="/5" tone="green" />
    </div>
  ),
};

export const StatTiles: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-3">
      <StatTile
        label="Daily XP"
        value="240"
        delta={{ dir: "up", copy: "12% vs yesterday" }}
      />
      <StatTile
        label="Avg. score"
        value="84%"
        tone="rush"
        delta={{ dir: "up", copy: "4 pts" }}
      />
      <StatTile
        label="Hearts lost"
        value="2"
        delta={{ dir: "down", copy: "this session" }}
      />
    </div>
  ),
};
