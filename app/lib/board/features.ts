/**
 * The things painted on the board that a learner has to be able to name: what
 * each one is and what it asks of the driver. Learn mode points the camera at
 * each in turn. The rules are the NTSA handbook's (Unit 3, "Model Town").
 */
import {
  BOARD_LANDMARKS,
  RING_R,
  ROADS,
  SOLID_TO,
  U_TURN_GAPS,
  type Box,
} from "./full-board";

export type BoardFeature = {
  id: string;
  name: string;
  note: string;
  /** The part of the board to look at. */
  box: Box;
  /** The road sign that goes with it, where there is one. */
  sign?: { to: string; label: string };
};

const { SIDE, STREET, AISLE, PARK, FLUSH, CROSSINGS, WIDE, NARROW } = ROADS;

const around = (x: number, z: number, half: number): Box => ({
  x0: x - half,
  x1: x + half,
  z0: z - half,
  z1: z + half,
});

export const BOARD_FEATURES: readonly BoardFeature[] = [
  {
    id: "roundabout",
    name: "Roundabout",
    note: "Go round it clockwise, keeping left. No stopping, waiting, parking, overtaking or changing lanes on it. Choose your lane before you reach it.",
    box: around(0, 0, RING_R + 6),
    sign: { to: "/road-signs/roundabout-ahead", label: "Roundabout ahead" },
  },
  {
    id: "island",
    name: "Traffic island",
    note: "The green circle in the middle of the roundabout. You go round it and never over it. Only lane 4, the lane beside it, may go all the way round.",
    box: around(0, 0, 13),
  },
  {
    id: "lane-numbers",
    name: "Lane numbers",
    note: "Lanes are counted from the kerb. Lane 1 is by the kerb and the highest number is in the middle of the road. The roundabout's lanes are counted the same way, from the outside in.",
    box: { x0: -WIDE - 3, x1: 3, z0: RING_R - 2, z1: SOLID_TO + 6 },
  },
  {
    id: "lane-arrows",
    name: "Lane arrows",
    note: "The arrow painted in a lane shows where that lane may go. On the four-lane road, lane 1 goes straight or left, lane 2 straight only, lane 3 straight or right, and lane 4 right, back or round.",
    box: { x0: -WIDE - 3, x1: 3, z0: RING_R - 2, z1: SOLID_TO + 2 },
  },
  {
    id: "continuous-lines",
    name: "Continuous white lines",
    note: "Near the roundabout the lines between lanes are continuous. That means no changing lanes: you should already be in the lane for your turn.",
    box: { x0: -WIDE - 3, x1: 3, z0: RING_R - 2, z1: SOLID_TO + 4 },
  },
  {
    id: "broken-lines",
    name: "Broken white lines",
    note: "Further back the lines between lanes are broken. This is where you may change lanes, so this is where you choose the lane for your turn.",
    box: { x0: -WIDE - 3, x1: 3, z0: SOLID_TO - 2, z1: SOLID_TO + 28 },
  },
  {
    id: "dual-carriageway",
    name: "Dual carriageway",
    note: "Four lanes each way, with a central reserve keeping the two directions apart. It runs the length of the board and through the roundabout.",
    box: { x0: -WIDE - 6, x1: WIDE + 6, z0: -112, z1: -30 },
  },
  {
    id: "central-reserve",
    name: "Central reserve",
    note: "The raised green strip down the middle of the dual carriageway. It separates you from traffic coming the other way. You never drive over it.",
    box: { x0: -WIDE, x1: WIDE, z0: -62, z1: -26 },
  },
  {
    id: "u-turn-gap",
    name: "Gap in the central reserve",
    note: "A break in the reserve where a car can turn back onto the other side. Be in the lane beside the reserve first, and give way to traffic on the side you are joining.",
    box: {
      x0: -WIDE,
      x1: WIDE,
      z0: -U_TURN_GAPS[0].to - 9,
      z1: -U_TURN_GAPS[0].from + 9,
    },
  },
  {
    id: "three-lane-road",
    name: "Three-lane road",
    note: "Three lanes each way with a continuous yellow line down the middle. A continuous yellow centre line means stay on your side: no crossing it to turn or overtake.",
    box: { x0: -58, x1: -RING_R + 2, z0: -NARROW - 8, z1: NARROW + 8 },
  },
  {
    id: "yellow-kerb",
    name: "Yellow kerb",
    note: "The kerbs at the junctions and round the island are painted yellow so they stand out. Stay off every kerb: no driving, stopping or parking on it.",
    box: { x0: 6, x1: 38, z0: 2, z1: 34 },
  },
  {
    id: "two-way-road",
    name: "Two-way road",
    note: "One lane each way with a yellow line between them. Keep left of the line. Traffic on the other side is coming toward you.",
    box: { x0: SIDE.x0 - 10, x1: SIDE.x1 + 2, z0: 12, z1: 62 },
    sign: {
      to: "/road-signs/two-way-traffic-ahead",
      label: "Two-way traffic ahead",
    },
  },
  {
    id: "crossing",
    name: "Pedestrian crossing",
    note: "The white bars across the two-way road. Slow down as you reach one and be ready to stop. People on the crossing go first.",
    box: around(BOARD_LANDMARKS.crossing.x, CROSSINGS[1], 14),
    sign: {
      to: "/road-signs/pedestrian-crossing",
      label: "Pedestrian crossing",
    },
  },
  {
    id: "street",
    name: "The street",
    note: "A short two-way road joining the dual carriageway to the two-way road. It has a give way line at one end and a stop line at the other.",
    box: { x0: WIDE - 6, x1: SIDE.x0 + 6, z0: STREET.z0 - 8, z1: STREET.z1 + 8 },
  },
  {
    id: "stop-line",
    name: "Stop line",
    note: "A thick continuous white line across your side of the road. You must stop at it every time, even when nothing is coming, and go only when the road is clear.",
    box: around(SIDE.x0 - 2, STREET.mid, 12),
    sign: { to: "/road-signs/stop", label: "Stop" },
  },
  {
    id: "give-way-line",
    name: "Give way line",
    note: "A broken white line across your side of the road. Slow down and let traffic on the road you are joining go first. Stop only if you need to.",
    box: around(WIDE + 2, STREET.mid, 12),
    sign: { to: "/road-signs/give-way", label: "Give way" },
  },
  {
    id: "angle-parking",
    name: "Angle parking",
    note: "The controlled parking zone: bays painted at an angle on both sides of a two-way aisle. Park with the whole car inside the lines. Only drive through here when no other correct route gets you there.",
    box: {
      x0: PARK.x0 - 6,
      x1: PARK.x1 + 6,
      z0: PARK.z0 - 4,
      z1: PARK.z1 + 4,
    },
  },
  {
    id: "parking-aisle",
    name: "Parking aisle",
    note: "The road through the parking zone. It is two-way, with a give way line at each end. Drive slowly: a car may pull out of a bay on either side.",
    box: { x0: AISLE.x0 - 8, x1: AISLE.x1 + 8, z0: -NARROW - 22, z1: -NARROW + 6 },
  },
  {
    id: "flush-parking",
    name: "Flush parking",
    note: "Boxes painted along the kerb of the two-way road, in line with the traffic. You park beside the kerb, inside one box, facing the way the traffic goes.",
    box: {
      x0: SIDE.x0 - 8,
      x1: SIDE.x1 + 2,
      z0: FLUSH.z0 - 6,
      z1: FLUSH.z1 + 6,
    },
  },
];
