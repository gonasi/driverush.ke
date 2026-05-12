import type { Meta, StoryObj } from "@storybook/react-vite";

import { NotificationItem, NotificationList } from "./notification-item";

const meta: Meta<typeof NotificationItem> = {
  title: "Brand/NotificationItem",
  component: NotificationItem,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof NotificationItem>;

export const Inbox: Story = {
  render: () => (
    <div className="max-w-md">
      <NotificationList>
        <NotificationItem
          unread
          tone="rush"
          icon="!"
          title="Streak in danger"
          description="12-day streak ends in 4 hours. Drop in for one quick lesson."
          timestamp="04 H"
        />
        <NotificationItem
          tone="amber"
          icon="★"
          title="Gold league · top 5"
          description="You're in the top 5 of Nairobi Gold this week."
          timestamp="12 H"
        />
        <NotificationItem
          tone="green"
          icon="✓"
          title="Chapter 3 complete"
          description="Traffic Lights & Signals · scored 92%. +240 XP banked."
          timestamp="2 D"
        />
      </NotificationList>
    </div>
  ),
};
