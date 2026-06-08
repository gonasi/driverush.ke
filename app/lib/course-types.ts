/**
 * Shared types for the file-based course engine. Zero runtime imports so both
 * the server loaders and client components can share them. The course content
 * tree (course.json → chapter.json → lesson.json → ordered `.mdx` blocks) is
 * authored under `app/courses/` and assembled into these shapes by
 * `app/lib/course.ts`. See `NTSA-Course-Files/COURSE_SPEC.md` for the authoring
 * contract this models.
 */
import type { ComponentType } from "react";

/**
 * Every block type the spec defines. The renderer registry has real renderers
 * for a subset; the rest fall back to a completable placeholder, so a lesson
 * that uses an unbuilt type still plays through end-to-end.
 */
export type BlockType =
  | "rich_text"
  | "true_or_false"
  | "fill_in_the_blank"
  | "multiple_choice_single"
  | "multiple_choice_multiple"
  | "step_by_step_reveal"
  | "lottie_block"
  | "sorting_game"
  | "drag_and_drop_label"
  | "sequence_builder"
  | "scenario_branching"
  | "sign_recognition_flash"
  | "memory_match"
  | "speed_round"
  | "roundabout_simulator"
  | "parking_sim"
  | "stopping_distance_lab"
  | "gear_shift_trainer"
  | "bac_simulator"
  | "hazard_perception_clip"
  | "model_town_explorer"
  | "skid_recovery_sim"
  | "inspection_checklist";

/** Completion triggers the renderer fires on (spec §8). */
export type CompletionTrigger =
  | "read"
  | "played"
  | "answered"
  | "all_flipped"
  | "all_sorted_correctly"
  | "all_placed_correctly"
  | "correct_order_submitted"
  | "reached_terminal"
  | "round_complete"
  | "all_matched"
  | "all_challenges_passed"
  | "challenges_complete"
  | "all_prompts_correct"
  | "all_types_attempted"
  | "clip_ended"
  | "interacted";

/** Inline media placeholder hint embedded in rich_text bodies / frontmatter. */
export type MediaHintData = {
  type: "diagram" | "lottie" | "photo";
  id?: string;
  alt: string;
  caption?: string;
  placement?: string;
};

/** Common frontmatter on every block (spec §5.1). */
export type BaseBlockFrontmatter = {
  id: string;
  type: BlockType;
  /** Position within the lesson, 1-indexed. */
  order: number;
  /** Cognitive load + time (spec §7). Drives the weighted progress bar. */
  weight: number;
  /** XP awarded once on completion. */
  xp: number;
  completion: CompletionTrigger;
  /** If false, the learner may skip. Defaults to true. */
  required: boolean;
  /** Exam-sprint blocks only — costs a life on a wrong answer (future). */
  costsLifeOnFail?: boolean;
  mediaHints?: MediaHintData[];
};

// ---- Type-specific `data` shapes for the renderers we build now ----

export type TrueFalseData = {
  statement: string;
  correct: boolean;
  feedback: { correct: string; incorrect: string };
};

export type McqOption = {
  id: string;
  text: string;
  correct: boolean;
  feedback?: string;
};

export type McqSingleData = {
  question: string;
  options: McqOption[];
  shuffleOptions?: boolean;
};

export type McqMultipleData = {
  question: string;
  options: McqOption[];
  shuffleOptions?: boolean;
  /** Minimum number of correct options (advisory; the renderer requires the exact correct set). */
  minCorrect?: number;
  /** Shown in the Why sheet after submitting. */
  feedbackOnSubmit?: string;
};

export type FillBlankData = {
  prompt: string;
  answers: string[];
  caseSensitive?: boolean;
  feedback: { correct: string; incorrect: string };
};

export type StepRevealCard = { id: string; front: string; back: string };

export type StepRevealData = {
  title: string;
  synthesisAfter?: boolean;
  synthesis?: string;
  cards: StepRevealCard[];
};

export type LottieHotspot = {
  frame?: number;
  x?: number;
  y?: number;
  label: string;
};

export type LottieBlockData = {
  lottieId?: string;
  lottieUrl?: string;
  caption?: string;
  loop?: boolean;
  autoplay?: boolean;
  controls?: boolean;
  hotspots?: LottieHotspot[];
  altText?: string;
};

export type SortingGameBucket = { id: string; label: string };
export type SortingGameItem = {
  id: string;
  text: string;
  bucketId: string;
  feedback?: string;
};
export type SortingGameData = {
  prompt: string;
  buckets: SortingGameBucket[];
  items: SortingGameItem[];
  feedbackOnComplete?: string;
  shuffleItems?: boolean;
};

export type SequenceBuilderStep = {
  id: string;
  text: string;
  correctPosition: number;
};
export type SequenceBuilderData = {
  prompt: string;
  steps: SequenceBuilderStep[];
  feedbackOnComplete?: string;
  allowPartialCredit?: boolean;
};

export type ScenarioChoice = { id: string; text: string; nextNode: string };
export type ScenarioNode = {
  id: string;
  type: "decision" | "outcome";
  outcome?: "positive" | "negative" | "neutral";
  title?: string;
  body?: string;
  animationId?: string;
  terminal?: boolean;
  choices?: ScenarioChoice[];
};
export type ScenarioBranchingData = {
  opening: string;
  nodes: ScenarioNode[];
};

export type SignRecognitionFlashData = {
  mode: "learn" | "exam";
  timePerSign?: number;
  totalSigns: number;
  streakMultiplier?: boolean;
  signSet: {
    category: "warning" | "regulatory" | "information";
    count: number;
  }[];
  feedbackDelay?: number;
  reviewMissed?: boolean;
};

export type MemoryMatchData = {
  pairs: number;
  cardSet: string;
  timeLimitSeconds?: number;
  showCategoryHint?: boolean;
};

export type SpeedRoundQuestion = {
  id: string;
  prompt: string;
  options: { id: string; text: string; correct: boolean }[];
};
export type SpeedRoundData = {
  questionCount: number;
  timeLimitSeconds: number;
  questionPool?: string;
  showExplanationsAtEnd?: boolean;
  passMark?: number;
  questions?: SpeedRoundQuestion[];
};

export type DragLabel = {
  id: string;
  text: string;
  hotspot: string;
  incorrectFeedback?: string;
};
export type DragHotspot = {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};
export type DragAndDropLabelData = {
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  labels: DragLabel[];
  hotspots: DragHotspot[];
  feedbackOnComplete?: string;
};

export type InspectionPoint = {
  id: string;
  label: string;
  status: "ok" | "fault";
  okDescription?: string;
  faultDescription?: string;
  safetyNote?: string;
};
export type InspectionChecklistData = {
  vehicle?: string;
  view?: "exterior" | "boot" | "engine_bay";
  requireAllTapped?: boolean;
  inspectionPoints: InspectionPoint[];
  feedbackOnComplete?: string;
};

export type SkidType = {
  id: string;
  prompt: string;
  options: {
    id: string;
    text: string;
    correct: boolean;
    feedback?: string;
  }[];
};
export type SkidRecoverySimData = {
  skidTypes: SkidType[];
  replaySpeedMultiplier?: number;
};

export type GearShiftPrompt = {
  speed: number;
  context: string;
  correctGear: number;
  feedback: string;
};
export type GearShiftTrainerData = {
  transmission?: "manual" | "automatic";
  mode?: "challenge" | "sequential";
  prompts: GearShiftPrompt[];
};

export type StoppingDistanceLabData = {
  unit?: string;
  showCarLengths?: boolean;
  showFormula?: boolean;
  highlightSpeeds?: number[];
  quizMode?: boolean;
};

export type BacSimulatorData = {
  legalLimitKE?: number;
  showEffectsList?: boolean;
  driveSimulation?: boolean;
  driveSimPromptThreshold?: number;
};

export type HazardPerceptionClipData = {
  scenario: string;
  durationSeconds: number;
  hazardAppearsAt: number;
  scoreWindowSeconds: number;
  replayWithHighlight?: boolean;
  averageReactionSeconds?: number;
};

export type RoundaboutChallenge = {
  id: string;
  prompt: string;
  correctLanes: number[];
  correctDirection?: string;
  successFeedback: string;
  failFeedback: string;
};
export type RoundaboutSimulatorData = {
  mode?: "free_play" | "guided_challenges";
  showLaneLabels?: boolean;
  challenges: RoundaboutChallenge[];
};

export type ParkingSimChallenge = {
  id: string;
  type: "angle" | "flush";
  targetSpot?: number;
  gapSize?: "tight" | "standard" | "wide";
  successThreshold?: number;
};
export type ParkingSimData = {
  mode?: "angle" | "flush" | "both" | "challenge";
  vehicle?: string;
  showGuides?: boolean;
  maxAttempts?: number;
  challenges: ParkingSimChallenge[];
};

export type ModelTownChallenge = {
  id: string;
  prompt: string;
  correctPath: string[];
  failFeedback: string;
};
export type ModelTownExplorerData = {
  mode?: "explore_then_challenge" | "free_play";
  interactiveElements?: string[];
  challenges: ModelTownChallenge[];
};

/** Loose data bag for any block type without a dedicated data shape. */
export type GenericBlockData = Record<string, unknown>;

export type BlockData =
  | TrueFalseData
  | McqSingleData
  | McqMultipleData
  | FillBlankData
  | StepRevealData
  | LottieBlockData
  | SortingGameData
  | SequenceBuilderData
  | ScenarioBranchingData
  | SignRecognitionFlashData
  | MemoryMatchData
  | SpeedRoundData
  | DragAndDropLabelData
  | InspectionChecklistData
  | SkidRecoverySimData
  | GearShiftTrainerData
  | StoppingDistanceLabData
  | BacSimulatorData
  | HazardPerceptionClipData
  | RoundaboutSimulatorData
  | ParkingSimData
  | ModelTownExplorerData
  | GenericBlockData;

/** A block ready to render: frontmatter + parsed data + (for rich_text) its MDX component. */
export type CourseBlock = BaseBlockFrontmatter & {
  data?: BlockData;
  /** MDX body component — present for `rich_text` blocks; ignored otherwise. */
  Component?: ComponentType<{ components?: Record<string, unknown> }>;
};

/** A block stripped of its (non-serialisable) MDX Component, for the loader boundary. */
export type SerialisedBlock = Omit<CourseBlock, "Component">;

export type Lesson = {
  id: string;
  /** Directory name = URL slug. */
  dir: string;
  slug: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  /** Derived = Σ block.xp (JSON value treated as advisory). */
  totalXP: number;
  /** Derived = Σ block.weight. */
  totalWeight: number;
  blocks: CourseBlock[];
  chapterId: string;
  chapterSlug: string;
};

export type SerialisedLesson = Omit<Lesson, "blocks"> & {
  blocks: SerialisedBlock[];
};

export type Chapter = {
  id: string;
  dir: string;
  slug: string;
  title: string;
  description: string;
  outcomes: string[];
  badgeId?: string;
  badgeThreshold?: number;
  totalXP?: number;
  /** Only lessons whose files exist on disk (roadmap entries are skipped). */
  lessons: Lesson[];
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  version: string;
  locale: string;
  totalXP: number;
  passMark: number;
  /** Only chapters whose files exist on disk. */
  chapters: Chapter[];
};

/** Per-block unlock status in the progress store. */
export type BlockStatus = "locked" | "unlocked" | "complete";

/**
 * Assessment plugins — the block types the learner *attempts* and is *scored*
 * on (a 0–100 score is saved with their progress). Everything else is an
 * informational/reveal plugin: it tracks completion only (read / all-flipped /
 * played), no score. This split mirrors Gonasi's scored vs non-scored blocks.
 */
export const ASSESSMENT_BLOCK_TYPES = new Set<BlockType>([
  "true_or_false",
  "multiple_choice_single",
  "multiple_choice_multiple",
  "fill_in_the_blank",
]);

export function isAssessmentType(type: BlockType): boolean {
  return ASSESSMENT_BLOCK_TYPES.has(type);
}

/** Result a renderer reports when it advances — assessments include a score. */
export type BlockResult = { score?: number };

/**
 * Contract every block renderer implements. Each renderer owns its own
 * interaction + the Continue/Complete button it shows when ready, calling
 * `onAdvance` to mark itself complete (assessments pass their `score`). It
 * renders interactively when `status === "unlocked"` (the active block) and a
 * read-only resolved state when `status === "complete"` (a block above that's
 * already done — all blocks stay on the page, Gonasi-style).
 */
export type BlockRendererProps = {
  block: CourseBlock;
  status: BlockStatus;
  /** True when this is the last block in the lesson (button reads "Complete lesson"). */
  isLast: boolean;
  /** Called on each scored attempt (before completion) so the store can tally attempts. */
  onAttempt?: (correct: boolean) => void;
  /** Called once to advance: marks the block complete (+score for assessments) and reveals the next. */
  onAdvance: (result?: BlockResult) => void;
};
