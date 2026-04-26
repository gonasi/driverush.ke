import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
  SheetClose,
} from "./sheet";
import { Button } from "./button";

const meta: Meta<typeof Sheet> = {
  title: "Primitives/Sheet",
  component: Sheet,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Sheet>;

export const RightDrawer: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ink">Open menu</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>DR · Menu</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <nav className="grid gap-3">
            {["Learn", "Mock", "Signs", "Profile"].map((it) => (
              <a
                key={it}
                href="#"
                className="border-2 border-ink bg-surface px-4 py-3 font-display text-[13px] font-bold uppercase tracking-wider text-ink shadow-stamp-sm hover:bg-paper-3"
              >
                {it}
              </a>
            ))}
          </nav>
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="paper" size="sm">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const BottomDrawer: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="rush">Open settings</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <SheetBody>Bottom-anchored drawer for mobile actions.</SheetBody>
      </SheetContent>
    </Sheet>
  ),
};
