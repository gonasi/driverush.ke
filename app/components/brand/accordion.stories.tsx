import type { Meta, StoryObj } from "@storybook/react-vite";

import { Accordion, AccordionItem } from "./accordion";

const meta: Meta<typeof Accordion> = {
  title: "Brand/Accordion",
  component: Accordion,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const FAQ: Story = {
  render: () => (
    <div className="max-w-lg">
      <Accordion>
        <AccordionItem open summary="What does the NTSA exam cover?">
          Three sections — Highway Code, Road Signs and Junctions. 50 questions,
          30 minutes, 80% to pass.
        </AccordionItem>
        <AccordionItem summary="How long does DriveRush keep my progress?">
          Indefinitely — every lesson, streak and result is saved to your
          account, even if you switch device.
        </AccordionItem>
        <AccordionItem summary="Can I use M-Pesa for premium?">
          Yes. Lipa na M-Pesa Paybill 400222, Account DRIVERUSH.
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
