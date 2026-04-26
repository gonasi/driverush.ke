import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "./separator";

const meta = {
  title: "Primitives/Separator",
  component: Separator,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="grid w-96 gap-6">
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-3">
          Bold (default · 2px solid)
        </p>
        <Separator />
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-3">
          Thin (1px solid)
        </p>
        <Separator weight="thin" />
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-3">
          Dashed
        </p>
        <Separator style="dashed" />
      </div>
      <div className="flex h-20 items-stretch gap-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
          Vertical
        </span>
        <Separator orientation="vertical" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
          Right side
        </span>
      </div>
    </div>
  ),
};
