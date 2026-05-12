import type { Meta, StoryObj } from "@storybook/react-vite";

import { SignGameCard } from "./sign-game-card";
import { SIGN_GAMES } from "~/lib/road-signs";

const meta: Meta<typeof SignGameCard> = {
  title: "Brand/SignGameCard",
  component: SignGameCard,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof SignGameCard>;

export const Trainers: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
      {SIGN_GAMES.map((g) => (
        <SignGameCard key={g.slug} game={g} />
      ))}
    </div>
  ),
};
