/**
 * The Model Town Board question bank, on `/model-town-board/questions` and in
 * the printable PDF (`/tools/og?print=board-questions`). Written by us from the
 * Kenya Learner Driver Handbook (NTSA, 2016). They are not questions from any
 * test centre, and the page says so.
 *
 * Every answer names the handbook page it comes from. Where the handbook is
 * silent and the answer is a road rule a school should confirm, `confirm` is
 * set and the page says to ask an instructor. Don't add a question without one
 * or the other.
 */

export type BoardTopicId =
  | "board"
  | "lanes"
  | "roundabout"
  | "routes"
  | "signs"
  | "parking";

export type BoardTopic = {
  id: BoardTopicId;
  title: string;
  /** The course level that teaches this topic. */
  level: string;
};

export const BOARD_TOPICS: readonly BoardTopic[] = [
  { id: "board", title: "The board and its roads", level: "roads" },
  { id: "lanes", title: "Lanes", level: "four-lane" },
  { id: "roundabout", title: "The roundabout", level: "roundabout-rules" },
  { id: "routes", title: "Routes", level: "route-rules" },
  { id: "signs", title: "Signs on the board", level: "stops" },
  { id: "parking", title: "Parking", level: "parking-rules" },
];

export type BoardQuestion = {
  topic: BoardTopicId;
  q: string;
  a: string;
  /** Where the answer comes from. */
  source: string;
  /** The handbook doesn't settle it: the page says to ask an instructor. */
  confirm?: true;
};

const unit3 = (page: number) =>
  `Learner Driver Handbook, Unit 3: Model Town, p. ${page}`;
const MSM = "Learner Driver Handbook, MSM technique, pp. 38 to 39";
const SIGNS = "Learner Driver Handbook, Unit 2: traffic signs, p. 8";
const ROAD_RULE =
  "Not in the handbook: a road rule to confirm with your school";

export const BOARD_QUESTIONS: readonly BoardQuestion[] = [
  // The board and its roads
  {
    topic: "board",
    q: "What is the Model Town Board?",
    a: "A road network drawn on a board. It is a simple picture of the kinds of roads found in Kenya's major towns, used to test whether you know the rules of the road.",
    source: unit3(9),
  },
  {
    topic: "board",
    q: "Name the features of the Model Town Board.",
    a: "A one-way traffic road, a two-way traffic road, a roundabout, parking zones, the yellow kerb, a pedestrian crossing, a Stop sign, a Give way sign, an exit from the main road, an exit from the controlled parking zone, and road markings such as arrows, reflectors and delta marks.",
    source: unit3(9),
  },
  {
    topic: "board",
    q: "What is a one-way traffic road?",
    a: "The dual carriageway: a road where all vehicles move in one direction, with white continuous or broken lines dividing it into lanes.",
    source: unit3(10),
  },
  {
    topic: "board",
    q: "What does a continuous white line between lanes mean?",
    a: "No changing lanes and no overtaking.",
    source: unit3(10),
  },
  {
    topic: "board",
    q: "What does a broken white line between lanes mean?",
    a: "You may change lanes or overtake if the road is clear and safe.",
    source: unit3(10),
  },
  {
    topic: "board",
    q: "What separates the two sides of the dual carriageway?",
    a: "The central reserve.",
    source: unit3(10),
  },
  {
    topic: "board",
    q: "What is the gap in the central reserve for?",
    a: "It is an exit from the main road, where a car can make a U-turn.",
    source: unit3(10),
  },
  {
    topic: "board",
    q: "What is the yellow kerb?",
    a: "The yellow marking along the green field at the side of the road. It protects the field.",
    source: unit3(10),
  },
  {
    topic: "board",
    q: "What does the yellow kerb mean?",
    a: "No overlapping, no parking, no waiting and no stopping beside it.",
    source: unit3(10),
  },
  {
    topic: "board",
    q: "What is a two-way traffic road?",
    a: "A single carriageway, where vehicles move in opposite directions. A single yellow line down the centre divides it into two equal parts.",
    source: unit3(10),
  },
  {
    topic: "board",
    q: "On the two-way road, what does a continuous yellow line down the middle mean?",
    a: "Stick to your side. No overtaking.",
    source: unit3(10),
  },
  {
    topic: "board",
    q: "On the two-way road, what does a broken yellow line down the middle mean?",
    a: "You may overtake if the road is clear. Otherwise keep left.",
    source: unit3(10),
  },
  {
    topic: "board",
    q: "What divides the three-lane road and the streets?",
    a: "A double yellow line, which splits the road into equal parts. Vehicles in a street move in one direction.",
    source: unit3(10),
    confirm: true,
  },
  {
    topic: "board",
    q: "What is a pedestrian crossing, and what do you do at one?",
    a: "A safe, marked place for people to cross the road. Slow down, and stop to let pedestrians cross.",
    source: unit3(10),
  },

  // Lanes
  {
    topic: "lanes",
    q: "How are the lanes numbered?",
    a: "From the outermost lane inwards. Lane 1 is beside the kerb, and the highest number is beside the middle of the road.",
    source: unit3(11),
  },
  {
    topic: "lanes",
    q: "What do the codes 2124 and 215 mean?",
    a: "They count the options in each lane, starting at the kerb. On the four-lane road lane 1 has two options, lane 2 one, lane 3 two and lane 4 four. On the three-lane road lane 1 has two, lane 2 one and lane 3 five.",
    source: unit3(13),
  },
  {
    topic: "lanes",
    q: "You are on the four-lane road and want to turn left at the roundabout. Which lane?",
    a: "Lane 1, which turns left at 90°. Lane 4 can also get there, but only the long way round, at 270°.",
    source: unit3(13),
  },
  {
    topic: "lanes",
    q: "You want to go straight across the roundabout from the four-lane road. Which lanes can you use?",
    a: "Lanes 1, 2 or 3, at 0°. Lane 4 can too, but only after going once all the way round, at 360°.",
    source: unit3(13),
  },
  {
    topic: "lanes",
    q: "You want to turn right from the four-lane road. Which lanes?",
    a: "Lane 3 or lane 4, at 90°.",
    source: unit3(13),
  },
  {
    topic: "lanes",
    q: "You want to go round the roundabout and come back down the four-lane road. Which lane?",
    a: "Lane 4, the lane beside the central reserve. Coming back is 180°.",
    source: unit3(13),
  },
  {
    topic: "lanes",
    q: "What are lane 4's four options on the four-lane road?",
    a: "Turn right (90°), come back (180°), turn left the long way round (270°), or go straight after going round clockwise (360°).",
    source: unit3(13),
  },
  {
    topic: "lanes",
    q: "Which lane has only one option, on either road?",
    a: "Lane 2. It goes straight only, at 0°.",
    source: unit3(13),
  },
  {
    topic: "lanes",
    q: "You are on the three-lane road and want to turn left. Which lane?",
    a: "Lane 1, at 90°. Lane 3 can also turn left, the long way round at 270°.",
    source: unit3(13),
  },
  {
    topic: "lanes",
    q: "You want to go straight on from the three-lane road. Which lanes?",
    a: "Lanes 1, 2 or 3, at 0°.",
    source: unit3(13),
  },
  {
    topic: "lanes",
    q: "You want to turn right from the three-lane road. Which lane?",
    a: "Lane 3. It is the only lane on that road that turns right.",
    source: unit3(13),
  },
  {
    topic: "lanes",
    q: "You want to come back down the three-lane road. Which lane, and which lane do you come back in?",
    a: "Lane 3, at 180°. You come back in lane 3.",
    source: unit3(13),
  },
  {
    topic: "lanes",
    q: "What are lane 3's five options on the three-lane road?",
    a: "Go straight; turn right; turn right and enter lane 4 at 90°; come back into lane 3 at 180°; or turn left into lane 3 at 270° and move to lane 4 on the broken line.",
    source: unit3(13),
  },
  {
    topic: "lanes",
    q: "How many degrees is each turn at the roundabout?",
    a: "Straight on is 0°, left and right are 90°, coming back is 180°, the long way left is 270° and once all the way round is 360°.",
    source: unit3(13),
  },
  {
    topic: "lanes",
    q: "What do you do before you change lanes?",
    a: "Mirror, signal, manoeuvre: check your mirrors and your blind spot, signal, then move across. Only where the line is broken.",
    source: `${MSM}; ${unit3(10)}`,
  },
  {
    topic: "lanes",
    q: "You are in lane 2 near the roundabout and realise you need to turn right. The lines beside you are continuous. What do you do?",
    a: "Stay in lane 2 and go straight. A continuous white line means no changing lanes, and lane 2 goes straight only. Then take the longest correct route back to where you were asked to go.",
    source: `${unit3(10)}; ${unit3(12)}`,
  },

  // The roundabout
  {
    topic: "roundabout",
    q: "What is a roundabout?",
    a: "A meeting point where more than two roads meet.",
    source: unit3(11),
  },
  {
    topic: "roundabout",
    q: "What is a roundabout for?",
    a: "To let vehicles move in different directions without blocking or hitting each other.",
    source: unit3(11),
  },
  {
    topic: "roundabout",
    q: "Name the three parts of the roundabout.",
    a: "The traffic island, the innermost lane (lane 4), and the space (lanes 1, 2 and 3).",
    source: unit3(11),
  },
  {
    topic: "roundabout",
    q: "What is the traffic island?",
    a: "The green part in the middle of the roundabout. It controls the movement of vehicles.",
    source: unit3(11),
  },
  {
    topic: "roundabout",
    q: "Which way do you go round the roundabout?",
    a: "Clockwise, keeping left.",
    source: unit3(11),
  },
  {
    topic: "roundabout",
    q: "Who goes first at the roundabout?",
    a: "Traffic already on it, which comes from your right. Give way before you enter.",
    source: ROAD_RULE,
    confirm: true,
  },
  {
    topic: "roundabout",
    q: "Name the five things you must not do on the roundabout.",
    a: "Stop, change lanes, park, overtake or wait.",
    source: unit3(11),
  },
  {
    topic: "roundabout",
    q: "You entered in the wrong lane. Can you move across once you are on the roundabout?",
    a: "No. Changing lanes on the roundabout is not allowed. Choose your lane before you enter.",
    source: unit3(11),
  },
  {
    topic: "roundabout",
    q: "Which lane may go all the way round?",
    a: "Only the innermost lane, lane 4 from the four-lane road, may make a full circle (360°). From the three-lane road, only the innermost lane may go as far as 270°. Lanes 1, 2 and 3 may not make a full circle.",
    source: unit3(11),
  },
  {
    topic: "roundabout",
    q: "Which lane do you leave the roundabout in?",
    a: "The lane you came round in. Leaving in the wrong lane is one of the common mistakes.",
    source: unit3(11),
  },
  {
    topic: "roundabout",
    q: "What are the common mistakes at the roundabout?",
    a: "Approaching in the wrong lane, leaving in the wrong lane, changing lanes on the roundabout, and misreading the traffic lights.",
    source: unit3(11),
  },

  // Routes
  {
    topic: "routes",
    q: "What are the three route rules?",
    a: "Take the shortest correct route without using the parking. If you can't, take the longest correct route without using the parking. Use the parking zone as a route only as a last option.",
    source: unit3(12),
  },
  {
    topic: "routes",
    q: "There are two correct routes to where you are going. Which one do you take?",
    a: "The shorter one, as long as it avoids the parking area.",
    source: unit3(12),
  },
  {
    topic: "routes",
    q: "The only short route cuts through the parking area, but a longer route avoids it. Which do you take?",
    a: "The longer route. The parking area is a last resort.",
    source: unit3(12),
  },
  {
    topic: "routes",
    q: "The shortest way goes the wrong way down a one-way road. Can you use it?",
    a: "No. It breaks a rule, so it is not a correct route, however short it is.",
    source: `${unit3(10)}; ${unit3(12)}`,
  },
  {
    topic: "routes",
    q: "When may you drive through the parking zone on your way somewhere else?",
    a: "Only when there is no other route.",
    source: unit3(12),
  },

  // Signs on the board
  {
    topic: "signs",
    q: "What does a Stop sign look like?",
    a: "A red, eight-sided sign (an octagon) with white letters.",
    source: unit3(12),
  },
  {
    topic: "signs",
    q: "Where is the Stop sign on the board?",
    a: "At a junction, where you join a two-way traffic road.",
    source: unit3(12),
  },
  {
    topic: "signs",
    q: "There is a Stop sign on your route, but no traffic. What do you do?",
    a: "Stop anyway. Look right, left, then right again, and go only when the road is clear.",
    source: unit3(12),
  },
  {
    topic: "signs",
    q: "What does a Give way sign look like?",
    a: "A red triangle with its point facing down and a white border.",
    source: unit3(12),
  },
  {
    topic: "signs",
    q: "What do you do at a Give way sign?",
    a: "Slow down, or stop if you need to, and go only when it is safe.",
    source: unit3(12),
  },
  {
    topic: "signs",
    q: "What do a triangle, a circle and a rectangle tell you on a road sign?",
    a: "A triangle warns, a circle gives an order, and a rectangle informs.",
    source: SIGNS,
  },

  // Parking
  {
    topic: "parking",
    q: "What are the two kinds of parking on the board?",
    a: "Angle parking, also called ample or controlled parking, and flush parking, also called parallel or uncontrolled parking.",
    source: unit3(12),
  },
  {
    topic: "parking",
    q: "Which vehicles may use angle parking?",
    a: "Small cars only, such as a saloon.",
    source: unit3(12),
  },
  {
    topic: "parking",
    q: "How do you go into and out of an angle parking bay?",
    a: "Drive in forwards and leave in reverse.",
    source: unit3(12),
  },
  {
    topic: "parking",
    q: "How does traffic move through the angle parking zone?",
    a: "In one direction. The zone has a set entrance and exit.",
    source: unit3(12),
  },
  {
    topic: "parking",
    q: "Which vehicles may use flush parking?",
    a: "All vehicles except tractors and trailers.",
    source: unit3(12),
  },
  {
    topic: "parking",
    q: "Where is flush parking?",
    a: "On the left side of the road, in the direction of traffic.",
    source: unit3(12),
  },
  {
    topic: "parking",
    q: "Why is flush parking called uncontrolled?",
    a: "It has no security.",
    source: unit3(12),
  },
  {
    topic: "parking",
    q: "How do you go into and out of a flush parking space?",
    a: "Reverse in and drive out forwards. Leave space for the exit.",
    source: unit3(12),
  },
  {
    topic: "parking",
    q: "Which bay do you take?",
    a: "The farthest free one, in angle parking and in flush parking.",
    source: unit3(12),
  },
  {
    topic: "parking",
    q: "May you park on the roundabout or beside the yellow kerb?",
    a: "No. Parking is one of the five things you must not do on the roundabout, and the yellow kerb means no parking, waiting or stopping.",
    source: `${unit3(10)}; ${unit3(11)}`,
  },
];

export function boardQuestionsIn(topic: BoardTopicId): BoardQuestion[] {
  return BOARD_QUESTIONS.filter((question) => question.topic === topic);
}
