import type { Meta, StoryObj } from "@storybook/react-vite";

import { CodeBlock, CodeKey, CodeValue, CodeComment } from "./code-block";

const meta: Meta<typeof CodeBlock> = {
  title: "Brand/CodeBlock",
  component: CodeBlock,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

export const Tokens: Story = {
  render: () => (
    <div className="max-w-md">
      <CodeBlock filename="tokens.css" meta="·  v 2.0">
        <CodeComment>{"/* DriveRush primary tokens */"}</CodeComment>
        {"\n:root {\n  "}
        <CodeKey>--rush</CodeKey>
        {":        "}
        <CodeValue>#E11D2E</CodeValue>
        {";\n  "}
        <CodeKey>--ink</CodeKey>
        {":         "}
        <CodeValue>#0E1014</CodeValue>
        {";\n  "}
        <CodeKey>--paper</CodeKey>
        {":       "}
        <CodeValue>#F2EDE3</CodeValue>
        {";\n  "}
        <CodeKey>--kenya-green</CodeKey>
        {": "}
        <CodeValue>#1E8449</CodeValue>
        {";\n  "}
        <CodeKey>--radius</CodeKey>
        {":      "}
        <CodeValue>0</CodeValue>
        {";\n  "}
        <CodeKey>--shadow</CodeKey>
        {":      "}
        <CodeValue>5px 5px 0 var(--ink)</CodeValue>
        {";\n}"}
      </CodeBlock>
    </div>
  ),
};
