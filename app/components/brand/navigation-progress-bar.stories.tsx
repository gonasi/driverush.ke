import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  NavigationProgressTrack,
  type NavigationProgressPhase,
} from "./navigation-progress-bar";

/**
 * A bit of page furniture so the fixed bar reads in context (it lives at the
 * very top of the viewport, above everything).
 */
function MockPage({ note }: { note?: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] bg-paper text-ink">
      <div className="h-7 w-full border-b-2 border-ink bg-[repeating-linear-gradient(90deg,var(--ink)_0_14px,transparent_14px_26px)]" />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="m-0 font-display text-4xl font-extrabold uppercase tracking-tighter">
          Page content
        </h1>
        <p className="mt-3 font-serif text-lg leading-snug text-ink-2">
          The navigation progress bar pins to the top edge while a route
          transition or form submission is in flight, runs the colours like a
          signal — rush red on submit, amber mid-load, signal green as it lands
          — then fades.
        </p>
        {note && (
          <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-ink-3">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

const meta = {
  title: "Brand/Navigation Progress Bar",
  component: NavigationProgressTrack,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Top-of-page route-transition indicator, ported from gonasi and re-skinned to the DriveRush system: a hard-edged stamp strip with a flat ink underline, signal colours, no blur and no pulse. `NavigationProgressBar` is the router-wired version you mount once in `root.tsx`; `NavigationProgressTrack` is the presentational bar these stories drive with a fixed `phase`.",
      },
    },
  },
  argTypes: {
    phase: {
      control: "inline-radio",
      options: ["idle", "submitting", "loading", "finishing"],
      description:
        "Which navigation phase to render. `idle` is collapsed + hidden.",
    },
    barRef: { table: { disable: true } },
  },
  args: { phase: "loading" },
  render: (args) => (
    <>
      <NavigationProgressTrack {...args} />
      <MockPage note={`Phase: ${args.phase}`} />
    </>
  ),
} satisfies Meta<typeof NavigationProgressTrack>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Drag the `phase` control to see each state. */
export const Playground: Story = {};

/** Form post in flight — rush red, a short way across. */
export const Submitting: Story = { args: { phase: "submitting" } };

/** Route data loading — amber, most of the way. */
export const Loading: Story = { args: { phase: "loading" } };

/** Route landed — signal green, full width, just before it fades. */
export const Finishing: Story = { args: { phase: "finishing" } };

/** Nothing in flight — the bar is collapsed to zero width and `aria-hidden`. */
export const Idle: Story = { args: { phase: "idle" } };

/**
 * The full sweep on a loop: idle → submitting → loading → finishing → idle.
 * Width eases on `--ease-snap`; the colour snaps between phases the way a
 * signal flips.
 */
export const FullCycle: Story = {
  render: () => {
    const sequence: { phase: NavigationProgressPhase; hold: number }[] = [
      { phase: "idle", hold: 600 },
      { phase: "submitting", hold: 700 },
      { phase: "loading", hold: 1100 },
      { phase: "finishing", hold: 700 },
    ];
    const [i, setI] = React.useState(0);
    React.useEffect(() => {
      const t = setTimeout(
        () => setI((n) => (n + 1) % sequence.length),
        sequence[i].hold,
      );
      return () => clearTimeout(t);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [i]);
    return (
      <>
        <NavigationProgressTrack phase={sequence[i].phase} />
        <MockPage note={`Cycling · current phase: ${sequence[i].phase}`} />
      </>
    );
  },
};
