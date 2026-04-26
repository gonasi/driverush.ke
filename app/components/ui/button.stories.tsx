import type { Meta, StoryObj } from "@storybook/react-vite";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02FreeIcons,
  PlayCircleFreeIcons,
  RefreshFreeIcons,
  Tick02FreeIcons,
} from "@hugeicons/core-free-icons";

import { Button } from "./button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  parameters: { layout: "centered" },
  args: { children: "Continue lesson" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rush: Story = { args: { variant: "rush" } };
export const Ink: Story = { args: { variant: "ink" } };
export const Amber: Story = { args: { variant: "amber" } };
export const Green: Story = { args: { variant: "green" } };
export const Paper: Story = { args: { variant: "paper" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Link: Story = {
  args: { variant: "link", children: "View NTSA rule" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <Button variant="rush" size="sm">
        Skip
      </Button>
      <Button variant="rush" size="default">
        See results
      </Button>
      <Button variant="rush" size="lg">
        Continue lesson
      </Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="rush">
        Continue
        <HugeiconsIcon
          icon={ArrowRight02FreeIcons}
          size={16}
          strokeWidth={2.5}
        />
      </Button>
      <Button variant="ink">
        <HugeiconsIcon icon={RefreshFreeIcons} size={16} strokeWidth={2.5} />
        Restart
      </Button>
      <Button variant="green" size="sm">
        <HugeiconsIcon icon={Tick02FreeIcons} size={14} strokeWidth={3} />
        Pass · sawa
      </Button>
    </div>
  ),
};

export const Stamps: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button variant="rush" size="stamp" aria-label="Play">
        <HugeiconsIcon icon={PlayCircleFreeIcons} size={22} strokeWidth={2} />
      </Button>
      <Button variant="ink" size="stamp" aria-label="Restart">
        <HugeiconsIcon icon={RefreshFreeIcons} size={22} strokeWidth={2} />
      </Button>
      <Button variant="green" size="stamp" aria-label="Confirm">
        <HugeiconsIcon icon={Tick02FreeIcons} size={22} strokeWidth={2.5} />
      </Button>
      <Button variant="amber" size="stamp-sm" aria-label="Hint">
        <HugeiconsIcon
          icon={ArrowRight02FreeIcons}
          size={16}
          strokeWidth={2.5}
        />
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { variant: "rush", disabled: true, children: "Locked — finish 03" },
};
