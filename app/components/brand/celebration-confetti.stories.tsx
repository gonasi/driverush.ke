import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { cn } from "~/lib/utils";

import { CelebrationConfetti } from "./celebration-confetti";

const meta: Meta<typeof CelebrationConfetti> = {
  title: "Brand/CelebrationConfetti",
  component: CelebrationConfetti,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof meta>;

const DARK_STAGE = "bg-[linear-gradient(180deg,#1B1E25,#0B0D11)]";

/**
 * Fired over a dark stage, the way it sits behind the trainer's "every sign
 * mastered" card. The burst plays a few times then settles — hit the button to
 * remount and fire it again.
 */
export const OverTheTrainerOverlay: Story = {
  render: function Demo() {
    const [run, setRun] = React.useState(0);
    return (
      <div
        className={cn(
          "relative flex min-h-[480px] items-center justify-center overflow-hidden",
          DARK_STAGE,
        )}
      >
        <CelebrationConfetti key={run} />
        <div className="relative z-10 flex flex-col items-center gap-4 border-2 border-ink bg-surface px-8 py-7 text-center shadow-stamp-xl">
          <span className="font-display text-[22px] font-extrabold uppercase tracking-tight text-ink">
            All 42 signs — mastered.
          </span>
          <button
            type="button"
            onClick={() => setRun((n) => n + 1)}
            className="border-2 border-ink bg-rush px-4 py-2 font-display text-[12px] font-extrabold uppercase tracking-wider text-white shadow-stamp-sm"
          >
            Celebrate again
          </button>
        </div>
      </div>
    );
  },
};
