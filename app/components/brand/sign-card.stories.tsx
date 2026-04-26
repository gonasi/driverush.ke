import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  OctagonFreeIcons,
  AlertCircleFreeIcons,
  ArrowRight02FreeIcons,
  TrafficLightFreeIcons,
} from "@hugeicons/core-free-icons";

import { SignCard } from "./sign-card";

const meta: Meta<typeof SignCard> = {
  title: "Brand/SignCard",
  component: SignCard,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof SignCard>;

export const Library: Story = {
  render: () => (
    <div className="grid w-[640px] grid-cols-3 gap-3.5">
      <SignCard
        shape="octagon"
        tone="rush"
        icon={OctagonFreeIcons}
        name="Mandatory · Stop"
        classification="Octagon · 200 mm"
      />
      <SignCard
        shape="triangle"
        tone="amber"
        icon={AlertCircleFreeIcons}
        name="Warning · Pedestrian"
        classification="Triangle · 180 mm"
        iconSize={42}
      />
      <SignCard
        shape="circle"
        tone="blue"
        icon={ArrowRight02FreeIcons}
        name="Information · Direction"
        classification="Circle · 160 mm"
      />
      <SignCard
        shape="circle"
        tone="rush"
        icon={TrafficLightFreeIcons}
        name="Mandatory · Lights"
        classification="Circle · 200 mm"
      />
      <SignCard
        shape="diamond"
        tone="amber"
        icon={AlertCircleFreeIcons}
        name="Warning · Junction"
        classification="Diamond · 180 mm"
      />
      <SignCard
        shape="square"
        tone="green"
        icon={ArrowRight02FreeIcons}
        name="Route · Direction"
        classification="Square · 160 mm"
      />
    </div>
  ),
};
