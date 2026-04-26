import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton } from "./skeleton";

const meta = {
  title: "Primitives/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ChapterCard: Story = {
  render: () => (
    <div className="grid w-96 gap-3 border-2 border-line-soft bg-surface p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 border-2 border-line-soft" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="w-3/5" />
          <Skeleton className="w-2/5" />
        </div>
      </div>
      <Skeleton className="h-20" />
    </div>
  ),
};
