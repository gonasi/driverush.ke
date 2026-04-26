import type { Meta, StoryObj } from "@storybook/react-vite";

import { FeedbackBanner } from "./feedback-banner";
import { Button } from "../ui/button";

const meta = {
  title: "Brand/FeedbackBanner",
  component: FeedbackBanner,
  parameters: { layout: "padded" },
  args: { tone: "win", title: "SAWA SAWA · CORRECT" },
} satisfies Meta<typeof FeedbackBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WinAndFail: Story = {
  render: () => (
    <div className="grid w-[640px] gap-3">
      <FeedbackBanner
        tone="win"
        title="Sawa sawa · Correct"
        description="Vehicle on your right has right of way at uncontrolled junctions."
        action={
          <Button variant="ink" size="sm">
            Continue
          </Button>
        }
      />
      <FeedbackBanner
        tone="fail"
        title="Not quite · Wrong"
        description="Roll-stops are an instant fail on the practical. Always come to a full stop."
        action={
          <Button variant="ink" size="sm">
            Review
          </Button>
        }
      />
    </div>
  ),
};
