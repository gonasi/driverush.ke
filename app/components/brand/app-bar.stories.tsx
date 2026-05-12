import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppBar, AppBarLink } from "./app-bar";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";

const meta = {
  title: "Brand/AppBar",
  component: AppBar,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    // `static` here so the bar doesn't pin to the Storybook canvas top — in
    // the app it defaults to `sticky top-0`.
    <div className="w-[860px]">
      <AppBar
        className="static"
        nav={
          <>
            <AppBarLink href="#" active>
              Learn
            </AppBarLink>
            <AppBarLink href="#">Mock</AppBarLink>
            <AppBarLink href="#">Signs</AppBarLink>
            <AppBarLink href="#">Profile</AppBarLink>
          </>
        }
        trailing={
          <>
            <Badge variant="amber">★ 12d streak</Badge>
            <Badge variant="rush">+ 2,410 XP</Badge>
            <Avatar size="sm" tone="rush">
              <AvatarFallback>WM</AvatarFallback>
            </Avatar>
          </>
        }
      />
    </div>
  ),
};
