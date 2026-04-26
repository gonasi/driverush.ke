import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
import { Button } from "./button";
import { Badge } from "./badge";

const meta = {
  title: "Primitives/Card",
  component: Card,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-96 shadow-stamp">
      <CardHeader>
        <CardTitle>Traffic Lights & Signals</CardTitle>
        <Badge variant="rush">Chapter 03</Badge>
      </CardHeader>
      <CardContent>
        <CardDescription>
          Real Nairobi junctions, real lights, real questions from past papers.
          Bite-sized and timed like the practical.
        </CardDescription>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm">
          Skip
        </Button>
        <Button variant="rush" size="sm">
          Continue
        </Button>
      </CardFooter>
    </Card>
  ),
};
