/**
 * Kenyan road-sign reference, the content backbone of `/road-signs`.
 *
 * Grouped the way the NTSA Highway Code groups them (it follows the Traffic
 * Signs Rules, Legal Notice 310 of 1974): Class A regulatory signs (mandatory
 * instructions plus prohibitions), Class B warning signs, Class C traffic-light
 * signals and Class D carriageway and kerb markings. The blue and green
 * information and direction signs drivers meet alongside them get their own
 * group here too.
 *
 * This is reference copy, not legal text. The signs listed are the common ones
 * that turn up on Kenyan roads and in the NTSA test, not the full schedule.
 * Keep the wording plain and local; this file is also what the FAQ and the
 * structured data on the page are built from.
 */
import type { IconSvgElement } from "@hugeicons/react";
import {
  Alert02FreeIcons,
  CircleArrowRight02FreeIcons,
  UnavailableFreeIcons,
  RoadLocation01FreeIcons,
  TrafficLightFreeIcons,
  RoadFreeIcons,
} from "@hugeicons/core-free-icons";

/** Sign-frame shape, drives the clip-path on the category badge. */
export type SignShape = "triangle" | "circle" | "octagon" | "rectangle";

/** Brand colour the category badge fills with. */
export type SignTone = "rush" | "amber" | "blue" | "green" | "ink";

export type RoadSign = {
  /** English name as it appears in the Highway Code, e.g. "Sharp bend ahead". */
  name: string;
  /** Common Kiswahili or street name where drivers actually use one. */
  swahili?: string;
  /** One line on what the sign tells the driver to expect or do. */
  meaning: string;
};

export type SignCategory = {
  /** Anchor id and URL fragment, e.g. "warning". */
  slug: string;
  /** Highway Code class label, e.g. "Class B". */
  klass: string;
  /** Section title, e.g. "Warning signs". */
  title: string;
  /** One- or two-word category label, e.g. "Warning". Used on the legend cards. */
  short: string;
  /** Shape-and-colour key line, e.g. "Triangle, red border, black symbol". */
  shapeLabel: string;
  /** Tight shape-and-colour line for the legend card caption, e.g. "Red triangle". */
  shapeShort: string;
  shape: SignShape;
  tone: SignTone;
  icon: IconSvgElement;
  /** A sentence or two on what the whole class is for and how to read it. */
  summary: string;
  signs: RoadSign[];
};

export const SIGN_CATEGORIES: SignCategory[] = [
  {
    slug: "warning",
    klass: "Class B",
    title: "Warning signs",
    short: "Warning",
    shapeLabel: "Triangle, red border, black symbol on white",
    shapeShort: "Red triangle",
    shape: "triangle",
    tone: "amber",
    icon: Alert02FreeIcons,
    summary:
      "Warning signs, Class B in the Highway Code, give you advance notice of a hazard or a change in the road ahead: a bend, a junction, a school, animals, road works. They never tell you to do anything, they tell you to be ready. If it is a red-bordered triangle, slow down and look.",
    signs: [
      {
        name: "Sharp bend to the left or right",
        meaning:
          "A tight curve ahead. Ease off the throttle before you reach it, not in it.",
      },
      {
        name: "Double bend or series of bends",
        meaning:
          "Bends in succession. The symbol shows which way the first one goes.",
      },
      {
        name: "Steep hill, down or up",
        meaning:
          "A gradient ahead. Lower gear for the climb, control your speed on the drop.",
      },
      {
        name: "Road narrows",
        meaning:
          "The carriageway narrows on one or both sides. Expect traffic to merge.",
      },
      {
        name: "Roundabout ahead",
        meaning:
          "A roundabout is coming. Give way to traffic already on it, usually from the right.",
      },
      {
        name: "Crossroads, T-junction or side road",
        meaning:
          "A junction ahead where other vehicles can join or cross your path.",
      },
      {
        name: "Pedestrian crossing ahead",
        meaning:
          "A marked crossing is coming. Be ready to stop for people stepping out.",
      },
      {
        name: "Children or school ahead",
        swahili: "Watoto",
        meaning:
          "School, playground or children near the road. Slow right down.",
      },
      {
        name: "Cattle or animals crossing",
        swahili: "Ng'ombe",
        meaning:
          "Livestock may be on the road, often unaccompanied. Be ready to stop.",
      },
      {
        name: "Wild animals (game) crossing",
        meaning:
          "Common near parks and reserves. Animals cross without warning, day or night.",
      },
      {
        name: "Slippery road",
        meaning:
          "The surface can be slippery when wet. Gentle steering, gentle braking.",
      },
      {
        name: "Bump, dip or uneven road",
        meaning:
          "A hump, dip or rough patch ahead. Slow down before it, not on it.",
      },
      {
        name: "Falling or fallen rocks",
        meaning:
          "Loose rock from the cutting above. Watch the road surface as well as the slope.",
      },
      {
        name: "Road works ahead",
        meaning:
          "Works on or beside the carriageway. Expect closures, workers and a lower limit.",
      },
      {
        name: "Traffic signals ahead",
        meaning:
          "Traffic lights are coming. Be ready in case they are red when you arrive.",
      },
      {
        name: "Level (railway) crossing",
        meaning:
          "A railway crosses the road ahead, gated or not. Never queue across it.",
      },
      {
        name: "Two-way traffic",
        meaning:
          "You are rejoining a road that carries traffic both ways. Keep left, do not overtake blind.",
      },
      {
        name: "Speed humps or rumble strips ahead",
        swahili: "Matuta",
        meaning:
          "Calming bumps in the surface. Drop your speed before the first one.",
      },
    ],
  },
  {
    slug: "prohibitory",
    klass: "Class A",
    title: "Prohibition and restriction signs",
    short: "Prohibition",
    shapeLabel:
      "Red ring on a circle, except STOP (red octagon) and GIVE WAY (red triangle)",
    shapeShort: "Red-ring circle",
    shape: "circle",
    tone: "rush",
    icon: UnavailableFreeIcons,
    summary:
      "Prohibitory and restrictive signs are the half of Class A that tells you what you must not do, or sets a limit you must keep: no entry, no overtaking, no parking, a speed or weight limit. They are red-ringed circles, with two famous exceptions. STOP is a red octagon and GIVE WAY a red downward triangle, shaped so you can read them even when faded or seen from behind.",
    signs: [
      {
        name: "STOP",
        meaning:
          "Full stop at the line, every time. Then move off only when it is clear.",
      },
      {
        name: "GIVE WAY",
        meaning:
          "Do not enter the junction or roundabout until you will not make other traffic slow.",
      },
      {
        name: "No entry",
        meaning:
          "You may not drive past this point, usually the wrong end of a one-way street.",
      },
      {
        name: "No left turn, no right turn, no U-turn",
        meaning:
          "That manoeuvre is banned at this junction. Carry on or find another route.",
      },
      {
        name: "No overtaking",
        meaning:
          "Do not pull out to pass until the sign that ends it, or the road clearly allows it.",
      },
      {
        name: "Maximum speed limit",
        meaning:
          "The number is the most you may do here. It does not mean it is safe to do it.",
      },
      {
        name: "No motor vehicles",
        meaning: "Cars, matatus, lorries and motorbikes may not use this road.",
      },
      {
        name: "No goods vehicles or weight limit",
        meaning:
          "Lorries over the stated weight, or all goods vehicles, are banned. Take the diversion.",
      },
      {
        name: "Width, height or length limit",
        meaning:
          "Your vehicle must be under the stated size to pass. Bridges and tunnels especially.",
      },
      {
        name: "No stopping (clearway)",
        meaning:
          "You may not stop on the carriageway at all, even briefly, except in an emergency.",
      },
      {
        name: "No waiting or no parking",
        meaning:
          "You may not leave the vehicle here. No waiting also covers stopping to wait.",
      },
      {
        name: "No horn (silence zone)",
        meaning: "Do not sound the horn here. Common by hospitals and schools.",
      },
      {
        name: "No pedestrians",
        meaning:
          "Walking is not allowed on this stretch, typically a bypass or trunk road.",
      },
    ],
  },
  {
    slug: "mandatory",
    klass: "Class A",
    title: "Mandatory signs",
    short: "Mandatory",
    shapeLabel: "Blue circle, white symbol",
    shapeShort: "Blue circle",
    shape: "circle",
    tone: "blue",
    icon: CircleArrowRight02FreeIcons,
    summary:
      "Mandatory signs are the other half of Class A, the positive instruction. A blue circle means you must do what the symbol shows: keep left, turn here, go straight on, use this lane. Blue means do, the red ring meant do not. They turn up most at roundabouts, dual carriageways and one-way systems.",
    signs: [
      {
        name: "Keep left or keep right",
        meaning:
          "Pass the island, refuge or obstruction on the side the arrow points.",
      },
      {
        name: "Turn left or turn right ahead",
        meaning:
          "You must turn the way shown at the junction ahead. No straight on.",
      },
      {
        name: "Ahead only",
        meaning: "Straight on is the only legal move here. No turning off.",
      },
      {
        name: "Turn left or right at the sign",
        meaning:
          "Turn now, at this point, often where the road is closed straight ahead.",
      },
      {
        name: "Mini-roundabout or roundabout",
        meaning:
          "Circulate in the direction of the arrows. Give way as at any roundabout.",
      },
      {
        name: "Pass either side",
        meaning: "You may go left or right of the island ahead.",
      },
      {
        name: "Buses or matatus only",
        meaning:
          "This lane or road is reserved. Only the vehicle type shown may use it.",
      },
      {
        name: "Cycle route or cyclists only",
        meaning:
          "A lane or path set aside for bicycles. Other traffic keeps out.",
      },
      {
        name: "Pedestrians only or segregated path",
        meaning:
          "For people on foot, and cyclists where the path is split. Not for vehicles.",
      },
      {
        name: "Minimum speed",
        meaning:
          "Keep up to at least the number shown. Used in tunnels and on fast roads.",
      },
    ],
  },
  {
    slug: "information",
    klass: "Information and direction",
    title: "Information and direction signs",
    short: "Information",
    shapeLabel:
      "Rectangle, blue for facilities, green or white for routes and distances",
    shapeShort: "Blue & green rectangle",
    shape: "rectangle",
    tone: "green",
    icon: RoadLocation01FreeIcons,
    summary:
      "These are the rectangular signs that help you rather than command you: where you are, where a road goes, where the hospital, parking or matatu stage is, which way a one-way street runs. Blue panels point to facilities and local routes. Green and white-on-black panels carry place names, distances and major-road directions.",
    signs: [
      {
        name: "One-way street",
        meaning:
          "Traffic on this street runs one way only, in the direction of the arrow.",
      },
      {
        name: "Parking",
        meaning:
          "Parking is allowed here. Check any plate below for times, fees or who it is for.",
      },
      {
        name: "Pedestrian (zebra) crossing",
        meaning:
          "A marked crossing where people on foot have priority once they have stepped on.",
      },
      {
        name: "Bus stop or matatu stage",
        meaning:
          "The official place public-service vehicles pick up and set down. Keep it clear.",
      },
      {
        name: "Hospital",
        meaning:
          "A hospital with casualty facilities is signed off this route.",
      },
      {
        name: "Petrol station or services",
        meaning:
          "Fuel and roadside services ahead. Useful on long inter-town stretches.",
      },
      {
        name: "No through road or dead end",
        meaning:
          "This road does not lead anywhere onward. You will have to come back.",
      },
      {
        name: "Diversion",
        meaning:
          "Follow the marked alternative route. The normal road ahead is closed or restricted.",
      },
      {
        name: "Direction sign, place names and distances",
        meaning: "Confirms the route to a town or junction and how far it is.",
      },
      {
        name: "Toll station ahead",
        meaning:
          "A toll point is coming on this road. Have payment ready and slow down.",
      },
      {
        name: "Speed enforcement or camera zone",
        meaning:
          "Speed is being checked along here. Your limit has not changed, the watching has.",
      },
    ],
  },
  {
    slug: "signals",
    klass: "Class C",
    title: "Traffic-light signals",
    short: "Signals",
    shapeLabel: "Red, amber, green, top to bottom",
    shapeShort: "Red · amber · green",
    shape: "rectangle",
    tone: "ink",
    icon: TrafficLightFreeIcons,
    summary:
      "Traffic lights are their own class in the Traffic Act, Class C. The sequence in Kenya runs red, then red-and-amber, then green, then amber, then red. A green light is permission to go only if the way is clear, it never forces you across a blocked junction, and a green arrow lets you go only in that direction.",
    signs: [
      {
        name: "Red",
        meaning: "Stop at the line and wait. Do not cross or edge forward.",
      },
      {
        name: "Red and amber together",
        meaning:
          "Still stop. This is the warning that green is next, do not go yet.",
      },
      {
        name: "Green",
        meaning:
          "Go, but only if the road beyond the junction is clear and it is safe.",
      },
      {
        name: "Amber",
        meaning:
          "Stop at the line, unless you are so close that pulling up would be dangerous.",
      },
      {
        name: "Green arrow (filter)",
        meaning:
          "You may go in the direction of the arrow even if the main light is still red.",
      },
      {
        name: "Flashing amber (pedestrian crossing)",
        meaning:
          "Give way to anyone on the crossing, then proceed when it is clear.",
      },
      {
        name: "Lights out or not working",
        meaning:
          "Treat the junction as uncontrolled. Give way as the markings and good sense require.",
      },
    ],
  },
  {
    slug: "markings",
    klass: "Class D",
    title: "Carriageway and kerb markings",
    short: "Markings",
    shapeLabel:
      "Painted lines on the road and kerb, white for lanes, yellow for restrictions",
    shapeShort: "White & yellow lines",
    shape: "rectangle",
    tone: "ink",
    icon: RoadFreeIcons,
    summary:
      "Road markings are Class D, and they carry as much authority as a metal sign, sometimes more. White lines organise the lanes and tell you when you may cross. Yellow lines and kerb marks tell you where you may stop or wait. The shorter the gaps in a line, the harder it is warning you.",
    signs: [
      {
        name: "Broken white centre line",
        meaning:
          "Lane divider. You may cross it to overtake when the road ahead is clear.",
      },
      {
        name: "Continuous (solid) white line",
        meaning:
          "Do not cross or straddle it. Stay your side until it becomes broken again.",
      },
      {
        name: "Double white lines",
        meaning:
          "Cross only the one nearest you if it is broken, never if the one your side is solid.",
      },
      {
        name: "Hatched markings or chevrons",
        meaning:
          "Keep out of the painted area. It separates streams of traffic, chevrons especially.",
      },
      {
        name: "Yellow box junction",
        meaning:
          "Do not enter unless your exit is clear. Keep the box from locking up.",
      },
      {
        name: "Stop line",
        meaning:
          "The line you stop behind at a STOP sign or red light. Do not creep over it.",
      },
      {
        name: "Give-way line (double broken line)",
        meaning:
          "Stop or slow at this line and give way before joining the major road.",
      },
      {
        name: "Lane arrows",
        meaning:
          "Get into the lane whose arrow matches where you are going, in good time.",
      },
      {
        name: "Edge-of-carriageway line",
        meaning:
          "Marks the limit of the running surface. Beyond it is shoulder, not lane.",
      },
      {
        name: "Yellow kerb or edge lines",
        meaning:
          "Waiting and loading restrictions apply along the kerb. A plate gives the times.",
      },
      {
        name: "Bus or matatu lane marking",
        meaning:
          "The painted lane is reserved during the hours shown. Keep out of it then.",
      },
    ],
  },
];

export type SignFaq = {
  /** Question, phrased the way someone would type it into search. */
  q: string;
  /** Answer, kept plain so the visible accordion and FAQPage JSON-LD share it. */
  a: string;
};

export const SIGN_FAQ: SignFaq[] = [
  {
    q: "What are the four types of road signs in Kenya?",
    a: "The NTSA Highway Code, which follows the Traffic Signs Rules, groups them into four classes: Class A regulatory signs (mandatory instructions plus prohibitions and limits), Class B warning signs, Class C traffic-light signals, and Class D carriageway and kerb markings. Alongside these, drivers also meet blue and green information and direction signs.",
  },
  {
    q: "How many road signs are there in Kenya?",
    a: "Several hundred are listed in full in the Traffic Signs Rules, but in everyday driving and in the NTSA test you deal with roughly a hundred or so common ones across the four classes. Learning the shape-and-colour pattern matters more than counting them: a red triangle warns, a red ring or octagon prohibits, a blue circle commands, and a rectangle informs.",
  },
  {
    q: "What is the difference between a warning sign and a prohibition sign?",
    a: "Shape and colour tell you before you can even read the symbol. A warning sign is a red-bordered triangle. It tells you what to expect ahead, like a bend, a school or animals, and never orders you to do anything. A prohibition sign is a red-ringed circle, with STOP a red octagon and GIVE WAY a red triangle. It tells you what you must not do or sets a limit you must keep. A blue circle is the opposite of a prohibition: something you must do.",
  },
  {
    q: "What does the STOP sign look like in Kenya?",
    a: "A red octagon with STOP in white letters, the one road sign that is not a triangle, circle or rectangle. The shape is deliberate: you can recognise it even when it is faded, dirty or seen from behind. It means a full stop at the line every time, then move off only when the way is clear, never a roll-through.",
  },
  {
    q: "Are Kenyan road signs the same as the Highway Code signs?",
    a: "Yes. The road signs you see in Kenya are the ones set out in the Highway Code published by the NTSA, which is based on the Traffic Signs Rules. They follow the international shape-and-colour conventions, so the patterns you learn here are the same ones used across much of the world.",
  },
  {
    q: "Do road signs come up in the NTSA test?",
    a: "Yes. Identifying road signs and knowing what each one means is a core part of the NTSA theory and oral test for every licence class (A, B, C and D). It is also some of the easiest marks to bank, because the signs follow a pattern you can learn in an afternoon and lock in with a few minutes of recall a day.",
  },
  {
    q: "Where can I get a Kenya road signs PDF or chart?",
    a: "The complete set is in the Traffic Signs Rules on the Kenya Law site and in the Roads and Bridges design manual, and the NTSA Highway Code summarises them for drivers. This page lists the common ones grouped by class, and the trainers above drill them off a sign chart so you do not just read them once, you remember them.",
  },
  {
    q: "What is the fastest way to memorise road signs?",
    a: "Do not reread a list, recall it. Look at a sign, name it before the answer shows, and let the ones you miss come back sooner than the ones you know. That is spaced recall, and it is exactly what the Pelican trainer on this page does. Five honest minutes a day beats an hour the night before the test.",
  },
];
