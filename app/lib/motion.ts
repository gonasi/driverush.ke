import type { Transition, Variants } from "framer-motion";

export const ease = {
  snap: [0.32, 0.72, 0, 1] as const,
  outQuart: [0.25, 1, 0.5, 1] as const,
  inOutQuart: [0.76, 0, 0.24, 1] as const,
};

export const duration = {
  press: 0.08,
  enter: 0.18,
  page: 0.24,
  banner: 0.14,
} as const;

export const transition = {
  press: { duration: duration.press, ease: ease.snap } satisfies Transition,
  enter: { duration: duration.enter, ease: ease.outQuart } satisfies Transition,
  page: { duration: duration.page, ease: ease.snap } satisfies Transition,
  banner: { duration: duration.banner, ease: ease.snap } satisfies Transition,
};

export const variants = {
  // Stamp press — for non-button pressables. The 3px translation matches
  // the CSS press recipe used on .btn in the design system HTML.
  stamp: {
    rest: { x: 0, y: 0 },
    pressed: { x: 3, y: 3, transition: transition.press },
  } satisfies Variants,

  // Card / banner enter — fade up with a hint of scale, snap easing.
  fadeUp: {
    hidden: { opacity: 0, y: 8, scale: 0.99 },
    visible: { opacity: 1, y: 0, scale: 1, transition: transition.enter },
    exit: { opacity: 0, y: -4, transition: transition.press },
  } satisfies Variants,

  // List stagger — children animate one after the other at 30ms steps.
  staggerList: {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.03, delayChildren: 0.04 },
    },
  } satisfies Variants,

  // Banner slam — feedback banners scale in fast, no bounce.
  bannerSlam: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1, transition: transition.banner },
    exit: { opacity: 0, scale: 0.96, transition: transition.press },
  } satisfies Variants,

  // Page transition — subtle, mostly out of the way of the user.
  page: {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: transition.page },
    exit: { opacity: 0, y: -4, transition: transition.press },
  } satisfies Variants,
} as const;
