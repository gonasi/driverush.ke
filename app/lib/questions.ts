/**
 * NTSA Class B question dataset. Lean source-of-truth so guest practice can
 * load instantly with no network call. Real production deployment would
 * fetch from a question bank, but for the value-first, no-signup loop the
 * static dataset is the right tool.
 */

export type QuestionCategory = "general" | "sign" | "scenario";

export type Question = {
  id: string;
  category: QuestionCategory;
  /** The question stem. */
  prompt: string;
  /** Always 4 choices; one correct. */
  choices: [string, string, string, string];
  /** 0–3 index of the correct choice. */
  correctIndex: 0 | 1 | 2 | 3;
  /** Plain-language reasoning shown after the answer is revealed. */
  explanation: string;
  /** NTSA Highway Code citation, shown small under the explanation. */
  rule: string;
};

export const QUESTIONS: Question[] = [
  // ============== GENERAL ==============
  {
    id: "g-001",
    category: "general",
    prompt:
      "What is the maximum speed limit in built-up areas in Kenya unless signs say otherwise?",
    choices: ["30 km/h", "50 km/h", "60 km/h", "80 km/h"],
    correctIndex: 1,
    explanation:
      "The default urban speed limit is 50 km/h. Look for posted signs that may lower it further around schools, hospitals or residential zones.",
    rule: "NTSA Highway Code · Speed limits",
  },
  {
    id: "g-002",
    category: "general",
    prompt:
      "What is the safe following distance behind another vehicle in normal conditions?",
    choices: [
      "Half a car length",
      "Use the 2-second rule",
      "Keep one metre",
      "10 metres regardless of speed",
    ],
    correctIndex: 1,
    explanation:
      "The 2-second rule scales with your speed. Pick a fixed point ahead, count two seconds after the vehicle in front passes it. Double it in rain.",
    rule: "NTSA Highway Code · Defensive driving",
  },
  {
    id: "g-003",
    category: "general",
    prompt: "When are hazard lights correctly used on a Kenyan road?",
    choices: [
      "While driving in heavy rain",
      "When parked on the shoulder due to a breakdown",
      "When overtaking",
      "When parking briefly to drop someone off",
    ],
    correctIndex: 1,
    explanation:
      "Hazard lights warn other drivers that your vehicle is stationary and an obstruction. Don't use them while moving — they hide your indicator signals.",
    rule: "NTSA Highway Code · Vehicle lights",
  },
  {
    id: "g-004",
    category: "general",
    prompt:
      "What is the minimum age to apply for a Class B driving licence in Kenya?",
    choices: ["16 years", "17 years", "18 years", "21 years"],
    correctIndex: 2,
    explanation:
      "Class B (light vehicles up to 3,500 kg) requires the applicant to be at least 18. Class C (light goods) and PSV classes require older minimums.",
    rule: "NTSA Class B requirements",
  },
  // ============== SIGNS ==============
  {
    id: "s-001",
    category: "sign",
    prompt: "What does an octagonal red sign with the word STOP mean?",
    choices: [
      "Slow down and proceed if clear",
      "Stop only if other vehicles are present",
      "Come to a complete stop, then proceed when safe",
      "Yield to oncoming traffic",
    ],
    correctIndex: 2,
    explanation:
      "A STOP sign requires a complete stop behind the line every time, regardless of whether other vehicles are visible. Rolling stops are an instant fail on the practical.",
    rule: "NTSA Highway Code · Mandatory signs",
  },
  {
    id: "s-002",
    category: "sign",
    prompt: "A red triangular sign showing a person walking ahead means…",
    choices: [
      "Pedestrian-only zone",
      "Pedestrian crossing ahead, slow down",
      "No pedestrians beyond this point",
      "Stop and let pedestrians pass",
    ],
    correctIndex: 1,
    explanation:
      "Red triangles are warning signs. They alert you to a hazard ahead — in this case a pedestrian crossing. Slow down and prepare to stop if needed.",
    rule: "NTSA Highway Code · Warning signs",
  },
  {
    id: "s-003",
    category: "sign",
    prompt: "What does a red circle with a horizontal white bar mean?",
    choices: [
      "No overtaking",
      "No entry for all vehicles",
      "One-way street",
      "Road closed to heavy vehicles only",
    ],
    correctIndex: 1,
    explanation:
      "The 'no entry' sign forbids all vehicles from entering. Often used at one-way street exits, restricted zones, and reverse-flow lanes.",
    rule: "NTSA Highway Code · Prohibitive signs",
  },
  {
    id: "s-004",
    category: "sign",
    prompt: "A blue circular sign with a white arrow pointing right means…",
    choices: [
      "Suggested direction",
      "Right turn only",
      "No right turn",
      "Beware of curving road ahead",
    ],
    correctIndex: 1,
    explanation:
      "Blue circular signs are mandatory — they tell you what you must do. A right arrow in a blue circle means right turn is the only permitted direction.",
    rule: "NTSA Highway Code · Mandatory signs",
  },
  // ============== SCENARIOS ==============
  {
    id: "c-001",
    category: "scenario",
    prompt:
      "At an uncontrolled junction (no signs, no lights), who has right of way?",
    choices: [
      "The vehicle on your left",
      "The vehicle on your right",
      "The larger vehicle",
      "Whichever vehicle arrived first",
    ],
    correctIndex: 1,
    explanation:
      "At uncontrolled junctions, give way to the vehicle approaching from your right. Make eye contact if possible — assume nothing.",
    rule: "NTSA Highway Code · Junctions",
  },
  {
    id: "c-002",
    category: "scenario",
    prompt:
      "You're approaching a roundabout. Who already on the roundabout has priority?",
    choices: [
      "Vehicles on your left",
      "Vehicles on your right",
      "Vehicles already circulating, regardless of side",
      "The vehicle entering at the same time as you",
    ],
    correctIndex: 2,
    explanation:
      "Vehicles already on the roundabout have priority. Approach slowly, look right, enter only when there's a safe gap.",
    rule: "NTSA Highway Code · Roundabouts",
  },
  {
    id: "c-003",
    category: "scenario",
    prompt: "A pedestrian is waiting at a zebra crossing. What must you do?",
    choices: [
      "Sound your horn to warn them",
      "Stop and let them cross",
      "Slow down but keep moving if there's space",
      "Continue at speed; the pedestrian will wait",
    ],
    correctIndex: 1,
    explanation:
      "Pedestrians have right of way on zebra crossings. Stop, let them cross fully, then proceed. Don't wave them on — let them choose when to step out.",
    rule: "NTSA Highway Code · Pedestrian crossings",
  },
  {
    id: "c-004",
    category: "scenario",
    prompt:
      "An ambulance is approaching from behind with siren and flashing lights. What do you do?",
    choices: [
      "Speed up to clear the road",
      "Pull over to the left when safe and stop",
      "Stop immediately wherever you are",
      "Maintain your speed and let it pass on its own",
    ],
    correctIndex: 1,
    explanation:
      "Pull over to the left when it's safe to do so and stop. Never brake suddenly or stop in a junction. Resume only after the emergency vehicle has passed.",
    rule: "NTSA Highway Code · Emergency vehicles",
  },
];

const MODE_TO_CATEGORY: Record<string, QuestionCategory | null> = {
  quick: null,
  test: null,
  signs: "sign",
  challenge: "scenario",
};

const MODE_LIMITS: Record<string, number> = {
  quick: 5,
  test: 10,
  signs: 5,
  challenge: 5,
};

export type QuizMode = "quick" | "test" | "signs" | "challenge";

export const MODE_LABELS: Record<QuizMode, { title: string; copy: string }> = {
  quick: {
    title: "Quick practice",
    copy: "Five questions, no timer. Mistakes don't cost anything.",
  },
  test: {
    title: "Quick test",
    copy: "Ten questions, eight minutes. Same shape as the real paper.",
  },
  signs: {
    title: "Road signs",
    copy: "Five questions on Kenyan road signs and what they mean.",
  },
  challenge: {
    title: "Scenarios",
    copy: "Five right-of-way and hazard scenarios from real junctions.",
  },
};

/** Pick the questions for a given mode. Deterministic order. */
export function getQuestionsForMode(mode: QuizMode): Question[] {
  const filter = MODE_TO_CATEGORY[mode];
  const limit = MODE_LIMITS[mode] ?? 5;
  const pool = filter
    ? QUESTIONS.filter((q) => q.category === filter)
    : QUESTIONS;
  return pool.slice(0, limit);
}

/** A deterministic "today's question" picked from the dataset. Stable across SSR + hydration. */
export function getTodaysQuestion(date = new Date()): Question {
  // Day-of-year mod questions length. Same question for all visitors on the
  // same calendar day, regardless of timezone differences in display copy.
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86_400_000);
  return QUESTIONS[dayOfYear % QUESTIONS.length];
}
