/**
 * A sentence or two on each sign, keyed by chart code, for its page at
 * `/road-signs/:slug`. The sign's `note` in `road-signs-pelican.json` says what to
 * do; this says what the sign is telling you and where you'll meet it, so every
 * page has something of its own to say.
 *
 * Plain driving knowledge, not legal text. Keep it free of statistics and
 * measurements unless they come from the Highway Code.
 */
export const SIGN_DETAILS: Record<string, string> = {
  "W.1":
    "The road ahead curves to the left. You often can't see what's coming until you're already in the bend, so slow down before it, not during it.",
  "W.2":
    "The road ahead curves to the right. Kenya drives on the left, so you're on the outside of this bend and your vehicle will tend to drift toward the road edge.",
  "W.3":
    "A run of bends, with the first one going left. Each bend hides the next, so expect to keep adjusting for the whole stretch.",
  "W.4":
    "A run of bends, with the first one going right. Each bend hides the next, so expect to keep adjusting for the whole stretch.",
  "W.5":
    "The road drops sharply and your vehicle will gain speed by itself. Long descents can overheat brakes, which is especially dangerous in a loaded vehicle.",
  "W.6":
    "The road climbs sharply. Loaded lorries can slow to a crawl on a climb like this, and you may not see past the top of the hill.",
  "W.7":
    "The road gets narrower on both sides, so two vehicles may not fit side by side at speed.",
  "W.8":
    "The road gets narrower from the right-hand side, which squeezes oncoming traffic toward your lane.",
  "W.9":
    "The road gets narrower from the left-hand side, so it's your side of the road that runs out first.",
  "W.10":
    "The road runs beside or ends at water, such as a river bank or quay. There may be little or nothing to stop a vehicle at the edge.",
  "W.11":
    "The surface ahead is rough or broken. Ruts and patches can unsettle your steering and make braking less predictable.",
  "W.12":
    "A sharp rise across the road. A bump like this can throw a vehicle around and shift a load if it's taken at speed.",
  "W.13(a)":
    "A sudden drop in the road surface. A dip can hide an oncoming or stopped vehicle until you're nearly on top of it.",
  "W.13(b)":
    "A drift is a low place where a stream crosses the road instead of going under a bridge. After rain the water can rise quickly, and the surface can wash away.",
  "W.14":
    "The surface can lose grip here, often because of rain, mud or spilled oil. Stopping takes much longer on a slippery road.",
  "W.15":
    "Gravel, murram or loose chippings cover the road. Your tyres grip less, and other vehicles can throw stones up at you.",
  "W.16":
    "The road passes below a rocky slope. Rocks may already be on the road or could come down, especially after heavy rain.",
  "W.17":
    "A pedestrian crossing is coming up and people may be on the road. The sign gives you time to slow down before you reach it.",
  "W.18":
    "Children may cross here, usually near a school or playground. They're small, hard to see between parked vehicles, and may run out without looking.",
  "W.19":
    "Cyclists often ride on or cross the road here. They may move out around potholes or parked vehicles, so give them room.",
  "W.20":
    "Cows, goats or other livestock regularly cross here, often with a herder. Where one animal crosses, others usually follow.",
  "W.21":
    "Wild animals may be on or near the road, most often around parks and reserves. They're especially hard to see at dawn, dusk and at night.",
  "W.22":
    "Workers and machines may be on or beside the road, and the layout can change from one day to the next.",
  "W.23":
    "Traffic lights are coming up, possibly round a bend or over a crest where you can't see them yet.",
  "W.24":
    "The road passes close to an airstrip or a flight path. The sign is there so that a low, loud aircraft doesn't startle you into a mistake.",
  "W.25":
    "Traffic is about to run in both directions, often where a one-way section or a dual carriageway ends.",
  "W.26":
    "A general warning, used when no other sign fits. It doesn't tell you what the danger is, so treat it seriously.",
  "W.27":
    "A road meets yours ahead. The sign shows the layout, so you know where other vehicles may come from.",
  "W.28(a)":
    "An early warning of a junction where you'll have to stop or give way, so you can slow down long before you reach the line.",
  "W.28(b)":
    "A side road joins yours from the right, and vehicles on it may pull out into your path.",
  "W.29":
    "Traffic joins from the right using its own lane, which lets it build up speed before it merges with yours.",
  "W.30":
    "A roundabout is coming up. Kenya drives on the left, so traffic goes round clockwise and approaches from your right.",
  "W.31":
    "The road crosses a railway at a level crossing fitted with barriers.",
  "W.32":
    "The road crosses a railway with no barrier to stop you. Only your own eyes and ears will tell you a train is coming.",
  "R.1":
    "The only eight-sided sign on the road, so you can recognise it even when it's faded. It's an order, and it applies every time, even when the road looks empty.",
  "R.2":
    "A triangle standing on its point, the opposite way up from a warning sign. It means the road you're on is the minor one at this junction.",
  "M.1":
    "A blue disc with a white arrow is an order, not advice. The arrow may point left or right, depending on the road layout ahead.",
  "M.2":
    "You'll see this where turning off would be dangerous, or where traffic is being kept in one flow.",
  "M.3":
    "You'll see this where the layout allows only one way through, such as on a one-way system.",
  "M.4":
    "You'll see this where a left turn would lead into a restricted or one-way road.",
  "M.5":
    "Usually fixed to a traffic island or the start of a central divider, showing which side traffic must pass on.",
  "M.7":
    "Blue discs give orders, so this one sets a track aside for bicycles. Motor vehicles may not use it, and it keeps cyclists away from faster traffic.",
  "M.8":
    "Sets a path aside for people on foot, usually where walking on the road itself would be unsafe.",
  "M.9":
    "Sets a track aside for livestock, usually where herds regularly move near a main road.",
  "M.10":
    "The reverse of a speed limit: the number is the lowest speed you may drive at, not the highest. It keeps very slow vehicles from holding up fast traffic.",
  "M.11":
    "Marks the exact point where a required minimum speed stops applying.",
  "P.1":
    "This is the sign you meet at the wrong end of a one-way street or at an exit-only access. You may not drive in from this side.",
  "P.2":
    "A plain red ring with nothing inside bans every vehicle, in both directions. It's used to close a street to traffic, often to make it a pedestrian street, and a plate below can limit it to certain hours or days.",
  "P.3":
    "Covers every kind of vehicle, whether it has an engine or not. The road is closed to vehicles from this point.",
  "P.4":
    "You'll see this where motorcycles, including boda bodas, are kept out of a road or zone.",
  "P.5":
    "You'll see this where bicycles would be at risk from fast traffic, such as on a busy highway.",
  "P.7":
    "You'll see this where walking would be dangerous, such as on a fast road or at a restricted site.",
  "P.8":
    "Keeps slow carts off roads where they'd hold up fast traffic or be put at risk by it.",
  "P.9":
    "Keeps mikokoteni and other pushed carts off roads where they'd hold up or be endangered by traffic.",
  "P.10":
    "Keeps slow, wide machines such as tractors off roads where they'd be a danger to other traffic.",
  "P.11":
    "Protects a road, bridge or residential area from heavy traffic. Lighter vehicles may still use it.",
  "P.12":
    "Closes the road to anything with an engine, which you may see around pedestrian areas and parks.",
  "P.13":
    "Closes the road to motor vehicles and animal-drawn carts at the same time.",
  "P.14":
    "The number on the sign is a width limit. Know your vehicle's full width, including anything it's carrying.",
  "P.15":
    "The number on the sign is a height limit, often at a low bridge. Know your vehicle's full height, including its load and any roof rack.",
  "P.16":
    "The figure is a weight limit, often because a bridge or weak stretch of road lies ahead. If you aren't sure what your vehicle weighs, check before you go on.",
  "P.17":
    "This limits the load on a single axle, so a vehicle within its total weight limit can still break this one.",
  "P.18":
    "A limit on vehicle length, usually where tight turns or narrow lanes won't take a long vehicle.",
  "P.19":
    "A spacing rule, usually where too many heavy vehicles close together would be a danger.",
  "P.20":
    "The ban applies at the junction where the sign stands. It's a red ring, so it forbids the turn shown.",
  "P.21":
    "A right turn cuts across oncoming traffic, so you'll often see this at busy junctions.",
  "P.22":
    "You'll see this where a U-turn would cut across fast traffic, or where the road is too narrow to turn safely.",
  "P.23":
    "Usually placed on hills, bends and narrow stretches where you can't see far enough to pass safely.",
  "P.24":
    "Used on stretches where overtaking a long or slow goods vehicle would take too long to be safe.",
  "P.25":
    "The number in the red ring is your maximum speed in km/h. It replaces the general limit for that road until the limit ends.",
  "P.26":
    "A noise ban, so you'll usually find it where quiet matters.",
  "P.27a":
    "Marks a point where officials check vehicles. Keep going only once you've been cleared.",
  "P.27b":
    "Marks a school crossing where children have the right to cross. It's an order to stop, not a warning to slow down.",
  "P.28":
    "Two vehicles can't pass each other here, usually at a narrow bridge or road works. Traffic coming the other way has priority over you.",
  "P.29":
    "Cancels the bans set by earlier signs on this stretch. Signs placed after this one still apply.",
  "P.30":
    "Marks the end of a specific limit, not the end of all limits. The general limit for that kind of road applies again.",
  "P.32":
    "Bans parking, not stopping, which is how it differs from the no-waiting and no-stopping signs.",
  "P.33":
    "A red X on a blue disc bans stopping as well as parking. A road signed this way is a clearway, and a plate below can give the hours it applies.",
  "P.39":
    "The strictest of the stopping bans, and it covers a whole marked zone rather than a single spot.",
  "A.1":
    "An additional panel never stands alone. It changes or explains the main sign above it, and this one tells you which way the main sign applies.",
  "A.2":
    "An additional panel never stands alone. This one tells you how far ahead the main sign above it begins to apply.",
  "A.3":
    "An additional panel never stands alone. This one narrows down the main sign above it, for example to certain times or vehicles.",
  "A.1b":
    "An additional panel never stands alone. This one tells you how long the stretch covered by the main sign above it is.",
};
