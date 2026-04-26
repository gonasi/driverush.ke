import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogClose,
} from "./dialog";
import { Button } from "./button";

const meta = {
  title: "Primitives/Dialog",
  component: Dialog,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const QuitLesson: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="rush">Open quit confirm</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quit this lesson?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          You're 60% through Chapter 03 · Lesson 04. Your progress saves
          automatically — but you'll lose your in-session streak bonus of{" "}
          <strong>+30 XP</strong>.
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="paper" size="sm">
              Keep going
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="rush" size="sm">
              Quit anyway
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
