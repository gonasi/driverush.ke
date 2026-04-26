import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, AvatarFallback, AvatarStatus, AvatarStack } from "./avatar";

const meta = {
  title: "Primitives/Avatar",
  component: Avatar,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      <Avatar size="lg" tone="rush">
        <AvatarFallback>WM</AvatarFallback>
      </Avatar>
      <Avatar tone="green">
        <AvatarFallback>JK</AvatarFallback>
      </Avatar>
      <Avatar tone="blue">
        <AvatarFallback>PO</AvatarFallback>
      </Avatar>
      <Avatar tone="amber">
        <AvatarFallback>AN</AvatarFallback>
      </Avatar>
      <Avatar tone="cyan">
        <AvatarFallback>FS</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>DR</AvatarFallback>
        <AvatarStatus />
      </Avatar>
      <Avatar size="sm" tone="rush">
        <AvatarFallback>+9</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const Stack: Story = {
  render: () => (
    <div className="grid gap-2">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
        Leaderboard · top 5
      </p>
      <AvatarStack>
        <Avatar tone="rush">
          <AvatarFallback>1</AvatarFallback>
        </Avatar>
        <Avatar tone="amber">
          <AvatarFallback>2</AvatarFallback>
        </Avatar>
        <Avatar tone="green">
          <AvatarFallback>3</AvatarFallback>
        </Avatar>
        <Avatar tone="blue">
          <AvatarFallback>4</AvatarFallback>
        </Avatar>
        <Avatar tone="cyan">
          <AvatarFallback>5</AvatarFallback>
        </Avatar>
      </AvatarStack>
    </div>
  ),
};
