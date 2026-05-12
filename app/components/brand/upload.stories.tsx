import type { Meta, StoryObj } from "@storybook/react-vite";

import { UploadZone, FileRow } from "./upload";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const meta: Meta<typeof UploadZone> = {
  title: "Brand/Upload",
  component: UploadZone,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof UploadZone>;

export const ZoneAndRows: Story = {
  render: () => (
    <div className="grid max-w-md gap-2.5">
      <UploadZone
        title="Drop your ID document"
        sub="PNG · JPG · PDF · max 8 MB"
      />
      <FileRow
        ext="PDF"
        extTone="rush"
        name="NTSA_Mock_Test_03"
        size="2.4 MB · uploaded May 9"
        status={<Badge variant="green">Safe</Badge>}
        action={
          <Button variant="ink" size="sm">
            Open
          </Button>
        }
      />
      <FileRow
        ext="PNG"
        extTone="blue"
        name="licence_front.png"
        size="1.1 MB · scanning"
        status={<Badge variant="amber">Scan</Badge>}
        action={
          <Button variant="paper" size="sm">
            Cancel
          </Button>
        }
      />
    </div>
  ),
};
