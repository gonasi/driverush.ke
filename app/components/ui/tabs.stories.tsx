import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

const meta = {
  title: "Primitives/Tabs",
  component: Tabs,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FourPanels: Story = {
  render: () => (
    <Tabs defaultValue="lessons" className="w-[480px]">
      <TabsList>
        <TabsTrigger value="lessons">Lessons</TabsTrigger>
        <TabsTrigger value="mock">Mock exams</TabsTrigger>
        <TabsTrigger value="signs">Sign library</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>
      <TabsContent
        value="lessons"
        className="border-2 border-ink bg-surface p-4"
      >
        24 lessons across 7 chapters. Pick up where you left off.
      </TabsContent>
      <TabsContent value="mock" className="border-2 border-ink bg-surface p-4">
        Three timed papers unlock once you finish chapter 03.
      </TabsContent>
      <TabsContent value="signs" className="border-2 border-ink bg-surface p-4">
        Browse the full Kenyan road sign reference.
      </TabsContent>
      <TabsContent value="stats" className="border-2 border-ink bg-surface p-4">
        Daily XP, average score, weakest categories.
      </TabsContent>
    </Tabs>
  ),
};
