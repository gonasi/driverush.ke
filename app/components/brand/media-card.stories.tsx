import type { Meta, StoryObj } from "@storybook/react-vite";

import { MediaCard } from "./media-card";

const meta: Meta<typeof MediaCard> = {
  title: "Brand/MediaCard",
  component: MediaCard,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof MediaCard>;

export const VideoLesson: Story = {
  render: () => (
    <div className="max-w-sm">
      <MediaCard
        category="★ Hazard perception"
        title="Reading Nairobi roundabouts"
        sub="12 clips · 4 min avg · NTSA-aligned"
        duration="04:32"
      />
    </div>
  ),
};
