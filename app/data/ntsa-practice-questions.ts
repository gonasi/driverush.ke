/**
 * NTSA theory practice questions. The short set (`PRACTICE_QUESTIONS`) is on
 * `/ntsa-test`; every question (`ALL_PRACTICE_QUESTIONS`) is on
 * `/ntsa-test/questions`, grouped by topic. Written by us, and every answer
 * traces to the source named on it: NTSA's service pages, the Traffic Act
 * (Cap 403), the Ministry of Roads road signs manual or the Kenya Learner
 * Driver Handbook (NTSA, 2016). They are not past NTSA papers, and the pages
 * say so. Don't add a question here unless you can name where the answer
 * comes from.
 */
export type PracticeTopicId =
  | "licence"
  | "rules"
  | "signs"
  | "safety"
  | "control"
  | "emergencies";

export const PRACTICE_TOPICS: readonly { id: PracticeTopicId; title: string }[] =
  [
    { id: "licence", title: "Your licence and the test" },
    { id: "rules", title: "Rules of the road" },
    { id: "signs", title: "Signs and signals" },
    { id: "safety", title: "Safety, alcohol and fatigue" },
    { id: "control", title: "Controlling the car" },
    { id: "emergencies", title: "Emergencies" },
  ];

export type PracticeQuestion = {
  topic: PracticeTopicId;
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
    topic: "licence",
    prompt: "How old must you be to apply for a provisional licence for a car?",
    choices: ["16", "18", "21", "24"],
    answer: 1,
    why: "NTSA asks for learners aged 18 and above, and the Traffic Act bars anyone under 18 from a licence for anything other than a motorcycle.",
    source: `${NTSA_PDL}; Traffic Act, section 33`,
  },
  {
    topic: "licence",
    prompt: "How long is a Provisional Driving Licence valid?",
    choices: ["1 month", "3 months", "6 months", "1 year"],
    answer: 1,
    why: "A PDL lasts 3 months, so plan your lessons and your test around that.",
    source: NTSA_PDL,
  },
  {
    topic: "licence",
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
    topic: "licence",
    prompt: "How long must your PDL have matured before you book the test?",
    choices: ["7 days", "14 days", "21 days", "30 days"],
    answer: 2,
    why: "You book the driving test after your PDL has matured for 21 days.",
    source: NTSA_TEST,
  },
  {
    topic: "licence",
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
    topic: "rules",
    prompt:
      "What is the speed limit on a road inside a trading centre, township, municipality or city, unless a lower limit is set?",
    choices: ["30 km/h", "50 km/h", "70 km/h", "100 km/h"],
    answer: 1,
    why: "The Traffic Act sets 50 km/h on any road within those boundaries, with signs showing where the limit begins and ends.",
    source: "Traffic Act, section 42(3)",
  },
  {
    topic: "signs",
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
    topic: "signs",
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
    topic: "signs",
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
    topic: "signs",
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
    topic: "rules",
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
    topic: "rules",
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
    topic: "rules",
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

const handbook = (unit: number, page: number) =>
  `Learner Driver Handbook, Unit ${unit}, p. ${page}`;

/** The rest of the bank, from the learner handbook. */
const MORE_QUESTIONS: PracticeQuestion[] = [
  // Rules of the road
  {
    topic: "rules",
    prompt: "Where are Kenya's rules of the road set out?",
    choices: [
      "Only in the driving school's notes",
      "In the Traffic Act and the Highway Code",
      "In the county by-laws only",
      "On the back of the licence",
    ],
    answer: 1,
    why: "The handbook names the Traffic Act, which sets out the law and its penalties, and the Highway Code, the rules and advice for every road user.",
    source: handbook(2, 7),
  },
  {
    topic: "rules",
    prompt: "When may you use your horn?",
    choices: [
      "When you are stopped in a jam",
      "While moving, to warn others that you are there",
      "To show a driver they made a mistake",
      "Whenever you like, if it is brief",
    ],
    answer: 1,
    why: "Use the horn only while moving, to warn other road users. Never while stationary on the road, and never aggressively.",
    source: handbook(2, 7),
  },
  {
    topic: "rules",
    prompt: "Where must you never use your horn?",
    choices: [
      "On a dual carriageway",
      "Near hospitals and schools, and where a No Hooting sign stands",
      "At a roundabout",
      "On a bridge",
    ],
    answer: 1,
    why: "Hooting is always prohibited at places such as hospitals and schools, and wherever the No Hooting sign is placed.",
    source: handbook(2, 7),
  },
  {
    topic: "rules",
    prompt: "Which of these must you give way to?",
    choices: [
      "A matatu that wants to pull out",
      "An ambulance sounding its siren or showing flashing lights",
      "A car behind you that is flashing its lights",
      "A cyclist waiting at the kerb",
    ],
    answer: 1,
    why: "Give way to police cars, emergency vehicles sounding a siren or with flashing lights, the presidential motorcade, and when a police officer or traffic marshal asks you to.",
    source: handbook(2, 8),
  },
  {
    topic: "rules",
    prompt: "May you drive in a part of the road set aside for pedestrians and cyclists?",
    choices: ["Yes, to pass slow traffic", "Yes, at night", "No", "Only on a weekend"],
    answer: 2,
    why: "You should not ride or drive in areas of the road designated for pedestrians and cyclists.",
    source: handbook(2, 8),
  },
  {
    topic: "rules",
    prompt: "How many passengers may a Category B light vehicle carry?",
    choices: ["Not more than five", "Not more than seven", "Not more than ten", "As many as have seats"],
    answer: 1,
    why: "The handbook's table allows not more than seven passengers in a Category B light vehicle.",
    source: handbook(4, 18),
  },
  {
    topic: "rules",
    prompt: "What is the heaviest light trailer a Category B vehicle may tow?",
    choices: ["500 kg", "750 kg", "1,000 kg", "3,500 kg"],
    answer: 1,
    why: "Category B allows one light trailer not exceeding 750 kg.",
    source: handbook(4, 18),
  },
  {
    topic: "rules",
    prompt: "Before you make a U-turn, what must you check?",
    choices: [
      "Only that the car behind has stopped",
      "That no sign forbids it, and that you can see well both ways",
      "That you are on a dual carriageway",
      "That your hazard lights are on",
    ],
    answer: 1,
    why: "Check that there is no sign saying you should not, and make the turn only where you can see well on both sides.",
    source: handbook(8, 36),
  },

  // Signs and signals
  {
    topic: "signs",
    prompt: "What are the two types of traffic signals?",
    choices: [
      "Hand signals and light signals",
      "Road signs and road markings",
      "Horns and headlights",
      "Arrows and lines",
    ],
    answer: 0,
    why: "The handbook names two types of traffic signal: hand signals and light signals.",
    source: handbook(2, 8),
  },
  {
    topic: "signs",
    prompt: "What does a rectangular road sign usually do?",
    choices: ["Warn you", "Give you an order", "Inform you", "Tell you to stop"],
    answer: 2,
    why: "Most signs fall into three shapes: a triangle warns, a circle gives an order, and a rectangle informs.",
    source: handbook(2, 8),
  },
  {
    topic: "signs",
    prompt: "What does a circular road sign usually do?",
    choices: ["Give an order", "Warn of a hazard", "Show a place name", "Mark a parking area"],
    answer: 0,
    why: "A circle gives an order. A triangle warns and a rectangle informs.",
    source: handbook(2, 8),
  },
  {
    topic: "signs",
    prompt: "What does a Stop sign look like?",
    choices: [
      "A red triangle pointing down",
      "A red octagon with white letters",
      "A blue circle",
      "A yellow diamond",
    ],
    answer: 1,
    why: "A Stop sign is red, with eight sides (an octagon) and white letters. A red triangle pointing down is Give way.",
    source: handbook(3, 12),
  },
  {
    topic: "signs",
    prompt: "At a Give way sign, what do you do?",
    choices: [
      "Always stop for 3 seconds",
      "Slow down, stop if you need to, and go only when it is safe",
      "Hoot and carry on",
      "Speed up to clear the junction",
    ],
    answer: 1,
    why: "Slow down or stop if necessary, and proceed only when it is safe.",
    source: handbook(3, 12),
  },
  {
    topic: "signs",
    prompt: "What does a broken white line between lanes allow?",
    choices: [
      "Nothing: you must stay in lane",
      "Changing lanes or overtaking, if the road is clear",
      "Parking beside it",
      "U-turns",
    ],
    answer: 1,
    why: "A broken white line means you may change lanes or overtake if the road is clear. A continuous one means you may not.",
    source: handbook(3, 10),
  },
  {
    topic: "signs",
    prompt: "What does a yellow kerb mean?",
    choices: [
      "Loading only",
      "No stopping, no waiting and no parking",
      "Parking for an hour",
      "Bus stop ahead",
    ],
    answer: 1,
    why: "The yellow kerb means no overlapping, no parking, no waiting and no stopping.",
    source: handbook(3, 10),
  },

  // Safety, alcohol and fatigue
  {
    topic: "safety",
    prompt: "Who must wear a seat belt?",
    choices: [
      "Only the driver",
      "The driver and the front passenger",
      "Everyone in the car, however short the trip",
      "Only on highways",
    ],
    answer: 2,
    why: "All passengers must wear safety belts at all times, no matter how short the distance.",
    source: handbook(4, 17),
  },
  {
    topic: "safety",
    prompt: "What does the handbook recommend for children under 12?",
    choices: [
      "The front seat",
      "A booster seat, so the seat belt fits properly",
      "No seat belt",
      "Sitting on an adult's lap",
    ],
    answer: 1,
    why: "Use a proper child restraint. A booster seat is recommended for children under 12, so the vehicle's seat belt fits properly.",
    source: handbook(4, 17),
  },
  {
    topic: "safety",
    prompt: "You start to feel tired while driving. What should you do?",
    choices: [
      "Open the window and keep going",
      "Turn the radio up",
      "Stop at a safe place and rest",
      "Drive faster to get there sooner",
    ],
    answer: 2,
    why: "If you feel tired, stop at a safe place and rest. On long journeys take regular breaks.",
    source: handbook(4, 15),
  },
  {
    topic: "safety",
    prompt: "Which of these can cause fatigue?",
    choices: [
      "Too little sleep, or driving when you would usually be asleep",
      "Eating a balanced meal",
      "Taking regular breaks",
      "Keeping fit",
    ],
    answer: 0,
    why: "Fatigue comes from too little sleep or rest, long spells at the same task, illness, and driving at times you would usually be resting, such as at night.",
    source: handbook(4, 15),
  },
  {
    topic: "safety",
    prompt: "What should you do with your phone while driving?",
    choices: [
      "Text only at traffic lights",
      "Hold it low so police can't see",
      "Switch it off or put it out of reach",
      "Use it on speaker in your hand",
    ],
    answer: 2,
    why: "Talking or texting takes your attention off the road. Switch the phone off, or put it out of reach for the journey.",
    source: handbook(4, 15),
  },
  {
    topic: "safety",
    prompt: "Which is an effect of alcohol on a driver?",
    choices: [
      "Sharper judgement of speed",
      "Slower reactions and false confidence",
      "Better balance",
      "Better concentration",
    ],
    answer: 1,
    why: "Alcohol slows your brain, makes it harder to judge speed and distance, gives you false confidence, and hurts concentration and balance.",
    source: handbook(4, 16),
  },
  {
    topic: "safety",
    prompt: "A police officer asks you to take a breathalyser test. May you refuse?",
    choices: [
      "Yes, if you have not been drinking",
      "Yes, if you are close to home",
      "No: refusing is an offence",
      "Only with a lawyer present",
    ],
    answer: 2,
    why: "It is an offence to refuse, or fail to comply with, a police officer's direction about an alcohol test.",
    source: handbook(4, 16),
  },
  {
    topic: "safety",
    prompt: "Why must you never run the engine in a closed garage?",
    choices: [
      "It wastes fuel",
      "Exhaust fumes carry carbon monoxide, an odourless gas that can kill",
      "It wears the battery",
      "It is noisy",
    ],
    answer: 1,
    why: "Carbon monoxide has no smell and can be lethal. Never run the engine in an enclosed space, and check the exhaust for leaks.",
    source: handbook(4, 16),
  },
  {
    topic: "safety",
    prompt: "May you wear sunglasses when driving at night?",
    choices: [
      "Yes, against headlight glare",
      "No: not at night or when visibility is poor",
      "Only on the highway",
      "Only if they are lightly tinted",
    ],
    answer: 1,
    why: "Do not wear sunglasses or tinted visors at night or in poor visibility.",
    source: handbook(4, 14),
  },
  {
    topic: "safety",
    prompt: "How should you load luggage in a car?",
    choices: [
      "High up, so you can reach it",
      "On the roof, without a rack",
      "As low and as close to the middle of the car as you can",
      "All at the back",
    ],
    answer: 2,
    why: "Load items as low as possible and as close to the centre of the vehicle as possible, and never overload it.",
    source: handbook(4, 18),
  },
  {
    topic: "safety",
    prompt: "What should you do when you leave your car?",
    choices: [
      "Leave the engine running if you'll be quick",
      "Switch off the ignition, take the keys and lock it",
      "Leave a window open for air",
      "Leave the keys for the parking attendant",
    ],
    answer: 1,
    why: "Switch off the ignition, remove the keys, and lock the windows and the boot.",
    source: handbook(4, 17),
  },

  // Controlling the car
  {
    topic: "control",
    prompt: "What does MSM stand for?",
    choices: [
      "Move, Stop, Move",
      "Mirror, Signal, Manoeuvre",
      "Mirror, Speed, Merge",
      "Motor, Steering, Mirrors",
    ],
    answer: 1,
    why: "Mirror, Signal, Manoeuvre: the routine before moving off, changing direction or lanes, overtaking, and changing speed.",
    source: handbook(9, 38),
  },
  {
    topic: "control",
    prompt: "In the MSM routine, which mirror do you check first?",
    choices: [
      "The door mirror on the side you are going",
      "The centre interior mirror",
      "Neither: you look over your shoulder",
      "The passenger's door mirror",
    ],
    answer: 1,
    why: "Look in the centre interior mirror first, then the door mirror on the side you are going.",
    source: handbook(9, 38),
  },
  {
    topic: "control",
    prompt: "When must you check your blind spot?",
    choices: [
      "Only when reversing",
      "When you change lanes, and when cyclists or motorcyclists are close",
      "Never, if your mirrors are set",
      "Only at night",
    ],
    answer: 1,
    why: "Check the blind spot before you change lanes, when overtaking on a dual carriageway, and when cyclists or motorcyclists are near.",
    source: handbook(9, 39),
  },
  {
    topic: "control",
    prompt: "You want to park just after a junction. When do you signal?",
    choices: [
      "Before the junction",
      "After the junction",
      "Never",
      "At the same time as you brake",
    ],
    answer: 1,
    why: "Do not signal before a junction when you are parking up, or drivers will think you are turning.",
    source: handbook(9, 39),
  },
  {
    topic: "control",
    prompt: "Where should your hands be on the steering wheel to avoid injury if the airbag goes off?",
    choices: ["12 and 6", "At 9 and 3", "Both at the top", "One hand at the bottom"],
    answer: 1,
    why: "To avoid injury from the airbag, hold the wheel at the 9 and 3 position.",
    source: handbook(8, 35),
  },
  {
    topic: "control",
    prompt: "Which gear should the car be in before you start the engine?",
    choices: ["First", "Reverse", "Neutral", "Second"],
    answer: 2,
    why: "Before starting the engine, the gear should be in neutral.",
    source: handbook(8, 34),
  },
  {
    topic: "control",
    prompt: "Which gear do you use to move off from a stop?",
    choices: ["First", "Second", "Third", "Reverse"],
    answer: 0,
    why: "First gear is for moving off from a stationary position, up to about 30 km/h.",
    source: handbook(8, 34),
  },
  {
    topic: "control",
    prompt: "In rain or fog, how far behind the car in front should you stay?",
    choices: ["One second", "Two seconds", "About four seconds", "One car length"],
    answer: 2,
    why: "The handbook's 4-second rule: when the car ahead passes a landmark, count to four. If you reach it first, drop back.",
    source: handbook(10, 43),
  },
  {
    topic: "control",
    prompt: "What is stopping distance?",
    choices: [
      "The braking distance only",
      "The thinking distance plus the braking distance",
      "The gap to the car in front",
      "The distance to the next junction",
    ],
    answer: 1,
    why: "Stopping distance is the thinking distance and the braking distance added together.",
    source: handbook(10, 44),
  },
  {
    topic: "control",
    prompt: "Which of these makes your braking distance longer?",
    choices: [
      "A dry road",
      "A wet road, more speed or worn tyres",
      "Driving slowly",
      "New brakes",
    ],
    answer: 1,
    why: "Braking distance grows on wet or poor roads, as speed goes up, and with worn tyres, poor brakes or an overloaded car.",
    source: handbook(10, 44),
  },
  {
    topic: "control",
    prompt: "What affects your thinking distance?",
    choices: [
      "Your speed, tiredness and distractions",
      "Only the weather",
      "The colour of the car",
      "Your tyre pressure",
    ],
    answer: 0,
    why: "Thinking distance is affected by speed, driver fatigue and distractions.",
    source: handbook(10, 44),
  },
  {
    topic: "control",
    prompt: "Does coasting in neutral (freewheeling) save fuel?",
    choices: [
      "Yes, a lot",
      "Yes, downhill only",
      "No, and it gives you less control",
      "Only in fifth gear",
    ],
    answer: 2,
    why: "Freewheeling burns about what an idling engine does, so it saves nothing. It also cuts your control and wears the brakes.",
    source: handbook(10, 45),
  },
  {
    topic: "control",
    prompt: "Which brakes does the handbrake work on?",
    choices: ["The front two", "The rear two", "All four", "Only the left side"],
    answer: 1,
    why: "The handbrake applies the two rear brakes.",
    source: handbook(10, 45),
  },
  {
    topic: "control",
    prompt: "What are the three kinds of road conditions the handbook describes?",
    choices: [
      "Open, closed and changing",
      "Wet, dry and dusty",
      "Urban, rural and highway",
      "Day, night and dusk",
    ],
    answer: 0,
    why: "Open conditions give a clear, wide view; closed conditions limit space and view; changing conditions bring changes in speed limit, surface, width, visibility or traffic.",
    source: handbook(11, 46),
  },

  // Emergencies
  {
    topic: "emergencies",
    prompt: "Your car breaks down on the road. Where do you put the reflector triangles?",
    choices: [
      "10 metres behind only",
      "60 metres ahead and 60 metres behind",
      "On the roof",
      "Right beside the car",
    ],
    answer: 1,
    why: "Every motor vehicle except a motorcycle should carry reflector triangles, placed 60 metres ahead and 60 metres behind a vehicle stopped on the road.",
    source: handbook(4, 19),
  },
  {
    topic: "emergencies",
    prompt: "Your brakes fail. What do you try first?",
    choices: [
      "Switch off the engine",
      "Pump the brake pedal, then use the handbrake gently but firmly",
      "Pull the handbrake hard at once",
      "Jump out",
    ],
    answer: 1,
    why: "Pumping the pedal may restore pressure. If not, apply the handbrake gently but firmly, holding the release button.",
    source: handbook(12, 48),
  },
  {
    topic: "emergencies",
    prompt: "A tyre bursts while you are driving. What do you do?",
    choices: [
      "Brake hard at once",
      "Grip the wheel firmly, don't slam the brakes, and slow down gradually",
      "Steer sharply to the side",
      "Speed up to keep control",
    ],
    answer: 1,
    why: "Keep a firm grip, don't slam on the brakes, let the car slow gradually, pull over once slow, and switch on your hazard lights.",
    source: handbook(12, 48),
  },
  {
    topic: "emergencies",
    prompt: "Your wheels run off the edge of the tarmac. What do you do?",
    choices: [
      "Brake hard and steer back at once",
      "Hold the wheel firmly, ease off the accelerator, and steer back once in control",
      "Speed up",
      "Let go of the wheel",
    ],
    answer: 1,
    why: "Hold the steering firmly, take your foot off the accelerator, avoid heavy braking, and steer back when the car is under control.",
    source: handbook(12, 48),
  },
  {
    topic: "emergencies",
    prompt: "Your headlights go out at night. What do you do?",
    choices: [
      "Carry on with hazard lights",
      "Check the switch; if they stay off, keep left and stop safely off the road",
      "Follow the car in front closely",
      "Drive on the shoulder",
    ],
    answer: 1,
    why: "Check the switch at once. If the lights stay off, keep left and stop safely off the road: driving at night without lights is dangerous and illegal.",
    source: handbook(12, 48),
  },
];

/** Every practice question: the short set first, then the rest. */
export const ALL_PRACTICE_QUESTIONS: readonly PracticeQuestion[] = [
  ...PRACTICE_QUESTIONS,
  ...MORE_QUESTIONS,
];
