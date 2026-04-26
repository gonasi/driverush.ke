import type { Meta, StoryObj } from "@storybook/react-vite";
import { File01FreeIcons } from "@hugeicons/core-free-icons";

import { EmptyState } from "./empty-state";
import { Button } from "../ui/button";

const meta = {
  title: "Brand/EmptyState",
  component: EmptyState,
  parameters: { layout: "padded" },
  args: { title: "No mock exams yet" },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="max-w-md">
      <EmptyState
        icon={File01FreeIcons}
        title="No mock exams yet"
        description="Take your first one when you've completed three chapters."
      />
    </div>
  ),
};

export const WithAction: Story = {
  render: () => (
    <div className="max-w-md">
      <EmptyState
        icon={File01FreeIcons}
        title="No saved signs"
        description="Bookmark signs while you study to see them here."
        action={
          <Button variant="rush" size="sm">
            Browse signs
          </Button>
        }
      />
    </div>
  ),
};
