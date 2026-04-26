import type { Meta, StoryObj } from "@storybook/react-vite";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarFreeIcons, Fire02FreeIcons } from "@hugeicons/core-free-icons";

import { Badge } from "./badge";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="rush">
        <HugeiconsIcon icon={StarFreeIcons} size={12} strokeWidth={2.5} />
        Stop
      </Badge>
      <Badge variant="ink">Class B</Badge>
      <Badge variant="amber">
        <HugeiconsIcon icon={Fire02FreeIcons} size={12} strokeWidth={2.5} />
        Caution
      </Badge>
      <Badge variant="green">Pass</Badge>
      <Badge variant="cyan">Route</Badge>
      <Badge variant="magenta">Premium</Badge>
      <Badge variant="blue">Plate-B</Badge>
      <Badge variant="default">+80 XP</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};
