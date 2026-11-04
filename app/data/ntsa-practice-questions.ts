/**
 * Practice questions on `/ntsa-test`. Written by us, and every answer traces to the
 * source named on it: NTSA's service pages, the Traffic Act (Cap 403) or the Ministry
 * of Roads road signs manual. They are not past NTSA papers, and the page says so.
 * Don't add a question here unless you can name where the answer comes from.
 */
export type PracticeQuestion = {
  prompt: string;
  /** The first choice isn't special: `answer` points at the right one. */
  choices: readonly string[];
  answer: number;
  why: string;
  source: string;
};

const NTSA_PDL = "NTSA, Provisional Driving Licence page";
const NTSA_TEST = "NTSA, Driver Test Booking page";
const NTSA_INTERIM = "NTSA, Interim Driving Licence page";
const MANUAL = "Ministry of Roads, road signs manual";

export const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  {
    prompt: "How old must you be to apply for a provisional licence for a car?",
    choices: ["16", "18", "21", "24"],
    answer: 1,
    why: "NTSA asks for learners aged 18 and above, and the Traffic Act bars anyone under 18 from a licence for anything other than a motorcycle.",
    source: `${NTSA_PDL}; Traffic Act, section 33`,
  },
  {
    prompt: "How long is a Provisional Driving Licence valid?",
    choices: ["1 month", "3 months", "6 months", "1 year"],
    answer: 1,
    why: "A PDL lasts 3 months, so plan your lessons and your test around that.",
    source: NTSA_PDL,
  },
  {
    prompt: "From how far away must your L plates be visible?",
    choices: [
      "5 metres, at the back only",
      "10 metres, front and rear",
      "At least 20 metres, front and rear",
      "50 metres, at the front only",
    ],
    answer: 2,
    why: "L plates must be visible from at least twenty metres, from both the front and the rear of the vehicle.",
    source: NTSA_PDL,
  },
  {
    prompt: "How long must your PDL have matured before you book the test?",
    choices: ["7 days", "14 days", "21 days", "30 days"],
    answer: 2,
    why: "You book the driving test after your PDL has matured for 21 days.",
    source: NTSA_TEST,
  },
  {
    prompt: "You've just passed your test. What do you apply for next?",
    choices: [
      "A new provisional licence",
      "An interim driving licence",
      "A retest",
      "A PSV badge",
    ],
    answer: 1,
    why: "After a pass you apply for an interim licence, which is valid for 6 months, and then your Smart DL.",
    source: `${NTSA_TEST}; ${NTSA_INTERIM}`,
  },
  {
    prompt:
      "What is the speed limit on a road inside a trading centre, township, municipality or city, unless a lower limit is set?",
    choices: ["30 km/h", "50 km/h", "70 km/h", "100 km/h"],
    answer: 1,
    why: "The Traffic Act sets 50 km/h on any road within those boundaries, with signs showing where the limit begins and ends.",
    source: "Traffic Act, section 42(3)",
  },
  {
    prompt:
      "You reach a STOP sign, but no stop line is painted on the road. Where must you stop?",
    choices: [
      "You don't have to stop without a line",
      "At or before the STOP sign",
      "In the middle of the junction",
      "Only if you can see other traffic",
    ],
    answer: 1,
    why: "Vehicles must stop at or before a STOP line, or at or before the STOP sign if there's no line.",
    source: MANUAL,
  },
  {
    prompt: "A warning sign is what shape?",
    choices: [
      "A blue circle",
      "A triangle with a red border",
      "A red octagon",
      "A green rectangle",
    ],
    answer: 1,
    why: "Warning signs are triangles with a red border. A blue circle gives an order, and a red octagon is STOP.",
    source: MANUAL,
  },
  {
    prompt:
      "What does a blue circle with a white arrow pointing right tell you?",
    choices: [
      "A road joins from the right",
      "Turning right is advised",
      "You must turn right",
      "No right turn",
    ],
    answer: 2,
    why: "A blue circle is an instruction, so traffic must turn right.",
    source: MANUAL,
  },
  {
    prompt: "What does the low-flying aircraft warning sign prepare you for?",
    choices: [
      "An airport car park",
      "Sudden aircraft noise that may startle you",
      "A ban on stopping",
      "A lower speed limit",
    ],
    answer: 1,
    why: "It's used where low-flying aircraft or sudden aircraft noise may startle road users.",
    source: MANUAL,
  },
  {
    prompt:
      "A person in charge of cattle on the road raises a hand signalling you to stop. What must you do?",
    choices: [
      "Hoot and carry on slowly",
      "Stop only if the animals are in your lane",
      "Stop at once and stay stopped for as long as is reasonably necessary",
      "Overtake the herd quickly",
    ],
    answer: 2,
    why: "The Traffic Act requires you to stop immediately and stay stationary for as long as is reasonably necessary.",
    source: "Traffic Act, section 52(1)",
  },
  {
    prompt:
      "A uniformed police officer signals you to do something a sign doesn't show. What must you do?",
    choices: [
      "Follow the sign only",
      "Obey the officer's direction",
      "Ignore it unless it's spoken",
      "Stop and ask for it in writing",
    ],
    answer: 1,
    why: "Drivers must obey directions from a uniformed police officer on duty, given by word or by signal.",
    source: "Traffic Act, section 52(1)",
  },
  {
    prompt:
      "May you leave a motor vehicle unattended on a road with the engine running?",
    choices: [
      "Yes, for up to five minutes",
      "Yes, if the hazard lights are on",
      "Yes, if someone is watching it",
      "No",
    ],
    answer: 3,
    why: "The Traffic Act forbids leaving a motor vehicle unattended on a road with the engine running.",
    source: "Traffic Act, section 66",
  },
];
