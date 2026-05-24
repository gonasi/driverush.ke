# NTSA Drive Kenya — Course Spec
> **This file is the single source of truth for an AI generating the course.**
> Read it fully before writing any file. Every naming rule, schema field, and weight table is authoritative.

---

## 0. What You Are Building

A file-based, progressively revealed interactive driving course for the Gonasi platform. No database. All course content lives in MDX files. Progress is tracked client-side (localStorage or in-memory state). The renderer reads the file tree and frontmatter, serves blocks one at a time, and advances on completion.

Think Brilliant.org: one idea per screen, every screen requires an action, nothing skippable.

---

## 1. Directory Layout

```
ntsa-course/
├── COURSE_SPEC.md              ← this file
├── course.json                 ← course metadata + ordered chapter manifest
│
└── chapters/
    ├── 01-road-foundations/
    │   ├── chapter.json        ← chapter metadata + ordered lesson manifest
    │   └── lessons/
    │       ├── 01-why-rules-rule-the-road/
    │       │   ├── lesson.json ← lesson metadata + ordered block manifest
    │       │   ├── 001-intro.mdx
    │       │   ├── 002-step-reveal.mdx
    │       │   ├── 003-true-false.mdx
    │       │   ├── 004-mcq-single.mdx
    │       │   ├── 005-fill-blank.mdx
    │       │   └── 006-outro.mdx
    │       ├── 02-signals-signs-when-to-hoot/
    │       │   └── ...
    │       └── ...
    ├── 02-the-human-factor/
    │   └── ...
    └── ...
```

### Naming Rules

| Level | Pattern | Example |
|---|---|---|
| Chapter dir | `{NN}-{slug}` | `01-road-foundations` |
| Lesson dir | `{NN}-{slug}` | `03-roundabout-rules` |
| Block file | `{NNN}-{slug}.mdx` | `004-sorting-game.mdx` |
| IDs | `ch{NN}-l{NN}-b{NNN}` | `ch01-l03-b004` |

- `NN` = zero-padded chapter/lesson number
- `NNN` = zero-padded block number within lesson
- slugs = lowercase, hyphens only, no special chars
- IDs must be globally unique across the entire course

---

## 2. course.json

```json
{
  "id": "ntsa-drive-kenya",
  "title": "Drive Kenya: Master Your NTSA Licence",
  "tagline": "From zero to road-ready — interactively",
  "version": "1.0.0",
  "locale": "en-KE",
  "totalXP": 4800,
  "passMark": 80,
  "chapters": [
    { "id": "ch01", "dir": "01-road-foundations" },
    { "id": "ch02", "dir": "02-the-human-factor" },
    { "id": "ch03", "dir": "03-know-your-vehicle" },
    { "id": "ch04", "dir": "04-reading-the-road" },
    { "id": "ch05", "dir": "05-speed-space-survival" },
    { "id": "ch06", "dir": "06-tough-conditions" },
    { "id": "ch07", "dir": "07-cargo-hazards-emergencies" },
    { "id": "ch08", "dir": "08-exam-sprint" }
  ]
}
```

---

## 3. chapter.json

```json
{
  "id": "ch01",
  "title": "Road Foundations",
  "description": "The mental map every Kenyan driver must have — the laws, the roads, and the model town.",
  "outcomes": [
    "Understand the Traffic Act and Highway Code",
    "Know road types and their line markings",
    "Navigate the model town correctly"
  ],
  "badgeId": "road-foundations-badge",
  "badgeThreshold": 80,
  "totalXP": 600,
  "lessons": [
    { "id": "ch01-l01", "dir": "01-why-rules-rule-the-road" },
    { "id": "ch01-l02", "dir": "02-signals-signs-when-to-hoot" },
    { "id": "ch01-l03", "dir": "03-road-network-lines-lanes-logic" },
    { "id": "ch01-l04", "dir": "04-roundabout-rules-lane-by-lane" },
    { "id": "ch01-l05", "dir": "05-parking-rules-of-the-zone" },
    { "id": "ch01-l06", "dir": "06-model-town-the-exam-board" }
  ]
}
```

---

## 4. lesson.json

```json
{
  "id": "ch01-l01",
  "title": "Why Rules Rule the Road",
  "objective": "Understand what the Traffic Act and Highway Code are and why they exist.",
  "estimatedMinutes": 4,
  "totalXP": 100,
  "totalWeight": 14,
  "blocks": [
    { "id": "ch01-l01-b001", "file": "001-intro.mdx" },
    { "id": "ch01-l01-b002", "file": "002-two-documents.mdx" },
    { "id": "ch01-l01-b003", "file": "003-synthesis.mdx" },
    { "id": "ch01-l01-b004", "file": "004-true-false.mdx" },
    { "id": "ch01-l01-b005", "file": "005-mcq-single.mdx" },
    { "id": "ch01-l01-b006", "file": "006-fill-blank.mdx" },
    { "id": "ch01-l01-b007", "file": "007-outro.mdx" }
  ]
}
```

> **`totalWeight`** = sum of all block `weight` values in the lesson. Used by the renderer to draw a progress bar that advances proportionally — heavier blocks move the bar more.

---

## 5. Block MDX Files

Each block is one `.mdx` file. It has:
1. A **YAML frontmatter** section (the machine-readable data)
2. An optional **MDX body** (rendered prose for `rich_text` blocks; unused or minimal for pure-data blocks)

### 5.1 Frontmatter: Common Fields (all block types)

```yaml
---
id: "ch01-l01-b001"          # globally unique block ID
type: "rich_text"             # block type — see §6 for all types
order: 1                      # position within lesson (1-indexed)
weight: 2                     # see §7 Weight System
xp: 10                        # XP awarded on completion
completion: "read"            # completion trigger — see §8
required: true                # if false, learner can skip
---
```

### 5.2 Frontmatter: Type-Specific Fields

Every block type adds its own fields below the common fields. The full schemas per type are in §6.

### 5.3 MDX Body

- **`rich_text` blocks**: the body IS the content. Write clean MDX prose. Use `<Callout>`, `<Diagram>`, `<MediaHint>` components where helpful.
- **Interactive blocks** (MCQ, T/F, etc.): body is empty or contains only a brief setup paragraph if needed. All data lives in frontmatter.
- **Simulation/game blocks**: body is empty. All config in frontmatter.

---

## 6. Block Type Schemas

For each type: frontmatter fields to add beyond the common set, plus the MDX body rule.

---

### `rich_text`
Plain explanatory content. Prose, analogies, diagrams, callouts.

```yaml
type: "rich_text"
completion: "read"          # auto-complete after read (or scroll-to-end)
mediaHints:                 # optional — describes media to embed
  - type: "diagram"
    alt: "Top-down roundabout with four lanes numbered 1–4"
    placement: "after-paragraph-2"
  - type: "lottie"
    id: "lottie_traffic_light"
    placement: "end"
```

**Body:** Full MDX prose.

---

### `true_or_false`
Single statement, binary True/False answer.

```yaml
type: "true_or_false"
completion: "answered"
data:
  statement: "The Highway Code only applies to motor vehicle drivers."
  correct: false
  feedback:
    correct: "Correct. The Highway Code applies to ALL road users without exception."
    incorrect: "Not quite. The Highway Code applies to ALL road users — pedestrians, cyclists, animal riders, motorcyclists, and drivers."
```

**Body:** Empty (or a single optional lead-in sentence).

---

### `fill_in_the_blank`
Short typed answer (word or short phrase). Fuzzy match recommended.

```yaml
type: "fill_in_the_blank"
completion: "answered"
data:
  prompt: "On a two-way road, traffic going in opposite directions is separated by a _______ line."
  answers:
    - "yellow"
    - "yellow centre"
  caseSensitive: false
  feedback:
    correct: "Correct. Yellow lines separate opposite-direction traffic on two-way roads."
    incorrect: "Not quite. Two-way roads use YELLOW lines at the centre. White lines are for same-direction lanes on dual carriageways."
```

**Body:** Empty.

---

### `multiple_choice_single`
One correct answer from 2–5 options.

```yaml
type: "multiple_choice_single"
completion: "answered"
data:
  question: "What is the primary purpose of the Highway Code?"
  options:
    - id: "a"
      text: "To set out criminal penalties for bad driving"
      correct: false
      feedback: "That is the Traffic Act's role — not the Highway Code."
    - id: "b"
      text: "To promote safety, responsible behaviour, and courtesy for all road users"
      correct: true
      feedback: "Exactly. The Highway Code is a practical guide. Penalties belong to the Traffic Act."
    - id: "c"
      text: "To license vehicles and register drivers"
      correct: false
      feedback: "Licensing is handled by NTSA — not the Highway Code."
    - id: "d"
      text: "To describe the construction of Kenyan roads"
      correct: false
      feedback: "Road construction is covered by different legislation entirely."
  shuffleOptions: true
```

**Body:** Empty.

---

### `multiple_choice_multiple`
One or more correct answers. "Select all that apply."

```yaml
type: "multiple_choice_multiple"
completion: "answered"
data:
  question: "Which of the following are correct uses of the car horn? Select all that apply."
  options:
    - id: "a"
      text: "Warning a pedestrian stepping into your path while moving"
      correct: true
    - id: "b"
      text: "Expressing frustration at a driver who cut you off"
      correct: false
    - id: "c"
      text: "Warning oncoming traffic at a blind bend while moving"
      correct: true
    - id: "d"
      text: "Alerting a parked car while stationary"
      correct: false
    - id: "e"
      text: "Hooting outside a hospital zone"
      correct: false
  feedbackOnSubmit: "Horn use is only legal while MOVING and only to WARN. Never aggressively, never when stationary, never near hospitals or schools."
  shuffleOptions: true
  minCorrect: 2
```

**Body:** Empty.

---

### `step_by_step_reveal`
Guided card-flip sequence. Each card has a front (prompt/question) and a back (explanation). Learner must flip all cards before the block completes.

```yaml
type: "step_by_step_reveal"
completion: "all_flipped"
data:
  title: "Two Documents, One Safe Road"
  synthesisAfter: true        # render a rich_text synthesis block after all cards are flipped
  cards:
    - id: "card-1"
      front: "What is the Traffic Act?"
      back: "The Traffic Act is the law. It sets out what road users must and must not do, and lists penalties for violations. It applies to every person using any Kenyan road."
    - id: "card-2"
      front: "What is the Highway Code?"
      back: "The Highway Code is the practical guide — information, advice, and mandatory rules for ALL road users: pedestrians, cyclists, motorcyclists, and drivers. Core purpose: safety, responsibility, and courtesy."
    - id: "card-3"
      front: "Who must follow these documents?"
      back: "Every road user without exception — drivers, cyclists, pedestrians, even horse riders. If you use the road, you are bound by these rules."
    - id: "card-4"
      front: "Where do Kenya's road laws originate?"
      back: "From international and regional conventions, plus Kenyan legislation. Kenya's rules are part of a global framework — not invented domestically."
  synthesis: "You are legally responsible for reading and understanding both documents before driving. 'I didn't know' is not a valid defence on any Kenyan road."
```

**Body:** Empty (synthesis text is in frontmatter).

---

### `lottie_block`
Plays a Lottie JSON animation. Semi-interactive — learner presses play.

```yaml
type: "lottie_block"
completion: "played"        # completes when animation finishes at least once
data:
  lottieId: "lottie_traffic_light"
  lottieUrl: "/animations/lottie_traffic_light.json"
  caption: "Watch how the traffic light sequence works — and note what the driver should do at each phase."
  loop: false
  autoplay: false
  controls: true
  hotspots:                 # optional tap-to-reveal labels on specific frames
    - frame: 0
      x: 50
      y: 20
      label: "RED — Stop. Do not proceed."
    - frame: 48
      x: 50
      y: 20
      label: "RED + AMBER — Engine on, prepare to move. Still stopped."
    - frame: 96
      x: 50
      y: 20
      label: "GREEN — Proceed when road is clear."
    - frame: 144
      x: 50
      y: 20
      label: "AMBER — Stop if safe to do so."
  altText: "Animated traffic light cycling through red, red-and-amber, green, and amber phases with driver action labels."
```

**Body:** Empty.

---

### `sorting_game`
Drag items into labelled buckets.

```yaml
type: "sorting_game"
completion: "all_sorted_correctly"
data:
  prompt: "Sort each situation into the correct bucket."
  buckets:
    - id: "give-way"
      label: "Give way — pull over and stop"
    - id: "normal"
      label: "Normal road rules apply"
  items:
    - id: "item-1"
      text: "Police car with siren and lights"
      bucketId: "give-way"
      feedback: "Emergency vehicles always take priority."
    - id: "item-2"
      text: "Presidential motorcade"
      bucketId: "give-way"
      feedback: "Presidential motorcades are given absolute right of way."
    - id: "item-3"
      text: "Ambulance with blue lights activated"
      bucketId: "give-way"
      feedback: "Ambulances responding to emergencies take priority."
    - id: "item-4"
      text: "Delivery truck on the main road"
      bucketId: "normal"
      feedback: "A delivery truck follows the same rules as any other vehicle."
    - id: "item-5"
      text: "Traffic officer directing traffic"
      bucketId: "give-way"
      feedback: "A traffic officer's instruction overrides all other signals and rules."
  feedbackOnComplete: "Emergency vehicles, presidential motorcades, and traffic officers always take absolute priority. This is both a legal requirement and a moral one."
  shuffleItems: true
```

**Body:** Empty.

---

### `drag_and_drop_label`
Drag label chips onto hotspots on an image diagram.

```yaml
type: "drag_and_drop_label"
completion: "all_placed_correctly"
data:
  image: "/diagrams/dashboard-pedals.png"
  imageAlt: "Car dashboard showing three pedals: left, centre, right. Steering wheel above."
  imageWidth: 800
  imageHeight: 500
  labels:
    - id: "label-clutch"
      text: "Clutch"
      hotspot: "left-pedal"
      incorrectFeedback: "The clutch is the LEFT pedal — used to disengage the engine before changing gear."
    - id: "label-brake"
      text: "Brake pedal"
      hotspot: "centre-pedal"
      incorrectFeedback: "The brake is the CENTRE pedal — applies all four wheel brakes."
    - id: "label-accel"
      text: "Accelerator"
      hotspot: "right-pedal"
      incorrectFeedback: "The accelerator is the RIGHT pedal — controls engine power and speed."
  hotspots:
    - id: "left-pedal"
      x: 120
      y: 400
      width: 80
      height: 60
    - id: "centre-pedal"
      x: 240
      y: 400
      width: 80
      height: 60
    - id: "right-pedal"
      x: 360
      y: 400
      width: 80
      height: 60
  feedbackOnComplete: "Left = Clutch (C), Centre = Brake (B), Right = Accelerator (A). Remember: C-B-A left to right."
```

**Body:** Empty.

---

### `sequence_builder`
Drag shuffled step tiles into the correct numbered order.

```yaml
type: "sequence_builder"
completion: "correct_order_submitted"
data:
  prompt: "Arrange the correct procedure at a Stop sign junction."
  steps:
    - id: "step-a"
      text: "Stop completely"
      correctPosition: 1
    - id: "step-b"
      text: "Look right"
      correctPosition: 2
    - id: "step-c"
      text: "Look left"
      correctPosition: 3
    - id: "step-d"
      text: "Look right again"
      correctPosition: 4
    - id: "step-e"
      text: "Proceed only if road is clear"
      correctPosition: 5
  feedbackOnComplete: "Right → Left → Right again. You check right first and last because in Kenya we drive on the left — the primary threat comes from your right."
  allowPartialCredit: false
```

**Body:** Empty.

---

### `scenario_branching`
Narrative decision tree with animated consequences.

```yaml
type: "scenario_branching"
completion: "reached_terminal"     # completes when any terminal node is reached
data:
  opening: "You've been driving 4 hours on the Nairobi-Mombasa highway. It's 2am. Your eyes are getting heavy. The next rest stop is 30km away."
  nodes:
    - id: "root"
      type: "decision"
      choices:
        - id: "push-through"
          text: "Push through — it's only 30km more."
          nextNode: "microsleep"
        - id: "pull-over"
          text: "Pull over immediately at the first safe spot."
          nextNode: "safe-rest"
    - id: "microsleep"
      type: "outcome"
      outcome: "negative"
      animationId: "anim_microsleep_drift"
      title: "Microsleep"
      body: "You microsleep for 2 seconds. At 100 km/h, that's 55 metres of uncontrolled vehicle. You wake up on the hard shoulder — barely. Fatigue is as dangerous as alcohol. Never push through it."
      terminal: true
    - id: "safe-rest"
      type: "outcome"
      outcome: "positive"
      animationId: "anim_safe_pullover"
      title: "Good decision"
      body: "You pull over safely, set reflector triangles, turn on hazard lights, and rest for 30 minutes. You arrive safely. Pulling over is never weak — it's professional."
      terminal: true
```

**Body:** Empty.

---

### `sign_recognition_flash`
Rapid-fire sign identification game.

```yaml
type: "sign_recognition_flash"
completion: "round_complete"
data:
  mode: "learn"               # "learn" | "exam"
  timePerSign: 6              # seconds (learn) or 5 (exam)
  totalSigns: 12
  streakMultiplier: true
  signSet:
    - category: "warning"
      count: 4
    - category: "regulatory"
      count: 4
    - category: "information"
      count: 4
  feedbackDelay: 800          # ms to show correct answer before next sign
  reviewMissed: true          # show missed signs in summary
```

**Body:** Empty.

---

### `memory_match`
Card-flip memory game. Sign ↔ meaning pairs.

```yaml
type: "memory_match"
completion: "all_matched"
data:
  pairs: 8
  cardSet: "warning_signs"    # references a sign set definition
  timeLimitSeconds: 120
  showCategoryHint: true
```

**Body:** Empty.

---

### `speed_round`
Timed mini-quiz burst.

```yaml
type: "speed_round"
completion: "round_complete"
data:
  questionCount: 10
  timeLimitSeconds: 30
  questionPool: "ch01-all"    # pool ID — references question bank
  showExplanationsAtEnd: true
  passMark: 70                # % correct to "pass" the round (no fail — just score)
```

**Body:** Empty.

---

### `roundabout_simulator`
Interactive top-down roundabout React component.

```yaml
type: "roundabout_simulator"
completion: "all_challenges_passed"
data:
  mode: "guided_challenges"   # "free_play" | "guided_challenges"
  showLaneLabels: true
  challenges:
    - id: "c1"
      prompt: "You want to go straight through. Which lane do you enter from?"
      correctLanes: [1, 2]
      correctDirection: "straight_180"
      successFeedback: "Correct. Lane 1 or 2 for going straight. Lane 1 exits first — it cannot reach further exits."
      failFeedback: "Not quite. Lane 1 or Lane 2 are for going straight."
    - id: "c2"
      prompt: "You want to turn right (90°). Which lane must you use?"
      correctLanes: [3, 4]
      correctDirection: "right_90"
      successFeedback: "Correct. Lane 3 or 4 for turning right."
      failFeedback: "Lanes 1 and 2 cannot reach the right exit — they exit before reaching it."
    - id: "c3"
      prompt: "You want to make a U-turn (180°). Which lane must you be in?"
      correctLanes: [4]
      correctDirection: "u_turn_180"
      successFeedback: "Correct. Only Lane 4 can make a U-turn — it sits inside all other lanes."
      failFeedback: "Only Lane 4 (innermost) can make a U-turn."
    - id: "c4"
      prompt: "You want to go all the way around (360°). Which lane?"
      correctLanes: [4]
      correctDirection: "full_circle_360"
      successFeedback: "Lane 4 only — the most powerful lane, with access to all exits."
      failFeedback: "Only Lane 4 can go all the way around."
```

**Body:** Empty.

---

### `parking_sim`
Top-down 2D parking simulator.

```yaml
type: "parking_sim"
completion: "challenges_complete"
data:
  mode: "angle"               # "angle" | "flush" | "both"
  vehicle: "saloon"
  showGuides: true
  maxAttempts: 3
  challenges:
    - id: "angle-1"
      type: "angle"
      targetSpot: 3           # spot number from far end
      successThreshold: 0.8   # 0–1 centering score
    - id: "flush-1"
      type: "flush"
      gapSize: "standard"
      successThreshold: 0.75
```

**Body:** Empty.

---

### `stopping_distance_lab`
Interactive stopping distance slider.

```yaml
type: "stopping_distance_lab"
completion: "interacted"       # completes after learner moves slider + views at least 2 speeds
data:
  unit: "km/h"
  showCarLengths: true
  showFormula: true
  highlightSpeeds: [30, 50, 80, 100]
  quizMode: false             # set true in mini-game variant to ask questions
```

**Body:** Optional brief intro paragraph.

---

### `gear_shift_trainer`
Animated H-pattern gear stick trainer.

```yaml
type: "gear_shift_trainer"
completion: "all_prompts_correct"
data:
  transmission: "manual"
  mode: "challenge"           # "challenge" | "sequential"
  prompts:
    - speed: 0
      context: "You've just started the engine. Moving off from rest."
      correctGear: 1
      feedback: "Always start in 1st gear. Never try to move from 2nd — you'll stall or cause excessive clutch wear."
    - speed: 20
      context: "You're rolling slowly in 1st gear. Traffic is moving."
      correctGear: 2
      feedback: "Shift to 2nd between 15–25 km/h for smooth town driving."
    - speed: 45
      context: "Town traffic, flowing steadily."
      correctGear: 3
      feedback: "3rd gear is your workhorse for 35–55 km/h urban driving."
    - speed: 80
      context: "Open road, consistent speed."
      correctGear: 4
      feedback: "4th gear for 65–95 km/h. Economical and smooth."
    - speed: 100
      context: "Highway, cruising."
      correctGear: 5
      feedback: "5th gear (top gear) for sustained speeds above 90 km/h."
```

**Body:** Empty.

---

### `bac_simulator`
Blood Alcohol Concentration simulator.

```yaml
type: "bac_simulator"
completion: "interacted"       # completes after learner adjusts inputs + views effects
data:
  legalLimitKE: 0.08
  showEffectsList: true
  driveSimulation: true
  driveSimPromptThreshold: 0.06   # show "Drive Now?" button above this BAC
```

**Body:** Optional brief intro paragraph.

---

### `hazard_perception_clip`
Tap-to-flag hazard in animated road scene.

```yaml
type: "hazard_perception_clip"
completion: "clip_ended"
data:
  scenario: "parked_car_pedestrian"
  durationSeconds: 8
  hazardAppearsAt: 3.8
  scoreWindowSeconds: 3.0
  replayWithHighlight: true
  averageReactionSeconds: 2.1
```

**Body:** Empty.

---

### `model_town_explorer`
Interactive NTSA Model Town board.

```yaml
type: "model_town_explorer"
completion: "all_challenges_passed"
data:
  mode: "explore_then_challenge"
  interactiveElements:
    - "roundabout"
    - "angle_parking"
    - "flush_parking"
    - "pedestrian_crossing"
    - "stop_sign"
    - "give_way"
    - "yellow_kerb"
    - "one_way_road"
    - "two_way_road"
  challenges:
    - id: "route-1"
      prompt: "Navigate from the dual carriageway entrance to the flush parking zone. Use the shortest correct route."
      correctPath: ["entry_dual", "roundabout_straight", "flush_parking"]
      failFeedback: "Check your route — did you use the shortest path without cutting through parking?"
    - id: "route-2"
      prompt: "From the roundabout, navigate to the pedestrian crossing. Obey all signs."
      correctPath: ["roundabout_exit_two_way", "stop_sign", "pedestrian_crossing"]
      failFeedback: "Did you stop at the stop sign before proceeding?"
```

**Body:** Empty.

---

### `skid_recovery_sim`
Interactive skid type and recovery simulator.

```yaml
type: "skid_recovery_sim"
completion: "all_types_attempted"
data:
  skidTypes:
    - id: "front_wheel"
      prompt: "Your front wheels are sliding — the car is drifting wide on a bend."
      options:
        - id: "steer-into"
          text: "Ease off the accelerator and steer toward where you want to go."
          correct: true
          feedback: "Correct. Ease off, steer toward your intended path. Don't brake sharply — that worsens front grip loss."
        - id: "brake-hard"
          text: "Brake hard to slow the car."
          correct: false
          feedback: "Hard braking removes what little front grip remains and deepens the skid."
        - id: "steer-away"
          text: "Turn the wheel opposite to the direction of drift."
          correct: false
          feedback: "Counter-steering works for rear skids, not front skids. For front skids: ease off, steer toward target."
    - id: "rear_wheel"
      prompt: "The rear of your car swings out to the right on a wet bend."
      options:
        - id: "steer-into"
          text: "Steer into the skid — turn right to correct the swing."
          correct: true
          feedback: "Correct. Steer into the skid direction. Ease off the accelerator — do not brake."
        - id: "brake-hard"
          text: "Apply the brakes immediately."
          correct: false
          feedback: "Braking during a rear skid locks the rear wheels further, making it worse. Ease off the accelerator only."
        - id: "steer-opposite"
          text: "Steer left, away from the swing."
          correct: false
          feedback: "Steering opposite to a rear skid makes the car spin. Steer into it."
    - id: "aquaplaning"
      prompt: "Your steering suddenly feels light and unresponsive. You're on wet road at 90 km/h."
      options:
        - id: "ease-off-both"
          text: "Ease off the accelerator. Hold the wheel steady. Do not brake."
          correct: true
          feedback: "Correct. Let the speed drop naturally. The tyre will regain contact as speed reduces. No sudden inputs."
        - id: "steer-through"
          text: "Steer firmly toward the side of the road."
          correct: false
          feedback: "Steering inputs on a floating tyre have no effect and may cause a violent snap when grip returns."
        - id: "brake-to-slow"
          text: "Apply the brakes firmly to slow down quickly."
          correct: false
          feedback: "Braking while aquaplaning locks wheels that are already floating. Hold steady and ease off the accelerator only."
  replaySpeedMultiplier: 0.5
```

**Body:** Empty.

---

### `inspection_checklist`
Interactive tap-to-inspect vehicle illustration.

```yaml
type: "inspection_checklist"
completion: "all_tapped"
data:
  vehicle: "saloon"
  view: "exterior"            # "exterior" | "boot" | "engine_bay"
  requireAllTapped: true
  inspectionPoints:
    - id: "front-tyre-left"
      label: "Front left tyre"
      status: "fault"
      faultDescription: "Tyre is visibly underinflated. Tread depth is below legal minimum of 1.6mm."
      safetyNote: "An underinflated tyre increases stopping distance and is at risk of blowout at speed."
    - id: "headlights"
      label: "Headlights"
      status: "ok"
      okDescription: "Both headlights are clean, intact, and functioning."
    - id: "left-indicator"
      label: "Left front indicator"
      status: "fault"
      faultDescription: "Indicator bulb is blown — no flash."
      safetyNote: "A non-functioning indicator means you cannot legally communicate a turn or lane change."
    - id: "windscreen"
      label: "Windscreen"
      status: "ok"
      okDescription: "No cracks in the driver's field of vision. Clean and clear."
    - id: "nearside-mirror"
      label: "Left (nearside) mirror"
      status: "ok"
      okDescription: "Mirror is intact, correctly angled, and clean."
  feedbackOnComplete: "You found 2 faults: an underinflated tyre and a blown indicator. Neither is safe to drive with. Both must be fixed before the vehicle is used."
```

**Body:** Empty.

---

## 7. Weight System

Block weight represents **cognitive load + time investment**, combined. It is used by the renderer to:
- Advance the lesson progress bar proportionally (heavier blocks = bigger bar movement)
- Estimate lesson duration
- Calculate XP distribution across blocks

### Weight Scale

| Weight | Description | Block Types | Approx Time |
|--------|-------------|-------------|-------------|
| 1 | Passive read, minimal text | `rich_text` (very short) | ~5s |
| 2 | Standard read, 1–3 paragraphs | `rich_text` (standard) | ~15s |
| 3 | Quick binary interaction | `true_or_false`, `lottie_block` | ~10–20s |
| 4 | Single choice, low ambiguity | `multiple_choice_single` (easy) | ~15–25s |
| 5 | Typed answer or multi-select | `fill_in_the_blank`, `multiple_choice_multiple` | ~20–35s |
| 6 | Guided card sequence (4–6 cards) | `step_by_step_reveal` | ~45–60s |
| 7 | Drag interaction, spatial reasoning | `drag_and_drop_label`, `sorting_game`, `sequence_builder` | ~45–90s |
| 8 | Narrative with consequences | `scenario_branching`, `sign_recognition_flash` | ~60–120s |
| 9 | Simulation / full interaction | `roundabout_simulator`, `parking_sim`, `skid_recovery_sim`, `gear_shift_trainer`, `stopping_distance_lab`, `hazard_perception_clip`, `inspection_checklist`, `memory_match` | ~90–180s |
| 10 | Extended game or full exam | `speed_round` (10q), `model_town_explorer`, `bac_simulator` | ~120–300s |

### XP ↔ Weight Formula

```
xp = weight * 10 * difficultyMultiplier
```

Where `difficultyMultiplier`:
- Chapter 1–2 (foundation): `1.0`
- Chapter 3–5 (intermediate): `1.2`
- Chapter 6–7 (advanced): `1.5`
- Chapter 8 (exam sprint): `2.0`

**Example:** A `sequence_builder` (weight 7) in Chapter 5 → `7 * 10 * 1.2 = 84 XP`

---

## 8. Completion Triggers

The renderer listens for a completion event. Each block type has a required trigger:

| Completion Value | Fires When |
|---|---|
| `"read"` | Learner scrolls to end of content OR dwell time ≥ 3s |
| `"played"` | Lottie animation completes at least once |
| `"answered"` | Learner submits any answer (correct or not) and sees feedback |
| `"all_flipped"` | All step_by_step_reveal cards have been flipped to back |
| `"all_sorted_correctly"` | All sorting_game items in correct buckets |
| `"all_placed_correctly"` | All drag_and_drop labels placed correctly |
| `"correct_order_submitted"` | Sequence builder submitted with correct order |
| `"reached_terminal"` | Scenario branching reaches a terminal node |
| `"round_complete"` | speed_round or sign_recognition_flash completes all questions |
| `"all_matched"` | memory_match: all pairs found |
| `"all_challenges_passed"` | roundabout_simulator / model_town_explorer: all challenges done |
| `"challenges_complete"` | parking_sim: required challenges attempted |
| `"all_prompts_correct"` | gear_shift_trainer: all prompts answered correctly |
| `"all_types_attempted"` | skid_recovery_sim: all skid types interacted with |
| `"clip_ended"` | hazard_perception_clip: clip finishes |
| `"interacted"` | bac_simulator / stopping_distance_lab: minimum interaction met |

> **Key rule:** Completion ≠ correct answer. For most interactive blocks, the learner must answer, see feedback, and the block completes — regardless of whether their answer was right. The exception is `all_challenges_passed` and `all_sorted_correctly`, which require correct answers because they are process simulations, not tests.

---

## 9. Progress Model (No DB)

Since there is no database, all progress is tracked in client-side state. Structure:

### State Shape (localStorage key: `ntsa_progress`)

```json
{
  "courseId": "ntsa-drive-kenya",
  "lastUpdated": "2025-01-01T12:00:00Z",
  "streakDays": 3,
  "lastActivityDate": "2025-01-01",
  "totalXP": 340,
  "lives": 3,
  "livesRefilledAt": "2025-01-01T00:00:00Z",
  "chapters": {
    "ch01": {
      "status": "in_progress",
      "xpEarned": 340,
      "badgeEarned": false,
      "lessons": {
        "ch01-l01": {
          "status": "complete",
          "xpEarned": 100,
          "completedAt": "2025-01-01T11:00:00Z",
          "blocks": {
            "ch01-l01-b001": { "status": "complete", "xpEarned": 10, "attempts": 1 },
            "ch01-l01-b002": { "status": "complete", "xpEarned": 30, "attempts": 2 },
            "ch01-l01-b003": { "status": "complete", "xpEarned": 10, "attempts": 1 }
          }
        },
        "ch01-l02": {
          "status": "in_progress",
          "xpEarned": 45,
          "currentBlockId": "ch01-l02-b004",
          "blocks": {
            "ch01-l02-b001": { "status": "complete", "xpEarned": 10, "attempts": 1 },
            "ch01-l02-b002": { "status": "complete", "xpEarned": 20, "attempts": 1 },
            "ch01-l02-b003": { "status": "complete", "xpEarned": 15, "attempts": 1 },
            "ch01-l02-b004": { "status": "unlocked", "xpEarned": 0, "attempts": 0 }
          }
        }
      }
    }
  },
  "weakAreas": ["ch01-l04", "ch02-l03"],
  "reviewSet": ["sign_014", "sign_022", "sign_031"],
  "missedBlocks": ["ch01-l02-b003"]
}
```

### Unlock Rules

```
Block N+1 unlocks when Block N reaches "complete" status.
Lesson N+1 unlocks when all blocks in Lesson N are "complete".
Chapter N+1 unlocks when all lessons in Chapter N are "complete".
```

### Life Loss Rules

A life is lost when:
- A learner answers incorrectly on a block flagged `"costsLifeOnFail": true`
- This flag should be set on blocks in Lessons 8.x (exam sprint) only
- Lives refill at midnight (UTC+3 Nairobi time) — max 3 lives

---

## 10. MDX Component Reference

These are the JSX components available inside `rich_text` block bodies:

```mdx
{/* Inline callout box */}
<Callout type="tip" | "warning" | "rule" | "analogy">
  Text inside the callout.
</Callout>

{/* Media placement hint — renderer inserts the actual asset */}
<MediaHint
  type="diagram" | "lottie" | "photo"
  id="optional-asset-id"
  alt="Full alt text for the media"
  caption="Optional caption"
  placement="inline" | "full-width"
/>

{/* Key term highlight with definition tooltip */}
<Term id="traffic-act">Traffic Act</Term>

{/* Bold rule statement */}
<Rule>
  Horn use is only legal while the vehicle is moving and only to warn.
</Rule>

{/* Memory hook / mnemonic */}
<Mnemonic>
  White = same direction. Yellow = opposite directions.
  Continuous = no crossing. Broken = conditional permission.
</Mnemonic>
```

---

## 11. AI Generation Instructions

When using this spec to generate course content, follow these rules:

### File generation order
1. `course.json` — top level
2. `chapter.json` — per chapter
3. `lesson.json` — per lesson  
4. Block MDX files — per block, in order

### Per-block generation checklist
- [ ] Assign a globally unique `id` using the `ch{NN}-l{NN}-b{NNN}` pattern
- [ ] Set `type` from the defined type list only
- [ ] Set `weight` from the weight table (§7) — do not invent values
- [ ] Calculate `xp` using the formula in §7
- [ ] Set `completion` to the correct trigger value for the type (§8)
- [ ] For interactive blocks: populate all required `data` fields per the schema (§6)
- [ ] For `rich_text` blocks: write the MDX body — conversational tone, no passive voice, concrete examples
- [ ] Ensure every interactive block is followed by (or contains inline) corrective feedback
- [ ] Ensure every `step_by_step_reveal` includes a `synthesis` field

### Tone rules (for rich_text bodies)
- Conversational and direct — address the learner as "you"
- No bullet points in prose — use flowing sentences
- Short paragraphs (2–4 sentences max)
- Use analogies before definitions
- Use `<Rule>` for the one thing the learner must remember from this block
- Use `<Callout type="tip">` for exam tips
- Use `<MediaHint>` to specify diagrams — never describe images in prose

### Lesson structure rules
- First block: always `rich_text` — set the context with a hook (question, story, or surprising fact)
- Last block: always `rich_text` — close the loop, bridge to next lesson
- No two consecutive blocks of the same interactive type
- Every interactive block must be preceded or followed by a `rich_text` that explains the reasoning
- Minimum 5 blocks per lesson; maximum 10

### Weight distribution per lesson (target)
- `rich_text` blocks: weight 1–2 each
- 1–2 blocks at weight 3–5 (quick checks)
- 1–2 blocks at weight 6–8 (deeper interactions)
- 0–1 block at weight 9–10 (simulation/game)
- Total lesson weight: 12–25 (renders as ~3–5 minutes)

---

## 12. Full Block Manifest (All 48 Lessons)

This section lists every lesson and its expected block sequence. Use it as the generation backlog — generate blocks in this order.

### Chapter 1: Road Foundations

**L01 — Why Rules Rule the Road** (7 blocks, total weight ≈ 19)
```
b001 rich_text       weight:2  "Two documents govern Kenya's roads..."
b002 step_by_step_reveal weight:6  "Two Documents, One Safe Road" (4 cards)
b003 rich_text       weight:2  Synthesis: legal responsibility
b004 true_or_false   weight:3  "Highway Code applies only to drivers?" (False)
b005 multiple_choice_single weight:4  Primary purpose of Highway Code
b006 fill_in_the_blank weight:4  "Kenya's regulations come from ___ conventions"
b007 rich_text       weight:1  Bridge to next lesson
```

**L02 — Signals, Signs, and When to Hoot** (8 blocks, total weight ≈ 26)
```
b001 rich_text            weight:2  Horn — one legal purpose
b002 multiple_choice_multiple weight:5  Legal vs illegal horn uses
b003 lottie_block         weight:3  lottie_horn_correct
b004 rich_text            weight:2  Right-of-way introduction
b005 sorting_game         weight:7  Give way vs normal rules
b006 rich_text            weight:2  Three sign families
b007 sign_recognition_flash weight:8  Mixed categories, learn mode
b008 true_or_false        weight:3  "Circular + red border = information?" (False)
```

**L03 — Road Network: Lines, Lanes, Logic** (7 blocks, total weight ≈ 22)
```
b001 rich_text            weight:2  Lines as instructions
b002 step_by_step_reveal  weight:6  "Reading Road Lines" (6 cards)
b003 rich_text            weight:2  Memory hook: white/yellow, continuous/broken
b004 drag_and_drop_label  weight:7  Road cross-section labelling
b005 true_or_false        weight:3  "Yellow broken = always overtake?" (False)
b006 fill_in_the_blank    weight:4  Dual carriageway uses ___ lines
b007 rich_text            weight:1  Bridge to roundabout lesson
```

**L04 — Roundabout Rules: Lane by Lane** (8 blocks, total weight ≈ 30)
```
b001 rich_text            weight:2  Clock analogy + 5 laws
b002 true_or_false        weight:3  "Lane 1 can U-turn?" (False)
b003 step_by_step_reveal  weight:6  "What Can Each Lane Do?" (5 cards)
b004 rich_text            weight:2  Miss your exit — go around
b005 roundabout_simulator weight:10 4 guided challenges
b006 multiple_choice_single weight:4  3-lane system (2,1,5)
b007 rich_text            weight:1  Consolidation
b008 lottie_block         weight:3  lottie_roundabout_flow
```

**L05 — Parking: Rules of the Zone** (7 blocks, total weight ≈ 25)
```
b001 rich_text            weight:2  Two parking types intro
b002 step_by_step_reveal  weight:6  "Angle vs Flush — The Full Rules" (8 cards)
b003 rich_text            weight:2  Memory hook
b004 parking_sim          weight:9  Angle + flush challenges
b005 multiple_choice_single weight:4  Lorry driver — which zone?
b006 true_or_false        weight:3  "Quick stop on yellow kerb?" (False)
b007 rich_text            weight:1  Bridge to model town
```

**L06 — Model Town: The Exam Board** (6 blocks, total weight ≈ 27)
```
b001 rich_text            weight:2  Model town overview + 3 routing rules
b002 model_town_explorer  weight:10 Explore + 3 route challenges
b003 sequence_builder     weight:7  Stop sign procedure (5 steps)
b004 rich_text            weight:2  Route selection tips
b005 speed_round          weight:10 Ch01 review (10q, 30s)
b006 rich_text            weight:2  Ch01 close + bridge to Ch02
```

---

### Chapter 2: The Human Factor

**L01 — Eyes on the Road: Observation** (6 blocks, weight ≈ 22)
```
b001 rich_text            weight:2  Active vs passive observation
b002 multiple_choice_multiple weight:5  Correct observation habits
b003 hazard_perception_clip weight:9  Parked car + pedestrian scenario
b004 lottie_block         weight:3  lottie_blind_spot
b005 multiple_choice_single weight:4  Convex glass — effect on distance?
b006 rich_text            weight:2  Shoulder check: when and why
```

**L02 — Fatigue: The Invisible Killer** (6 blocks, weight ≈ 22)
```
b001 rich_text            weight:2  55-metre microsleep fact
b002 multiple_choice_multiple weight:5  Causes of fatigue
b003 scenario_branching   weight:8  Push through vs pull over
b004 step_by_step_reveal  weight:6  Anti-fatigue toolkit (5 cards)
b005 fill_in_the_blank    weight:4  Thinking distance definition
b006 rich_text            weight:2  Fatigue vs alcohol comparison
```

**L03 — Alcohol and Driving** (6 blocks, weight ≈ 23)
```
b001 rich_text            weight:2  CNS depressant mechanism
b002 bac_simulator        weight:10 Interactive BAC + drive demo
b003 step_by_step_reveal  weight:6  "Five Ways Alcohol Degrades Driving"
b004 rich_text            weight:2  Feedback synthesis
b005 true_or_false        weight:3  "Refusing ALCOBLOW is OK?" (False)
b006 rich_text            weight:2  Practical alternatives
```

**L04 — Distractions** (5 blocks, weight ≈ 19)
```
b001 rich_text            weight:2  Phone = 4x crash risk
b002 sorting_game         weight:7  Legal vs prohibited activities
b003 fill_in_the_blank    weight:4  CO is colourless and ___
b004 multiple_choice_single weight:4  GPS — set when?
b005 rich_text            weight:2  Distraction definition rule
```

**L05 — Safety Belts, Children, and Passenger Limits** (6 blocks, weight ≈ 20)
```
b001 rich_text            weight:2  4,000 Newton projectile fact
b002 drag_and_drop_label  weight:7  Family car — label each occupant status
b003 true_or_false        weight:3  Booster seat — why needed? (True)
b004 multiple_choice_single weight:4  Category B max passengers (7)
b005 rich_text            weight:2  Belt before engine
b006 lottie_block         weight:3  lottie_seatbelt
```

**L06 — Safety Equipment** (6 blocks, weight ≈ 22)
```
b001 rich_text            weight:2  The emergency kit intro
b002 inspection_checklist weight:9  Boot inspection, 2 planted faults
b003 fill_in_the_blank    weight:4  Triangle placement distance (60m)
b004 step_by_step_reveal  weight:6  First aid kit contents (8 cards)
b005 true_or_false        weight:3  "Check kit once a year?" (False — each long journey)
b006 rich_text            weight:1  Bridge
```

**L07 — Road Rage and Road Courtesy** (5 blocks, weight ≈ 18)
```
b001 rich_text            weight:2  Road rage intro
b002 scenario_branching   weight:8  Flash and hoot vs slow down
b003 true_or_false        weight:3  "Tailgating justified if provoked?" (False)
b004 rich_text            weight:3  Three anti-rage reminders
b005 rich_text            weight:2  Ch02 close
```

---

### Chapters 3–8: Block Manifests (summary format)

For AI generation: each lesson below lists blocks as `type weight "brief_description"`. Generate full MDX using §6 schemas and §11 rules.

**Chapter 3: Know Your Vehicle**

L01 — Dashboard to Driveshaft
```
rich_text 2 "cockpit overview"
drag_and_drop_label 7 "dashboard + pedals"
step_by_step_reveal 6 "Three Pedals" (4 cards)
gear_shift_trainer 9 "5 speed prompts"
multiple_choice_single 4 "hand position 10-to-2"
rich_text 1 bridge
```

L02 — Exterior Pre-Drive Inspection
```
rich_text 2 "why inspect every journey"
inspection_checklist 9 "exterior: tyre + indicator faults"
step_by_step_reveal 6 "5-Minute Walkaround" (5 cards)
true_or_false 3 "cracked windscreen ok to drive?" (False)
fill_in_the_blank 4 "min tread depth = ___ mm → 1.6"
rich_text 1 bridge
```

L03 — Interior Inspection & Starting
```
rich_text 2 "interior check intro"
sequence_builder 7 "seat → mirrors → belt → start (7 steps)"
drag_and_drop_label 7 "interior components"
step_by_step_reveal 6 "Starting a Manual Vehicle"
rich_text 2 "POWDERY mnemonic"
```

L04 — Vehicle Systems Deep Dive
```
rich_text 2 "ABS + SRS intro"
lottie_block 3 "lottie ABS animation"
step_by_step_reveal 6 "Five Major Vehicle Systems"
true_or_false 3 "pump ABS brakes?" (False)
sorting_game 7 "warning lights: urgent / monitor / safe"
rich_text 1 bridge
```

L05 — Preventive Maintenance
```
rich_text 2 "legal obligation to maintain"
sorting_game 7 "symptom → cause → action"
inspection_checklist 9 "engine bay: oil coolant battery belts"
fill_in_the_blank 4 "PM = ___ Maintenance → Preventive"
multiple_choice_multiple 5 "items needing professional service"
rich_text 1 bridge
```

**Chapter 4: Reading the Road**

L01 — Mirror Mastery
```
rich_text 2 "mirrors as instruments"
lottie_block 3 "lottie_mirror_check"
drag_and_drop_label 7 "nearside offside interior labels"
multiple_choice_single 4 "convex glass distance effect"
step_by_step_reveal 6 "When to Check Which Mirror" (4 cards)
true_or_false 3 "adjust mirrors before starting?" (True)
rich_text 1 bridge
```

L02 — The MSM Technique
```
rich_text 2 "MSM intro and importance"
sequence_builder 7 "full MSM right turn (7 steps)"
step_by_step_reveal 6 "When Each MSM Step Happens" (4 cards)
hazard_perception_clip 9 "turning left: car from behind + cyclist"
multiple_choice_multiple 5 "MSM triggers"
rich_text 2 synthesis
```

L03 — Road Signals and Communication
```
lottie_block 3 "lottie_traffic_light full sequence"
sorting_game 7 "traffic light phase → driver action"
drag_and_drop_label 7 "police officer hand signals"
sign_recognition_flash 8 "hand signals learn mode"
multiple_choice_single 4 "signal blackout procedure"
rich_text 2 synthesis
```

L04 — Starting, Stopping, Gear Mastery
```
step_by_step_reveal 6 "Starting Manual Vehicle" (7 cards)
gear_shift_trainer 9 "sequential shift 1st–5th"
sequence_builder 7 "stopping procedure"
fill_in_the_blank 4 "gearbox must be in ___ before starting → neutral"
true_or_false 3 "freewheeling saves fuel on modern engines?" (False)
rich_text 1 bridge
```

L05 — Parking Manoeuvres
```
rich_text 2 "kerb parking intro"
step_by_step_reveal 6 "Parking at the Kerb" (6 cards)
parking_sim 9 "flush mode"
scenario_branching 8 "is this spot legal? three scenarios"
multiple_choice_single 4 "legal distance from junction: 15m"
rich_text 1 bridge
```

L06 — Turning: Bends, J-Turns, U-Turns
```
lottie_block 3 "U-turn animation"
rich_text 2 "U-turn rules"
lottie_block 3 "J-turn / three-point"
step_by_step_reveal 6 "Driving on Bends" (4 cards)
true_or_false 3 "safe to brake sharply mid-bend?" (False)
multiple_choice_single 4 "downhill bend: engage lower gear BEFORE bend"
rich_text 1 close
```

L07 — Chapter 4 Mastery Check
```
rich_text 2 "chapter 4 review intro"
speed_round 10 "Ch04 all content (10q, 30s)"
rich_text 2 "MSM rhythm recap + bridge to Ch05"
```

**Chapter 5: Speed, Space & Survival**

L01 — Physics of Stopping
```
rich_text 2 "kinetic energy analogy — 2x speed = 4x distance"
stopping_distance_lab 10 "interactive slider"
fill_in_the_blank 5 "80km/h = ___m = ___ car lengths → 53 / 13"
multiple_choice_multiple 5 "factors increasing braking distance"
rich_text 3 "4-Second Rule with landmark counting"
```

L02 — The Danger of Freewheeling
```
rich_text 2 "freewheeling defined"
step_by_step_reveal 6 "Four Risks of Freewheeling"
true_or_false 3 "progressive braking safer than freewheeling?" (True)
multiple_choice_single 4 "when most tempted: downhill — why it's worst"
rich_text 2 synthesis
```

L03 — Space Management
```
lottie_block 3 "lottie_space_envelope"
step_by_step_reveal 6 "Three Road Condition Types: open/closed/changing"
scenario_branching 8 "open road → fog → 3 decisions"
fill_in_the_blank 4 "first action when space reduces → reduce speed"
rich_text 2 synthesis
```

L04 — Emergency Manoeuvres
```
rich_text 2 "intro: what to do when things fail"
step_by_step_reveal 6 "Brake Failure" (5 cards)
step_by_step_reveal 6 "Tyre Blowout" (5 cards)
step_by_step_reveal 6 "Wheel Off Pavement" (4 cards)
scenario_branching 8 "headlights fail at night"
sequence_builder 7 "correct blowout response order"
rich_text 1 bridge
```

L05 — Skid Control and Recovery
```
lottie_block 3 "lottie_skid_types — three panels"
step_by_step_reveal 6 "Causes of Each Skid Type" (3 cards)
skid_recovery_sim 9 "all 3 types: front/rear/aquaplaning"
sequence_builder 7 "general skid recovery order"
rich_text 3 "aquaplaning: ease off both — no sudden inputs"
```

L06 — Defensive Driving
```
rich_text 2 "defensive driving defined"
multiple_choice_multiple 5 "defensive driving principles"
scenario_branching 8 "long-distance trip decision tree"
speed_round 10 "Ch05 review (10q, 30s)"
rich_text 2 "Ch05 close"
```

**Chapter 6: Tough Conditions**

L01 — Night Driving
```
rich_text 2 "never outrun headlights"
lottie_block 3 "lottie_night_beams — high vs low"
multiple_choice_single 4 "following: switch to low beam at 60m"
scenario_branching 8 "hilltop at night — beam decision"
rich_text 3 "night driving pre-journey checklist"
```

L02 — Fog, Rain, and Reduced Visibility
```
step_by_step_reveal 6 "Fog Rules" (5 cards)
lottie_block 3 "lottie_aquaplaning — tyre contact loss"
multiple_choice_multiple 5 "correct rain-driving behaviours"
true_or_false 3 "first 10 minutes of rain most dangerous?" (True)
rich_text 3 "road surface chemistry — why first rain is worst"
```

L03 — Mud, Dust, Difficult Terrain
```
rich_text 2 "rural road hazards intro"
step_by_step_reveal 6 "Getting Unstuck from Mud" (5 cards)
scenario_branching 8 "dust cloud ahead — 3 options"
true_or_false 3 "rocking uses maximum power?" (False)
rich_text 2 synthesis
```

L04 — ABS Braking and Threshold Braking
```
lottie_block 3 "ABS sensor animation"
rich_text 3 "plant and steer explained"
step_by_step_reveal 6 "Threshold Braking for Non-ABS" (4 cards)
multiple_choice_single 4 "pumping ABS brakes: what happens?"
rich_text 2 close
```

L05 — Preventive Maintenance in Adverse Conditions
```
rich_text 2 "legal obligation to maintain"
sorting_game 7 "symptom → cause → action (weather-related)"
inspection_checklist 9 "engine bay"
fill_in_the_blank 4 "responsibility for roadworthy condition → driver/owner"
rich_text 2 "Ch06 close"
```

**Chapter 7: Cargo, Hazards & Emergencies**

L01 — Conditions of Carriage
```
rich_text 2 "PSV and commercial obligations"
multiple_choice_multiple 5 "PSV must-do list"
true_or_false 3 "max driving hours = 8 in 24?" (True)
fill_in_the_blank 4 "Category B max passengers → 7"
rich_text 2 synthesis
```

L02 — Hazardous Materials
```
rich_text 2 "hazmat defined"
sorting_game 7 "classify into 9 hazmat categories"
step_by_step_reveal 6 "9 Classes of Hazardous Material" (9 cards)
multiple_choice_single 4 "Kenya hazmat licensing bodies: NTSA + KBS + NEMA"
true_or_false 3 "standard licence permits all hazmat?" (False)
rich_text 1 bridge
```

L03 — First Response at a Crash Scene
```
rich_text 2 "priorities: safety → warn → call → don't move injured"
sequence_builder 7 "first response steps (7 in order)"
step_by_step_reveal 6 "Dr ABC Protocol" (5 cards: D/R/A/B/C)
scenario_branching 8 "move vs stabilise trapped passenger"
true_or_false 3 "give casualty water if thirsty?" (False)
rich_text 2 synthesis
```

L04 — First Aid: Bleeding and Injury
```
rich_text 2 "direct pressure principle"
step_by_step_reveal 6 "Treating Heavy Bleeding" (5 cards)
sequence_builder 7 "recovery position (6 steps)"
lottie_block 3 "lottie recovery position animation"
rich_text 3 "why recovery position prevents choking"
```

L05 — Shock and Casualty Care
```
rich_text 3 "shock defined: inadequate perfusion"
step_by_step_reveal 6 "Treating Shock" (6 cards)
multiple_choice_multiple 5 "signs of shock to monitor"
true_or_false 3 "give paracetamol to shocked casualty?" (False)
rich_text 2 synthesis
```

L06 — Reporting and Documentation
```
rich_text 2 "legal obligations post-accident"
sequence_builder 7 "post-accident reporting (7 steps)"
fill_in_the_blank 4 "Kenya emergency number → 999"
multiple_choice_single 4 "first info to give emergency services → location"
rich_text 2 "Ch07 close"
```

**Chapter 8: Exam Sprint**

L01 — Regulatory Signs Masterclass
```
rich_text 3 "circles = orders: prohibition vs mandatory"
sign_recognition_flash 8 "all regulatory signs, learn mode"
memory_match 9 "10 pairs: regulatory signs"
sorting_game 7 "'must do' vs 'must not do' regulatory signs"
rich_text 2 "exam tip: spot the border colour"
```

L02 — Warning Signs Masterclass
```
rich_text 3 "triangles = warnings: prepare, don't stop"
sign_recognition_flash 8 "all warning signs, exam mode"
memory_match 9 "warning signs"
scenario_branching 8 "sharp bend ahead — what changes in your driving?"
rich_text 2 synthesis
```

L03 — Information and Guidance Signs
```
rich_text 3 "rectangles = information: guide not command"
sign_recognition_flash 8 "information + guidance, learn mode"
drag_and_drop_label 7 "guidance signs onto junction diagram"
multiple_choice_single 4 "signal blackout: treat as stop sign"
rich_text 2 synthesis
```

L04 — Customer Care and Work Planning
```
rich_text 2 "professional driver obligations"
multiple_choice_single 4 "max commercial driver hours → 8 in 24"
sorting_game 7 "professional vs unprofessional behaviours"
step_by_step_reveal 6 "Trip Planning Essentials" (6 cards)
fill_in_the_blank 4 "GPS should be set ___ journey → before"
rich_text 2 "exam day prep"
```

L05 — Simulated NTSA Theory Exam
```
rich_text 2 "exam conditions — 40 questions — aim 80%"
speed_round 10 "40q / 30min / all chapters / weighted"
rich_text 3 "debrief + weak area summary + review set update"
```

L06 — What Happens on Exam Day
```
rich_text 3 "theory exam format"
rich_text 3 "practical exam format"
scenario_branching 8 "graduation scenario — model town route"
rich_text 3 "final message — licence = starting line"
```

---

## 13. Sign Asset Registry

All `sign_recognition_flash` and `memory_match` blocks reference signs from this registry. Sign image files live at `/assets/signs/{id}.svg`.

| ID | Category | Meaning |
|---|---|---|
| sign_r001 | regulatory | No entry |
| sign_r002 | regulatory | Speed limit 50 km/h |
| sign_r003 | regulatory | Speed limit 80 km/h |
| sign_r004 | regulatory | No overtaking |
| sign_r005 | regulatory | Give way |
| sign_r006 | regulatory | Stop |
| sign_r007 | regulatory | No parking |
| sign_r008 | regulatory | No waiting |
| sign_r009 | regulatory | No U-turn |
| sign_r010 | regulatory | Keep left |
| sign_r011 | regulatory | One way (left) |
| sign_r012 | regulatory | One way (right) |
| sign_w001 | warning | Bend ahead (left) |
| sign_w002 | warning | Bend ahead (right) |
| sign_w003 | warning | Double bend |
| sign_w004 | warning | Steep hill downwards |
| sign_w005 | warning | Steep hill upwards |
| sign_w006 | warning | Slippery road |
| sign_w007 | warning | Pedestrian crossing ahead |
| sign_w008 | warning | School ahead |
| sign_w009 | warning | Junction ahead |
| sign_w010 | warning | Roundabout ahead |
| sign_w011 | warning | Traffic signals ahead |
| sign_w012 | warning | Road narrows |
| sign_i001 | information | Hospital |
| sign_i002 | information | Parking |
| sign_i003 | information | Petrol station |
| sign_i004 | information | First aid post |
| sign_i005 | information | Telephone |
| sign_i006 | information | No through road |
| sign_i007 | information | Dead end |
| sign_i008 | information | Motorway begins |

---

*End of COURSE_SPEC.md*
*Version 1.0 — authoritative for all AI-generated course content*
