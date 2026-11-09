/**
 * The long-form part of each sign's page at `/road-signs/:slug`: what's on it,
 * where you'll meet it in Kenya, the signs it gets confused with, common
 * mistakes and a memory cue. Only signs in `CONFIRMED_CODES` (the ones in
 * search) have an entry; the rest show the short page.
 *
 * Plain driving knowledge, not legal text. Same rules as `road-sign-details.ts`:
 * no statistics, fines or test-format claims, and no named places we haven't
 * checked.
 */
export type SignGuide = {
  looks: string;
  where: string;
  confusedWith: { code: string; how: string }[];
  mistakes: string[];
  remember: string;
};

export const SIGN_GUIDES: Record<string, SignGuide> = {
  "W.1": {
    looks:
      "A red-bordered warning triangle with a thick black line that rises straight up from the bottom, then kinks over to the left near the top and ends in a slanted point.",
    where:
      "You'll see it before single curves on rural tarmac, on hill roads where the carriageway follows the slope, and where a road swings around a ridge, a river or a farm boundary. It is placed far enough back to let you shed speed on the straight, while your tyres still have full grip.",
    confusedWith: [
      {
        code: "W.2",
        how: "The same sign flipped. Check which way the top of the line leans: here it tips left. Pick the wrong one and you'll set up on the wrong side for the curve.",
      },
      {
        code: "W.3",
        how: "W.3 has a zigzag line with a second turn after the first. A single kink means one bend only, so don't expect the road to straighten in a series of curves.",
      },
    ],
    mistakes: [
      "Braking hard halfway round the curve. Doing your slowing on the straight leaves the car settled and the steering light when you turn in.",
      "Drifting toward the centre line to 'straighten' the curve. On a left bend you are on the inside, and that line puts you in the path of anyone coming the other way.",
      "Forgetting that a parked lorry, a broken-down matatu or a group of people walking can sit just out of sight round the corner.",
    ],
    remember:
      "Read the top of the black line like a finger: it points left, so the road goes left. One kink, one bend.",
  },
  "W.2": {
    looks:
      "A white triangle with a red border. Inside, a black road shape runs straight up and then turns sharply to the right, finishing in an angled tip near the upper right.",
    where:
      "It warns of a single right-hand curve, the kind found on country roads through farmland, on climbs out of valleys and on approaches to bridges. Because you drive on the left, a right bend is the wider, outside curve, and the sign gives you room to slow before the forces start pushing you outward. At night, watch for the glare of oncoming headlights sweeping across the curve before the vehicle itself appears.",
    confusedWith: [
      {
        code: "W.1",
        how: "The mirror image. The line's top tilts left on W.1 and right on this one. Reading it backwards is an easy slip in the test, and on the road it leaves you braced for the wrong curve.",
      },
      {
        code: "W.4",
        how: "W.4 shows a doubled-back shape like an N, meaning a chain of curves. This sign has only one turn in it.",
      },
    ],
    mistakes: [
      "Going in too fast and running wide onto the gravel shoulder, where pedestrians and boda bodas often travel.",
      "Cutting into the oncoming lane to make the bend feel gentler. Traffic coming the other way is on the inside and may already be close to the centre.",
      "Overtaking just before the curve because the road looks clear, then finding the bend closes the view.",
    ],
    remember:
      "Line kinks right, road turns right, and you're on the outside edge, so ease off and hug your lane.",
  },
  "W.3": {
    looks:
      "A red-edged triangle holding a black zigzag line. Starting at the bottom right, it climbs, steps across to the left, then climbs again, with the arrow-like end at the top leaning left.",
    where:
      "Expect it on winding roads that climb or drop through hills and escarpments, such as the descents into the Rift Valley, and on stretches that wind beside rivers. The warning tells you the first curve is a left one and that more follow, so you can set a slow, steady pace for the whole section. On these roads a slow lorry, a stalled vehicle or animals being herded can be waiting just past any one of the turns.",
    confusedWith: [
      {
        code: "W.4",
        how: "Same idea, opposite start. Look at where the line begins its first step. Here it heads left first; on W.4 it heads right first.",
      },
      {
        code: "W.1",
        how: "W.1 has just one turn. If the line zigzags, assume a run of curves and don't speed up after the first one.",
      },
    ],
    mistakes: [
      "Treating each curve as a separate event and accelerating between them. The gaps are short, and you arrive at the next turn too fast.",
      "Trying to pass a slow lorry on the short straights. You can't see far enough ahead to know the next bend is clear.",
      "Letting the vehicle swing across the centre line on the right-hand curves that follow the first left one.",
    ],
    remember:
      "A zigzag means a series. The first step of the line shows the first bend: left here, so think 'left, then more'.",
  },
  "W.4": {
    looks:
      "On a white triangle with a red border, a black line shaped like a capital N rises from the bottom left, swings over to the right, climbs, and ends in a point that leans to the right.",
    where:
      "You'll meet it before twisting stretches in hilly country, on mountain passes and on roads that follow the line of a gorge. It tells you the first curve goes right and that others follow straight after, so the whole section needs a lower, even speed. In rain or mist, the curves can arrive faster than you expect, and the road edge may be soft or broken where it drops away.",
    confusedWith: [
      {
        code: "W.3",
        how: "Its mirror twin. Follow the line from the bottom: on this sign it moves right first. Mixing them up means you'll set your position for a left curve that never comes.",
      },
      {
        code: "W.2",
        how: "W.2 turns once and stops. This sign doubles back, telling you the curves keep coming.",
      },
    ],
    mistakes: [
      "Picking up speed after clearing the first right-hand curve, only to meet a tighter left one straight after.",
      "Running wide on the opening right bend because you are on the outside of it, then correcting sharply on the next curve.",
      "Following too close behind a lorry or bus through the curves, so you can't see what's ahead or stop if it brakes.",
    ],
    remember:
      "The shape looks like an N leaning right. N for 'not just one': a run of bends that starts to the right.",
  },
  "W.5": {
    looks:
      "A red-bordered triangle showing a black slope that falls from high on the left to low on the right, with a small car pointing nose-down as it travels down the incline.",
    where:
      "Look for it at the top of long drops: escarpment roads, highland routes falling into valleys, and the roads leading down from hilltop towns. It is placed before the descent begins so you can pick the right gear while the road is still level. Heavy vehicles crawl down these hills in low gear, so you may also come up behind a slow queue sooner than you think.",
    confusedWith: [
      {
        code: "W.6",
        how: "W.6 has the slope rising to the right and the car climbing. Mix them up and you might reach for power when you need engine braking.",
      },
      {
        code: "W.13(a)",
        how: "A dip is a short drop and rise in the surface. A steep descent is a long fall in the road that can go on for a long distance.",
      },
    ],
    mistakes: [
      "Coasting in neutral or with the clutch pressed. You lose engine braking, and the car runs away faster than you expect.",
      "Ignoring the smell of hot brakes. If you notice it, pull in safely where you can and let them cool before going on.",
      "Overtaking on the way down. Your speed builds quickly, and stopping distances are longer when the road falls away in front of you.",
    ],
    remember:
      "The car on the sign points downhill. Gear down at the top, not halfway: the hill does the speeding for you. Engine holds you back, brakes only help.",
  },
  "W.6": {
    looks:
      "A white triangle with a red edge, containing a black wedge that climbs from the bottom left to the upper right, with a car tilted nose-up driving up the slope.",
    where:
      "It stands before sharp climbs on highland and escarpment roads, on hills out of river valleys, and on steep approaches in hilly towns. The road may also bring you over a blind crest at the top, so the sign gives you time to plan your gear and your position. Loaded lorries and full buses may be moving at walking pace, and some drivers will try to pass them where it isn't safe. On murram climbs, wheels can also spin on loose or wet ground, so keep a steady throttle rather than stopping halfway.",
    confusedWith: [
      {
        code: "W.5",
        how: "W.5 is the reverse: the ground falls away and the car tips forward. Read the slope's direction from left to right, and note which way the car's nose points.",
      },
      {
        code: "W.12",
        how: "W.12 shows a short hump across the road surface. A steep ascent is a long climb, not a single bump.",
      },
    ],
    mistakes: [
      "Staying in a high gear and letting the engine labour, so the vehicle slows and stalls halfway up.",
      "Overtaking a crawling lorry near the top of the hill when the crest hides oncoming traffic.",
      "Stopping on the climb without using the handbrake properly and rolling back into the car behind.",
    ],
    remember:
      "Car nose pointing up means climbing. Change down early, and don't pass where you can't see over the top.",
  },
  "W.7": {
    looks:
      "A red-bordered triangle with two black vertical bars that start wide apart at the bottom, bend inward together, and run close and parallel to the top.",
    where:
      "You'll see it where a wide carriageway squeezes down, often at a narrow bridge, a culvert, a road works section or the start of an older stretch of road. It warns you so you can slow down and work out, with oncoming drivers, who goes through first. On busy roads, a long queue can form at the pinch, and the vehicles at its head may be letting oncoming traffic through. On quieter routes the gap may be hidden behind a bend, so you only see the width change at the last moment.",
    confusedWith: [
      {
        code: "W.8",
        how: "On W.8 only the right-hand bar bends in. Here both bars move inward, so the road closes in from both edges.",
      },
      {
        code: "W.9",
        how: "W.9 has only the left bar stepping in. If both sides narrow, you can't escape the squeeze by moving one way.",
      },
      {
        code: "W.25",
        how: "W.25 warns that traffic will start coming toward you. A narrowing road can also bring oncoming vehicles close, but the sign is about width, not direction.",
      },
    ],
    mistakes: [
      "Racing an oncoming vehicle to reach the narrow part first instead of slowing and holding back.",
      "Forgetting that pedestrians, handcarts and cyclists may also be squeezed into the narrow section with nowhere else to go.",
      "Squeezing past a cyclist or boda boda inside the narrow section instead of waiting behind until there is space.",
    ],
    remember:
      "Both lines pinch together like a funnel. Narrow on both sides means slow down and be ready to wait your turn.",
  },
  "W.8": {
    looks:
      "Inside a red-edged triangle, two black vertical strips stand side by side. The left strip is straight, while the right one jogs inward partway up, so the road shown is narrower at the top.",
    where:
      "It appears where the right-hand side of the road ends or is pushed in, such as at a bridge with a narrow right side, a lane that ends, or works taking space from the right. Since you keep left, it's oncoming traffic that loses room first, and they may move toward you. On a dual carriageway it can also mean the right-hand lane on your side is about to end, so you need to merge left in good time.",
    confusedWith: [
      {
        code: "W.9",
        how: "Its mirror image, with the left strip bending in. Check which strip is straight: here the left one is straight, so the narrowing comes from the right.",
      },
      {
        code: "W.7",
        how: "W.7 has both strips stepping in. On this sign only one side changes.",
      },
    ],
    mistakes: [
      "Assuming the narrowing is someone else's problem because it's on the right. Oncoming vehicles may cross into your lane.",
      "Holding your speed and hugging the centre line, leaving no room for a vehicle squeezed over toward you.",
      "On a road with two lanes your way, staying in the right lane until the last moment and forcing your way in at the pinch point.",
    ],
    remember:
      "The bent strip shows the closing side. Right strip bends, right side closes, so keep left and give space.",
  },
  "W.9": {
    looks:
      "A red-bordered triangle with two upright black strips. The right strip is straight and the left one kinks inward, showing a road that gets narrower from the left edge.",
    where:
      "It warns of a road losing width on the left, as at a bridge, a culvert, a lane ending on the left, or a slip road closing. Since you drive on the left, it's your own side that disappears, and the space you need moves toward the centre. Where a lane on your side ends, drivers in it have to merge right, and those already there should leave space for them to do it calmly.",
    confusedWith: [
      {
        code: "W.8",
        how: "W.8 is the mirror, with the right strip bending in. Here the left strip moves, so it's your side of the road that runs out.",
      },
      {
        code: "W.7",
        how: "W.7 shows both edges closing. This sign tells you one side only, the left, is narrowing.",
      },
    ],
    mistakes: [
      "Not checking the mirrors before easing right, and moving into the path of a vehicle passing you.",
      "Missing pedestrians, boda bodas or a parked handcart that are pushed into the road where the left verge ends.",
      "Speeding up to block a driver merging from the ending left lane. Let them in early so the merge stays smooth.",
    ],
    remember:
      "Left strip bends in, your lane shrinks. Mirrors first, then move out gently and only as much as you need. Then hold that new line until the road widens.",
  },
  "W.10": {
    looks:
      "A red-edged warning triangle showing a black block (a quay or bank) on the left and wavy water lines below it, with a car tipping off the edge and falling toward the water.",
    where:
      "You'll find it where a road runs beside open water or ends at a landing, such as roads along lakeshores, river banks, ferry approaches, jetties and port quays. Some of these edges have no railing or kerb, and the road can end without much warning. Mud, algae or wet planks near the water can also leave the surface slippery, so grip may be poor right where you least want it.",
    confusedWith: [
      {
        code: "W.13(b)",
        how: "A drift sign warns of a stream crossing the road. This sign warns that the road runs alongside or stops at water, with a drop at the edge.",
      },
      {
        code: "W.16",
        how: "Both show a hazard beside the road, but W.16 shows rocks falling from above. Here the danger is going over an edge into water.",
      },
    ],
    mistakes: [
      "Driving close to an unfenced edge at night or in rain, when it's hard to judge where the hard surface ends.",
      "Parking near the water without setting the handbrake firmly or leaving the car in gear.",
      "Following a vehicle onto a ferry ramp or jetty without waiting for instructions from the staff in charge.",
    ],
    remember:
      "The picture shows the worst outcome: a car toppling into water. Slow, steady, and well away from the edge. If you can't see the edge, stop and check.",
  },
  "W.11": {
    looks:
      "A white triangle with a red border, showing a flat black base topped by two rounded bumps, like a road surface with humps and hollows along it.",
    where:
      "It's put up before rough sections of tarmac: worn patches, rutted wheel tracks from heavy lorries, potholes, and stretches where roots or poor ground have lifted the surface. Upcountry roads after the rains and the edges of old tarmac are places it may stand. On a motorbike or boda boda, the jolts can throw a rider and passenger off balance, so give two-wheelers extra room here.",
    confusedWith: [
      {
        code: "W.12",
        how: "W.12 shows a single smooth hump, meaning one sharp bump. Two humps here mean a rough, uneven stretch, not one obstacle.",
      },
      {
        code: "W.13(a)",
        how: "W.13(a) shows a single hollow cut into the base. This sign shows a bumpy, broken surface that goes on for a while.",
      },
      {
        code: "W.14",
        how: "W.14 warns of a road that loses grip, such as wet or oily tarmac. This sign is about the shape of the surface, which jolts the car rather than making it slide.",
      },
    ],
    mistakes: [
      "Swerving suddenly around each pothole, which can put you in front of overtaking traffic or a boda boda alongside.",
      "Braking hard while the wheels are on broken tarmac. Grip is uneven, so the car may pull to one side.",
      "Speeding up again the moment the first rough patch ends. Broken surfaces usually continue for a stretch, so wait until the road is clearly smooth.",
    ],
    remember:
      "Two humps, more than one problem. Rough road ahead: slow down, hold the wheel firmly, and plan your line early.",
  },
  "W.12": {
    looks:
      "A red-bordered triangle with a white middle, pointing upwards. At the bottom sits a flat black bar with a single smooth hump rising out of its centre, like a road seen side-on with one raised lump on it.",
    where:
      "You'll meet it before speed bumps and raised humps built to slow traffic, such as near schools, markets, hospitals and busy trading centres where a highway passes through a town. It can also mark a ridge left by a culvert or a pipe laid across the road. The sign is there because a hump is easy to miss on grey tarmac, especially at night or when it has not been painted.",
    confusedWith: [
      {
        code: "W.11",
        how: "W.11 shows two humps side by side, meaning the whole stretch is rough or broken. W.12 shows one hump, meaning a single sharp rise at one spot. Read one bump as general roughness and you may not slow enough for the real thing.",
      },
      {
        code: "W.13(a)",
        how: "The dip sign is the mirror image: the black shape curves down into the road instead of rising out of it. Both need you to slow down, but a dip can also hide water or a vehicle, so check which way the curve goes.",
      },
    ],
    mistakes: [
      "Braking hard right on top of the hump. Do your braking before it, then roll over gently with the brakes off so the suspension can do its job.",
      "Swerving onto the shoulder to dodge the bump. Pedestrians, boda bodas and handcarts often use that edge, and you can drop a wheel into a ditch.",
      "Forgetting that there may be a second or third hump close behind the first. Stay slow until you're sure the set has ended.",
    ],
    remember:
      "One hump on the sign, one hard lump in the road. Think of the black bar as the road and the bulge as the thing that will lift your car.",
  },
  "W.13(a)": {
    looks:
      "A white warning triangle, point up, edged in red. Near the bottom is a black block with a bowl-shaped curve scooped out of its top, showing the road surface sinking and rising again.",
    where:
      "It warns of a sudden hollow in the road, the kind you find where a road crosses a shallow valley, a seasonal stream bed or a low spot that has sunk over time. On rural roads these hollows can collect rainwater or mud. The sign is put there because a vehicle in the bottom of the dip can be hidden from you until the last moment.",
    confusedWith: [
      {
        code: "W.12",
        how: "The bump sign shows a hump rising up from a flat bar. The dip sign shows the bar cut away in a downward curve. Get them the wrong way round and you'll be expecting a lift when the road actually drops.",
      },
      {
        code: "W.13(b)",
        how: "A drift sign warns of a stream running across the road at a low crossing. A plain dip may stay dry, but after heavy rain any dip can act like a drift, so treat standing water in it with the same caution.",
      },
    ],
    mistakes: [
      "Speeding into the dip to carry momentum up the far side. The car bottoms out at the lowest point, and the sudden bounce can throw your steering off line.",
      "Overtaking on the approach. You cannot see oncoming traffic that is down in the hollow, and it can appear right in front of you.",
      "Driving through water in the dip at normal speed. A wave of water can stall the engine or hide a washed-out surface underneath.",
    ],
    remember:
      "The black shape looks like a bowl. A bowl holds water and hides things, so slow down before the rim.",
  },
  "W.14": {
    looks:
      "A red-bordered triangle with a white middle. Inside is a black car seen from behind, and beneath it two wavy tyre tracks that wriggle from side to side like an S, showing a vehicle sliding.",
    where:
      "Expect it on stretches that get slick, such as steep sections, shaded bends, bridges, or roads where mud washes off farmland or construction sites onto the tarmac. In Kenya the first rain after a dry spell can lift oil and dust off the surface and make it greasy, and roads crossing black cotton soil can turn slick when wet. The sign tells you grip may vanish without much warning.",
    confusedWith: [
      {
        code: "W.15",
        how: "Loose surface warns of gravel or murram chippings that can be thrown up or roll under your tyres. Slippery road is about a smooth surface that has lost grip. Both cause skids, but loose gravel also chips windscreens, so leave a longer gap behind other vehicles.",
      },
      {
        code: "W.3",
        how: "The wiggly skid marks can look like the winding arrow on the successive bends sign. The bends sign shows one thick zigzag line and no car. If there's a car with tracks behind it, it's about grip, not the shape of the road.",
      },
    ],
    mistakes: [
      "Thinking the danger is gone once the rain stops. The surface can stay greasy for some time, especially in shade.",
      "Changing down a gear harshly to slow down. On a slick road a sudden jolt of engine braking can make the drive wheels lose grip, much as harsh braking would.",
      "Overcorrecting when the back steps out. Look and steer gently where you want to go, ease off the pedals, and let the tyres find grip again.",
    ],
    remember:
      "Car on top, squiggles underneath: the squiggles are what your tyres will do if you rush it.",
  },
  "W.16": {
    looks:
      "A triangle with a red border and white centre. On the left is a solid black cliff face sloping down to the right, with a scatter of black rocks of different sizes tumbling off it towards the bottom right corner.",
    where:
      "You'll find it where a road is cut into a hillside or runs below a rock face, such as escarpment roads in the Rift Valley and routes through hilly or mountainous country. Rain loosens soil and stones on these cuttings, and debris can sit on the road for hours. The sign gives you time to slow down so you can stop or steer round a rock you meet suddenly.",
    confusedWith: [
      {
        code: "W.6",
        how: "The steep ascent sign also has a black slope, but it carries a car climbing it and has no rocks. Falling rocks has no vehicle, just the cliff and stones dropping off it.",
      },
      {
        code: "W.15",
        how: "Loose surface warns of small stones and gravel already lying loose on the road surface. Falling rocks warns of bigger rocks arriving from above. The bigger danger here is hitting a boulder hidden round a bend.",
      },
    ],
    mistakes: [
      "Looking only at the road surface and never up at the slope. A glance at the bank ahead can show fresh soil or stones moving.",
      "Swerving sharply into the oncoming lane to avoid a rock on a blind bend. Slow down early enough that you can stop behind it or pass it with care.",
      "Pulling over to rest, take photos or fix a fault right under the rock face. Keep moving until you're clear of the slope.",
    ],
    remember:
      "Black cliff on the left, rocks falling off it. If the road is cut into a hill, look up as well as ahead.",
  },
  "W.17": {
    looks:
      "An upward-pointing red-bordered triangle with a white centre. A black figure in a hat strides to the right across two rows of short black dashes, which stand for the stripes of a crossing.",
    where:
      "It goes up before a marked crossing in a town centre, outside markets, hospitals, churches and bus or matatu stages, and on highways where a trading centre lines the road. The crossing itself may be faded, hidden behind a parked vehicle or round a bend. The sign gives you warning before you can see the stripes.",
    confusedWith: [
      {
        code: "W.18",
        how: "The children crossing sign shows two children holding hands, not one adult. W.18 means young pedestrians who may dart out. W.17 means a formal crossing point used by everyone.",
      },
      {
        code: "M.8",
        how: "The compulsory footpath sign is a round blue sign that tells pedestrians where they must walk. W.17 is a red triangle that warns drivers about people crossing. Shape and colour tell you who the sign is talking to.",
      },
    ],
    mistakes: [
      "Overtaking a vehicle that has slowed or stopped near the crossing. It has probably stopped for someone you can't see, who may step out in front of you.",
      "Stopping on the stripes in slow traffic. Hold back so the crossing stays clear for people on foot.",
      "Waving a pedestrian across without checking the other lane. A boda boda or matatu coming past may not stop, and the person trusts your signal.",
    ],
    remember:
      "A grown-up walking over the stripes. When you see the dashes under the feet, look for a crossing and the people using it.",
  },
  "W.18": {
    looks:
      "A red-bordered triangle with a white centre, showing two black figures of children holding hands mid-stride. One is smaller than the other, and the taller one wears a skirt or dress.",
    where:
      "Expect it near primary and secondary schools, nursery schools, playgrounds and places where children walk along the roadside to and from school. On rural roads children may walk long distances on the verge with no footpath at all. Danger peaks in the morning and afternoon around school times, but children can be about at any hour.",
    confusedWith: [
      {
        code: "W.17",
        how: "The pedestrian crossing sign shows one adult walking over stripes. This sign shows two children and no stripes, because children may cross anywhere nearby, not just at a marked point.",
      },
      {
        code: "P.27b",
        how: "Stop: children school is a round sign with STOP and CHILDREN written on it. W.18 only warns you to take care, but when P.27b is shown you must stop and wait for the children to cross.",
      },
    ],
    mistakes: [
      "Easing off only during school hours. Children play, run errands and walk home at all times, including weekends and holidays.",
      "Driving close to a bus, matatu or parked vehicle dropping off children. A child can run round the front of it straight into your path.",
      "Assuming a child has seen you because they looked your way. Young children judge speed and distance poorly, so give them extra time and room.",
    ],
    remember:
      "Two small figures, hand in hand. Picture your own child or sibling on that verge and drive the way you'd want others to drive past them.",
  },
  "W.20": {
    looks:
      "A red-bordered triangle with a white middle, showing a black side-on silhouette of a cow standing and facing right, with short horns and a tail hanging down.",
    where:
      "You'll see it in farming and pastoral areas where herds are driven between grazing, water points and markets. It also appears near dips, livestock markets and villages where animals routinely cross. Herds often move in the early morning and late afternoon, sometimes in dust or low light.",
    confusedWith: [
      {
        code: "W.21",
        how: "The wild animals sign shows a leaping antelope or deer. The cattle sign shows a standing cow. Cattle usually come with a herder you can watch for. Wild animals have no one guiding them, so they behave less predictably.",
      },
      {
        code: "M.9",
        how: "Compulsory track for cattle is a round blue sign telling herders which path animals must use. W.20 is the warning for drivers that animals cross the road here.",
      },
    ],
    mistakes: [
      "Squeezing through a gap in a moving herd. Animals turn back or bunch together without warning, and a cow can dent a car badly.",
      "Hooting or revving to hurry the animals along. It can scatter them across the road and frighten the herder's goats and calves into your path.",
      "Speeding up again as soon as the last animal you can see has crossed. Stragglers, calves and the herder often follow behind.",
    ],
    remember:
      "A cow standing still on the sign. On the road, expect the herd to stand still too, and wait for it.",
  },
  "W.21": {
    looks:
      "An upward-pointing triangle with a red border and white centre. A black antelope with branching horns leaps towards the top right, its back legs trailing low and its front legs tucked up.",
    where:
      "It's used on roads that pass through or beside national parks, game reserves and conservancies, and on open country where wildlife moves freely. Zebra, gazelle, giraffe, buffalo, warthog and even elephants can wander onto the tarmac. Many animals are most active around dawn and dusk, when they're also hardest to see.",
    confusedWith: [
      {
        code: "W.20",
        how: "The cattle sign shows a cow standing still and usually means a herder is nearby. The leaping animal on W.21 means wildlife that can bound out from the bush with nobody controlling it.",
      },
      {
        code: "W.26",
        how: "The general hazard sign is a plain exclamation mark that names no danger. If you see an animal, the warning is specific: watch the verges and the bush on both sides.",
      },
    ],
    mistakes: [
      "Stopping on the carriageway to watch or photograph animals. Traffic behind you may not expect it, and some animals can charge a vehicle.",
      "Watching only the animal in front and missing the rest of the group. Many species travel in herds, and the ones behind will cross too.",
      "Driving at full beam into an animal's eyes and expecting it to move. Bright lights can freeze some animals on the spot, so slow down and give them time.",
    ],
    remember:
      "The animal is jumping, mid-air. That's how wildlife arrives on a road: suddenly, from the side.",
  },
  "W.22": {
    looks:
      "A red-bordered triangle with a white middle, showing a black figure of a worker bent forward and pushing a shovel into a pile of earth or material on the right.",
    where:
      "You'll find it before road repairs, resurfacing, new road construction, drainage work and utility digging along the verge. Work sites may include diversions onto murram tracks, single-lane sections controlled by flagmen, and heavy machines such as graders and tippers moving in and out. The sign often stays up while the work lasts, so the hazards behind it can change from day to day.",
    confusedWith: [
      {
        code: "W.26",
        how: "The general hazard sign is just an exclamation mark. The road works sign tells you the danger is people and machines working, so expect flagmen, cones and changed lanes.",
      },
      {
        code: "P.2",
        how: "Road closed is a round prohibitory sign that stops you going on. Road works only warns you. The road is still open, but you must slow down and follow the temporary layout.",
      },
    ],
    mistakes: [
      "Ignoring a flagman's signal and following the car in front instead. The flagman can see oncoming traffic on the single lane that you can't.",
      "Speeding up through the site because no one appears to be working. Workers can be resting behind machines, and fresh gravel or a sharp edge between old and new tarmac can be hard to spot.",
      "Missing the end of a diversion and rejoining the main road without looking. Treat it like a junction.",
    ],
    remember:
      "A person with a shovel. Somewhere ahead is someone working on the road with their back to you.",
  },
  "W.23": {
    looks:
      "A red-bordered triangle with a white centre containing three coloured discs stacked vertically: red at the top, amber in the middle and green at the bottom. Unlike most warning signs, it has colour inside the triangle, not just black.",
    where:
      "It's placed before signal-controlled junctions and pedestrian crossings, especially where a bend, a crest or a line of trees hides the lights. You'll also see it on fast roads entering towns, where drivers may not expect lights after a long open stretch. It gives you time to lose speed so you can stop comfortably if the lights change.",
    confusedWith: [
      {
        code: "W.27",
        how: "The junction ahead sign shows the layout of the roads meeting yours, with no lights. W.23 tells you the junction is controlled by signals, so the lights decide who goes, not the shape of the road.",
      },
      {
        code: "W.28(a)",
        how: "That sign warns that you will have to stop or give way at the junction ahead. With W.23, whether you stop depends on the colour of the light when you get there.",
      },
    ],
    mistakes: [
      "Keeping your speed up in the hope of catching green. If the light changes as you arrive, you'll be forced into a harsh stop or tempted to run the amber.",
      "Assuming lights are working. If they're dark during a power cut or fault, slow right down, be ready to give way, and follow any police officer directing traffic.",
      "Treating green as a free pass. Pedestrians, handcarts and boda bodas may still be clearing the junction.",
    ],
    remember:
      "Red, amber, green inside a triangle. The colours are the giveaway: real lights are on the way.",
  },
  "W.24": {
    looks:
      "A red-bordered triangle with a white middle, showing a black aircraft silhouette angled with its nose pointing up to the left and its tail down to the right, as if climbing away or coming in to land.",
    where:
      "It's put up where a road runs close to the end of a runway or airstrip, so aircraft cross above it at low height. That can include small airstrips serving lodges, farms and remote towns, as well as larger airports. A plane passing low over your roof can be very loud and sudden, which is why the warning comes first. Near smaller airstrips you may also meet airport vehicles, fuel bowsers or people walking to and from the strip, so keep your speed down past the entrance.",
    confusedWith: [
      {
        code: "W.26",
        how: "The general hazard sign doesn't say what the danger is. The aircraft sign tells you exactly what to expect: noise and a shadow overhead, not something on the road itself.",
      },
    ],
    mistakes: [
      "Slowing down or stopping on the road to watch a plane land or take off. Drivers behind you aren't expecting it, and a sudden stop can cause a rear-end crash.",
      "Flinching and jerking the wheel when the noise hits. Know it's coming, keep a firm grip and hold your line.",
      "Thinking the sign only matters when you can see a plane. Aircraft can approach quickly and from behind you.",
    ],
    remember:
      "A plane in a warning triangle means the danger is above you, not in front of you. Keep your eyes on the road anyway.",
  },
  "W.25": {
    looks:
      "A white triangle with a red border, pointing up. Inside are two thick black arrows side by side: the one on the left points up and the one on the right points down, showing your lane going ahead on the left and oncoming traffic on the right.",
    where:
      "You'll meet it where a dual carriageway or a one way street ends, and at diversions where road works push both directions onto one side. On highways leaving town, it marks the point where the central divider stops and nothing separates you from lorries and buses coming the other way.",
    confusedWith: [
      {
        code: "W.7",
        how: "W.7 shows two black lines squeezing together, meaning the road itself gets narrower. W.25 shows arrows in opposite directions, meaning the road may stay the same width but now carries oncoming traffic. One is about space, the other is about who shares it with you.",
      },
      {
        code: "M.2",
        how: "M.2 is a blue circle with a single white arrow, and it orders you to go straight on. W.25 is a red triangle with two black arrows, and it only warns you. Reading the shape first stops you treating a warning as an instruction.",
      },
      {
        code: "P.28",
        how: "P.28 is a red circle that tells you to give priority to vehicles coming towards you on a narrow section. W.25 sets no priority rule; it only warns that two way traffic starts.",
      },
    ],
    mistakes: [
      "Staying in the right-hand lane out of habit after the dual carriageway ends. That lane now belongs to oncoming traffic, so move left before the sign's point, not after.",
      "Carrying on an overtake that began on the dual carriageway. If you can't finish it well before two-way traffic starts, drop back and wait.",
      "Relaxing your look ahead. Drivers coming the other way may still be overtaking as if they had a free lane, so watch for headlights in your lane.",
    ],
    remember:
      "Two arrows, two directions: one is you going up on the left, the other is them coming down on the right.",
  },
  "W.27": {
    looks:
      "A white triangle with a red border, point up, with a bold black diagonal cross (an X shape) in the lower middle. The two crossing bars stand for roads that meet and cut across each other ahead.",
    where:
      "It's placed on the approach to crossroads on rural and suburban roads, where a side road may be hidden by hedges, maize, buildings or a crest. You'll also see it on main roads through trading centres, where feeder roads, matatu stages and boda boda riders join from both sides.",
    confusedWith: [
      {
        code: "W.28(b)",
        how: "W.28(b) warns of a single road joining from the right. W.27's cross means traffic can appear from both sides, so you must check left as well as right.",
      },
      {
        code: "W.30",
        how: "W.30 shows three curved black arrows in a circle, which means a roundabout and a clockwise flow. W.27's straight cross means an ordinary junction where vehicles may cut straight across your path.",
      },
      {
        code: "W.28(a)",
        how: "W.28(a) tells you the junction ahead has a stop or give way rule for you. W.27 only shows the layout, so you need to look for road markings and other signs at the junction itself to see who has priority.",
      },
    ],
    mistakes: [
      "Assuming the main road always has priority. W.27 doesn't say who goes first, so slow down enough to stop if a vehicle pulls out.",
      "Looking only to the right. Kenya drives on the left, so the nearest danger often comes from the right, but cyclists, handcarts and boda bodas can come out from the left too.",
      "Overtaking as you near the junction. A vehicle in front may be slowing to turn, and you can't see what is coming out of the side road.",
    ],
    remember:
      "An X marks the spot where roads cross. Expect traffic from every arm of that X.",
  },
  "W.30": {
    looks:
      "A red bordered white triangle, point up, holding three thick black curved arrows that follow one another in a ring. The ring shows a circular flow of traffic.",
    where:
      "It stands on the approach to a roundabout, usually a fair distance back so you have room to brake from open road speed. You'll see it on highways entering towns and on busy urban routes where several roads meet.",
    confusedWith: [
      {
        code: "W.27",
        how: "W.27 shows a straight black cross for an ordinary junction. W.30 shows a ring of arrows. At a roundabout everyone goes round the same way, while at a plain junction vehicles can cut straight across you.",
      },
      {
        code: "R.2",
        how: "R.2 is the upside down triangle you'll often find at the roundabout entry itself. W.30 warns you the roundabout is coming; R.2 is where you actually give way to traffic coming from your right.",
      },
    ],
    mistakes: [
      "Arriving too fast because the road was clear and straight. Brake in good time so you can stop at the give way line if the roundabout is busy.",
      "Watching the car in front instead of the traffic on the roundabout. The driver ahead may go, but the gap may close before your turn.",
      "Picking a lane late. Decide which exit you want as soon as you see the sign, and look for lane markings and direction boards. Matatus and boda bodas may cut across lanes, so check your mirrors before you leave.",
    ],
    remember:
      "Arrows chasing each other in a circle: a roundabout. Go round clockwise and look right before you join.",
  },
  "W.31": {
    looks:
      "A white triangle with a red border, point up, with a black gate or fence of upright pointed posts joined by rails across the lower half. The gate stands for the barrier that closes the road when a train is due.",
    where:
      "It's put on the approach to a level crossing that has gates or lifting barriers, giving you time to slow down before the crossing comes into view. In towns and on roads near railway lines you may find warning lights, a bell or a crossing keeper as well.",
    confusedWith: [
      {
        code: "W.32",
        how: "W.32 shows a steam train and means there is no barrier to protect you. W.31 shows a gate, so a barrier should come down when a train is coming. With W.32 the whole job of spotting the train is yours.",
      },
      {
        code: "R.1",
        how: "R.1 is a red octagon that orders you to stop every time. W.31 warns you of the crossing; you must stop when the barrier is down or the lights show, and you may cross when the barrier is up and the line is clear.",
      },
    ],
    mistakes: [
      "Zigzagging round a half lowered barrier to save time. A barrier starting to move means a train is near, so stop.",
      "Following the vehicle ahead onto the tracks when the far side is jammed. Only move onto the crossing when there's room to clear it completely.",
      "Treating an open barrier as a guarantee. Barriers can fail, so look and listen along the line before you cross.",
    ],
    remember:
      "Gate on the sign, gate on the road. When the gate is down, so is your foot on the brake.",
  },
  "W.32": {
    looks:
      "A white triangle with a red border, point up, showing a black steam locomotive side on, with a puff of smoke rising from its chimney. There's no gate or fence on it, which is the point: nothing will stop you at this crossing.",
    where:
      "It's placed before level crossings without barriers, which tend to be on quieter rural and upcountry roads, farm access roads and murram roads that run across a railway line. There may be no lights or bells, so this sign may be the only warning you get. Tall grass, maize, buildings or a cutting can hide the line on either side, so you may not see a train until you are close to the rails.",
    confusedWith: [
      {
        code: "W.31",
        how: "W.31 shows a gate, which means a barrier should close when a train is due. W.32 shows the train itself, so no barrier will come down. Mixing them up could leave you waiting for a barrier that doesn't exist.",
      },
    ],
    mistakes: [
      "Crossing at your normal speed because the line looks unused. Trains can come at any time, so slow right down before you reach the rails.",
      "Relying on hearing alone with the windows up and music on. Turn the radio down, open a window and look properly both ways along the track.",
      "Stopping on the rails. Rough or raised crossings can stall you or bog you down after rain, so don't start across until you can drive straight over and clear the far side.",
    ],
    remember:
      "See the steam train, be the barrier yourself: stop, look and listen.",
  },
  "R.1": {
    looks:
      "A red eight sided sign with the word STOP in large white capital letters across the middle. It has no picture, only the word and the colour.",
    where:
      "It stands at junctions where you can't see far enough along the main road to judge it safely while still moving: blind corners, junctions at the bottom of a hill, and minor roads joining a busy highway. A white stop line is usually painted across your lane at the point where you must halt.",
    confusedWith: [
      {
        code: "R.2",
        how: "R.2 is a red bordered triangle standing on its point, and you may roll through if the road is clear. R.1 demands a full stop even when nothing is coming. Treating STOP like give way is a serious error.",
      },
      {
        code: "P.27b",
        how: "P.27b is a round sign with STOP and CHILDREN on it, and it's used where children cross near schools. R.1 is about a junction. Both mean stop, but P.27b holds you until the children are safely across.",
      },
      {
        code: "P.27a",
        how: "P.27a tells you to stop at a control post such as a checkpoint or weighbridge. R.1 is about traffic at a junction, so once you've stopped and the road is clear you can go.",
      },
    ],
    mistakes: [
      "Slowing to a crawl and rolling over the line. The wheels must stop turning, at the line, before you look and move off.",
      "Stopping well back and then pulling out without looking again. If your view is blocked from the line, creep forward and stop once more where you can see.",
      "Going because another driver flashes you. A matatu or lorry flashing its lights may not have seen the boda boda overtaking it.",
    ],
    remember: "Eight sides, one word, no exceptions. Wheels still, then look.",
  },
  "R.2": {
    looks:
      "A plain white triangle with a thick red border, turned so one point faces down and the flat side is on top. There's no symbol or writing inside.",
    where:
      "You'll find it where a minor road joins a main road, at the entry to many roundabouts, and at slip roads where you merge onto a faster road. It's used where you can see clearly enough to judge the traffic without stopping every time, and a broken line is often painted across your lane at the edge of the main road.",
    confusedWith: [
      {
        code: "R.1",
        how: "R.1 is a red octagon with STOP on it and needs a full stop every time. R.2 only needs you to stop if traffic is coming. Treating R.2 like STOP can cause rear end bumps behind you; treating STOP like R.2 can cause a side impact.",
      },
      {
        code: "W.27",
        how: "W.27 is a triangle the normal way up, point to the sky, with a black cross. It warns that a junction is coming. R.2 points down, is empty inside, and is placed at the junction to tell you the other road has priority.",
      },
    ],
    mistakes: [
      "Edging into the main road and making oncoming traffic brake for you. Giving way means they should not need to slow down because of you.",
      "Misjudging the speed of an approaching lorry or bus. Big vehicles look slower than they are, so wait for a clearly safe gap.",
      "Forgetting pedestrians and cyclists already crossing the side road. Let them finish before you move up to the line.",
    ],
    remember:
      "The upside down triangle points at you: you're the one who waits. An empty triangle means let others go first.",
  },
  "M.2": {
    looks:
      "A solid blue circle with one straight white arrow pointing straight up, with no border. The blue and the round shape tell you it's an instruction you must follow.",
    where:
      "It's put up at junctions where turning across traffic would be unsafe or would block a busy flow, for example where the side roads on both sides are one way towards you. You may also find it on approaches to bridges, ramps or channelled lanes where every vehicle has to carry on in one line.",
    confusedWith: [
      {
        code: "M.4",
        how: "M.4 has an arrow that splits, letting you go straight or turn right. M.2 has a single arrow, so going straight is your only choice. Check how many heads the arrow has before you signal.",
      },
      {
        code: "P.21",
        how: "P.21 is a red ringed circle with a crossed out right turn arrow, banning only the right turn. M.2 rules out both turns. A driver who only sees that right is banned may wrongly think left is fine.",
      },
      {
        code: "W.25",
        how: "W.25 is a red triangle with two black arrows pointing opposite ways. M.2 is a blue circle with one white arrow. One warns about oncoming traffic, the other tells you where to drive.",
      },
    ],
    mistakes: [
      "Turning left because a left turn feels harmless. The sign rules it out too, and the reason may be something you can't see from the junction, such as a one way street.",
      "Stopping or slowing sharply at the junction to look for a turn. Keep moving with the flow and plan your route to turn later.",
      "Reading the blue sign as advice. Blue circles are orders, the same as red ones.",
    ],
    remember: "Blue circle, one straight arrow, one way: ahead.",
  },
  "M.3": {
    looks:
      "A solid blue circle with a white arrow that comes up from the bottom, bends and points to the right. There's no border and no other mark.",
    where:
      "You'll see it at junctions where going straight on or turning left would take you the wrong way into a one way street, onto a closed road or into an area reserved for buses or service vehicles. It's also used in one way loops in town centres and on temporary diversions.",
    confusedWith: [
      {
        code: "P.21",
        how: "P.21 shows a black right turn arrow with a red bar across it inside a red ring, and it bans turning right. M.3 shows a white right turn arrow on blue and makes turning right compulsory. Same arrow, opposite meaning, so the colour decides.",
      },
      {
        code: "M.4",
        how: "M.4 gives you a choice of straight or right. M.3 gives you no choice. If you see only one arrowhead, you have only one way out.",
      },
      {
        code: "M.1",
        how: "M.1 has a straight white arrow pointing flat to one side (left on the chart), showing a direction to be followed. M.3 is specifically about turning right at a junction, so read the arrow's shape: a bend means a turn.",
      },
    ],
    mistakes: [
      "Not getting into the right position early. Signal right, move towards the centre of the road where the layout allows, and watch for boda bodas undertaking you on the left.",
      "Forgetting that you still give way to oncoming traffic. A compulsory turn doesn't give you priority over vehicles coming the other way.",
      "Cutting the corner. Turn round the correct side of any island or centre point so you enter the new road on the left.",
    ],
    remember: "Blue means must. The arrow bends right, so you turn right.",
  },
  "M.5": {
    looks:
      "A solid blue circle with a thick white arrow pointing down and to the left at an angle, from the top right towards the bottom left. The slant shows you which side of the obstacle to pass.",
    where:
      "It's fixed to traffic islands, the start of central dividers, bollards at pedestrian refuges and the ends of road works barriers. Because Kenya drives on the left, it keeps you on your own side of the island, away from oncoming traffic.",
    confusedWith: [
      {
        code: "M.1",
        how: "M.1 has a white arrow pointing flat to the left, and it shows the direction you must follow. M.5 points down to the left at an angle and tells you which side of an object to pass. If the arrow slopes downwards, think of an island in front of you.",
      },
      {
        code: "P.20",
        how: "P.20 is a red ringed circle with a crossed out left turn, banning turning left. M.5 is a blue circle and has nothing to do with turning. Mixing them up could have you turning into a side road when you only needed to keep left of an island.",
      },
    ],
    mistakes: [
      "Passing an island on the right to reach a right hand turn sooner. That takes you head on into oncoming traffic.",
      "Hitting the kerb of the island at night. Islands are low and can be hard to see, so slow down when you spot the sign in your headlights.",
      "Squeezing a cyclist, handcart or pedestrian at the narrow gap beside the island. Hold back until you can pass them with space.",
    ],
    remember:
      "The arrow slides down to the left, and so do you: keep left of the island.",
  },
  "P.1": {
    looks:
      "A solid red circle with a thick white horizontal bar straight across the middle. There's no picture or writing on it.",
    where:
      "It faces you at the exit end of one way streets, at the way out of car parks, petrol stations and estates, and at bus or service only entrances. You may also see it on slip roads where joining from that side would put you against the flow.",
    confusedWith: [
      {
        code: "P.3",
        how: "P.3 means entry is forbidden to all vehicles, but the road is not necessarily one way. P.1 usually means traffic is flowing towards you, which is why entering would be so dangerous.",
      },
      {
        code: "P.27a",
        how: "P.27a is a white disc with a red ring and a black bar across it, and it means stop at a control post. P.1 is solid red with a white bar and means you may not go in at all. A white bar on red shuts the road; a black bar on white tells you to stop and wait to be cleared.",
      },
      {
        code: "P.2",
        how: "P.2 shows the road is closed, usually for works or an event, and the closure may be temporary. P.1 normally stays in place because it's part of the street's fixed layout.",
      },
    ],
    mistakes: [
      "Reversing or going in a short way to drop off a passenger. Even a few metres against the flow is entry, and drivers coming out won't expect you.",
      "Following a boda boda or matatu that ignores the sign. Their choice doesn't make it safe or legal for you.",
      "Missing the sign because you're looking for the street name. If a street you want has no entry from your side, plan to come in from the other end.",
    ],
    remember:
      "A red circle with a white bar blocking it: the door is shut from this side.",
  },
  "P.15": {
    looks:
      "A white disc inside a thick red ring, with a height figure in black (3.5m on the chart). A solid black triangle sits above the number and another below it, both pointing in towards the figure like the jaws of a gauge.",
    where:
      "You'll meet it before low railway bridges, footbridges, underpasses, tunnels and gateways into compounds, car parks or petrol station canopies. It's put there because the driver of a tall vehicle can't judge clearance from the cab, and by the time the roof touches something it's far too late to stop.",
    confusedWith: [
      {
        code: "P.14",
        how: "The width-limit sign carries the same kind of figure, but its arrowheads point in from the left and right sides, not from above and below. Read the triangles first: up and down means height, side to side means width.",
      },
      {
        code: "P.18",
        how: "The length limit is about long vehicles on tight turns, not overhead clearance. A long, low trailer can pass under a height limit and still be barred by a length limit, so check which measurement the sign is asking about.",
      },
    ],
    mistakes: [
      "Forgetting what's on the roof. A loaded carrier, a water tank, mattresses or sacks piled on a pickup or lorry all add height that the vehicle's papers don't show.",
      "Guessing and creeping forward to see if it fits. Once you're under the structure, reversing a tall vehicle out with traffic behind you is slow and dangerous, so turn off before you reach it.",
      "Assuming a road surface stays the same. Fresh tarmac or a speed bump just before a low bridge can raise the vehicle relative to the structure, so leave a margin.",
    ],
    remember:
      "Picture the two black triangles as a ruler squeezing the number from top and bottom: that squeeze is the gap overhead. If you drive anything taller than a car, know your height in metres before you set off.",
  },
  "P.16": {
    looks:
      "A plain white disc with a red ring and a single black figure followed by a small T for tonnes (5T on the chart). There is no picture of a vehicle, just the number and the letter.",
    where:
      "You'll find it before old or narrow bridges, culverts and causeways over rivers, and on rural roads with a weak base, such as some murram or estate access roads. The structure ahead can only carry so much, and one overweight lorry can crack a deck or collapse a culvert for everyone who uses it after.",
    confusedWith: [
      {
        code: "P.17",
        how: "The axle-weight sign shows a small drawing of an axle with two wheels and a downward arrow under the figure. The plain weight sign has only the number and T, so it's about the whole vehicle, not a single axle.",
      },
      {
        code: "P.25",
        how: "A speed limit also shows a number in a red ring, but with no letter after it. If you see a T beside the figure it's tonnes, not kilometres per hour, and it has nothing to do with how fast you go.",
      },
    ],
    mistakes: [
      "Judging the bridge by eye. A deck can look solid and still be weak underneath, so go by the figure on the sign, not by how the structure looks.",
      "Driving right up to the structure before deciding. If you're over the limit, stop well back and find another route, rather than trying to turn a heavy vehicle on a narrow bridge approach.",
      "Trying to rush across in the hope that speed lessens the load. It doesn't, and the impact from hitting a joint fast can make things worse.",
    ],
    remember:
      "T is for tonnes. A number with a T and no picture is a weight limit, not a speed: if your vehicle weighs more than the figure, you don't go on.",
  },
  "P.17": {
    looks:
      "A red-ringed white disc with a weight figure and a small T (2T on the chart) at the top. Below the number is a black drawing of one axle seen from behind, a wheel at each end, with a short arrow pressing down on its centre.",
    where:
      "Expect it on roads and bridges where the surface or deck can be damaged by concentrated weight, such as older bridges, roads with a thin surface layer, and approaches to culverts. Heavy loads on one axle press hard into a small area of road, which is what cracks surfaces and opens potholes.",
    confusedWith: [
      {
        code: "P.16",
        how: "The total-weight sign has the figure and T but no axle drawing. Mixing them up can lead a lorry driver to think a light total weight means a pass, when one axle may still be overloaded.",
      },
      {
        code: "P.11",
        how: "The heavy commercial vehicle ban keeps lorries out altogether. The axle limit doesn't ban lorries as a type; it lets through any vehicle whose load on each axle stays within the figure.",
      },
    ],
    mistakes: [
      "Loading everything at one end. A truck carrying heavy goods piled at the back can push its rear axle past the limit while the total weight looks fine.",
      "Ignoring a shifted load. Sacks or containers that slide backwards on a rough road move the weight onto one axle without you noticing from the cab.",
      "Assuming the sign is only for large lorries. A small truck or pickup with a heavy, badly placed load can also break a low axle limit.",
    ],
    remember:
      "The little arrow pushing down on the axle is the clue. It asks how hard each axle presses on the road, not how heavy the whole vehicle is.",
  },
  "P.20": {
    looks:
      "A black arrow rises from the bottom of the disc and bends sharply to the left. A thick red bar crosses it from the upper left to the lower right, inside a red ring on a white background.",
    where:
      "You'll see it at junctions where a left turn would lead into a one-way street from the wrong end, into a bus or matatu lane, or across a stream of traffic that would be unsafe to join there. It's also used where the turn would block a busy junction or where a side road is reserved for certain users.",
    confusedWith: [
      {
        code: "P.21",
        how: "The no-right-turn sign uses the same red bar, but the arrow bends the other way and the bar slopes the other way. Look at which way the arrow's tip points before you decide which turn is banned.",
      },
      {
        code: "M.1",
        how: "M.1 is a blue disc with a white arrow pointing left, and it orders you to go that way. P.20 has a black arrow bending left under a red bar, and it forbids the turn. Same direction, opposite meaning: the blue tells you to go, the red bar tells you not to.",
      },
    ],
    mistakes: [
      "Leaving the left indicator on from an earlier plan and then changing lanes at the last moment. Decide early and signal for the direction you'll actually take.",
      "Turning into the first gap just past the junction, such as a petrol station or a private gate, to get around the ban. Use a legal route instead.",
      "Thinking a left turn is always the easy one in Kenya because you don't cross oncoming traffic. The ban is there for a reason you may not see from the approach.",
    ],
    remember:
      "Arrow bending left, red bar on top: left is shut. Go straight or right, whichever the road allows.",
  },
  "P.21": {
    looks:
      "A black arrow comes up from the bottom and hooks round to the right, with a broad red bar laid across it running from lower left to upper right. The ring is red and the background white.",
    where:
      "Look for it at busy junctions on main roads and dual carriageways where waiting to turn right would hold up a lane of traffic behind you. It's also used where turning right would cut into a lane carrying fast oncoming vehicles, or where there's no safe gap in a central reserve.",
    confusedWith: [
      {
        code: "P.20",
        how: "The no-left-turn sign has the arrow bending left and the bar sloping the opposite way. In a hurry they look alike, so check the arrow, not the bar.",
      },
      {
        code: "M.3",
        how: "The blue sign with a white arrow curving right is an order to turn right. It's the exact opposite meaning, so mistaking one for the other could send you the wrong way.",
      },
      {
        code: "P.22",
        how: "A no-U-turn sign shows the arrow curving all the way back on itself. A right-turn ban doesn't automatically forbid a U-turn, and a U-turn ban doesn't forbid an ordinary right turn, so read the arrow's full shape.",
      },
    ],
    mistakes: [
      "Turning right into a side road just past the junction to get around the ban, cutting across the same oncoming traffic the sign is protecting.",
      "Sitting in the right-hand lane with your indicator on, hoping for a gap, and holding up everyone behind you.",
      "Following a matatu that turns anyway. Another vehicle breaking the rule doesn't make the turn legal for you.",
    ],
    remember:
      "Hook to the right with a slash through it: no right turn. Carry on and find a roundabout or a junction where turning right is allowed.",
  },
  "P.22": {
    looks:
      "A black arrow climbs up, curves over in an arch and comes back down, like an upside-down U, with a red diagonal bar across it. It sits inside a red ring on a white disc.",
    where:
      "You'll find it on fast roads, near bends and crests where oncoming drivers can't see you turning, and at central reserve gaps meant only for emergency or service use. It also appears on narrow streets where turning round would mean reversing into traffic or onto the footway. A vehicle swinging slowly across every lane is easy for a fast driver to misjudge, which is why some stretches ban the move altogether.",
    confusedWith: [
      {
        code: "P.21",
        how: "The no-right-turn sign shows an arrow that bends once to the right. The U-turn arrow goes over the top and comes back, so look for the second downward leg.",
      },
    ],
    mistakes: [
      "Using a petrol station forecourt, a bus stop or a matatu stage to turn round instead. That's a U-turn by another route and can block people waiting there.",
      "Turning round in several short moves and telling yourself it isn't really a U-turn. You still end up facing back the way you came, across the traffic the sign is protecting.",
      "Missing your exit and turning round on the spot. Accept the longer drive to the next legal place to turn.",
    ],
    remember:
      "The arch shape is the clue: an arrow that goes up and comes back down, crossed out. You can't go back the way you came here.",
  },
  "P.23": {
    looks:
      "Two cars seen from behind sit side by side in a white disc with a red ring: a black car on the left and a red car on the right. There's no diagonal bar; the red car itself shows the move that is forbidden.",
    where:
      "Expect it on climbs and descents, blind bends, crests, narrow bridges and stretches with no hard shoulder, such as winding escarpment roads in the Rift Valley. On these sections you can't see far enough ahead to know whether there's room to pass and get back in safely.",
    confusedWith: [
      {
        code: "P.24",
        how: "The goods-vehicle version shows a lorry rather than a second car. That one lets you pass cars but not trucks, while this one stops you passing four-wheeled vehicles of any kind.",
      },
      {
        code: "W.25",
        how: "The two-way traffic warning is a red triangle, and it warns you that oncoming traffic shares the road. It doesn't ban overtaking, though it's a strong hint not to.",
      },
    ],
    mistakes: [
      "Overtaking a slow lorry on a climb because it feels unbearable to sit behind it. The ban covers lorries too, since they have four or more wheels.",
      "Following another car that pulls out, assuming the road ahead is clear because they went. They may have seen a gap that closes before you get there.",
      "Thinking the ban ends at the next bend. Keep to it until a sign tells you the restriction has ended.",
    ],
    remember:
      "Two cars, one red: the red one is the car you're not allowed to be. Stay behind and wait for the ban to end.",
  },
  "P.25": {
    looks:
      "A white disc with a bold red ring and a large black number in the middle (50 on the chart). There's no unit written on it; the figure is in kilometres per hour.",
    where:
      "You'll meet speed limit signs on the edges of towns, through trading centres and markets, near schools and hospitals, at road works and on approaches to junctions and roundabouts. They also appear on roads through or beside national parks, where animals may step out. The limit is set for what's around the road, not for what your car can do.",
    confusedWith: [
      {
        code: "P.30",
        how: "The end-of-limit sign has a black number with diagonal black lines through it and no red ring. A red ring starts a limit, a crossed-out number on plain white ends one.",
      },
      {
        code: "M.10",
        how: "A compulsory minimum speed sign is blue with a white number and tells you not to go slower than that figure. The red-ringed sign is a maximum, so mixing them up flips the meaning.",
      },
    ],
    mistakes: [
      "Treating the limit as a target. It's the most you may do in good conditions, so slow down further in rain, darkness, fog or around boda bodas and pedestrians.",
      "Speeding up again as soon as the sign is out of sight. The limit holds until a sign ends it or a new one replaces it.",
      "Only braking when you see a camera or a police check. The limit applies along the whole stretch, whether anyone is watching or not.",
    ],
    remember:
      "Red ring, black number: that number is your ceiling until you pass a sign that ends it.",
  },
  "P.27b": {
    looks:
      "A round white disc with a red ring. The word STOP is printed in black at the top, CHILDREN at the bottom, and between them is a thick black horizontal bar with rounded ends.",
    where:
      "You'll see it at crossings by school gates, especially at the start and end of the school day when children arrive and leave. It may be a fixed sign or one held up by a person controlling the crossing. It's there because children are small, hard to see between parked vehicles, and can run out without checking the road.",
    confusedWith: [
      {
        code: "W.18",
        how: "The children crossing warning is a red triangle that tells you to be ready because children may be about. This round sign is an order: when it's shown, you stop.",
      },
      {
        code: "R.1",
        how: "The octagonal STOP sign at a junction makes you stop and then go when the road is clear. At the school crossing you stay stopped until the children have crossed and the way is cleared.",
      },
      {
        code: "W.17",
        how: "The pedestrian crossing warning points to a crossing for everyone. The school stop sign is specifically for children at a school and calls for a full stop, not just extra care.",
      },
    ],
    mistakes: [
      "Slowing to a crawl and rolling through instead of stopping completely. A child can step out from behind the vehicle next to you.",
      "Moving off as soon as the last child reaches the middle. Wait until they're safely on the far side and the person controlling the crossing lets you go.",
      "Overtaking a matatu or school bus that has stopped near the crossing. It may be hiding children who are about to cross in front of it.",
    ],
    remember:
      "Round sign, STOP over a black bar over CHILDREN: this is a command, not a caution. Stop, wait and let every child reach the kerb.",
  },
  "P.30": {
    looks:
      "A white disc with a thin black outline instead of a red ring. A black number (40 on the chart) sits in the middle, crossed by a band of thin black diagonal lines running from lower left to upper right.",
    where:
      "You'll find it where a lower limit is no longer needed, such as on leaving a town, a trading centre, a school area or a stretch of road works. It tells you that the specific restriction you were under has been lifted.",
    confusedWith: [
      {
        code: "P.25",
        how: "The speed limit sign has a red ring and a clear number. If the ring is black and thin and the number is struck through with diagonal lines, the limit is ending, not starting.",
      },
      {
        code: "P.29",
        how: "The end of all prohibitions sign cancels every earlier ban, not just the speed limit. This sign only ends the limit shown on it, so other bans, such as no overtaking, may still apply.",
      },
    ],
    mistakes: [
      "Taking it as permission to go as fast as you like. The general limit for that class of road and your vehicle still applies.",
      "Accelerating hard right at the sign. People, boda bodas and handcarts from the area you're leaving may still be on the road just beyond it.",
      "Forgetting about any lower limit that applies to your type of vehicle, such as a lorry or a vehicle towing a trailer. The end of the posted limit doesn't lift that.",
    ],
    remember:
      "Black lines through a black number on white: that particular limit has ended. Return to the normal limit for the road, not to no limit.",
  },
  "P.32": {
    looks:
      "A blue disc with a red ring and one red diagonal bar running from upper left to lower right. There's no letter, number or picture, just the blue field and the single red stroke.",
    where:
      "You'll see it on busy town streets, outside gates and driveways, near bus and matatu stages, close to junctions and in front of hospitals, fire stations and markets. Parked vehicles in these spots block access, hide pedestrians or narrow the road for everyone else.",
    confusedWith: [
      {
        code: "P.33",
        how: "The parking or waiting prohibited sign has a red X across the blue instead of a single bar, and it is stricter, banning you from waiting as well. If you confuse the two you may sit at the kerb somewhere that even a short wait is not allowed.",
      },
      {
        code: "P.39",
        how: "The no stopping zone sign has the word ZONE under the disc and covers a whole area, and its name tells you stopping is banned there. Treating it like a plain no-parking spot and pulling over to drop someone off would break it.",
      },
    ],
    mistakes: [
      "Leaving the car with the hazard lights on while you run into a shop. Hazard lights don't change the fact that the car is parked and blocking the street.",
      "Reading the blue background as a sign that parking is allowed because many parking signs are blue. The red ring and bar override the blue.",
      "Parking just a little past the sign and assuming it no longer applies. Look for an extra panel or road markings that show how far the ban runs.",
    ],
    remember:
      "One red slash across blue: no parking. Two slashes forming an X is the stricter sign, so count the bars.",
  },
};
