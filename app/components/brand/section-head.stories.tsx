import type { Meta, StoryObj } from "@storybook/react-vite";

import { SectionHead } from "./section-head";

const meta = {
  title: "Brand/SectionHead",
  component: SectionHead,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SectionHead>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    num: "01",
    title: (
      <>
        House <em>rules</em>
      </>
    ),
    stamp: (
      <>
        <div className="font-bold text-ink">PRINCIPLES</div>
        <div>3 stated · 0 negotiable</div>
      </>
    ),
    lede: "Three rules. Every screen, color, word ships through them or doesn't ship.",
  },
};

export const NumberedSubsection: Story = {
  args: {
    num: "02·b",
    title: (
      <>
        Logo <em>variations</em>
      </>
    ),
    stamp: (
      <>
        <div className="font-bold text-ink">MARKS</div>
        <div>12 cleared variants</div>
      </>
    ),
  },
};
