import type { Meta, StoryObj } from "@storybook/react-vite";

import { PricingTier } from "./pricing-tier";
import { Button } from "../ui/button";

const meta: Meta<typeof PricingTier> = {
  title: "Brand/PricingTier",
  component: PricingTier,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof PricingTier>;

export const Tiers: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-3.5 sm:grid-cols-3">
      <PricingTier
        name="Free"
        description="Sample the system"
        currency="KES"
        price="0"
        per="Forever"
        features={[
          { label: "2 chapters unlocked" },
          { label: "Daily streak & XP" },
          { label: "Mock exams", off: true },
          { label: "Hazard clips", off: true },
          { label: "Offline mode", off: true },
        ]}
        cta={<Button variant="paper">Stay free</Button>}
      />
      <PricingTier
        featured
        ribbon="★ Popular"
        name="Pass"
        description="For first-time exam takers"
        currency="KES"
        price="499"
        per="Per month"
        features={[
          { label: "Every chapter, every class" },
          { label: "Unlimited mock exams" },
          { label: "Hazard perception clips" },
          { label: "Offline mode · M-Pesa" },
          { label: "1-on-1 instructor", off: true },
        ]}
        cta={<Button variant="rush">Get PASS</Button>}
      />
      <PricingTier
        name="Fast Lane"
        description="Pass in 30 days · guarantee"
        currency="KES"
        price="1,499"
        per="Per month"
        features={[
          { label: "Everything in PASS" },
          { label: "1-on-1 instructor weekly" },
          { label: "Personalised study plan" },
          { label: "Pass guarantee · refund" },
          { label: "Priority M-Pesa support" },
        ]}
        cta={<Button variant="ink">Go Fast Lane</Button>}
      />
    </div>
  ),
};
