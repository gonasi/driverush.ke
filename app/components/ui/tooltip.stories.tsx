import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";
import { Button } from "./button";

const meta = {
  title: "Primitives/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnButton: Story = {
  render: () => (
    <div className="flex gap-6 p-12">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="rush" size="sm">
            12-day streak
          </Button>
        </TooltipTrigger>
        <TooltipContent>Press · 12-day streak</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ink" size="sm">
            Mock exam
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Unlocks tomorrow at 09:00</TooltipContent>
      </Tooltip>
    </div>
  ),
};
