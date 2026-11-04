import type { CSSProperties } from "react";
import type { Transition } from "framer-motion";

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

/** Position in a staggered entrance: `style={stagger(2)}` with `.dr-rise` or `.dr-pop`. */
export function stagger(step: number): CSSProperties {
  return { "--i": step } as CSSProperties;
}
