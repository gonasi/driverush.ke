import type { Meta, StoryObj } from "@storybook/react-vite";

import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Button } from "./button";
import { Label } from "./label";
import { Input } from "./input";

const meta = {
  title: "Primitives/Popover",
  component: Popover,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const QuickEdit: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ink" size="sm">
          Edit goal
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-3">
          <p className="font-display text-[12px] font-bold uppercase tracking-wider text-ink">
            Daily goal
          </p>
          <div className="grid gap-1.5">
            <Label htmlFor="goal">Minutes per day</Label>
            <Input
              id="goal"
              defaultValue="15"
              type="number"
              min={5}
              max={120}
            />
          </div>
          <Button variant="rush" size="sm">
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
