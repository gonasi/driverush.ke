/**
 * Block-renderer registry. Maps a block `type` to its renderer; any type
 * without a real renderer falls back to a completable placeholder, so a lesson
 * using an unbuilt type (e.g. the weight-10 simulators) still plays through.
 */
import type { ComponentType } from "react";

import type { BlockRendererProps, BlockType } from "~/lib/course-types";

import { FallbackBlock } from "./blocks/fallback-block";
import { FillBlankBlock } from "./blocks/fill-blank-block";
import { McqMultipleBlock } from "./blocks/mcq-multiple-block";
import { McqSingleBlock } from "./blocks/mcq-single-block";
import { RichTextBlock } from "./blocks/rich-text-block";
import { StepRevealBlock } from "./blocks/step-reveal-block";
import { TrueFalseBlock } from "./blocks/true-false-block";

const REGISTRY: Partial<Record<BlockType, ComponentType<BlockRendererProps>>> =
  {
    rich_text: RichTextBlock,
    step_by_step_reveal: StepRevealBlock,
    true_or_false: TrueFalseBlock,
    multiple_choice_single: McqSingleBlock,
    multiple_choice_multiple: McqMultipleBlock,
    fill_in_the_blank: FillBlankBlock,
  };

export function getBlockRenderer(
  type: BlockType,
): ComponentType<BlockRendererProps> {
  return REGISTRY[type] ?? FallbackBlock;
}
