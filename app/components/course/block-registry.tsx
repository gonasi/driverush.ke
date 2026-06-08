/**
 * Block-renderer registry. Maps a block `type` to its renderer; any type
 * without a real renderer falls back to a completable placeholder, so a lesson
 * using an unbuilt type still plays through.
 */
import type { ComponentType } from "react";

import type { BlockRendererProps, BlockType } from "~/lib/course-types";

import { BacSimulatorBlock } from "./blocks/bac-simulator-block";
import { DragAndDropLabelBlock } from "./blocks/drag-and-drop-label-block";
import { FallbackBlock } from "./blocks/fallback-block";
import { FillBlankBlock } from "./blocks/fill-blank-block";
import { GearShiftTrainerBlock } from "./blocks/gear-shift-trainer-block";
import { HazardPerceptionClipBlock } from "./blocks/hazard-perception-clip-block";
import { InspectionChecklistBlock } from "./blocks/inspection-checklist-block";
import { LottieBlock } from "./blocks/lottie-block";
import { McqMultipleBlock } from "./blocks/mcq-multiple-block";
import { McqSingleBlock } from "./blocks/mcq-single-block";
import { MemoryMatchBlock } from "./blocks/memory-match-block";
import { ModelTownExplorerBlock } from "./blocks/model-town-explorer-block";
import { ParkingSimBlock } from "./blocks/parking-sim-block";
import { RichTextBlock } from "./blocks/rich-text-block";
import { RoundaboutSimulatorBlock } from "./blocks/roundabout-simulator-block";
import { ScenarioBranchingBlock } from "./blocks/scenario-branching-block";
import { SequenceBuilderBlock } from "./blocks/sequence-builder-block";
import { SignRecognitionFlashBlock } from "./blocks/sign-recognition-flash-block";
import { SkidRecoverySimBlock } from "./blocks/skid-recovery-sim-block";
import { SortingGameBlock } from "./blocks/sorting-game-block";
import { SpeedRoundBlock } from "./blocks/speed-round-block";
import { StepRevealBlock } from "./blocks/step-reveal-block";
import { StoppingDistanceLabBlock } from "./blocks/stopping-distance-lab-block";
import { TrueFalseBlock } from "./blocks/true-false-block";

const REGISTRY: Partial<Record<BlockType, ComponentType<BlockRendererProps>>> =
  {
    rich_text: RichTextBlock,
    step_by_step_reveal: StepRevealBlock,
    true_or_false: TrueFalseBlock,
    multiple_choice_single: McqSingleBlock,
    multiple_choice_multiple: McqMultipleBlock,
    fill_in_the_blank: FillBlankBlock,
    lottie_block: LottieBlock,
    sorting_game: SortingGameBlock,
    sequence_builder: SequenceBuilderBlock,
    scenario_branching: ScenarioBranchingBlock,
    sign_recognition_flash: SignRecognitionFlashBlock,
    memory_match: MemoryMatchBlock,
    speed_round: SpeedRoundBlock,
    drag_and_drop_label: DragAndDropLabelBlock,
    inspection_checklist: InspectionChecklistBlock,
    skid_recovery_sim: SkidRecoverySimBlock,
    gear_shift_trainer: GearShiftTrainerBlock,
    stopping_distance_lab: StoppingDistanceLabBlock,
    bac_simulator: BacSimulatorBlock,
    hazard_perception_clip: HazardPerceptionClipBlock,
    roundabout_simulator: RoundaboutSimulatorBlock,
    parking_sim: ParkingSimBlock,
    model_town_explorer: ModelTownExplorerBlock,
  };

export function getBlockRenderer(
  type: BlockType,
): ComponentType<BlockRendererProps> {
  return REGISTRY[type] ?? FallbackBlock;
}
