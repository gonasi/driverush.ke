import type { Meta, StoryObj } from "@storybook/react-vite";

import { LicenseCard } from "./license-card";

const meta: Meta<typeof LicenseCard> = {
  title: "Brand/LicenseCard",
  component: LicenseCard,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof LicenseCard>;

export const Credential: Story = {
  render: () => (
    <div className="max-w-2xl">
      <LicenseCard
        name="Brian K. Mwangi"
        photoText="DR"
        rows={[
          [
            { label: "Class", value: "B · Driver" },
            { label: "ID", value: "32 411 887" },
            { label: "Exp", value: "09 · 2030" },
          ],
          [
            { label: "Status", value: "Active" },
            { label: "Streak", value: "12 D" },
            { label: "XP", value: "2,410" },
          ],
        ]}
        seal={{ big: "PASS", sm: "★ NTSA ★" }}
      />
    </div>
  ),
};
