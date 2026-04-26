import type { Meta, StoryObj } from "@storybook/react-vite";

import { Masthead } from "./masthead";

const meta: Meta<typeof Masthead> = {
  title: "Brand/Masthead",
  component: Masthead,
  parameters: { layout: "fullscreen" },
  argTypes: {
    title: { control: false },
    kicker: { control: false },
    stamp: { control: false },
    dateline: { control: false },
    leftCol: { control: false },
    centerLede: { control: false },
    rightCol: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof Masthead>;

export const Manual: Story = {
  render: () => (
    <div className="px-9 py-6">
      <Masthead
        kicker="Volume 01 · Edition 02"
        stamp="★ DriveRush · Brand Programme ★"
        dateline="Nairobi · 26.04.2026"
        title={
          <>
            Drive<em>Rush</em> <span data-out>Manual</span>
          </>
        }
        leftCol={
          <>
            <div>Field manual № 01</div>
            <div className="mt-1.5 font-display text-[34px] font-extrabold leading-none tracking-tight">
              v 2.0
            </div>
          </>
        }
        centerLede={
          <>
            Pages of color, type and craft for an NTSA prep app made{" "}
            <em>here</em>. Print discipline, road-system urgency, and a refusal
            to look like everyone else's dashboard.
          </>
        }
        rightCol={
          <>
            <div>Bureau</div>
            <div className="mt-1.5 font-display text-lg font-extrabold">
              DriveRush.ke
            </div>
          </>
        }
      />
    </div>
  ),
};
