import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";

import { Toaster } from "./sonner";
import { Button } from "./button";

const meta = {
  title: "Primitives/Toaster",
  component: Toaster,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FireToasts: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Button
        variant="rush"
        onClick={() =>
          toast("+40 XP · question banked", {
            action: { label: "Undo", onClick: () => undefined },
          })
        }
      >
        Default
      </Button>
      <Button
        variant="green"
        onClick={() =>
          toast.success("Sawa sawa", {
            description: "Chapter 03 complete. +240 XP banked.",
          })
        }
      >
        Success
      </Button>
      <Button
        variant="amber"
        onClick={() =>
          toast.warning("Streak at risk", {
            description: "14-day streak ends at midnight.",
          })
        }
      >
        Warning
      </Button>
      <Button
        variant="ink"
        onClick={() =>
          toast.error("Couldn't load lesson", {
            description: "Reconnect and we'll resume.",
            action: { label: "Retry", onClick: () => undefined },
          })
        }
      >
        Error
      </Button>
      <Toaster />
    </div>
  ),
};
