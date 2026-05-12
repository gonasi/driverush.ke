import type { Meta, StoryObj } from "@storybook/react-vite";

import { Medal, MedalGrid } from "./medal";

const meta: Meta<typeof Medal> = {
  title: "Brand/Medal",
  component: Medal,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Medal>;

export const Achievements: Story = {
  render: () => (
    <MedalGrid>
      <Medal
        tone="gold"
        glyph="★"
        label={
          <>
            Gold
            <br />
            Streak 30d
          </>
        }
      />
      <Medal
        tone="rush"
        glyph="R"
        label={
          <>
            Rush
            <br />
            First pass
          </>
        }
      />
      <Medal
        tone="green"
        glyph="✓"
        label={
          <>
            Sawa
            <br />
            100% quiz
          </>
        }
      />
      <Medal
        tone="blue"
        glyph="B"
        label={
          <>
            Class B
            <br />
            Graduate
          </>
        }
      />
    </MedalGrid>
  ),
};
