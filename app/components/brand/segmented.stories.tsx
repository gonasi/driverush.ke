import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Segmented } from "./segmented";

const meta: Meta<typeof Segmented> = {
  title: "Brand/Segmented",
  component: Segmented,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Segmented>;

type Range = "day" | "week" | "month" | "all";

function Demo() {
  const [range, setRange] = React.useState<Range>("week");
  return (
    <div className="grid gap-3">
      <Segmented<Range>
        value={range}
        onValueChange={setRange}
        options={[
          { value: "day", label: "Day" },
          { value: "week", label: "Week" },
          { value: "month", label: "Month" },
          { value: "all", label: "All time" },
        ]}
      />
      <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
        Selected · {range}
      </span>
    </div>
  );
}

export const Range: Story = {
  render: () => <Demo />,
};
