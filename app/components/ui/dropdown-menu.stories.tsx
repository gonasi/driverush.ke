import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./dropdown-menu";
import { Button } from "./button";

const meta = {
  title: "Primitives/DropdownMenu",
  component: DropdownMenu,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProfileMenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="paper" size="sm">
          Profile
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuItem>
          Settings
          <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>Streak history</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Difficulty</DropdownMenuLabel>
        <DropdownMenuRadioGroup value="rush">
          <DropdownMenuRadioItem value="cruise">Cruise</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="rush">Rush</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="hardcore">
            Hardcore
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>
          Sound effects
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem>Haptics</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-rush">Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
