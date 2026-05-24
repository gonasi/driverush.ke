import type { BlockRendererProps } from "~/lib/course-types";
import { courseMdxComponents } from "../course-mdx-components";
import { BlockActionButton } from "../block-action-button";

/**
 * `rich_text` block — informational (non-assessment). The MDX body IS the
 * content; reading it is the action. Active blocks show a Continue button;
 * resolved blocks (above, already done) just show the content.
 */
export function RichTextBlock({
  block,
  status,
  isLast,
  onAdvance,
}: BlockRendererProps) {
  const Body = block.Component;
  const resolved = status === "complete";

  return (
    <div className="grid gap-5">
      <div>{Body ? <Body components={courseMdxComponents} /> : null}</div>
      {!resolved && (
        <div>
          <BlockActionButton onClick={() => onAdvance()} isLast={isLast} />
        </div>
      )}
    </div>
  );
}
