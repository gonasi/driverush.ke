/**
 * Course catalogue. Two sample full courses for now — the homepage leads with
 * these and `/courses` lists them. Real per-course routes and the lesson
 * player land later; until then every `to` points at `/courses`.
 */
import type { IconSvgElement } from "@hugeicons/react";
import {
  Mortarboard01FreeIcons,
  RoadLocation01FreeIcons,
} from "@hugeicons/core-free-icons";

/** Brand accent a course renders in — icon block, title, primary action. */
export type CourseAccent = "rush" | "ink";

export type Course = {
  /** Stable slug — drives the (future) `/courses/:slug` route. */
  slug: string;
  /** Mono kicker, e.g. "Course № 01 · Class B". */
  kicker: string;
  /** Display title. */
  title: string;
  /** One-paragraph pitch. */
  blurb: string;
  /** Hugeicons mark for the course. */
  icon: IconSvgElement;
  accent: CourseAccent;
  /** Optional corner ribbon, e.g. "Start here". */
  tag?: string;
  /** Module names, in teaching order. */
  syllabus: string[];
  /** Headline stats shown on the card. */
  meta: { modules: number; lessons: number; hours: string; level: string };
  /** Short pricing line, e.g. "Free to start". */
  price: string;
  /** Where the CTA points. Placeholder until per-course pages ship. */
  to: string;
};

export const COURSES: Course[] = [
  {
    slug: "class-b",
    kicker: "Course № 01 · Class B",
    title: "Class B — the full course",
    blurb:
      "Everything between you and the licence. The highway code, every Kenyan road sign, junctions, hazard perception and the mechanical basics — taught in order, then tested in the exact shape of the NTSA paper. Finish it and walk into the test centre knowing you're ready.",
    icon: Mortarboard01FreeIcons,
    accent: "rush",
    tag: "Coming soon",
    syllabus: [
      "Highway code & the rules of the road",
      "Road signs, signals & markings",
      "Junctions, roundabouts & right of way",
      "Hazard perception on Nairobi streets",
      "Mechanical knowledge & vehicle checks",
      "Full mock papers & exam-day routine",
    ],
    meta: {
      modules: 6,
      lessons: 42,
      hours: "≈ 6 hrs",
      level: "Beginner → test-ready",
    },
    price: "Free to start",
    to: "/courses",
  },
  {
    slug: "kenyan-roads",
    kicker: "Course № 02 · After the test",
    title: "Confident on Kenyan roads",
    blurb:
      "A licence isn't the same as knowing how to handle Thika Road at 6pm. Real defensive driving for matatus, boda bodas, roundabouts that ignore the rules, night, rain and the long-haul highway — plus exactly what to do when the car stops moving.",
    icon: RoadLocation01FreeIcons,
    accent: "ink",
    tag: "Coming soon",
    syllabus: [
      "Reading traffic: matatus & boda bodas",
      "Roundabouts & busy junctions, for real",
      "Highway driving & overtaking on two lanes",
      "Night, rain & poor visibility",
      "Breakdowns, punctures & emergencies",
      "Defensive habits that actually stick",
    ],
    meta: {
      modules: 6,
      lessons: 32,
      hours: "≈ 4 hrs",
      level: "Licensed · all classes",
    },
    price: "Premium",
    to: "/courses",
  },
];
