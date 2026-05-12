import type { Meta, StoryObj } from "@storybook/react-vite";

import { Ledger, LedgerName, LedgerDelta } from "./ledger";
import { Badge } from "../ui/badge";

const meta: Meta<typeof Ledger> = {
  title: "Brand/Ledger",
  component: Ledger,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Ledger>;

export const TopicBreakdown: Story = {
  render: () => (
    <Ledger
      columns={[
        { key: "n", label: "#" },
        { key: "topic", label: "Topic" },
        { key: "score", label: "Score" },
        { key: "time", label: "Time" },
        { key: "delta", label: "Δ vs avg" },
        { key: "status", label: "Status" },
      ]}
      rows={[
        {
          n: "01",
          topic: <LedgerName>Highway Code</LedgerName>,
          score: "92%",
          time: "04:12",
          delta: <LedgerDelta dir="up">+18%</LedgerDelta>,
          status: <Badge variant="green">Pass</Badge>,
        },
        {
          n: "02",
          topic: <LedgerName>Road Signs</LedgerName>,
          score: "76%",
          time: "06:48",
          delta: <LedgerDelta dir="up">+04%</LedgerDelta>,
          status: <Badge variant="green">Pass</Badge>,
        },
        {
          n: "03",
          topic: <LedgerName>Junctions</LedgerName>,
          score: "58%",
          time: "09:22",
          delta: <LedgerDelta dir="down">−12%</LedgerDelta>,
          status: <Badge variant="amber">Retry</Badge>,
        },
        {
          n: "04",
          topic: <LedgerName>Hazard Perception</LedgerName>,
          score: "41%",
          time: "11:04",
          delta: <LedgerDelta dir="down">−21%</LedgerDelta>,
          status: <Badge variant="rush">Fail</Badge>,
        },
        {
          n: "05",
          topic: <LedgerName>Vehicle Documents</LedgerName>,
          score: "88%",
          time: "03:55",
          delta: <LedgerDelta dir="up">+11%</LedgerDelta>,
          status: <Badge variant="green">Pass</Badge>,
        },
      ]}
    />
  ),
};
