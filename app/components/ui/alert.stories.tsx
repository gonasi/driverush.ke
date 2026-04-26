import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertBody,
  AlertAction,
} from "./alert";

const meta = {
  title: "Primitives/Alert",
  component: Alert,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllStates: Story = {
  render: () => (
    <div className="grid w-[560px] gap-3">
      <Alert variant="info">
        <AlertBody>
          <AlertTitle>Mock exam scheduled</AlertTitle>
          <AlertDescription>
            Your timed Class B paper unlocks tomorrow at 09:00. 50 questions, 40
            minutes.
          </AlertDescription>
        </AlertBody>
        <AlertAction>Dismiss</AlertAction>
      </Alert>

      <Alert variant="warn">
        <AlertBody>
          <AlertTitle>Streak at risk</AlertTitle>
          <AlertDescription>
            You haven't done a lesson today. 14-day streak ends at midnight.
          </AlertDescription>
        </AlertBody>
        <AlertAction>Dismiss</AlertAction>
      </Alert>

      <Alert variant="ok">
        <AlertBody>
          <AlertTitle>Chapter complete · sawa sawa</AlertTitle>
          <AlertDescription>
            Traffic Lights & Signals — 100%. +240 XP banked.
          </AlertDescription>
        </AlertBody>
        <AlertAction>Close</AlertAction>
      </Alert>

      <Alert variant="error">
        <AlertBody>
          <AlertTitle>Couldn't load lesson</AlertTitle>
          <AlertDescription>
            Your connection dropped. Reconnect and we'll resume from where you
            left off.
          </AlertDescription>
        </AlertBody>
        <AlertAction>Retry</AlertAction>
      </Alert>
    </div>
  ),
};
