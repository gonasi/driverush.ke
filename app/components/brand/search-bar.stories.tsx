import type { Meta, StoryObj } from "@storybook/react-vite";

import { SearchBar } from "./search-bar";

const meta = {
  title: "Brand/SearchBar",
  component: SearchBar,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SearchBar
      placeholder="Search signs, lessons, NTSA rules…"
      className="w-[480px]"
    />
  ),
};

export const NoKbd: Story = {
  render: () => (
    <SearchBar placeholder="Search signs…" kbd={null} className="w-[320px]" />
  ),
};
